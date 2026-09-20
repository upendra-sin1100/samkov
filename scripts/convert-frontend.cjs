// One-time source migration: retain native JSX and modern JavaScript syntax.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function convert(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { convert(file); continue; }
    if (!/\.tsx?$/.test(file) || file.endsWith('.d.ts')) continue;
    const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file,
      compilerOptions: {target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve},
      reportDiagnostics: true,
    });
    if (result.diagnostics.some(d => d.category === ts.DiagnosticCategory.Error)) {
      throw new Error(`Cannot convert ${file}`);
    }
    fs.writeFileSync(file.replace(/\.tsx?$/, file.endsWith('.tsx') ? '.jsx' : '.js'), result.outputText);
    fs.unlinkSync(file);
  }
}
convert(path.resolve(__dirname, '../frontend/app'));
