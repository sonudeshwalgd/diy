# Version History

Format: `MAJOR.MINOR.PATCH`

- Every pushed change must bump the version.
- Frontend-only change: increment `PATCH` (last digit).
- Change that also updates the backend: increment `MINOR` (middle digit) as well as `PATCH`.
- `MAJOR` is reserved for breaking changes.

The current version lives in `app.json` and is displayed at the bottom of the sidebar.

## 1.3.6

- Added backend order idempotency using the generated order ID. Repeated submissions of the same order are returned as already saved instead of creating another record, deducting coins again, or opening WhatsApp again.
- Duplicate order IDs are now blocked from status updates and hidden from staff/customer order lists and popular-item totals, so only one unique order is accepted and listed.
- Split the orders page into four separate tabs: New, Accepted, Delivered, and Cancelled.

## 1.2.5

- Added a "Today's summary" statistics panel to the orders page showing total orders, sales (excluding cancelled), items sold, and average order value.
- The panel expands to show a per-status breakdown bar chart (New / Accepted / Delivered / Cancelled), coins used and earned, and the split between table, counter, and delivery orders.

## 1.2.4

- Added a "View full details" popup on every order card showing every item with its unit price, quantity, and line total, plus subtotal, coins used, delivery, and final total. Combo selections already appear inside the item name saved with the order (for example `Burger Fest (Fries, Coke)`), so they are visible in the popup.
- Split the orders list into three tabs: New / Received, Accepted, and Delivered / Cancel, each with a live count.
- Added a 30-second auto-refresh with a visible countdown (down from 60 seconds).
- Added a loud looping alarm and a red "NEW ORDER" banner whenever a newly placed order appears on refresh. The alarm stops automatically after 1 minute, as soon as the order is moved to Accepted / Delivered / Cancel, or when the banner is tapped.

## 1.2.3

- Fixed `POST /api/orders` returning 500 for anonymous WhatsApp orders by making `customerMobile` optional in the Order schema.

## 1.1.2

- Fixed new orders not appearing by saving the order before opening WhatsApp and disabling caching on the staff orders request.
- Added staff-key gated `PATCH /api/orders/:id/status` endpoint.
- Added Accept, Delivered, and Cancel buttons to every order card in `/orders`.

## 1.0.1

- First versioned release.
- Removed staff-route shortcuts from the sidebar; `/orders` and `/items/disabled` are now reachable only by typing the URL directly.
- Added the version label to the sidebar footer and this history file.
- Added a generated order ID to WhatsApp order messages, the order API payload, stored orders, and the staff order view.
- Staff orders route now lists only today's orders and refreshes every 60 seconds with a visible countdown.

## 1.0.0

- Baseline before versioning: UTM table/counter ordering, free in-restaurant delivery, staff-key item availability, and staff-key protected orders API.
