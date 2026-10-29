import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SandboxRun,ApiError,orientJpeg} from './lib/runtime.mjs';
import {loadApplication,defaults,validateSettings,defaultFaults,validateFaults,safeFile,CAPABILITIES,frames,effects} from './lib/config.mjs';
import {qrPng} from './lib/qr.mjs';
import {DiagnosticStore,fingerprint,SANDBOX_VERSION,scrubText} from './lib/diagnostics.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const prefix='/api/v1/external/runtime';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.wasm':'application/wasm','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const escape=(text)=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
function send(response,status,body,type='application/json; charset=utf-8'){
  if(response.destroyed||response.writableEnded)return;
  const buffer=Buffer.isBuffer(body)?body:Buffer.from(type.startsWith('application/json')?JSON.stringify(body):body);
  response.writeHead(status,{'Content-Type':type,'Content-Length':buffer.length,'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Retry-After':status===429?'1':'0'});response.end(buffer);
}
async function body(request,limit=8192){
  const chunks=[];let bytes=0;
  for await(const chunk of request){bytes+=chunk.length;if(bytes>limit)throw new ApiError('too_large','Слишком большой запрос',413);chunks.push(chunk);}
  return Buffer.concat(chunks);
}
async function json(request,limit=8192){try{return JSON.parse((await body(request,limit)).toString()||'{}');}catch(error){if(error instanceof ApiError)throw error;throw new ApiError('validation_error','Нужен корректный JSON');}}
const frameSvg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1800" viewBox="0 0 1200 1800"><rect x="18" y="18" width="1164" height="1764" rx="36" fill="none" stroke="#12a58a" stroke-width="36"/><path d="M70 150h180M70 150v180M1130 1650H950M1130 1650v-180" stroke="#efb759" stroke-width="14"/><text x="600" y="1740" text-anchor="middle" fill="#12374d" font-size="42" font-family="sans-serif">TEST FRAME</text></svg>';

