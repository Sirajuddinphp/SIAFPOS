# Restaurant POS UI/UX Design System and Screen Wireframes

Status: Architecture baseline  
Product: MealHi5 POS Desktop  
Platform: Windows desktop first, Electron + React + TypeScript  
Primary users: cashier, waiter, captain, kitchen staff, manager, owner/admin

## 1. Design Principles

- Offline confidence: every screen must show internet/sync/printer state without blocking core billing.
- Touch-first, keyboard-fast: controls must work for touch terminals and cashier keyboard workflows.
- Operational density: show useful order, table, payment, and printer data without marketing-style spacing.
- Low visual noise: neutral background, clear contrast, no decorative UI that competes with sales actions.
- Error recovery: failed sync, failed print, held orders, and interrupted payments must be recoverable.
- Role clarity: cashier, waiter, kitchen, manager, and admin see different default landing screens.

## 2. Visual Language

### Color Tokens

| Token | Usage | Value |
|---|---|---|
| `bg.app` | main background | `#F5F7FA` |
| `bg.surface` | panels, toolbars | `#FFFFFF` |
| `bg.muted` | secondary areas | `#EEF2F6` |
| `text.primary` | main text | `#17202A` |
| `text.secondary` | helper text | `#5D6D7E` |
| `border.default` | separators | `#DDE4EC` |
| `accent.primary` | primary action | `#0E7C66` |
| `accent.warning` | warning/hold | `#B7791F` |
| `accent.danger` | void/refund/error | `#C0392B` |
| `accent.info` | sync/device info | `#2563A8` |
| `status.success` | paid/synced/ready | `#16803C` |
| `status.pending` | pending KOT/sync | `#8A5A00` |
| `status.failed` | failed print/sync | `#B42318` |

### Typography

| Use | Size | Weight |
|---|---:|---:|
| App title | 20 | 700 |
| Screen title | 18 | 700 |
| Section title | 15 | 600 |
| Body | 14 | 400 |
| Dense table | 13 | 400 |
| Button | 14 | 600 |
| Amount total | 24 | 800 |

Rules:

- Do not scale font size by viewport width.
- Use fixed button heights for POS actions.
- Keep labels short and operational.
- Amounts use tabular numbers.

### Spacing and Layout

| Token | Value |
|---|---:|
| `space.1` | 4px |
| `space.2` | 8px |
| `space.3` | 12px |
| `space.4` | 16px |
| `space.5` | 20px |
| `space.6` | 24px |

Rules:

- Cards use max 8px radius.
- Avoid nested cards.
- POS screen uses fixed action zones to prevent layout jumping.
- Main desktop target is 1366x768 minimum.
- Touch target minimum is 44x44px.

## 3. Global App Shell

All authenticated screens share this shell.

```text
+--------------------------------------------------------------------------------+
| MealHi5 POS | Store | Terminal | Shift | User | Offline/Sync | Printer | Clock |
+--------------------------------------------------------------------------------+
| Nav Rail | Screen Content                                                    |
|          |                                                                   |
| POS      |                                                                   |
| Tables   |                                                                   |
| Orders   |                                                                   |
| Reports  |                                                                   |
| Settings |                                                                   |
+--------------------------------------------------------------------------------+
```

Global status rules:

- Sync badge: online, offline, syncing, failed, conflict.
- Printer badge: ready, warning, offline, retry pending.
- Shift badge: unopened, open, closing required.
- Cashier cannot hide failed print jobs.

## 4. Component System

### Buttons

- Primary: payment, save, send KOT, open shift.
- Secondary: hold, park, reprint, edit.
- Danger: void, refund, cancel KOT.
- Icon buttons: refresh, retry, print, search, filter, close.
- Manager approval buttons must show role lock icon.

### Inputs

- Numeric keypad for PIN, quantity, discount, cash amount.
- Search field with clear icon.
- Segmented controls for order mode and payment mode.
- Toggle for active/inactive settings.
- Stepper for quantity.
- Select menu for printer/device/tax group.

### POS-Specific Components

- Menu category rail.
- Menu item tile.
- Cart line item.
- Modifier matrix.
- Table tile.
- KOT status chip.
- Payment tender row.
- Sync queue row.
- Printer test row.
- Permission approval modal.

## 5. Screen Inventory

