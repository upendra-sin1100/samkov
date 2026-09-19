const fs=require('fs'),{spawnSync}=require('child_process');
const local=process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python';
const executable=fs.existsSync(local)?local:'python';
const result=spawnSync(executable,['-m','unittest','discover','-s','backend/tests','-v'],{stdio:'inherit'});
if(result.error){console.error('Create the Python environment and install backend/requirements.txt first.');process.exit(1)}process.exit(result.status??1);
