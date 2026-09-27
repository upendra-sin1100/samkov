# SamkovAI hero — supplied design integration

React component adapted from the supplied HTML preview.
Dependencies: React, lucide-react, Tailwind CSS v4.
Import styles in this order: globals.css, learning-atmosphere.css, hero.css.
The full site globals.css is included because the hero uses shared theme variables and layout rules.

Render inside <main className="intro-home">:
<Hero go={path => router.push(path)} />

Pass your router navigation callback as go. Include a section with id="how-it-works" for the secondary link.
Set html data-theme="light" or "dark" using your site's theme control.
Includes working pause control, reduced-motion support, floating card and waypoint, and orbital background.
