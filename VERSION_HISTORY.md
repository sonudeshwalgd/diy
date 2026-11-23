# Version History

Format: `MAJOR.MINOR.PATCH`

- Every pushed change must bump the version.
- Frontend-only change: increment `PATCH` (last digit).
- Change that also updates the backend: increment `MINOR` (middle digit) as well as `PATCH`.
- `MAJOR` is reserved for breaking changes.

The current version lives in `app.json` and is displayed at the bottom of the sidebar.

## 1.12.4

- Moved the Coming Soon vote section above Combos & Meals.
- Hid the DIY Chinese menu when the hidden-items API fails and no valid local snapshot is available, including menu cards, combos, and banner combos.

## 1.12.3

- Removed public up/down vote counts from Coming Soon cards; every customer sees all items, and each customer sees only their own vote.

## 1.12.2

- Added a "Do you want to pack the food?" checkbox in Your Cart above the WhatsApp order button for non-delivery (inside-restaurant) orders, and included the packing request in the WhatsApp message when checked.

## 1.12.1

- Added a QR-code icon button beside the `Pay Entire Bill` button; it has no label and opens a popup with an amount-prefilled UPI QR for the whole outstanding bill.

## 1.12.0

- Moved the `Pay Now` entry point inside the existing Active Orders floating widget; there is no separate floating button above it.
- The active-orders `Pay Now` sheet now shows one `Pay Entire Bill` button with the combined outstanding amount instead of a button for each order.
- `Pay Now` in order details also pays the entire outstanding bill in one UPI intent; the amount is fetched from the backend and prefilled.
- Added backend batch verification and a staff `Entire bill · UPI` panel that allocates one received amount and UPI transaction ID across all unpaid orders before marking them Paid.

## 1.11.0

- Added a compact floating `Pay Now` button to the menu screen that opens a bottom sheet of active orders, each with its order ID, date, items, total, payment status, and an individual `Pay Now` button.
- Added a conditional `Pay Now` button to the existing active-order details sheet for unpaid or failed orders; paid orders no longer show it, and partially paid orders show only the remaining amount.
- `Pay Now` fetches the latest order and payable amount from the backend, then opens the UPI intent directly so the operating system presents the available UPI app chooser with the amount prefilled. Customers are not asked to scan a QR, pick an app, or submit a transaction ID.
- Added backend payment-status endpoints and staff-only verification of the received amount before an order is marked Paid; order details refresh when the customer returns so `Pay Now` disappears once payment is verified.
- Added UPI payment status, paid amount, remaining amount, and transaction reference fields to stored orders without changing checkout, cart, Place Order, or the WhatsApp ordering flow.

## 1.10.36

- Added `(Made with Real Strawberries)` to the strawberry shake and crusher product names.
- Added Milk Chocolate, Dark Chocolate, and White Chocolate (₹10 extra) options to Single Chocolate Waffle.
- Added Double Chocolate Pancake with 8 Pieces (₹109) and 12 Pieces (₹149) options and its supplied image.
- Renamed the ₹39 Grilled Burger to `VEGI TIKKI BURGER` and updated Paneer Burger to ₹79 and Cheesy Paneer Burger to ₹89.
- Updated Paneer Sandwich to ₹89 and Cheesy Paneer Sandwich to ₹99.
- Added flavour-based image switching for Single Cone while keeping Double Delight and Dry Fruit images unchanged, using the supplied vanilla cone image for vanilla and the original cone image for chocolate.
- Added Real Strawberry Honey Pancake to the Coming Soon list.
- Made the Coming Soon arrow indicators tappable in both directions, with each arrow shown only when scrolling is possible.
- Updated dashboard item categorization for the renamed and new item names.

## 1.10.31

- Shortened order IDs to `XXXXXXXX-CCCC`, removing the date and `DIY` prefix.
- Appended a hidden 4-character customer code derived from the stored device user token to each order ID.
- Removed `Customer ID` and `Customer Mobile` lines from WhatsApp order messages on both frontend and backend.
- Cleaned 291 previously stored WhatsApp messages that still contained those lines.

## 1.9.30

- Added Momos, Spring Rolls, Maggi, Rajma Chawal, Kadhi Chawal, Pasta, Parathas, Noodles, Fried Rice, and Laphing to the Coming Soon section.
- Added a Vote row to each Coming Soon card with an arrow, thumbs up, thumbs down, and live up/down counts.
- Added backend vote storage through `GET /api/coming-soon/votes` and `PUT /api/coming-soon/votes`, with one vote per item per visitor token and support for switching or clearing a vote.
- Added a Mongoose `ComingSoonVote` model with a unique `itemId + visitorId` index, vote aggregation, and visitor-specific vote lookup.
- Kept a local device cache as an offline fallback while reconciling votes with backend totals on load and after each vote.

## 1.8.29

