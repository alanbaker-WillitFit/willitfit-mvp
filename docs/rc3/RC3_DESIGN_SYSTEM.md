# RC3 Design System

## Authority

RC2.37 navy, green, amber and red remain locked. RC3 governs their use; it does not replace the identity. Tailwind-facing values live in `tokens/designTokens.ts`, runtime CSS values live in `styles/tokens.css`, and application primitives live in `app/globals.css`. Colour literals outside the token library are prohibited.

## Foundations

- Navy provides structure, typography and trust.
- Green identifies the primary action and PASS state.
- Amber and red are reserved for CLOSE and FAIL/warning states.
- System sans-serif stacks prevent font downloads and preserve readability.
- Spacing follows the Tailwind scale or named `--wf-space-*` tokens.
- Motion uses fast, standard and slow duration tokens and always respects reduced motion.

## Reusable variants

| Primitive | Variants/states |
|---|---|
| `.wf-card` | compact, large, success, warning, error |
| `.wf-btn-cta` | default, hover, active, focus-visible, disabled |
| `.wf-input` | default, focus, error |
| `.wf-decision-module` | neutral, success, warning, error |
| `.wf-result` | entering, visible |
| `.wf-container` | standard, narrow |
| `.wf-section` | standard, compact |
| `StatusIcon` | success, warning, error with text-equivalent labels |
| `Breadcrumbs` | linked ancestors and current page |
| `PolicyPage` | title, introduction and governed content body |

## Rules for future work

Use an existing primitive first. Add a token only when a value is reusable and intentional. Never encode result meaning through colour alone. Illustrations may have fixed geometry, but their colours, radii and motion remain governed tokens.
