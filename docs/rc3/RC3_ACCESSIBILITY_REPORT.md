# RC3 Accessibility Report

Status: Section 6 engineering verification

## Implemented controls

- Skip link targets the named main landmark.
- Global focus-visible treatment remains high contrast and is not removed by component styles.
- Mobile navigation exposes state and controlled-region relationships; Escape closes menus.
- Desktop dropdown Escape handling restores focus to its trigger.
- Airline combobox implements listbox semantics, active descendant, arrow navigation, Enter selection and Escape dismissal.
- All measurement inputs have persistent labels, input modes, error relationships and recovery messages.
- Invalid submission focuses the first invalid field; a completed result receives focus and a polite live-region announcement.
- PASS, CLOSE and FAIL include icons, labels and explanatory text; colour is supplementary.
- FAQ controls expose expanded state and explicit answer relationships.
- Minimum primary control targets are 44–48 CSS pixels.
- Reduced-motion preferences disable non-essential transitions and smooth scrolling.
- Responsive tables switch to labelled row presentation; long text can wrap to prevent horizontal overflow.

## Engineering validation

- Automated semantic component contracts: 3/3 pass; full regression suite 78/78 pass.
- Keyboard path source review: complete for header, navigation, checker, combobox, result and footer.
- Breakpoint source review: 320px/mobile, 640px/tablet and 1024px/desktop reflow rules retained.
- Strict type-check, clean lint and 34-page production build: pass.

## UAT boundary

Real-device screen-reader and browser/OS zoom checks remain part of Product Owner UAT. They cannot be truthfully certified by static source analysis alone and are listed in the production checklist rather than assumed complete.
