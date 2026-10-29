import {parseArgs} from 'node:util';
import path from 'node:path';
import process from 'node:process';
import {startSandbox} from './server.mjs';
const {values}=parseArgs({options:{app:{type:'string'},config:{type:'string'},'data-dir':{type:'string'},port:{type:'string',default:'4174'},help:{type:'boolean'}}});
if(values.help){process.stdout.write('node sandbox/start.mjs [--app=STATIC_DIRECTORY] [--config=settings.json] [--data-dir=DIAGNOSTICS_DIRECTORY] [--port=4174]\n');}
else{
  const port=Number(values.port);
  if(!Number.isInteger(port)||port<1025||port>65535)throw new Error('Use a port in 1025..65535');
  try{
    const sandbox=await startSandbox({port,appDirectory:values.app?path.resolve(values.app):undefined,settingsFile:values.config?path.resolve(values.config):undefined,diagnosticsDirectory:values['data-dir']?path.resolve(values['data-dir']):undefined});
    process.stdout.write(`\nПесочница: ${sandbox.url}\nПриложение: ${sandbox.application.manifest.name}\nДиагностика: ${sandbox.diagnostics.directory}\nВсе деньги и оборудование имитируются. Остановка: Ctrl+C.\n\n`);
    let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{if(!closing){closing=true;void sandbox.close();}});
  }catch(error){process.stderr.write((error.code==='EADDRINUSE'?'Порт занят. Выберите другой через --port.':error.message)+'\n');process.exitCode=1;}
}
