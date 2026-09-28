const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const runtime = process.env.CODEX_DEPENDENCIES || 'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const {chromium} = require(path.join(runtime, 'node/node_modules/playwright'));
require.extensions['.jsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText, filename);
process.env.NEXT_PUBLIC_SITE_URL = 'https://samkovai.me';
const {OfferDocument, CertificateDocument} = require('../frontend/app/program-documents.jsx');
const application = {student_name:'Taylor Morgan',verification_id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',start_date:'2026-09-28',end_date:'2026-11-09'};
const certificate = {...application,student_name:'Taylor Morgan Alexander Christopher Benjamin Sullivan Montgomery Richardson',id:'SKAI-2026-'+'A'.repeat(32),track_title:'Artificial Intelligence and Machine Learning Development',duration_weeks:6,completed_at:'2026-11-09',issued_at:'2026-11-10',projects_completed:6,status:'active'};
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'samkov-print-'));
const css = ['globals.css','program-documents.css','program-feedback.css'].map(file => fs.readFileSync(path.join('frontend/app',file),'utf8')).join('\n');
(async () => {
    const browser = await chromium.launch({channel:'msedge',headless:true});
    try {
        const page = await browser.newPage();
        await page.route('**/api/qr*', route => route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="white"/><path d="M10 10h30v30H10zM70 10h30v30H70zM10 70h30v30H10z"/></svg>'}));
        for (const [name, element] of [['offer',React.createElement(OfferDocument,{application,track:{name:'Frontend Development',weeks:6}})],['certificate',React.createElement(CertificateDocument,{certificate})]]) {
            for (const theme of ['light','dark']) {
                // An empty host/notification box must not force the full-page document onto page two.
                const html = '<!doctype html><html data-theme="'+theme+'"><head><base href="https://samkovai.me"><style>'+css+'</style></head><body><div style="height:12px" aria-live="polite"></div><header>Site navigation</header><div class="workspace container"><aside class="workspace-nav">Navigation</aside><main class="workspace-main"><div class="page-title"><h1>Workspace title</h1></div><label>Choose internship<select><option>Frontend Development</option></select></label>'+renderToStaticMarkup(element)+'<button>Print / Save PDF</button><section class="program-feedback"><h2>Private feedback form</h2><textarea>Do not print this</textarea></section></main></div><footer>Website footer</footer></body></html>';
                await page.setContent(html);
                for (const width of [390,1440]) {
                    await page.setViewportSize({width,height:1000});
                    await page.emulateMedia({media:'screen'});
                    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1),false,`${name} screen overflow at ${width}`);
                    const readable = await page.locator('.program-document p,.program-document li,.program-document dt,.program-document dd').evaluateAll(nodes => nodes.every(node => {
                        const style = getComputedStyle(node);
                        return style.color === 'rgb(17, 17, 17)' && Number(style.fontWeight) >= 600;
                    }));
                    assert.ok(readable,`${name}: paragraphs and labels must use dark, heavier ink`);
                    await page.emulateMedia({media:'print'});
                    const pdf = path.join(out, `${name}-${theme}-${width}.pdf`);
                    await page.pdf({path:pdf,preferCSSPageSize:true,printBackground:true});
                    const result = JSON.parse(execFileSync(path.join(runtime,'python/python.exe'), ['-c', 'import sys,json; from pypdf import PdfReader; r=PdfReader(sys.argv[1]); print(json.dumps({"pages":len(r.pages),"texts":[p.extract_text() for p in r.pages],"width":float(r.pages[0].mediabox.width),"height":float(r.pages[0].mediabox.height)}))', pdf], {encoding:'utf8'}));
                    assert.equal(result.pages,1,`${name}/${theme}/${width}: expected one page, got ${result.pages}; PDFs: ${out}`);
                    assert.match(result.texts[0],/Taylor Morgan/);
                    assert.match(result.texts[0],/samkovaicorporation@gmail.com/);
                    assert.match(result.texts[0],/does not certify employment/);
                    assert.doesNotMatch(result.texts[0],/Private feedback form|Choose internship|Website footer|Workspace title/);
                    assert.equal(result.width > result.height,name === 'certificate');
                }
            }
        }
        console.log('PASS: offer/certificate each print on one A4 page, with all document text and no dashboard content, from mobile/desktop and light/dark themes.');
        console.log('PDF previews:',out);
    } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
