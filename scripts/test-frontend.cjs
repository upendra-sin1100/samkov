const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const moduleResult = {exports:{}};
const source = fs.readFileSync('frontend/app/workspace-state.js','utf8');
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
new Function('module','exports',compiled)(moduleResult,moduleResult.exports);
const {selectApplication,certificatesForApplication,certificateIdFromPath} = moduleResult.exports;
const applications = [{id:'python-app',track_slug:'python',status:'approved'},{id:'web-app',track_slug:'web-development',status:'completed'}];
for(const route of ['tasks','learn','submit','apply','internships']) {
 assert.equal(selectApplication(applications,`/${route}/machine-learning`,'python-app'),undefined);
 assert.equal(selectApplication(applications,`/${route}/web-development`,'python-app').id,'web-app');
}
assert.equal(selectApplication(applications,'/certificate','web-app').id,'web-app');
assert.equal(selectApplication(applications,'/dashboard','missing').id,'python-app');
assert.equal(selectApplication([],'/dashboard','missing'),undefined);
const certificates=[{application_id:'python-app',id:'certificate-1'}];
assert.deepEqual(certificatesForApplication(certificates,'web-app'),[]);
assert.deepEqual(certificatesForApplication(certificates,'python-app'),certificates);
assert.deepEqual(certificatesForApplication(certificates),[]);
assert.equal(certificateIdFromPath('/verify/SKAI%2D2026'),'SKAI-2026');
assert.equal(certificateIdFromPath('/verify/%invalid'),'');
console.log('PASS: track isolation, internship selection, certificate scope, and verification URL parsing.');
