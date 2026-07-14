CREATE TABLE staff_roles (
  uuid TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE staff_permissions (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  module TEXT NOT NULL
);
CREATE TABLE staff_role_permissions (
  role_uuid TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  PRIMARY KEY(role_uuid, permission_code),
  FOREIGN KEY(role_uuid) REFERENCES staff_roles(uuid) ON DELETE CASCADE,
  FOREIGN KEY(permission_code) REFERENCES staff_permissions(code) ON DELETE CASCADE
);
CREATE TABLE employee_profiles (
  uuid TEXT PRIMARY KEY,
  user_uuid TEXT NOT NULL UNIQUE,
  employee_code TEXT NOT NULL UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  department TEXT,
  designation TEXT,
  joining_date TEXT,
  salary_type TEXT NOT NULL DEFAULT 'monthly' CHECK(salary_type IN ('monthly','daily')),
  base_salary_minor INTEGER NOT NULL DEFAULT 0,
  role_uuid TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_uuid) REFERENCES users(uuid),
  FOREIGN KEY(role_uuid) REFERENCES staff_roles(uuid)
);
CREATE TABLE attendance_entries (
  uuid TEXT PRIMARY KEY,
  employee_uuid TEXT NOT NULL,
  work_date TEXT NOT NULL,
  check_in_at TEXT NOT NULL,
  check_out_at TEXT,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present' CHECK(status IN ('present','late','absent','leave')),
  notes TEXT,
  created_by_user_uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(employee_uuid) REFERENCES employee_profiles(uuid),
  FOREIGN KEY(created_by_user_uuid) REFERENCES users(uuid)
);
CREATE UNIQUE INDEX idx_attendance_open_employee ON attendance_entries(employee_uuid) WHERE check_out_at IS NULL;
CREATE INDEX idx_attendance_date ON attendance_entries(work_date);
CREATE TABLE payroll_entries (
  uuid TEXT PRIMARY KEY,
  employee_uuid TEXT NOT NULL,
  period TEXT NOT NULL,
  base_minor INTEGER NOT NULL,
  overtime_minor INTEGER NOT NULL DEFAULT 0,
  bonus_minor INTEGER NOT NULL DEFAULT 0,
  deduction_minor INTEGER NOT NULL DEFAULT 0,
  advance_minor INTEGER NOT NULL DEFAULT 0,
  net_minor INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','paid')),
  paid_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(employee_uuid) REFERENCES employee_profiles(uuid),
  UNIQUE(employee_uuid, period)
);
CREATE INDEX idx_employee_active ON employee_profiles(is_active, department);
CREATE INDEX idx_payroll_period ON payroll_entries(period, status);
