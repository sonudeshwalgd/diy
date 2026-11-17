# Version History

Format: `MAJOR.MINOR.PATCH`

- Every pushed change must bump the version.
- Frontend-only change: increment `PATCH` (last digit).
- Change that also updates the backend: increment `MINOR` (middle digit) as well as `PATCH`.
- `MAJOR` is reserved for breaking changes.

The current version lives in `app.json` and is displayed at the bottom of the sidebar.

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
