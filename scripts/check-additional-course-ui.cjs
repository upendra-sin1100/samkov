const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const normalJS = require.extensions['.js'];
const compile = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);
require.extensions['.jsx'] = compile;
require.extensions['.js'] = (module, filename) => filename.startsWith(path.resolve('frontend/app') + path.sep) ? compile(module,filename) : normalJS(module,filename);
process.env.NEXT_PUBLIC_SITE_URL = 'https://samkovai.tech';
const {additionalCourses} = require('../frontend/app/additional-courses');
const {tracks,resources,projectNames} = require('../frontend/app/data');
const TaskWorkspace = require('../frontend/app/task-workspace.jsx').default;
const {TaskCatalogue} = require('../frontend/app/task-workspace.jsx');
const {CertificateDocument,OfferDocument,VerificationPanel} = require('../frontend/app/program-documents.jsx');
const {selectApplication} = require('../frontend/app/workspace-state');
const css = fs.readFileSync('frontend/app/globals.css','utf8') + fs.readFileSync('frontend/app/program-documents.css','utf8');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/qr?*',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"/>'}));
  const render=async element=>page.setContent('<!doctype html><html><head><base href="https://samkovai.tech/"><style>'+css+'</style></head><body>'+renderToStaticMarkup(element)+'</body></html>');
  fs.mkdirSync('docs/new-course-preview',{recursive:true});
  await render(React.createElement(TaskCatalogue,{go:()=>{}}));
  assert.equal(await page.locator('.task-path').count(),14);
  for (const course of additionalCourses) {
   const track=tracks.find(t=>t.slug===course.slug);
   const application={id:course.slug,track_slug:course.slug,status:'approved',student_name:'Sample Learner',verification_id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',start_date:'2026-09-26',end_date:course.weeks===6?'2026-11-07':'2026-11-21'};
   for(const route of ['tasks','internships','apply','dashboard','submit','offer','certificate']) assert.equal(selectApplication([application],'/'+route+'/'+course.slug)?.id,course.slug);
   assert.equal(projectNames[course.slug].length,6);
   await render(React.createElement(TaskWorkspace,{track,go:()=>{},onSubmit:()=>{}}));
   assert.equal(await page.locator('.task-item').count(),6);
   assert.equal(await page.locator('.task-level').count(),3);
   assert.deepEqual(await page.locator('.doc-resource').evaluateAll(links=>links.map(a=>a.href)),resources[course.slug].map(r=>r.url));
   assert.equal(await page.getByText('YouTube resources',{exact:true}).count(),0);
   for(const width of [390,1200]) {
    await page.setViewportSize({width,height:950});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,course.slug+' workspace overflow');
   }
   const certificate={...application,id:'SKAI-2026-'+'A'.repeat(32),track_title:course.name,duration_weeks:course.weeks,projects_completed:6,completed_at:'2026-11-22',issued_at:'2026-11-22',status:'active'};
   for (const [kind,element] of [['offer',React.createElement(OfferDocument,{application,track})],['certificate',React.createElement(CertificateDocument,{certificate})]]) {
    await render(element);
    assert.ok((await page.locator('body').innerText()).includes(course.name));
    const id=kind==='offer'?'SKAI-OL-'+'B'.repeat(32):certificate.id;
    assert.equal(await page.locator('.document-verification a').getAttribute('href'),'https://samkovai.tech/verify/'+id);
    assert.equal(await page.locator('.document-verification img').getAttribute('src'),'/api/qr?id='+id);
    for (const width of [320,390,1200]) {
     await page.setViewportSize({width,height:1000});
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,course.slug+' '+kind+' overflow');
    }
    if(kind==='certificate') await page.screenshot({path:'docs/new-course-preview/'+course.slug+'-certificate.png',fullPage:true});
   }
   await render(React.createElement(VerificationPanel,{document:{...certificate,type:'certificate'},checked:true,id:certificate.id,go:()=>{}}));
   assert.equal(await page.getByRole('heading',{name:'Completion verified'}).count(),1);
   assert.ok((await page.locator('.verification-facts').innerText()).includes(course.name));
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: 14 catalogue entries; six new course routes, project briefs, resource URLs, offer/certificate layouts, verification links and record display. QR images stubbed; real QR endpoint covered by backend tests.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