- Renamed the secondary menu from the old name to `diy_chineese` / `DIY Chinese` everywhere: frontend and backend API routes, staff screen route, feature flag, restaurant tag, scoped storage keys, disabled/hidden scope values, ID prefix, React providers, data files, dashboard labels, and documentation.
- Renamed `data/products_bambooz.json` to `data/products_diy_chineese.json`, `data/products_bambooz.ts` to `data/products_diy_chineese.ts`, and `app/items/disabled/bambooz.tsx` to `app/items/disabled/diy_chineese.tsx`.
- Renamed staff routes to `/items/disabled/diy_chineese`, `/items/hidden`, and `/items/hidden/diy_chineese`, with scope and persisted document key `diy_chineese`.
- Renamed the restaurant tag to `restaurant: "diy_chineese"` across cart items, order payloads, order documents, activity events, duplicate checks, idempotency keys, analytics, and dashboards.
- Verified no `bambooz` references remain and reran frontend, backend, and dashboard lint/typechecks.

## 1.7.28

- Added a full DIY Chinese menu alongside the existing DIY menu behind the `menu.includeDiyChinese` feature flag.
- Added `data/products_diy_chineese.json` with 13 categories and 41 items, plus a typed adapter in `data/products_diy_chineese.ts` that maps categories, subcategories, variants, quantities, combo includes, and images into the existing menu model.
- Prefixed every DIY Chinese ID with `diy_chineese--` so cart variant IDs that use `:` continue to resolve to the correct base item for stock checks.
- Attached every supplied DIY Chinese image from `assets/bamboocza_ivory_food_images/` to its item and used the first item image as the category card image.
- Hid the DIY Chinese Cold Coffee, Sandwiches, Special Combos, and legacy combo category sections from the customer menu.
- Replaced six separate combo cards with one `Regular Meal` combo placed first in Combos & Meals, with six explicit choices: Chai + Aloo Paratha, Veg Steamed Momos + Chai, Classic Masala Maggi + Cold Coffee, Veg Steamed Momos + Cold Coffee, Veg Fried Rice + Veg Steamed Momos, and Veg Fried Rice + Cold Coffee.
- Mapped each Regular Meal option to its underlying primary item so stock flows through the correct category item while the option price stays the final combo price.
- Added a separate DIY Chinese staff screen at `/items/disabled/diy_chineese` and a `DIY CHINESE` shortcut on the global staff screen.
- Added independent hide and disable controls for every DIY and DIY Chinese item and combo; hidden items disappear from the customer menu while disabled items remain visible as out of stock.
- Added separate bulk buttons for each menu: Disable/Enable entire menu and Hide/Unhide entire menu. Hide and disable states are stored and toggled independently.
- Split disabled and hidden state into scoped global/DIY Chinese React contexts with local cache plus backend sync, and added `setItemsDisabled` / `setItemsHidden` bulk setters that save in one request.
- Added scoped backend routes for `items/disabled/diy_chineese`, `items/hidden`, and `items/hidden/diy_chineese`, with a separate `HiddenItems` model and document keys for global/DIY Chinese scopes.
- Reused the existing staff key verification for both hide and disable controls and added a database bypass for both DIY Chinese verify endpoints.
- Tagged cart items, order payloads, order documents, activity events, duplicate checks, duplicate-order guards, idempotency keys, and analytics with `restaurant: "diy_chineese"`.
- Updated item analytics in the app, web dashboard, and mobile dashboard to group by item name plus restaurant so DIY Chinese sales no longer merge into DIY sales, with DIY Chinese rows labeled separately.
- Renamed every API route, staff route, feature flag, restaurant tag, React context, ID prefix, data file, and UI label from the old menu name to `diy_chineese` / `DIY Chinese`.
- Verified the frontend with `npm run lint` and `npx tsc --noEmit`, and the backend with `npx tsc --noEmit`.

## 1.4.10

- Saved the last placed order ID on the device and used it to detect the customer when no mobile number is saved.
- Order lookup now accepts the generated order ID, so the app can resolve the customer's mobile number and load their full order history, loyalty points, total orders, and lifetime spend automatically.
- Manual mobile number entry still works as a fallback when no saved order or mobile number is available.

## 1.3.9

- Replaced the new-order alarm with a louder, repeating three-note chime so incoming orders are easier to hear.
- The alert still loops for one minute or until the order is moved out of New / Received.

## 1.3.8

- Made the orders page content below the header scroll as one area, including the new-order banner, summary panel, tabs, and order cards.
- The upper section no longer stays fixed, so expanded summary details and tabs remain reachable on smaller screens.

## 1.3.7

- Added a synchronous guard to the WhatsApp order button so repeated taps while the order is being saved or WhatsApp is opening are ignored.
- The button stays disabled until the order request and WhatsApp launch finish, preventing duplicate submissions from impatient taps.

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
