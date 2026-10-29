const $=id=>document.getElementById(id);
let snapshot,loaded=false,frameRun=null,lastPaint='',loading=false,noticeTimer;
const labels={'capture:main':'Главная камера','capture:secondary':'Дополнительные камеры',payment:'Оплата и возврат',print:'Печать','result:write':'Загрузка JPEG и скачивание файлов','config:read':'Публичные настройки и каталоги'};
const states={starting:'Запуск',ready:'Активна',running:'Работает',paused:'Пауза',completed:'Завершена',stopped:'Закрыта'};
function notice(message){$('notice').textContent=message;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,6000);}
async function request(action,data){
  const response=await fetch('/__control/'+action,{method:data===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Sandbox-Control':'1'},body:data===undefined?undefined:JSON.stringify(data)});
  const value=await response.json();if(!response.ok)throw new Error(value.error?.message??'Ошибка панели');return value;
}
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
function checkbox(value,label,checked,disabled=false){const item=node('label');const input=node('input');input.type='checkbox';input.value=value;input.checked=checked;input.disabled=disabled;item.append(input,document.createTextNode(label));return item;}
function init(data){
  const settings=data.settings;
  $('app-name').textContent=data.application.name;
  $('app-description').textContent=(data.application.builtin?'Встроенная страница проверки SDK':'Ваша статическая сборка')+' · '+data.application.id+' '+data.application.version;
  for(const key of ['price','sheetPrice','fulfillment','paper','cashWaitSeconds','idleWarningSeconds','idleTimeoutSeconds','idleWarningAfterPaymentSeconds','idleTimeoutAfterPaymentSeconds'])$(key).value=settings[key];
  $('publicConfig').value=JSON.stringify(settings.publicConfig,null,2);
  for(const permission of data.availablePermissions)$('permissions').append(checkbox(permission,labels[permission],settings.permissions.includes(permission),!data.application.capabilities.includes(permission)));
  for(const camera of settings.cameras){
    const row=node('div',undefined,'camera-row');row.dataset.camera=camera.id;row.dataset.label=camera.label;
    row.append(checkbox(camera.id,camera.label,camera.enabled));const select=node('select');
    for(const [value,label] of [['normal','Обычная'],['mirror','Зеркально'],['flip','По вертикали'],['rotate180','180°']]){const option=node('option',label);option.value=value;select.append(option);}select.value=camera.orientation;row.append(select);$('cameras').append(row);
  }
  for(const row of data.frames)$('frames').append(checkbox(row.id,'Рамка: '+row.title,settings.frameIds.includes(row.id)));
  for(const row of data.effects)$('effects').append(checkbox(row.id,'Эффект: '+row.title,settings.effectIds.includes(row.id)));
  for(const input of document.querySelectorAll('[data-fault]')){const value=data.faults[input.dataset.fault];input.type==='checkbox'?input.checked=value:input.value=value;}
  $('network').textContent='Разрешённая внешняя сеть: '+(data.application.network.allowed_origins.join(', ')||'не объявлена в service.json');
}
function settings(){
  const value={};
  for(const key of ['price','sheetPrice','paper','cashWaitSeconds','idleWarningSeconds','idleTimeoutSeconds','idleWarningAfterPaymentSeconds','idleTimeoutAfterPaymentSeconds'])value[key]=Number($(key).value);
  value.fulfillment=$('fulfillment').value;value.publicConfig=JSON.parse($('publicConfig').value);
  value.permissions=[...$('permissions').querySelectorAll('input:checked')].map(input=>input.value);
  value.cameras=[...$('cameras').children].map(row=>({id:row.dataset.camera,label:row.dataset.label,enabled:row.querySelector('input').checked,orientation:row.querySelector('select').value}));
  value.frameIds=[...$('frames').querySelectorAll('input:checked')].map(input=>Number(input.value));value.effectIds=[...$('effects').querySelectorAll('input:checked')].map(input=>Number(input.value));return value;
}
function faults(){return Object.fromEntries([...document.querySelectorAll('[data-fault]')].map(input=>[input.dataset.fault,input.type==='checkbox'?input.checked:Number(input.value)]));}
function card(title,description,detail){const el=node('div',undefined,'card');el.append(node('strong',title),node('span',description));if(detail)el.append(node('small',detail));return el;}
function paint(data){
  snapshot=data;if(!loaded){init(data);loaded=true;}
  const run=data.run;
  if(run&&frameRun!==run.id){$('application').src=run.url;frameRun=run.id;$('empty').hidden=true;}
  $('run-status').textContent=run?states[run.state]??run.state:'Нет сессии';
  if(!run)return;
  $('session-id').textContent='runId: '+run.id+' · sessionId: '+run.sessionId;
  const overlay=$('overlay');const paused=run.state==='paused';const stopped=['completed','stopped'].includes(run.state);
  overlay.hidden=!paused&&!stopped;
  if(paused||stopped){
    $('overlay-title').textContent=stopped?(run.state==='completed'?'Сессия завершена':'Приложение закрыто'):run.pauseReason==='idle'?'Вы ещё здесь?':run.pauseReason==='exit'?'Завершить работу?':'Приложение приостановлено';
    $('overlay-message').textContent=stopped?'Результаты сохранены в панели справа. Для нового запуска нажмите «Применить настройки и начать сессию».':run.stateSnapshot.payments.some(p=>p.amountPaid>0)?'В этой сессии уже внесены деньги. Выход сам по себе не подтверждает возврат. Все операции здесь имитируются.':'Выберите продолжение или завершение. Приложению отправлено событие pause.';
    $('stay').hidden=stopped;$('leave').hidden=stopped;
  }
  const pending=run.stateSnapshot.payments.find(p=>p.status==='pending');
  $('payment-state').textContent=pending?`К оплате: ${pending.amountDue.toFixed(2)} ₽\nВнесено: ${pending.amountPaid.toFixed(2)} ₽\nОжидание: ${pending.remainingSeconds??'—'} с`:'Приложение сейчас не ожидает оплату';
  $('approve').disabled=$('decline').disabled=$('cash').disabled=!pending;
  if(document.activeElement!==$('paper-current'))$('paper-current').value=run.paper;
  // The one-shot fault is consumed by the first accepted command, rather than silently remaining enabled.
  const lost=document.querySelector('[data-fault="loseNextCommandReply"]');if(document.activeElement!==lost)lost.checked=data.faults.loseNextCommandReply;
  $('stage-times').textContent=Object.entries(run.statistics.stageMilliseconds).map(([name,ms])=>`${name}: ${(ms/1000).toFixed(1)} с`).join(' · ')||'Приложение ещё не записало этапы через stage()';
  const {durationMs,stageMilliseconds,...counters}=run.statistics;
  const signature=JSON.stringify({state:run.stateSnapshot,stats:counters,images:run.images,events:run.events.length,last:run.events.at(-1)?.seq,history:data.history.filter(item=>item.id!==run.id)});
  if(signature===lastPaint)return;lastPaint=signature;
  $('payments-list').replaceChildren(...run.stateSnapshot.payments.map(p=>card(`${p.amountPaid.toFixed(2)} / ${p.amountDue.toFixed(2)} ₽ · ${p.status}`,p.method??'Метод ещё не выбран',p.refundStatus?`Возврат: ${p.refundStatus} · ${p.refundMessage}`:p.operationId)));
  $('statistics').replaceChildren(...[['Снимков',run.statistics.captures],['Обработанных файлов',run.statistics.processedFiles],['Подтверждённых листов',run.statistics.confirmedSheets],['Принято, ₽',run.statistics.amountPaid],['Возвращено, ₽',run.statistics.amountRefunded],['Повторов команд',run.statistics.replayedCommands]].map(([label,value])=>{const el=node('div',undefined,'stat');el.append(node('strong',String(value)),node('span',label));return el;}));
  $('photos').replaceChildren(...run.images.map(photo=>{const el=node('div',undefined,'photo');const img=node('img');img.src=photo.previewUrl;img.alt=photo.kind==='shot'?'Снимок':'Макет';const link=node('a',`${photo.width}×${photo.height} · скачать`);link.href=photo.previewUrl;link.download=photo.photoId+'.jpg';el.append(img,node('div',photo.kind==='shot'?'Снимок · '+photo.camera:'Загруженный JPEG'),link);return el;}));
  $('print-jobs').replaceChildren(...run.stateSnapshot.printJobs.map(job=>card(`${job.phase} · ${job.copiesDone}/${job.copies} листов`,(run.printDetails.find(item=>item.jobId===job.jobId)?.cut?'Запрошена резка · '+(job.copiesDone*2)+' тестовых полосок. ':'')+(job.error??'Без ошибки'),job.jobId)));
  $('raw-state').textContent=JSON.stringify(run.stateSnapshot,null,2);
  $('gallery-link').replaceChildren();if(run.share){const link=node('a','Открыть локальную галерею ↗');link.href=run.share.downloadUrl;link.target='_blank';link.rel='noopener';$('gallery-link').append(link);}
  $('history').replaceChildren(...data.history.filter(item=>item.id!==run.id).map(item=>card(`${states[item.state]??item.state} · ${item.statistics.confirmedSheets} листов`,`${item.statistics.amountPaid} ₽ · ${item.statistics.captures} снимков`,item.sessionId)));
  $('event-log').replaceChildren(...[...run.events].reverse().slice(0,100).map(event=>{const row=node('div',undefined,'event '+event.kind);row.append(node('strong',event.name),node('small',`${(event.elapsedMs/1000).toFixed(1)} с · ${event.kind}`),node('div',JSON.stringify(event.data)));return row;}));
}
function bind(id,action){$(id).addEventListener('click',async()=>{try{$(id).disabled=true;const data=await action();if(data?.application)paint(data);}catch(error){notice(error.message);}finally{$(id).disabled=false;}});}
bind('new-run',()=>request('start',{settings:settings(),faults:faults()}));
for(const [id,action] of [['pause','pause'],['resume','resume'],['stay','resume'],['leave','leave'],['exit-dialog','request-exit'],['approve','card-approve'],['decline','card-decline']])bind(id,()=>request('command',{action}));
bind('cash',()=>request('command',{action:'cash',data:{amount:Number($('cash-amount').value)}}));
bind('set-paper',()=>request('command',{action:'paper',data:{sheets:Number($('paper-current').value)}}));
bind('no-paper',()=>request('command',{action:'paper',data:{sheets:0}}));bind('refill-paper',()=>request('command',{action:'paper',data:{sheets:40}}));
bind('clear-history',()=>request('clear-history',{}));
for(const input of document.querySelectorAll('[data-fault]'))input.addEventListener('change',()=>{void request('faults',{[input.dataset.fault]:input.type==='checkbox'?input.checked:Number(input.value)}).then(paint).catch(error=>notice(error.message));});
bind('clear-faults',async()=>{const defaults={apiOffline:false,managementOffline:false,cameraFailure:false,printerFailure:false,refundFailure:false,apiDelayMs:0,operationDelayMs:250,sheetDelayMs:1000,failAfterSheets:-1,loseNextCommandReply:false};for(const input of document.querySelectorAll('[data-fault]'))input.type==='checkbox'?input.checked=defaults[input.dataset.fault]:input.value=defaults[input.dataset.fault];return request('faults',defaults);});
bind('save-config',()=>{const data={settings:settings(),faults:faults()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=node('a');link.href=url;link.download='sandbox-settings.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('load-config').addEventListener('change',async event=>{try{const value=JSON.parse(await event.target.files[0].text());const imported=value.settings??value;for(const key of ['price','sheetPrice','fulfillment','paper','cashWaitSeconds','idleWarningSeconds','idleTimeoutSeconds','idleWarningAfterPaymentSeconds','idleTimeoutAfterPaymentSeconds'])if(imported[key]!==undefined)$(key).value=imported[key];$('publicConfig').value=JSON.stringify(imported.publicConfig??{},null,2);for(const input of $('permissions').querySelectorAll('input'))input.checked=(imported.permissions??[]).includes(input.value);for(const row of $('cameras').children){const camera=imported.cameras?.find(c=>c.id===row.dataset.camera);if(camera){row.querySelector('input').checked=camera.enabled;row.querySelector('select').value=camera.orientation;}}for(const [id,key] of [['frames','frameIds'],['effects','effectIds']])for(const input of $(id).querySelectorAll('input'))input.checked=(imported[key]??[]).includes(Number(input.value));if(value.faults)for(const input of document.querySelectorAll('[data-fault]'))if(value.faults[input.dataset.fault]!==undefined)input.type==='checkbox'?input.checked=value.faults[input.dataset.fault]:input.value=value.faults[input.dataset.fault];notice('Настройки загружены. Для применения начните новую сессию.');}catch(error){notice(error.message);}});
for(const button of document.querySelectorAll('[data-tab]'))button.addEventListener('click',()=>{for(const tab of document.querySelectorAll('[data-tab]'))tab.setAttribute('aria-selected',String(tab===button));for(const page of document.querySelectorAll('[data-page]'))page.hidden=page.dataset.page!==button.dataset.tab;});
async function poll(){if(loading)return;loading=true;try{paint(await request('state'));}catch(error){notice('Песочница недоступна: '+error.message);}finally{loading=false;}}
void poll();setInterval(poll,700);
