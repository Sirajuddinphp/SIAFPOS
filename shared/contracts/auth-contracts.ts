export type UserRole = "admin" | "manager" | "cashier" | "waiter" | "kitchen";

export type SanitizedUser = {
  uuid: string;
  name: string;
  username: string;
  role: UserRole;
  status: "active" | "inactive";
  lastLoginAt: string | null;
};

export type RestaurantContext = {
  uuid: string;
  name: string;
  code: string;
};

export type OutletContext = {
  uuid: string;
  name: string;
  code: string;
};

export type TerminalContext = {
  uuid: string;
  name: string;
  code: string;
  registrationStatus: "registered" | "pending" | "disabled";
};

export type AuthSession = {
  sessionUuid: string;
  user: SanitizedUser;
  restaurant: RestaurantContext;
  outlet: OutletContext;
  terminal: TerminalContext;
  loginAt: string;
};

export type PasswordLoginInput = {
  restaurantCode: string;
  outletCode: string;
  terminalCode: string;
  username: string;
  password: string;
  rememberTerminal: boolean;
};

export type PinLoginInput = {
  restaurantCode: string;
  outletCode: string;
  terminalCode: string;
  pin: string;
  rememberTerminal: boolean;
};

export type AuthResponse = {
  session: AuthSession;
};
