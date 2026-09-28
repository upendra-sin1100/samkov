const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const {chromium} = require('C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const compiler = require('next/dist/compiled/webpack/webpack'); compiler.init();
const out = fs.mkdtempSync(path.join(os.tmpdir(),'samkov-application-review-'));
const jsxLoader = path.join(out,'jsx.cjs'), cssLoader = path.join(out,'css.cjs');
fs.writeFileSync(jsxLoader, `const ts=require(${JSON.stringify(require.resolve('typescript'))});module.exports=function(source){return ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;}`);
fs.writeFileSync(cssLoader,'module.exports=function(){return "";}');
const entry = path.join(out,'entry.js');
fs.writeFileSync(entry, `
const React=require('react');const {createRoot}=require('react-dom/client');
const AdminDashboard=require(${JSON.stringify(path.resolve('frontend/app/admin-dashboard.jsx'))}).default;
window.reviewCalls=[];
const records={users:[{id:'learner',display_name:'Taylor Morgan',email:'taylor@example.com'}],applications:[{id:'application-one',user_id:'learner',student_name:'Taylor Morgan',track_slug:'frontend-development',status:'pending',occupation:'student',college:'Example College',start_date:'2026-10-01',motivation:'I want to build accessible websites and improve my React skills.'}],submissions:[],certificates:[]};
const api=async(action,data)=>{window.reviewCalls.push({action,data});return {total_users:1,active_users:1,total_views:1,views_today:1,updated_at:new Date().toISOString(),feedback:[]};};
createRoot(document.getElementById('root')).render(React.createElement(AdminDashboard,{records,tracks:[{slug:'frontend-development',name:'Frontend Development'}],names:{'frontend-development':['Landing page','React app','Portfolio']},preview:false,api,refresh:async()=>{},go:()=>{}}));
`);
(async()=>{
    await new Promise((resolve,reject)=>compiler.webpack({mode:'development',devtool:false,entry,plugins:[new compiler.webpack.DefinePlugin({'process.env.NEXT_PUBLIC_SITE_URL':JSON.stringify('https://samkovai.me')})],output:{path:out,filename:'bundle.js'},resolve:{modules:[path.resolve('node_modules'),'node_modules'],extensions:['.js','.jsx','.json']},module:{rules:[{test:/\.jsx$/,use:jsxLoader},{test:/\.css$/,use:cssLoader}]},optimization:{minimize:false}},(error,stats)=>error?reject(error):stats.hasErrors()?reject(Error(stats.toString({all:false,errors:true}))):resolve()));
    const browser=await chromium.launch({channel:'msedge',headless:true});
    try {
        const page=await browser.newPage();
        const errors=[];page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
        const css=['globals.css','admin-dashboard.css'].map(f=>fs.readFileSync('frontend/app/'+f,'utf8')).join('\n');
        for(const width of [390,1440]) {
            await page.setViewportSize({width,height:1000});
            await page.setContent('<!doctype html><html><head><style>'+css+'</style></head><body><div id="root"></div></body></html>');
            await page.addScriptTag({content:fs.readFileSync(path.join(out,'bundle.js'),'utf8')});
            await page.getByRole('button',{name:'Review application',exact:true}).click();
            const dialog=page.getByRole('dialog');
            await dialog.getByText('I want to build accessible websites and improve my React skills.',{exact:true}).waitFor();
            await dialog.getByText('Example College',{exact:true}).waitFor();
            await dialog.getByText('01/10/2026',{exact:true}).waitFor();
            assert.ok(await dialog.locator('.application-review dd').first().evaluate(node => Number(getComputedStyle(node).color.match(/\d+/)[0]) >= 180), 'Enrollment details must stay readable on the dark admin panel');
            assert.equal(await page.evaluate(()=>window.reviewCalls.filter(c=>c.action==='approve_application').length),0,'Opening the review must not approve');
            assert.equal(await dialog.evaluate(node=>node.scrollWidth>node.clientWidth+1),false,'Drawer content must fit');
            await page.screenshot({path:path.join(out,`review-${width}.png`),fullPage:true});
            await dialog.getByRole('button',{name:'Approve application',exact:true}).click();
            assert.deepEqual(await page.evaluate(()=>window.reviewCalls.filter(c=>c.action==='approve_application')),[{action:'approve_application',data:{id:'application-one'}}]);
        }
        assert.deepEqual(errors,[]);
        console.log('PASS: mobile and desktop review show motivation and enrollment details before an explicit approval, with exactly one approval request.');
        console.log('Previews:',out);
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
