const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const ts = require('typescript'), React = require('react'), {renderToStaticMarkup} = require('react-dom/server');
const {chromium} = require('C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
require.extensions['.css'] = () => {};
require.extensions['.jsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);
const Chooser = require('../frontend/app/internship-chooser.jsx').default;
const videoModule = {exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('frontend/app/video-resources.js','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(videoModule,videoModule.exports);
assert.equal(Object.keys(videoModule.exports.videos).length,14);
for (const slug of ['frontend-development','backend-development','java-development','mobile-development','devops-cloud','system-design']) {
    assert.ok(videoModule.exports.videos[slug].length);
    for (const video of videoModule.exports.videos[slug]) {
        assert.equal(new URL(video.url).hostname,'www.youtube.com');
        assert.equal(video.creator,'freeCodeCamp.org');
    }
}
const props = {applications:[{id:'pending',track_slug:'web-development',status:'pending'},{id:'active',track_slug:'artificial-intelligence',status:'approved'}],tracks:[{slug:'web-development',name:'Web Development',weeks:6},{slug:'artificial-intelligence',name:'Artificial Intelligence',weeks:8}],names:{'web-development':['a','b','c'],'artificial-intelligence':['a','b','c']},submissions:[{application_id:'active',project_index:0,status:'approved'}],go:()=>{}};
const out = fs.mkdtempSync(path.join(os.tmpdir(),'samkov-dashboard-'));
(async()=>{
    const browser = await chromium.launch({channel:'msedge',headless:true});
    try {
        const page = await browser.newPage();
        const css = ['globals.css','internship-chooser.css'].map(f=>fs.readFileSync('frontend/app/'+f,'utf8')).join('\n');
        for (const theme of ['light','dark']) {
            await page.setContent('<!doctype html><html data-theme="'+theme+'"><head><style>'+css+'</style></head><body><main class="workspace-main" style="max-width:1000px;margin:auto;padding:24px">'+renderToStaticMarkup(React.createElement(Chooser,props))+'<div class="panel space-top"><div class="project-row"><span>Responsive Landing Page</span><span class="status">Complete</span></div><div class="project-row"><span>Recent submission</span><span class="status">approved</span></div></div></main></body></html>');
            for(const width of [390,768,1200]) {
                await page.setViewportSize({width,height:900});
                assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,theme+' overflow at '+width);
                assert.equal(await page.locator('.chooser-card').count(),2);
                assert.match(await page.locator('.chooser-progress').last().innerText(),/1 of 3 projects approved/);
                assert.equal(await page.locator('.status').first().evaluate(node=>getComputedStyle(node).color),'rgb(37, 53, 106)');
                await page.screenshot({path:path.join(out,`${theme}-${width}.png`),fullPage:true});
            }
        }
        console.log('PASS: responsive internship chooser, per-internship progress, readable status pills, and video entries for all 14 courses.');
        console.log('Previews:',out);
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
