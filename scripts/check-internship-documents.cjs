const fs = require('node:fs');
const path = require('node:path');
const {execFileSync}=require('node:child_process');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {chromium} = require('C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
require.extensions['.jsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);
process.env.NEXT_PUBLIC_SITE_URL = 'https://samkovai.me';
const {OfferDocument,CertificateDocument,documentDate} = require('../frontend/app/program-documents.jsx');
assert.equal(documentDate('2026-09-24'),'24/09/2026');
const application = {student_name:'Taylor Morgan',verification_id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',start_date:'2026-09-24',end_date:'2026-11-05'};
const certificate = {...application,id:'SKAI-2026-'+ 'A'.repeat(32),track_title:'Python Programming',duration_weeks:6,completed_at:'2026-11-05',issued_at:'2026-11-06',projects_completed:6,status:'active'};
(async()=>{
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage();
  fs.mkdirSync('docs/document-preview',{recursive:true});
  for (const [name, element] of [['offer',React.createElement(OfferDocument,{application,track:{name:'Python Programming',weeks:6}})],['certificate',React.createElement(CertificateDocument,{certificate})]]) {
   const html='<html><head><style>'+fs.readFileSync('frontend/app/globals.css','utf8')+'\n'+fs.readFileSync('frontend/app/program-documents.css','utf8')+'</style></head><body style="padding:24px">'+renderToStaticMarkup(element).replace(/src="\/api\/qr[^"]*"/, 'src="data:image/svg+xml;base64,' + execFileSync('.venv/Scripts/python.exe',['-c', 'import qrcode,qrcode.image.svg,io,sys; b=io.BytesIO(); qrcode.make(sys.argv[1],image_factory=qrcode.image.svg.SvgPathImage).save(b); sys.stdout.buffer.write(b.getvalue())', 'https://samkovai.me/verify/' + (name === 'offer' ? 'SKAI-OL-'+'B'.repeat(32) : certificate.id)]).toString('base64') + '"')+'</body></html>';
   await page.setContent(html);
   for (const width of [320,390,768,1200]) {
    await page.setViewportSize({width,height:1000});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,name+' overflow');
    await page.screenshot({path:`docs/document-preview/${name}-${width}.png`,fullPage:true});
   }
   await page.pdf({path:`docs/document-preview/${name}-sample.pdf`,preferCSSPageSize:true,printBackground:true});
  }
  console.log('PASS: Indian date format and responsive offer/certificate layouts.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
