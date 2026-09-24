// Run against a local preview build with Clerk disabled; no live accounts are used.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || undefined, headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1366,height:768}});
    const errors=[];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({tracks:[],resources:[]})}));
    fs.mkdirSync('docs/profile-preview', {recursive:true});
    await page.goto(process.env.PREVIEW_URL || 'http://localhost:3100');
    for (const [width,height] of [[1024,600],[1280,720],[1366,768],[1440,900],[320,740],[390,844],[768,1024]]) {
      await page.setViewportSize({width,height});
      await page.locator('.sk-hero').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `overflow at ${width}`);
      if(width>900) {
        const hero = await page.locator('.sk-hero').boundingBox();
        assert.ok(hero.y+hero.height <= height+5, `Hero exceeds laptop viewport: ${JSON.stringify(hero)}`);
      }
      const launcher = await page.locator('.chat-launcher').boundingBox();
      assert.equal(Math.round(launcher.width),44);
      await page.screenshot({path:`docs/profile-preview/home-${width}.png`});
    }
    await page.setViewportSize({width:1366,height:768});
    await page.getByRole('button',{name:'Log in',exact:true}).click();
    await page.getByRole('button',{name:'Explore demo workspace'}).click();
    await page.getByRole('button',{name:'My profile',exact:true}).last().click();
    await page.getByLabel('Full name',{exact:true}).fill('Taylor Morgan');
    await page.locator('select[name=occupation]').selectOption('student');
    await page.getByLabel('College / institution',{exact:true}).fill('Example College');
    await page.getByRole('button',{name:'Save profile'}).click();
    await page.getByRole('button',{name:'Overview',exact:true}).click();
    await page.getByRole('heading',{name:'Welcome, Taylor.'}).waitFor();
    await page.getByRole('button',{name:'My profile',exact:true}).last().click();
    assert.equal(await page.getByLabel('Full name',{exact:true}).inputValue(),'Taylor Morgan');
    await page.locator('select[name=occupation]').selectOption('employee');
    assert.equal(await page.getByLabel('College / institution',{exact:true}).count(),0);
    await page.getByLabel('Company',{exact:true}).fill('Example Company');
    await page.getByRole('button',{name:'Save profile'}).click();
    await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:'docs/profile-preview/profile-desktop.png',fullPage:true});
    // Navigate without reloading the intentionally in-memory preview account.
    await page.evaluate(() => {history.pushState({},'', '/apply/python');dispatchEvent(new PopStateEvent('popstate'));});
    assert.equal(await page.getByLabel('Full name',{exact:true}).inputValue(),'Taylor Morgan');
    assert.equal(await page.getByLabel('Company',{exact:true}).inputValue(),'Example Company');
    await page.getByLabel('Preferred start date').fill('2099-01-01');
    await page.getByLabel('Why would you like to join?').fill(Array(16).fill('learn').join(' '));
    assert.equal(await page.getByRole('button',{name:'Submit application'}).isDisabled(),true);
    await page.getByLabel('Why would you like to join?').fill(Array(15).fill('learn').join(' '));
    assert.equal(await page.getByRole('button',{name:'Submit application'}).isEnabled(),true);
    await page.locator('select[name=occupation]').selectOption('other');
    assert.equal(await page.getByLabel('Company',{exact:true}).count(),0);
    assert.equal(await page.getByLabel('College / institution',{exact:true}).count(),0);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),false);
    await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:'docs/profile-preview/enrollment-mobile.png',fullPage:true});
    await page.getByRole('checkbox').check();
    await page.getByRole('button',{name:'Submit application'}).click();
    await page.getByText('Preview application submitted. No real application was saved.').waitFor();
    await page.getByRole('button',{name:'My profile',exact:true}).last().click();
    await page.locator('select[name=occupation]').selectOption('other');
    await page.getByRole('button',{name:'Save profile'}).click();
    await page.getByRole('button',{name:'Overview',exact:true}).click();
    await page.getByRole('button',{name:'My profile',exact:true}).last().click();
    assert.equal(await page.locator('select[name=occupation]').inputValue(),'other');
    assert.equal(await page.getByLabel('Company',{exact:true}).count(),0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),false);
    await page.getByRole('button',{name:'Switch to dark theme'}).click();
    await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:'docs/profile-preview/profile-mobile-dark.png',fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('PASS: responsive hero, compact support, profile edits, enrollment prefill, conditional fields and 15-word maximum.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
