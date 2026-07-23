# WillItFly RC0.4 — WillIt Lab Offline-Only PWA

## Locked UX principle

Play is completely free and immediate.

No username, email, account, or consent prompt appears before a round.
Registration is offered only after the score has already been shown.

## Included

- One-tap flying
- Airport-stage obstacles
- Passport, passport-control, and boarding-pass collectibles
- Scoring and device personal best
- Local top-five leaderboard
- Device-only personal best and local leaderboard
- Lightweight parallax airport background
- Seasonal configuration framework:
  - Original
  - Summer
  - Christmas
  - Easter
  - Fringe
- Automatic date-based theme plus manual preview switch
- Offline PWA caching
- Example server-side validation endpoint

## Launch boundary

This release is certified **Offline Only**. Score registration is disabled and hidden.
The game makes no score-registration network request and requests no personal data.
A production leaderboard requires a separate backend, privacy and abuse-control certification.

## RC0.4 integration

- Published only beneath `/lab/`; no game script is imported by the WillItFit application.
- Added a governed WillIt Lab return path and result focus recovery.
- Browser zoom is permitted and reduced-motion preferences are respected.
- Core baggage logic, search, airline data and application storage are not imported or referenced.

## Test locally

From the extracted directory:

```bash
python3 -m http.server 8080
```

Open:

`http://localhost:8080`

For phone/PWA testing, deploy the extracted directory to an HTTPS static host and open it in Safari or Chrome.

## Data stored locally

- Device high score
- Local leaderboard
- Selected seasonal theme

No registration data is requested before play.