export async function startSandbox({port=4174,appDirectory,settingsFile,diagnosticsDirectory,now,clock}={}){
  const application=await loadApplication(appDirectory,path.join(here,'probe'));
  let settings=defaults(application.manifest);let draftFaults={...defaultFaults};
  if(settingsFile){const imported=JSON.parse(await readFile(settingsFile,'utf8'));settings=validateSettings(imported.settings??imported,application.manifest);if(imported.faults)draftFaults=validateFaults(imported.faults);}
  const images=Object.fromEntries(await Promise.all(['main','top','side'].map(async camera=>[camera,await readFile(path.join(here,'assets',camera+'.jpg'))])));
  const sdkFile=await realpath(path.join(here,'../sdk/dist/external.js'));
  const sdkPackage=JSON.parse(await readFile(path.join(here,'../sdk/package.json'),'utf8'));
  const environment={sandbox:{version:SANDBOX_VERSION,build:await fingerprint(here)},
    sdk:{version:sdkPackage.version,sha256:createHash('sha256').update(await readFile(sdkFile)).digest('hex'),scope:'bundled SDK; custom applications may bundle another copy'},
    application:{...application.manifest,build:await fingerprint(application.root)},
    server:{node:process.version,platform:process.platform,release:os.release(),arch:process.arch}};
  const diagnostics=await new DiagnosticStore({directory:diagnosticsDirectory}).open();
  const runs=new Map();let current=null;let baseUrl;let tick;
  function newRun(raw={}){
    settings=validateSettings(raw.settings??settings,application.manifest);draftFaults=validateFaults(raw.faults??draftFaults);
    if(application.manifest.requires_online&&draftFaults.managementOffline)throw new ApiError('device_unavailable','Для этого приложения нужен сервер панели администратора',503);
    if(settings.fulfillment==='print'&&(settings.paper<1||draftFaults.printerFailure))throw new ApiError('device_unavailable','Перед запуском печатной услуги добавьте бумагу и восстановите принтер',503);
    if(current&&!['completed','stopped'].includes(current.state))current.stop('stopped','Начат новый запуск песочницы');
    const run=new SandboxRun({manifest:application.manifest,settings,faults:draftFaults,images,baseUrl,now,clock});
    run.appOrigin=`http://${run.id}.localhost:${server.address().port}`;run.url=run.appOrigin+`/apps/${application.manifest.id}/local/${application.manifest.entry}`;
    runs.set(run.id,run);current=run;diagnostics.attach(run,environment);
    // Keep recent simulated results. Disposed entries cannot accept new requests.
    while(runs.size>20){const oldest=runs.values().next().value;if(oldest===current)break;oldest.dispose();diagnostics.detach(oldest);runs.delete(oldest.id);}
    return run;
  }
  function panelState(){return {application:{name:application.manifest.name,id:application.manifest.id,version:application.manifest.version,
    builtin:application.builtin,capabilities:application.manifest.capabilities,network:application.manifest.network},
    settings,faults:current?.faults??draftFaults,availablePermissions:CAPABILITIES,frames,effects,
    run:current?{...current.summary(),url:current.url}:null,
    storage:{...diagnostics.health,limits:diagnostics.limits,directory:diagnostics.directory||null},history:diagnostics.list()};}
  const server=createServer(async(request,response)=>{
    let auditRun;const audit={serverRequestId:randomUUID(),method:request.method,route:null,requestId:null,clientRequestId:null};const received=performance.now();let audited=false;
    const recordRequest=()=>{if(audited||!auditRun)return;audited=true;auditRun.log('http.request',{...audit,status:response.writableFinished?response.statusCode:null,
      outcome:response.writableFinished?'response_sent':'connection_closed',durationMs:Math.round(performance.now()-received)},'http');};
    response.once('finish',recordRequest);response.once('close',recordRequest);
    try{
      const host=(request.headers.host??'').toLowerCase();
      const localPort=server.address().port;
      const panelHost=host===`127.0.0.1:${localPort}`||host===`localhost:${localPort}`;
      const match=host.match(new RegExp(`^([a-f0-9]{32})\\.localhost:${localPort}$`));
      if(!panelHost&&!match)throw new ApiError('forbidden','Неизвестный адрес песочницы',403);
      const url=new URL(request.url,'http://'+host);const pathname=decodeURIComponent(url.pathname);
      if(panelHost){
        if(pathname==='/__control/state'&&request.method==='GET'){send(response,200,panelState());return;}
        if(pathname==='/__control/session'&&request.method==='GET'){
          const detail=await diagnostics.detail(url.searchParams.get('id'));if(!detail)throw new ApiError('not_found','Сессия диагностики не найдена',404);send(response,200,detail);return;
        }
        if(pathname.startsWith('/__control/')&&request.method==='POST'){
          if(request.headers['x-sandbox-control']!=='1'||(request.headers.origin&&!['http://'+host,baseUrl].includes(request.headers.origin)))throw new ApiError('forbidden','Эта команда доступна только панели разработчика',403);
          const data=await json(request,65536);const action=pathname.slice('/__control/'.length);
          if(action==='export'){
            const bundle=await diagnostics.export(data.runId??current?.id,data.report);if(!bundle)throw new ApiError('not_found','Выберите сессию для диагностики',404);
            response.setHeader('Content-Disposition',`attachment; filename="pbt-sandbox-diagnostics-${bundle.summary.id}.json"`);send(response,200,bundle);return;
          }
          if(action==='start')newRun(data);
          else if(action==='clear-history'){for(const [id,run] of runs)if(run!==current){run.dispose();diagnostics.detach(run);runs.delete(id);}await diagnostics.clearHistory(current?.id);}
          else if(action==='faults'){
            draftFaults=validateFaults({...draftFaults,...data});if(current)current.control('faults',draftFaults);
          }else if(action==='command'){if(!current)throw new ApiError('conflict','Сначала начните сессию',409);current.control(data.action,data.data);}
          else throw new ApiError('not_found','Команда панели не найдена',404);
          send(response,200,panelState());return;
        }
        if(pathname.startsWith('/media/')){
          const [, ,id,photoId]=pathname.split('/');const run=runs.get(id);if(!run)throw new ApiError('not_found','Сессия не найдена',404);
          send(response,200,run.photo(photoId).data,'image/jpeg');return;
        }
        if(pathname.startsWith('/gallery/')){
          const id=pathname.split('/')[2];const run=runs.get(id);if(!run?.share)throw new ApiError('not_found','Фотографии для скачивания ещё не готовы',404);
          if(Date.parse(run.share.expiresAt)<run.clock())throw new ApiError('gone','Истёк срок ссылки',410);
          const html=`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Тестовые фотографии</title><style>body{font:18px system-ui;background:#eef4f7;color:#173247;margin:30px auto;max-width:1000px;padding:20px}img{width:100%;border-radius:14px}article{margin:24px 0;background:white;padding:16px;border-radius:18px}a{display:inline-block;margin:12px;color:#087b68}</style><h1>Тестовые фотографии</h1><p>Локальная галерея песочницы. Этот адрес работает на компьютере, где запущен симулятор.</p>${run.shareIds.map(photoId=>`<article><img src="/media/${id}/${photoId}" alt="Тестовая фотография"><a href="/media/${id}/${photoId}" download="${photoId}.jpg">Скачать JPEG</a></article>`).join('')}</html>`;
          send(response,200,html,'text/html; charset=utf-8');return;
        }
        if(pathname==='/__control/export'){
          const bundle=await diagnostics.export(url.searchParams.get('session')??current?.id);if(!bundle)throw new ApiError('not_found','Выберите сессию для диагностики',404);
          response.setHeader('Content-Disposition',`attachment; filename="pbt-sandbox-diagnostics-${bundle.summary.id}.json"`);send(response,200,bundle);return;
        }
        if(!['GET','HEAD'].includes(request.method))throw new ApiError('not_found','Маршрут не найден',404);
        const file=await safeFile(path.join(here,'public'),pathname==='/'?'index.html':'.'+pathname);
        send(response,200,await readFile(file),types[path.extname(file)]??'application/octet-stream');return;
      }
      const run=runs.get(match[1]);if(!run)throw new ApiError('unauthorized','Запуск не найден или уже удалён',401);
      // Trace SDK HTTP calls and application resources, excluding routine bridge polling.
      if(!pathname.startsWith('/__sandbox/')||pathname.endsWith('.js')){
        auditRun=run;audit.route=scrubText(pathname,300);const trace=request.headers['x-sandbox-trace'];if(typeof trace==='string'&&/^browser_[a-f0-9-]{36}$/.test(trace))audit.clientRequestId=trace;
        run.log('http.started',{...audit},'http');
      }
      if(request.headers.origin&&request.headers.origin!==run.appOrigin)throw new ApiError('forbidden','Запрос пришёл с другого адреса приложения',403);
      response.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' 'unsafe-inline' ${application.manifest.network.allowed_origins.join(' ')}; style-src 'self' 'unsafe-inline' ${application.manifest.network.allowed_origins.join(' ')}; img-src 'self' data: blob: ${application.manifest.network.allowed_origins.join(' ')}; connect-src 'self' ${application.manifest.network.allowed_origins.join(' ')}; font-src 'self' data: ${application.manifest.network.allowed_origins.join(' ')}; media-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors ${baseUrl} http://localhost:${localPort}`);
      response.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
      if(pathname==='/__sandbox/bridge.js'){send(response,200,await readFile(path.join(here,'public/bridge.js')),'text/javascript; charset=utf-8');return;}
      if(pathname==='/__sandbox/diagnostics.js'){send(response,200,await readFile(path.join(here,'public/diagnostics.js')),'text/javascript; charset=utf-8');return;}
      if(pathname==='/__sandbox/sdk.js'){send(response,200,await readFile(sdkFile),'text/javascript; charset=utf-8');return;}
      if(pathname==='/__sandbox/lifecycle'){
        const after=Number(url.searchParams.get('after')??0);send(response,200,{events:run.lifecycle.filter(e=>e.seq>after),state:run.state});return;
      }
      if(pathname==='/__sandbox/diagnostics'&&request.method==='POST'){
        if(run.endedAt!==undefined&&run.now()-run.endedAt>120000)throw new ApiError('unauthorized','Диагностика закрытого запуска завершена',401);
        send(response,200,diagnostics.browser(run,await json(request,16384)));return;
      }
      if(pathname==='/__sandbox/request-exit'&&request.method==='POST'){run.control('request-exit');send(response,200,{ok:true});return;}
      if(pathname.startsWith(prefix+'/')){
        run.admit();
        if(run.faults.apiOffline){audit.errorCode='simulated_api_offline';response.destroy();return;}
        const route=pathname.slice(prefix.length);let result;let status=200;
        if(request.method==='GET'){
          switch(route){
            case '/context':result=run.context();break;
            case '/state':result=run.snapshot();break;
            case '/cameras':result=run.cameras();break;
            case '/frames':result=run.catalog('frames');break;
            case '/effects':result=run.catalog('effects');break;
            case '/share':if(!run.share)throw new ApiError('not_found','Ссылка ещё не готова',404);if(Date.parse(run.share.expiresAt)<run.clock())throw new ApiError('gone','Истёк срок ссылки',410);run.require('result:write');result=run.share;break;
            case '/share/qr':
              run.require('result:write');if(!run.share)throw new ApiError('not_found','Ссылка ещё не готова',404);
              if(Date.parse(run.share.expiresAt)<run.clock())throw new ApiError('gone','Истёк срок ссылки',410);
              if(run.faults.managementOffline)throw new ApiError('upstream_unavailable','Не удалось получить QR с сервера панели администратора (имитация)',502);
              send(response,200,qrPng(run.share.downloadUrl),'image/png');return;
            case '/assets/frame.svg':run.catalog('frames');if(!run.settings.frameIds.includes(101))throw new ApiError('not_found','Рамка не выбрана',404);send(response,200,frameSvg,'image/svg+xml');return;
            default:
              if(route.startsWith('/photos/')){send(response,200,run.photo(route.slice('/photos/'.length)).data,'image/jpeg');return;}
              if(route==='/preview'||route.startsWith('/preview/')){
                const camera=route==='/preview'?'main':route.slice('/preview/'.length);run.camera(camera);
                if(run.previewCameras.has(camera))throw new ApiError('device_busy','Предпросмотр уже открыт',409);
                run.previewCameras.add(camera);run.previewStreams.set(camera,response);response.writeHead(200,{'Content-Type':'multipart/x-mixed-replace; boundary=frame','Cache-Control':'no-store'});
                const frame=()=>{if(response.destroyed||run.faults.cameraFailure||['stopped','completed'].includes(run.state))return response.end();const image=orientJpeg(images[camera],run.settings.cameras.find(c=>c.id===camera).orientation);response.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${image.length}\r\n\r\n`);response.write(image);response.write('\r\n');};
                frame();const timer=setInterval(frame,700);response.on('close',()=>{clearInterval(timer);if(run.previewStreams.get(camera)===response){run.previewCameras.delete(camera);run.previewStreams.delete(camera);}});return;
              }
              throw new ApiError('not_found','Метод API не найден',404);
          }
        }else if(request.method==='POST'){
          if(route==='/result'){
            audit.requestId=request.headers['x-request-id']??null;
            if(!request.headers['content-type']?.startsWith('image/jpeg'))throw new ApiError('validation_error','Ожидается image/jpeg');
            const jpeg=await body(request,15*1024*1024);
            const bytes=[...runs.values()].reduce((total,item)=>total+[...item.photos.values()].reduce((sum,p)=>sum+p.data.length,0),0);
            if(bytes+jpeg.length>256*1024*1024&&!run.commands.has('upload-'+request.headers['x-request-id']))throw new ApiError('forbidden','Общий объём изображений песочницы превышен. Очистите предыдущие сессии.',403);
            result=run.upload(jpeg,request.headers['x-request-id']);
          }else{
            const data=await json(request);
            if(typeof data.request_id==='string')audit.requestId=data.request_id;
            switch(route){
              case '/ready':result=run.ready();break;
              case '/heartbeat':result={ok:true};break;
              case '/activity':result=run.activity();break;
              case '/telemetry':result=run.observe(data);break;
              case '/commands':result=run.submit(data);status=202;
                if(run.faults.loseNextCommandReply){run.faults.loseNextCommandReply=false;draftFaults.loseNextCommandReply=false;audit.errorCode='simulated_reply_lost';run.log('simulator.reply-lost',{requestId:data.request_id});response.destroy();return;}
                break;
              default:throw new ApiError('not_found','Метод API не найден',404);
            }
          }
        }else throw new ApiError('not_found','Метод API не найден',404);
        // Disconnect/timeout does not undo an accepted command or a physical-operation simulation.
        if(run.faults.apiDelayMs)await new Promise(resolve=>{const timer=setTimeout(done,run.faults.apiDelayMs);function done(){clearTimeout(timer);response.off('close',done);resolve();}response.once('close',done);});
        send(response,status,result);return;
      }
      if(!['GET','HEAD'].includes(request.method))throw new ApiError('not_found','Маршрут не найден',404);
      const entryPrefix=`/apps/${application.manifest.id}/local/`;
      if(!pathname.startsWith(entryPrefix))throw new ApiError('not_found','Ресурс приложения не найден',404);
      const file=await safeFile(application.root,pathname.slice(entryPrefix.length));let content=await readFile(file);
      if(path.extname(file).toLowerCase()==='.html'){
        const script='<script src="/__sandbox/diagnostics.js"></script><script src="/__sandbox/bridge.js"></script>';
        const text=content.toString('utf8');content=Buffer.from(/<head[^>]*>/i.test(text)?text.replace(/<head[^>]*>/i,head=>head+script):script+text);
      }
      send(response,200,content,types[path.extname(file)]??'application/octet-stream');
    }catch(error){const missing=['ENOENT','ENOTDIR'].includes(error.code);audit.errorCode=missing?'not_found':error.code??'validation_error';audit.message=scrubText(error.message??'Ошибка песочницы',500);send(response,missing?404:error instanceof ApiError?error.status:400,{error:{code:audit.errorCode,message:missing?'Файл не найден':error.message??'Ошибка песочницы'}});}
  });
  server.requestTimeout=15000;server.headersTimeout=10000;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  baseUrl='http://127.0.0.1:'+server.address().port;
  tick=setInterval(()=>{for(const run of runs.values()){run.tick();if(run.state==='starting'&&!run.notReadyReported&&run.now()-run.created>=15000){run.notReadyReported=true;run.log('browser.not_ready',{message:'SDK ready() was not received within 15 seconds. Check application loading and browser errors.'},'error');}}},250);tick.unref();
  return {server,url:baseUrl,application,diagnostics,get current(){return current;},runs,
    async close(){clearInterval(tick);for(const run of runs.values())run.dispose();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await diagnostics.close();}};
}