| Screen | Primary Role | Purpose |
|---|---|---|
| Splash / Startup Health | all | validate DB, migrations, terminal, printer, sync engine |
| Terminal Setup | admin | register terminal and store defaults |
| Login / PIN | all | staff authentication |
| Shift Open | cashier/manager | declare opening cash |
| POS Home | cashier | start quick orders and resume current work |
| Table Floor | waiter/captain | dine-in table selection and status |
| Order Screen | cashier/waiter | build/edit order |
| Modifier Selector | cashier/waiter | configure item modifiers |
| KOT Confirmation | cashier/waiter | send kitchen ticket |
| Bill Preview | cashier | review bill before payment |
| Payment Screen | cashier | collect tender and close bill |
| Receipt / Print Status | cashier | receipt print success/failure/retry |
| Orders List | cashier/manager | find active, held, closed orders |
| Held Orders | cashier | resume parked orders |
| Delivery Orders | cashier/dispatcher | delivery order tracking |
| Refund / Void Authorization | manager | approve risk actions |
| Shift Close | cashier/manager | reconcile shift |
| Reports Dashboard | manager/owner | operational reports |
| Settings | manager/admin | store, tax, printer, sync configuration |
| Printer Setup | admin | configure and test ESC/POS printers |
| Sync Status | manager/admin | inspect queue, failures, conflicts |
| User / Staff Management | admin | roles, permissions, PINs |
| Menu Management | manager/admin | categories, items, prices, modifiers |

## 6. Screen Wireframes

### 6.1 Splash / Startup Health

```text
+--------------------------------------------------------------+
| MealHi5 POS                                                   |
| Starting terminal...                                          |
+--------------------------------------------------------------+
| [ok] SQLite database                                          |
| [ok] Migrations                                               |
| [ok] Terminal profile                                         |
| [warn] Internet offline - local mode available                |
| [ok] Receipt printer                                          |
| [retry] Kitchen printer offline                               |
+--------------------------------------------------------------+
|                                      [Open Offline] [Retry]   |
+--------------------------------------------------------------+
```

Primary actions:

- Continue if database is healthy.
- Block only if local database/migration fails.
- Show printer/sync warnings as recoverable.

### 6.2 Terminal Setup

```text
+----------------------------------------------------------------------------+
| Terminal Setup                                                              |
+----------------------------------------------------------------------------+
| Store Code        [____________________]                                    |
| Terminal Name     [Counter 1__________]                                     |
| API Base URL      [https://api.example.com_______________________________] |
| Pairing Token     [____________________]                                    |
|                                                                            |
| Local DB Path     C:\Users\...\MealHi5pos\terminal.db                      |
|                                                                            |
| [Test Connection] [Register Terminal] [Use Offline Demo Setup]              |
+----------------------------------------------------------------------------+
```

Validation:

- Store code required.
- Terminal name required.
- Pairing token required for production registration.
- Offline demo setup creates seed data only for development/pilot.

### 6.3 Login / PIN

```text
+--------------------------------------------------------------+
| MealHi5 POS                         Offline | Printer Ready   |
+--------------------------------------------------------------+
| Staff PIN                                                     |
| [ _ _ _ _ ]                                                   |
|                                                              |
| [1] [2] [3]                                                  |
| [4] [5] [6]                                                  |
| [7] [8] [9]                                                  |
| [Clear] [0] [Login]                                          |
|                                                              |
| [Manager Password Login]                                     |
+--------------------------------------------------------------+
```

Rules:

- PIN login works offline using locally cached staff records.
- Failed login attempts are audited.
- Role determines post-login landing screen.

### 6.4 Shift Open

```text
+----------------------------------------------------------------------------+
| Open Shift                                  User: Anil | Terminal: Counter 1 |
+----------------------------------------------------------------------------+
| Opening Cash                                                        [5000]  |
| Notes          [_______________________________________________]           |
|                                                                            |
| Last Closed Shift: 10 Jul 2026, 11:34 PM                                   |
| Expected Cash: 0.00                                                        |
|                                                                            |
| [Back]                                             [Open Shift]             |
+----------------------------------------------------------------------------+
```

Rules:

- POS billing is blocked until shift opens for cashier role.
- Manager can override with audit reason.

### 6.5 POS Home

```text
+--------------------------------------------------------------------------------+
| MealHi5 POS | Shift Open | Cashier | Offline | Sync 18 pending | Printer Ready  |
+--------------------------------------------------------------------------------+
| POS | Tables | Orders | Reports | Settings                                      |
+--------------------------------------------------------------------------------+
| Order Mode: [Dine-In] [Takeaway] [Delivery] [Quick Bill]                       |
|                                                                                |
| Active Work                                                                    |
| +------------------+ +------------------+ +------------------+                 |
| | Table A4         | | Takeaway #42     | | Delivery #18     |                 |
| | 6 items | KOT ok | | 2 items | held   | | pending payment  |                 |
| +------------------+ +------------------+ +------------------+                 |
|                                                                                |
| Quick Actions                                                                  |
| [New Takeaway] [Open Table Floor] [Held Orders] [Print Queue] [Close Shift]    |
+--------------------------------------------------------------------------------+
```

