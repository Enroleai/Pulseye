# Pulseye UI Modernization TODO

## In progress
- [x] Establish blue, white, and orange dashboard visual tokens.
- [x] Modernize dashboard header, announcement banner, date control, and status cards.
- [x] Preserve the existing two-column chart grid and chart component dimensions.
- [x] Remove green status visualization colors.
- [x] Replace legacy orange accents with a cleaner modern orange and blue token system.
- [x] Apply Inter typography globally and flatten nested dashboard borders.
- [x] Modernize login screen with the same design system.
- [x] Modernize top navigation and sidebar interactions across all routes.
- [x] Walk through login and every authenticated route in the running Sandbox.
- [x] Replace the broken Live Tracking detail image state with a usable empty state.
- [ ] Add keyboard navigation shortcuts for primary sections.
- [ ] Replace remaining legacy CommonJS visualization dependencies where safe.

## Known technical debt
- Angular Karma builder is deprecated and should move to the current Angular test builder.
- Some visualization dependencies still emit CommonJS optimization warnings.
- The application still uses legacy module-based Angular components; standalone migration is deferred to avoid changing feature behavior.

## Latest Sandbox verification
- [x] Fixed the forwarded Angular preview host configuration.
- [x] Verified manager login from the live Sandbox preview.
- [x] Confirmed report APIs return successful empty responses for the seeded date range.
- [x] Replaced indefinite dashboard spinners with clear no-data states.
- [x] Rebuilt the frontend successfully.
- [x] Confirmed all 44 frontend tests pass.
