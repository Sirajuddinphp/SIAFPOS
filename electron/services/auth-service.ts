import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type {
  AuthResponse,
  AuthSession,
  PasswordLoginInput,
  PinLoginInput,
  SanitizedUser
} from "../../shared/contracts/auth-contracts";
import { RestaurantRepository } from "../repositories/restaurant-repository";
import { OutletRepository } from "../repositories/outlet-repository";
import { TerminalRepository } from "../repositories/terminal-repository";
import { UserRepository, type UserRecord } from "../repositories/user-repository";
import { verifyPassword, verifyPin } from "../security/password";
import { sessionStore } from "../security/session-store";
import { logger } from "../logger/logger";

export class AuthService {
  constructor(private readonly db: Database.Database) {}

  loginWithPassword(input: PasswordLoginInput): AuthResponse {
    const context = this.resolveContext(input.restaurantCode, input.outletCode, input.terminalCode);
    const user = new UserRepository(this.db).findByUsername(context.restaurant.uuid, input.username);

    if (!user || !verifyPassword(input.password, user.password_hash)) {
      logger.warn("authentication", "Password login failed", { username: input.username });
      throw new AuthError("INVALID_CREDENTIALS", "Invalid username or password.");
    }

    return this.startSession(user, context, input.rememberTerminal);
  }

  loginWithPin(input: PinLoginInput): AuthResponse {
    const context = this.resolveContext(input.restaurantCode, input.outletCode, input.terminalCode);
    const users = new UserRepository(this.db).findActiveUsersByOutlet(context.outlet.uuid);
    const user = users.find((candidate) => verifyPin(input.pin, candidate.pin_hash));

    if (!user) {
      logger.warn("authentication", "PIN login failed", { terminalCode: input.terminalCode });
      throw new AuthError("INVALID_CREDENTIALS", "Invalid PIN.");
    }

    return this.startSession(user, context, input.rememberTerminal);
  }

  getSession(): AuthSession | null {
    return sessionStore.getSession();
  }

  logout(): { loggedOut: true } {
    const session = sessionStore.getSession();
    if (session) {
      const now = new Date().toISOString();
      this.db
        .prepare("UPDATE staff_sessions SET logout_at = ?, status = 'closed' WHERE uuid = ?")
        .run(now, session.sessionUuid);
      this.writeAudit(session.user.uuid, session.terminal.uuid, "auth.logout", "staff_session", session.sessionUuid, null, null);
      logger.info("authentication", "User logged out", { userUuid: session.user.uuid });
    }

    sessionStore.clearSession();
    return { loggedOut: true };
  }

  private resolveContext(restaurantCode: string, outletCode: string, terminalCode: string) {
    const restaurant = new RestaurantRepository(this.db).findByCode(restaurantCode);
    if (!restaurant || restaurant.status !== "active") {
      throw new AuthError("MISSING_RESTAURANT", "Restaurant is not available.");
    }

    const outlet = new OutletRepository(this.db).findByRestaurantAndCode(restaurant.uuid, outletCode);
    if (!outlet || outlet.status !== "active") {
      throw new AuthError("MISSING_OUTLET", "Outlet is not available.");
    }

    const terminal = new TerminalRepository(this.db).findByOutletAndCode(outlet.uuid, terminalCode);
    if (!terminal || terminal.registration_status !== "registered") {
      throw new AuthError("MISSING_TERMINAL", "Terminal is not registered.");
    }

    return { restaurant, outlet, terminal };
  }

  private startSession(
    user: UserRecord,
    context: ReturnType<AuthService["resolveContext"]>,
    rememberTerminal: boolean
  ): AuthResponse {
    if (user.status !== "active") {
      throw new AuthError("INACTIVE_USER", "This user is inactive.");
    }

    const now = new Date().toISOString();
    const sessionUuid = randomUUID();

    const createSession = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO staff_sessions (uuid, user_uuid, terminal_uuid, login_at, logout_at, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(sessionUuid, user.uuid, context.terminal.uuid, now, null, "active", now);

      new UserRepository(this.db).updateLastLogin(user.uuid, now);
      new TerminalRepository(this.db).touch(context.terminal.uuid, now);
      this.writeAudit(user.uuid, context.terminal.uuid, "auth.login", "staff_session", sessionUuid, null, null);
    });

    createSession();

    const session: AuthSession = {
      sessionUuid,
      user: sanitizeUser({ ...user, last_login_at: now }),
      restaurant: {
        uuid: context.restaurant.uuid,
        name: context.restaurant.name,
        code: context.restaurant.code
      },
      outlet: {
        uuid: context.outlet.uuid,
        name: context.outlet.name,
        code: context.outlet.code
      },
      terminal: {
        uuid: context.terminal.uuid,
        name: context.terminal.name,
        code: context.terminal.code,
        registrationStatus: context.terminal.registration_status
      },
      loginAt: now
    };

    sessionStore.setSession(session);
    if (rememberTerminal) {
      sessionStore.rememberTerminal(context.restaurant.code, context.outlet.code, context.terminal.code);
    }

    logger.info("authentication", "User logged in", { userUuid: user.uuid, role: user.role });
    return { session };
  }

  private writeAudit(
    userUuid: string | null,
    terminalUuid: string | null,
    action: string,
    entityType: string,
    entityUuid: string | null,
    oldValues: unknown,
    newValues: unknown
  ): void {
    this.db
      .prepare(
        `INSERT INTO audit_logs (
          uuid, user_uuid, terminal_uuid, action, entity_type, entity_uuid, old_values, new_values, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        randomUUID(),
        userUuid,
        terminalUuid,
        action,
        entityType,
        entityUuid,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        null,
        new Date().toISOString()
      );
  }
}

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

function sanitizeUser(user: UserRecord): SanitizedUser {
  return {
    uuid: user.uuid,
    name: user.name,
    username: user.username,
    role: user.role,
    status: user.status,
    lastLoginAt: user.last_login_at
  };
}