### 6.6 Table Floor

```text
+--------------------------------------------------------------------------------+
| Table Floor                                      Area: [Main] [Patio] [AC Room] |
+--------------------------------------------------------------------------------+
| Legend: Available | Occupied | KOT Pending | Billing | Dirty                   |
|                                                                                |
| +-------+ +-------+ +-------+ +-------+ +-------+                              |
| | A1    | | A2    | | A3    | | A4    | | A5    |                              |
| | Free  | | 2 pax | | KOT   | | Bill  | | Dirty |                              |
| +-------+ +-------+ +-------+ +-------+ +-------+                              |
|                                                                                |
| [New Table Order] [Merge Tables] [Transfer Table] [Mark Clean]                 |
+--------------------------------------------------------------------------------+
```

### 6.7 Order Screen

```text
+--------------------------------------------------------------------------------+
| Order #1024 | Table A2 | 2 pax | Waiter: Ravi | KOT pending                    |
+--------------------------------------------------------------------------------+
| Categories        | Menu Items                         | Cart                   |
| [Starters]        | +---------+ +---------+ +---------+ | 2 x Paneer Tikka 360  |
| [Mains]           | | Item    | | Item    | | Item    | | 1 x Naan          60  |
| [Breads]          | | 180.00  | | 220.00  | | 140.00  | | Discount          0  |
| [Drinks]          | +---------+ +---------+ +---------+ | Tax              42   |
| [Dessert]         | Search [____________________]       | Total           462   |
|                   |                                    |                       |
|                   |                                    | [Hold] [Send KOT]    |
|                   |                                    | [Bill] [Payment]     |
+--------------------------------------------------------------------------------+
```

Rules:

- Cart totals update instantly from local calculation.
- Every item keeps price/tax snapshot.
- Send KOT persists order and print job before printing.

### 6.8 Modifier Selector

```text
+--------------------------------------------------------------+
| Configure: Burger                                             |
+--------------------------------------------------------------+
| Size                                                         |
| ( ) Regular  0     ( ) Large +40                             |
|                                                              |
| Add-ons                                                      |
| [x] Cheese +30   [ ] Fries +60   [ ] Extra Patty +90         |
|                                                              |
| Notes                                                        |
| [No onion____________________________________________]       |
|                                                              |
| Quantity [-] 1 [+]                                           |
|                                      [Cancel] [Add to Cart]  |
+--------------------------------------------------------------+
```

### 6.9 KOT Confirmation

```text
+----------------------------------------------------------------------------+
| Send KOT                                                                     |
+----------------------------------------------------------------------------+
| Kitchen Printer: Ready                                                       |
| Items                                                                        |
| 2 x Paneer Tikka       Kitchen                                               |
| 1 x Naan               Tandoor                                                |
| 2 x Fresh Lime Soda    Bar                                                   |
|                                                                             |
| Notes: Less spicy                                                            |
|                                                                             |
| [Back]                                      [Save Order + Print KOT]          |
+----------------------------------------------------------------------------+
```

Failure behavior:

- If printer fails, order remains saved.
- Print job status becomes failed.
- User can retry from print queue.

### 6.10 Bill Preview

```text
+----------------------------------------------------------------------------+
| Bill Preview                                      Order #1024 | Table A2      |
+----------------------------------------------------------------------------+
| Item                         Qty        Rate        Tax        Total          |
| Paneer Tikka                 2          180.00      18.00      378.00         |
| Naan                         1           60.00       3.00       63.00         |
|                                                                             |
| Discount                     [None v]                 0.00                   |
| Service Charge               [5% v]                 22.05                    |
| Tax                                                   21.00                  |
| Grand Total                                           463.05                 |
|                                                                             |
| [Back to Order] [Split Bill] [Print Preview] [Proceed to Payment]            |
+----------------------------------------------------------------------------+
```

### 6.11 Payment Screen

