import { describe, expect, it, vi } from "vitest";
import { AuthService } from "../electron/services/auth-service";
import { createMigratedTestDatabase, seedAuthFixture } from "./test-helpers";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getPath: () => process.cwd(),
    getVersion: () => "0.1.0"
  }
}));

describe("auth service", () => {
  it("logs in with username and password and returns sanitized session", () => {
    const db = createMigratedTestDatabase();
    seedAuthFixture(db);

    const result = new AuthService(db).loginWithPassword({
      restaurantCode: "MH5-DEMO",
      outletCode: "MAIN",
      terminalCode: "POS-01",
      username: "admin",
      password: "admin123",
      rememberTerminal: true
    });

    expect(result.session.user.username).toBe("admin");
    expect(result.session.user.role).toBe("manager");
    expect(JSON.stringify(result)).not.toContain("password_hash");
    expect(JSON.stringify(result)).not.toContain("pin_hash");

    db.close();
  });

  it("logs in with PIN", () => {
    const db = createMigratedTestDatabase();
    seedAuthFixture(db);

    const result = new AuthService(db).loginWithPin({
      restaurantCode: "MH5-DEMO",
      outletCode: "MAIN",
      terminalCode: "POS-01",
      pin: "1234",
      rememberTerminal: false
    });

    expect(result.session.user.name).toBe("Demo Manager");
    db.close();
  });

  it("rejects invalid credentials", () => {
    const db = createMigratedTestDatabase();
    seedAuthFixture(db);

    expect(() =>
      new AuthService(db).loginWithPassword({
        restaurantCode: "MH5-DEMO",
        outletCode: "MAIN",
        terminalCode: "POS-01",
        username: "admin",
        password: "bad",
        rememberTerminal: false
      })
    ).toThrow("Invalid username or password.");

    db.close();
  });
});
