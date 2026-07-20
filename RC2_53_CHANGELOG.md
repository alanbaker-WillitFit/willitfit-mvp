# RC2.53 — Mobile and Interaction Polish

## Checker
- Added a mobile sticky action area that remains within the checker and respects device safe areas.
- Increased primary touch targets to at least 48 px.
- Added `aria-pressed` to bag-type controls.
- Added mobile keyboard hints and disabled autofill for measurement fields.

## Responsive tables
- Result comparison and fare-option tables now become labelled stacked rows on narrow screens.
- Removed forced horizontal scrolling for core comparison data.

## Mobile navigation
- Mobile navigation is constrained to the viewport and scrolls independently.
- Page scrolling is locked while the menu is open.
- Escape closes the mobile menu for keyboard users.

## Layout
- Reduced mobile card padding while retaining the desktop spacing system.
- Added safe-area padding for modern iPhone and iPad browser chrome.