```text
+----------------------------------------------------------------------------+
| Payment                                           Bill #B-2026-000421         |
+----------------------------------------------------------------------------+
| Amount Due: 463.05                                                         |
|                                                                             |
| Tender: [Cash] [Card] [UPI] [Custom]                                        |
| Received Amount [500.00________]                                            |
| Change Due: 36.95                                                           |
|                                                                             |
| Payment Lines                                                               |
| Cash                                      500.00                             |
|                                                                             |
| [Back] [Add Split Payment] [Settle + Print Receipt]                          |
+----------------------------------------------------------------------------+
```

Rules:

- Bill and payment are written in a single transaction.
- Receipt print job is created before print dispatch.
- Partial payment keeps bill open until fully paid.

### 6.12 Receipt / Print Status

```text
+--------------------------------------------------------------+
| Receipt                                                       |
+--------------------------------------------------------------+
| Bill #B-2026-000421                                           |
| Payment: Paid                                                 |
| Receipt Printer: Failed                                       |
|                                                              |
| [Retry Print] [Use Another Printer] [Continue]                |
|                                                              |
| Print Queue                                                   |
| Receipt #889 failed at 14:21 - Printer offline                |
+--------------------------------------------------------------+
```

### 6.13 Orders List

```text
+--------------------------------------------------------------------------------+
| Orders                       [Search bill/order/table/customer________] [Filter] |
+--------------------------------------------------------------------------------+
| Status     Order     Mode       Table     Total     KOT       Payment    Time   |
| Active     #1024     Dine-in    A2        463.05    Sent      Open       14:05  |
| Held       #1025     Takeaway   -         220.00    Pending   Open       14:08  |
| Closed     #1023     Delivery   -         910.00    Sent      Paid       13:52  |
|                                                                                |
| [Open] [Reprint] [Void] [Refund]                                               |
+--------------------------------------------------------------------------------+
```

### 6.14 Held Orders

```text
+----------------------------------------------------------------------------+
| Held Orders                                                                  |
+----------------------------------------------------------------------------+
| #1025 | Takeaway | 2 items | 220.00 | Held by Priya | 8 min                 |
| #1026 | Table B1 | 5 items | 780.00 | Held by Ravi  | 3 min                 |
|                                                                             |
| [Resume] [Cancel With Approval] [Print Hold Slip]                            |
+----------------------------------------------------------------------------+
```

### 6.15 Delivery Orders

```text
+--------------------------------------------------------------------------------+
| Delivery Orders                         [New Delivery] [Assign Rider]           |
+--------------------------------------------------------------------------------+
| Order | Customer | Phone | Address       | Status       | Payment | ETA         |
| #D18  | Neha     | 98... | Satellite Rd  | Preparing    | COD     | 25 min      |
| #D19  | Arjun    | 99... | CG Road       | Out Delivery | Paid    | 10 min      |
|                                                                                |
| [Open Order] [Mark Ready] [Dispatch] [Complete]                                 |
+--------------------------------------------------------------------------------+
```

### 6.16 Refund / Void Authorization

```text
+--------------------------------------------------------------+
| Manager Approval Required                                     |
+--------------------------------------------------------------+
| Action: Void item                                             |
| Order: #1024                                                  |
| Item: Paneer Tikka                                            |
| Reason [Wrong item punched__________________________]         |
| Manager PIN [ _ _ _ _ ]                                       |
|                                                              |
| [Cancel] [Approve Void]                                       |
+--------------------------------------------------------------+
```

Rules:

- Reason required.
- Approval creates audit log.
- Refund creates refund record, never deletes original payment.

### 6.17 Shift Close

```text
+----------------------------------------------------------------------------+
| Close Shift                                      Shift #S-2026-00012          |
+----------------------------------------------------------------------------+
| Opening Cash              5000.00                                           |
| Cash Sales                8420.00                                           |
| Cash Refunds               120.00                                           |
| Cash Movements            -500.00                                           |
| Expected Cash            12800.00                                           |
| Counted Cash             [12800.00____]                                     |
| Difference                   0.00                                           |
| Notes                    [________________________________]                  |
|                                                                             |
| [Print Shift Report] [Save Draft] [Close Shift]                              |
+----------------------------------------------------------------------------+
```

### 6.18 Reports Dashboard

```text
+--------------------------------------------------------------------------------+
| Reports                                 Today | This Week | Custom Range        |
+--------------------------------------------------------------------------------+
| Sales 24,560 | Orders 86 | Avg Bill 285.58 | Refunds 2 | Sync Pending 18       |
|                                                                                |
| [Sales] [Items] [Taxes] [Payments] [Shifts] [Staff]                            |
|                                                                                |
| Chart / Table Area                                                              |
|                                                                                |
| [Export PDF] [Export CSV] [Print]                                               |
+--------------------------------------------------------------------------------+
```

