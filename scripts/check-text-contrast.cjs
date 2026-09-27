const { chromium } = require('C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

// Audit rendered text against solid backgrounds; gradients need visual review.
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    for (const path of ['/', '/internships', '/internships/python', '/tasks', '/tasks/python', '/verify', '/login']) {
      await page.goto('http://127.0.0.1:3000' + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
      const ready = { '/': '.intro-home', '/internships': '.catalog-controls', '/internships/python': '.enrollment-card', '/tasks': '.task-catalog-grid', '/tasks/python': '.task-level-grid', '/verify': '.form-panel', '/login': '.auth-wrap' };
      await page.locator(ready[path]).first().waitFor({ timeout: 60000 });
      await page.evaluate(() => document.documentElement.dataset.theme = 'light');
      const failures = await page.evaluate(() => {
        const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
        const luminance = c => c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
        const found = new Map();
        for (const el of document.querySelectorAll('body *')) {
          if (!(el instanceof HTMLElement) || !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || el.closest('[aria-hidden="true"],nextjs-portal') || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
          const style = getComputedStyle(el), foreground = rgb(style.color);
          if (foreground[3] === 0) continue;
          let background = [255, 255, 255];
          for (let parent = el; parent; parent = parent.parentElement) {
            const c = rgb(getComputedStyle(parent).backgroundColor);
            if (c.length === 3 || c[3] === 1) { background = c; break; }
          }
          const a = luminance(foreground), b = luminance(background);
          const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
          const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
          if (ratio < (large ? 3 : 4.5)) {
            const key = el.className || el.tagName;
            if (!found.has(key)) found.set(key, { selector: key, text: el.textContent.trim().slice(0, 60), ratio: +ratio.toFixed(2), color: style.color });
          }
        }
        return [...found.values()];
      });
      console.log(path, JSON.stringify(failures));
      if (path === '/internships') {
        await page.screenshot({ path: 'docs/contrast-internships-light.png' });
        await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
        await page.screenshot({ path: 'docs/contrast-internships-dark.png' });
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
