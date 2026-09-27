# Frontend background refresh

The frontend before this refresh is saved in commit `1de351a`, tagged
`frontend-before-background-effects-20260923`. This includes the preceding
light-theme text contrast fixes.

## Design

The home page now has original orbital paths, connected points, a soft orange
glow, and a dotted field. The lower sections use quieter contour accents.
The references informed spacing, depth, and geometry; their assets and layouts
were not copied. Existing copy, application links, cards, and workflows remain.

The effect uses CSS and inline SVG with no new packages or remote assets.
Pointer movement shifts the background slightly on fine-pointer devices.
The pause button stops background animation and pointer movement. Reduced-motion
preferences disable both. Hero board, cube, badge, and label motion was restored at the user's request; the pause control stops these animations too.

## Rollback

To restore only the two existing files changed by this refresh, after preserving
any later edits to those files:

```powershell
git restore --source frontend-before-background-effects-20260923 -- frontend/app/home.jsx frontend/app/layout.jsx
```

The new `learning-atmosphere.jsx` and `learning-atmosphere.css` files are then
unused and may be retained for later experiments. This avoids resetting any
unrelated work or removing files.

## Verification

- Frontend type check passed.
- Browser review in light and dark themes.
- Pause button confirmed to stop the CSS animation.
- Phone widths of 320px and 375px checked without horizontal overflow.
- Background is decorative, hidden from accessibility tools, and ignores clicks.

Changes are local; no deployment was performed.