### 6.19 Settings

```text
+----------------------------------------------------------------------------+
| Settings                                                                     |
+----------------------------------------------------------------------------+
| [Store] [Taxes] [Payments] [Printers] [Sync] [Security] [Backup]             |
|                                                                             |
| Store Name       [MealHi5 Restaurant________________]                        |
| GSTIN            [____________________]                                      |
| Currency         [INR v]                                                     |
| Rounding         [Nearest 0.05 v]                                            |
|                                                                             |
| [Save Settings]                                                              |
+----------------------------------------------------------------------------+
```

### 6.20 Printer Setup

```text
+--------------------------------------------------------------------------------+
| Printer Setup                                            [Discover] [Add]       |
+--------------------------------------------------------------------------------+
| Name              Type       Connection        Status      Actions              |
| Kitchen Main      KOT        LAN 192.168.1.40  Ready       [Test] [Edit]        |
| Counter Receipt   Receipt    USB               Offline     [Retry] [Edit]       |
| Bar Printer       Bar        LAN 192.168.1.41  Ready       [Test] [Edit]        |
|                                                                                |
| Routing: Starters -> Kitchen Main | Drinks -> Bar Printer                       |
+--------------------------------------------------------------------------------+
```

### 6.21 Sync Status

```text
+--------------------------------------------------------------------------------+
| Sync Status                                 Offline | 18 pending | 0 conflicts  |
+--------------------------------------------------------------------------------+
| Last Successful Sync: 11 Jul 2026, 13:58                                      |
| Queue                                                                         |
| Event UUID        Type             Status       Attempts      Last Error        |
| e7a...            order.created    pending      0             -                 |
| a91...            bill.paid        failed       2             timeout           |
|                                                                                |
| [Sync Now] [Retry Failed] [View Conflicts]                                     |
+--------------------------------------------------------------------------------+
```

### 6.22 User / Staff Management

```text
+--------------------------------------------------------------------------------+
| Staff Management                                             [Add Staff]        |
+--------------------------------------------------------------------------------+
| Name       Role       PIN Set   Active   Last Login       Actions              |
| Priya      Cashier    Yes       Yes      Today 13:11      [Edit] [Disable]     |
| Ravi       Waiter     Yes       Yes      Today 12:48      [Edit] [Disable]     |
| Mehul      Manager    Yes       Yes      Yesterday        [Edit] [Disable]     |
|                                                                                |
| Permissions: [Cashier] [Waiter] [Manager] [Admin]                              |
+--------------------------------------------------------------------------------+
```

### 6.23 Menu Management

```text
+--------------------------------------------------------------------------------+
| Menu Management                         [Add Category] [Add Item] [Import CSV] |
+--------------------------------------------------------------------------------+
| Categories        | Items                         | Item Detail                |
| Starters          | Paneer Tikka    180 Active    | Name [Paneer Tikka____]   |
| Mains             | Veg Biryani     220 Active    | Price [180.00]            |
| Breads            | Naan             60 Active    | Tax Group [GST 5% v]      |
| Drinks            | Fresh Lime       90 Active    | Kitchen Route [Kitchen v] |
|                   |                               | [Save] [Archive]          |
+--------------------------------------------------------------------------------+
```

## 7. Role-Based Default Landing

| Role | Default Screen |
|---|---|
| Cashier | POS Home |
| Waiter | Table Floor |
| Captain | Table Floor |
| Kitchen | KOT/Kitchen queue if enabled later |
| Manager | Reports Dashboard |
| Admin | Settings |

## 8. Responsive Desktop Behavior

- Minimum supported resolution: 1366x768.
- Preferred POS counter resolution: 1920x1080.
- Left nav collapses to icons below 1280px.
- Cart remains visible on order screen at all supported desktop sizes.
- Modals must fit within 720px height with internal scroll only when needed.

## 9. Accessibility and Operations

- All primary workflows support keyboard navigation.
- Enter confirms safe actions; destructive actions require explicit focused button.
- Color is never the only status indicator.
- Failed printer/sync messages include action and timestamp.
- Large totals and settlement amounts use high contrast.

## 10. UI Acceptance Criteria

- Cashier can complete an offline takeaway sale without leaving POS screens.
- Waiter can open table, add items, send KOT, and return to floor in under 20 seconds.
- Printer failure is visible and recoverable without losing order/payment data.
- Manager approval modal blocks void/refund until valid credentials and reason are entered.
- Sync state is visible globally but does not interrupt billing.
- All listed screens have clear primary and secondary actions.
