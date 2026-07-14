# Runtime fixes: scrolling, tables, orders, billing

## Scrolling
- The application shell now uses a fixed viewport (`h-dvh`) with an explicit height chain.
- Sidebar navigation and main content have independent vertical scrolling.
- Page content no longer disappears below the Windows taskbar.

## Tables workflow
- Available table: creates/reuses an empty dine-in draft, assigns the table, and opens POS.
- Occupied table: loads the linked running order and opens POS.
- Table occupancy is derived from active/held orders, not only the static table column.
- Settled orders release their tables automatically in the floor read model.
- Waiter selection remains in POS and is required by existing dine-in/KOT validation.

## Running orders
- Open now loads the order and navigates to POS.
- Bill navigates to Billing with a validated order UUID.
- Empty unassigned drafts are hidden to avoid queue clutter.
- Empty orders cannot open billing.

## Billing
- Added clear loading/error states.
- Added Back to Order and Running Orders navigation.
- Added direct Open Shift action when no cashier shift is active.
- Improved settlement and receipt feedback.

## POS drafts
- New Draft now always creates a genuinely new order rather than reusing the current order.
