import {randomUUID,createHash} from 'node:crypto';
import {CAPABILITIES,CAMERAS,frames,effects,money,validateSettings,defaultFaults,validateFaults} from './config.mjs';

export class ApiError extends Error{constructor(code,message,status=400){super(message);this.code=code;this.status=status;}}
const fail=(code,message,status=400)=>{throw new ApiError(code,message,status);};
const stamp=()=>new Date().toISOString();
const hash=(value)=>createHash('sha256').update(value).digest('hex');
const closed=(state)=>['completed','stopped'].includes(state);
export function jpegSize(data){
  if(data.length<12||data[0]!==255||data[1]!==216)return null;
  for(let i=2;i+9<data.length;){
    if(data[i]!==255){i++;continue;}
    const marker=data[i+1];
    if(marker===255){i++;continue;}
    if(marker===216||marker===1||(marker>=208&&marker<=215)){i+=2;continue;}
    const length=data.readUInt16BE(i+2);
    if(length<2||i+2+length>data.length)return null;
    if(marker>=192&&marker<=207&&![196,200,204].includes(marker))return {width:data.readUInt16BE(i+7),height:data.readUInt16BE(i+5)};
    if(marker===218)return null;
    i+=2+length;
  }
  return null;
}
export function orientJpeg(data,orientation='normal'){
  const code={normal:1,mirror:2,rotate180:3,flip:4}[orientation]??1;
  const payload=Buffer.alloc(32);payload.write('Exif\0\0',0,'binary');payload.write('MM',6,'ascii');
  payload.writeUInt16BE(42,8);payload.writeUInt32BE(8,10);payload.writeUInt16BE(1,14);
  payload.writeUInt16BE(0x112,16);payload.writeUInt16BE(3,18);payload.writeUInt32BE(1,20);payload.writeUInt16BE(code,24);
  const header=Buffer.from([255,225,0,34]);return Buffer.concat([data.subarray(0,2),header,payload,data.subarray(2)]);
}
function normalizeCommand(raw){
  const keys=['request_id','action','amount','copies','cut','camera','photo_id','photo_ids'];
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!keys.includes(k)))fail('validation_error','Неизвестное поле команды');
  const command={request_id:raw.request_id,action:raw.action,amount:raw.amount??null,copies:raw.copies??1,cut:raw.cut??false,
    camera:raw.camera??'main',photo_id:raw.photo_id??null,photo_ids:raw.photo_ids??[]};
  if(typeof command.request_id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(command.request_id)||!['payment','capture','print','complete','cancel','extend','refund','share'].includes(command.action))fail('validation_error','Некорректный request_id или action');
  if(command.amount!==null)try{money(command.amount,false);}catch(error){fail('validation_error',error.message);}
  if(!Number.isInteger(command.copies)||command.copies<1||command.copies>10||typeof command.cut!=='boolean'||!CAMERAS.includes(command.camera))fail('validation_error','Некорректные copies, cut или camera');
  if(command.photo_id!==null&&(typeof command.photo_id!=='string'||!/^ph_[A-Za-z0-9_-]{1,80}$/.test(command.photo_id)))fail('validation_error','Некорректный photo_id');
  if(!Array.isArray(command.photo_ids)||command.photo_ids.length>20||command.photo_ids.some(id=>typeof id!=='string'||!/^ph_[A-Za-z0-9_-]{1,80}$/.test(id))||new Set(command.photo_ids).size!==command.photo_ids.length)fail('validation_error','Некорректный список фотографий');
  if((command.action==='share'&&!command.photo_ids.length)||(command.action!=='share'&&command.photo_ids.length))fail('validation_error','photo_ids применим только к share');
  return command;
}

export class SandboxRun{
  constructor({manifest,settings,faults,images,baseUrl,appOrigin,now=()=>performance.now(),clock=()=>Date.now()}){
    this.id=randomUUID().replaceAll('-','');this.sessionId='s_'+randomUUID();
    this.manifest=manifest;this.settings=validateSettings(settings,manifest);this.faults=validateFaults(faults??defaultFaults);
    this.images=images;this.baseUrl=baseUrl;this.appOrigin=appOrigin??'';this.now=now;this.clock=clock;
    this.created=now();this.lastActivity=now();this.state='starting';this.pauseReason=null;
    this.commands=new Map();this.photos=new Map();this.attachments=[];this.payments=[];this.jobs=[];
    this.events=[];this.observations=new Map();this.lifecycle=[];this.timers=new Set();
    this.paper=this.settings.paper;this.busy=false;this.deliveryUncertain=false;this.share=null;this.shareIds=null;
    this.stageDurations={};this.stageName=null;this.stageAt=0;this.acceptedCommands=0;this.duplicateCommands=0;
    this.budget={tokens:20,at:now()};this.previewCameras=new Set();this.previewStreams=new Map();this.emitLifecycle('start');this.log('session.started',{app:this.manifest.id});
  }
  log(name,data={},kind='event'){
    const event={seq:(this.events.at(-1)?.seq??0)+1,ts:stamp(),elapsedMs:Math.max(0,Math.floor(this.now()-this.created)),name,kind,data};
    this.events.push(event);if(this.events.length>500)this.events.shift();return event;
  }
  emitLifecycle(event){
    if(event==='pause'||event==='stop'){for(const response of this.previewStreams.values())response.end();this.previewStreams.clear();this.previewCameras.clear();}
    this.lifecycle.push({seq:this.lifecycle.length+1,event});
  }
  schedule(callback,ms){const timer=setTimeout(()=>{this.timers.delete(timer);callback();},ms);this.timers.add(timer);return timer;}
  active(){if(closed(this.state))fail('unauthorized','Этот запуск приложения закрыт',401);}
  writable(){this.active();if(!['ready','running'].includes(this.state))fail('device_busy','Приложение ещё не готово или приостановлено',409);}
  require(permission){if(!this.settings.permissions.includes(permission)||!this.manifest.capabilities.includes(permission))fail('forbidden','Приложению не разрешено: '+permission,403);}
  admit(){
    this.active();const current=this.now();this.budget.tokens=Math.min(20,this.budget.tokens+(current-this.budget.at)/1000*10);this.budget.at=current;
    if(this.budget.tokens<1)fail('rate_limited','Слишком много запросов',429);this.budget.tokens--;
  }
  context(){return {protocol:1,runId:this.id,sessionId:this.sessionId,name:this.manifest.name,version:this.manifest.version,
    permissions:[...this.settings.permissions],price:this.settings.price,sheetPrice:this.settings.sheetPrice,
    fulfillment:this.settings.fulfillment,config:this.settings.permissions.includes('config:read')?this.settings.publicConfig:{}};}
  ready(){this.active();if(this.state==='starting')this.state='ready';return {ok:true,elapsedMs:Math.floor(this.now()-this.created)};}
  paid(){return this.payments.some(p=>p.status==='completed'&&p.amountPaid>=p.amountDue);}
  publicPayment(payment){const {deadline,...value}=payment;return {...value,remainingSeconds:payment.status==='pending'?Math.max(0,Math.ceil((deadline-this.now())/1000)):null};}
  snapshot(){return {runId:this.id,sessionId:this.sessionId,state:this.state,paid:this.paid(),
    payments:this.payments.map(p=>this.publicPayment(p)),photos:this.attachments.map(p=>({...p})),
    printJobs:this.jobs.map(({jobId,phase,copies,copiesDone,error})=>({jobId,phase,copies,copiesDone,error:error??null})),
    commands:[...this.commands.values()].map(({requestId,state,result})=>({requestId,state,result}))};}
  camera(id){
    this.require(id==='main'?'capture:main':'capture:secondary');
    const camera=this.settings.cameras.find(c=>c.id===id&&c.enabled);
    if(!camera||this.faults.cameraFailure)fail('device_unavailable','Камера недоступна (имитация)',503);
    return camera;
  }
  cameras(){
    if(!this.settings.permissions.some(p=>['capture:main','capture:secondary'].includes(p)))fail('forbidden','Нет разрешения на камеры',403);
    return {captureMode:'camera',allowSelection:true,cameras:this.settings.cameras.filter(c=>c.enabled&&this.settings.permissions.includes(c.id==='main'?'capture:main':'capture:secondary'))
      .map(({id,label,orientation})=>({id,label,orientation,ready:!this.faults.cameraFailure}))};
  }
  catalog(kind){this.require('config:read');const catalog=kind==='frames'?frames:effects;return catalog.filter(row=>this.settings[kind==='frames'?'frameIds':'effectIds'].includes(row.id));}
  photo(id){const photo=this.photos.get(id);if(!photo)fail('not_found','Фотография не принадлежит этой сессии',404);return photo;}
  addPhoto(data,kind='shot',camera=null){
    if(this.photos.size>=20||[...this.photos.values()].reduce((sum,p)=>sum+p.data.length,0)+data.length>256*1024*1024)fail('forbidden','Достигнут лимит файлов сессии',403);
    const size=jpegSize(data);if(!size)fail('validation_error','Нужен корректный JPEG');
    const photoId='ph_'+randomUUID();const url='/api/v1/external/runtime/photos/'+photoId;
    const photo={photoId,url,...size,takenAt:stamp(),lens:null,lensApplied:false,belowMinimum:false};
    this.photos.set(photoId,{...photo,data,kind,camera});
    this.attachments.push({photoId,kind,url,createdAt:stamp()});this.log(kind==='shot'?'capture.saved':'upload.saved',{photoId,camera,bytes:data.length});
    return photo;
  }
  submit(raw){
    this.active();const command=normalizeCommand(raw);const encoded=hash(JSON.stringify(command));const existing=this.commands.get(command.request_id);
    if(existing){
      if(existing.hash!==encoded)fail('conflict','Этот requestId уже использован с другими аргументами',409);
      this.duplicateCommands++;this.log('command.replayed',{requestId:command.request_id,action:command.action});
      if(!(command.action==='share'&&existing.state==='failed'))return {requestId:existing.requestId,state:existing.state};
    }
    this.writable();if(this.busy)fail('device_busy','Выполняется другая команда',409);
    if(!existing&&this.commands.size>=200)fail('forbidden','Не более 200 команд за запуск',403);
    const record=existing??{requestId:command.request_id,hash:encoded,action:command.action};
    record.state='pending';record.result=null;this.commands.set(command.request_id,record);this.busy=true;
    if(!existing)this.acceptedCommands++;this.log('command.accepted',{requestId:command.request_id,action:command.action});
    const execute=()=>{
      try{this.active();record.result=this.action(command);record.state='done';}
      catch(error){record.state='failed';record.result={error:error.message};this.log('command.failed',{action:command.action,message:error.message},'error');}
      finally{this.busy=false;}
    };
    if(command.action==='complete')execute();else this.schedule(execute,this.faults.operationDelayMs);
    return {requestId:record.requestId,state:record.state};
  }
  action(command){
    const op='ext-'+this.id+'-'+command.request_id;
    switch(command.action){
      case 'payment':{
        this.require('payment');if(this.payments.some(p=>p.status==='pending'))fail('device_busy','Предыдущая оплата ещё не завершена',409);
        if(this.payments.length>=10)fail('forbidden','Не более 10 попыток оплаты',403);
        const amount=money(command.amount??this.settings.price,false)/100;
        const payment={operationId:op,status:'pending',method:null,amountDue:amount,amountPaid:0,error:null,
          fiscalQr:null,refundStatus:null,refundMessage:null,refundAmount:null,deadline:this.now()+this.settings.cashWaitSeconds*1000};
        this.payments.push(payment);this.log('payment.waiting',{operationId:op,amount});return this.publicPayment(payment);
      }
      case 'capture':{
        const camera=this.camera(command.camera);return this.addPhoto(orientJpeg(this.images[command.camera],camera.orientation),'shot',command.camera);
      }
      case 'print':{
        this.require('print');this.photo(command.photo_id);
        if(this.faults.printerFailure||this.paper<command.copies)fail('device_unavailable','Принтер недоступен или не хватает бумаги (имитация)',503);
        const job={jobId:'job_'+randomUUID(),phase:'queued',copies:command.copies,copiesDone:0,cut:command.cut,photoId:command.photo_id,error:null};
        this.jobs.push(job);
        if(!this.attachments.some(p=>p.photoId===command.photo_id&&p.kind==='print'))this.attachments.push({photoId:command.photo_id,kind:'print',url:this.photo(command.photo_id).url,createdAt:stamp()});
        this.log('print.queued',{jobId:job.jobId,copies:job.copies,cut:job.cut});this.nextPrint();return {jobId:job.jobId,phase:job.phase};
      }
      case 'extend':{
        this.require('payment');const p=this.payments.find(p=>p.status==='pending'&&p.amountPaid>0&&p.method==='cash');
        if(!p)fail('conflict','Нет ожидания остатка наличной оплаты',409);
        p.deadline=this.now()+this.settings.cashWaitSeconds*1000;this.log('payment.extended',{operationId:p.operationId});return this.publicPayment(p);
      }
      case 'share':{
        this.require('result:write');command.photo_ids.forEach(id=>this.photo(id));
        if(this.shareIds&&JSON.stringify(this.shareIds)!==JSON.stringify(command.photo_ids))fail('conflict','Состав фотографий для скачивания уже выбран',409);
        this.shareIds??=[...command.photo_ids];
        if(this.faults.managementOffline)fail('upstream_unavailable','Нет соединения с сервером панели администратора (имитация)',502);
        this.share??={downloadUrl:this.baseUrl+'/gallery/'+this.id,qrUrl:'/api/v1/external/runtime/share/qr',
          expiresAt:new Date(this.clock()+3600_000).toISOString(),photosCount:command.photo_ids.length};
        this.log('share.ready',{photosCount:this.share.photosCount});return this.share;
      }
      case 'complete':{
        if(this.payments.some(p=>p.status==='pending')||this.jobs.some(j=>['queued','printing'].includes(j.phase)))fail('conflict','Дождитесь оплаты и печати',409);
        if(this.jobs.at(-1)?.phase==='failed')fail('conflict','Последняя печать завершилась ошибкой',409);
        this.stop('completed','Услуга завершена');return {completed:true};
      }
      case 'cancel':this.stop('stopped','Выход посетителя');return {stopped:true};
      case 'refund':this.require('payment');this.refund();return {reviewedByBackend:true};
      default:fail('forbidden','Действие запрещено',403);
    }
  }
  nextPrint(){
    if(closed(this.state)||this.jobs.some(j=>j.phase==='printing'))return;
    const job=this.jobs.find(j=>j.phase==='queued');if(!job)return;
    job.phase='printing';this.log('print.started',{jobId:job.jobId});
    const sheet=()=>{
      if(job.phase!=='printing'||closed(this.state))return;
      if(this.faults.printerFailure||this.paper<=0||(this.faults.failAfterSheets>=0&&job.copiesDone>=this.faults.failAfterSheets)){
        job.phase='failed';job.error='Ошибка печати (имитация)';this.deliveryUncertain=true;this.log('print.failed',{jobId:job.jobId,copiesDone:job.copiesDone},'error');this.nextPrint();return;
      }
      job.copiesDone++;this.paper--;this.log('print.sheet',{jobId:job.jobId,copiesDone:job.copiesDone});
      if(job.copiesDone===job.copies){job.phase='done';this.log('print.done',{jobId:job.jobId});this.nextPrint();}
      else this.schedule(sheet,this.faults.sheetDelayMs);
    };
    this.schedule(sheet,this.faults.sheetDelayMs);
  }
  upload(data,requestId){
    this.require('result:write');if(typeof requestId!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(requestId))fail('validation_error','Нужен X-Request-Id');
    const key='upload-'+requestId;const digest=hash(data);const prior=this.commands.get(key);
    if(prior){if(prior.hash!==digest)fail('conflict','Этот ID использован для другого JPEG',409);return prior.result;}
    this.writable();if(this.busy)fail('device_busy','Выполняется другая операция',409);
    const size=jpegSize(data);if(!size||data.length>15*1024*1024||Math.max(size.width,size.height)>12000||size.width*size.height>40_000_000)fail('validation_error','Нужен JPEG до 15 МиБ и 40 мегапикселей');
    const photo=this.addPhoto(data,'print');const result={photoId:photo.photoId,url:photo.url,width:photo.width,height:photo.height};
    this.commands.set(key,{requestId:key,state:'done',hash:digest,action:'upload',result});return result;
  }
  control(action,data={}){
    if(action==='faults'){this.faults=validateFaults({...this.faults,...data});this.log('simulator.faults',{...data});return;}
    if(action==='paper'){if(!Number.isInteger(data.sheets)||data.sheets<0||data.sheets>1000)throw new Error('Укажите 0..1000 листов');this.paper=data.sheets;this.log('simulator.paper',{sheets:this.paper});return;}
    this.active();
    if(action==='pause'){this.pause('manual');return;}
    if(action==='resume'){this.resume();return;}
    if(action==='request-exit'){this.pause('exit');return;}
    if(action==='leave'){this.stop('stopped','Выход посетителя');return;}
    const payment=this.payments.find(p=>p.status==='pending');
    if(!payment)fail('conflict','Приложение сейчас не ожидает оплату',409);
    if(action==='card-approve'){
      payment.method=payment.amountPaid>0?'mixed':'card';payment.amountPaid=Math.max(payment.amountPaid,payment.amountDue);payment.status='completed';
      payment.fiscalQr='simulation:receipt/'+payment.operationId;this.activity();this.log('payment.completed',{operationId:payment.operationId,method:payment.method,amountPaid:payment.amountPaid});
    }else if(action==='card-decline'){
      payment.status='declined';payment.error='Карта отклонена (имитация)';this.log('payment.declined',{operationId:payment.operationId},'error');
    }else if(action==='cash'){
      const cents=money(data.amount,false);payment.amountPaid=(money(payment.amountPaid)+cents)/100;payment.method='cash';this.activity();
      payment.deadline=this.now()+this.settings.cashWaitSeconds*1000;
      if(payment.amountPaid>=payment.amountDue){payment.status='completed';payment.fiscalQr='simulation:receipt/'+payment.operationId;}
      this.log('payment.cash',{operationId:payment.operationId,amount:data.amount,amountPaid:payment.amountPaid});
    }else fail('validation_error','Неизвестная команда симулятора');
  }
  activity(){this.active();this.lastActivity=this.now();if(this.pauseReason==='idle')this.resume();return {ok:true};}
  pause(reason){if(closed(this.state))return;this.state='paused';this.pauseReason=reason;this.emitLifecycle('pause');this.log('session.paused',{reason});}
  resume(){this.active();this.state='ready';this.pauseReason=null;this.lastActivity=this.now();this.emitLifecycle('resume');this.log('session.resumed');}
  stop(state,reason){
    if(closed(this.state))return;
    for(const p of this.payments)if(p.status==='pending'){p.status='cancelled';p.error='Запуск завершён';}
    for(const job of this.jobs)if(['printing','queued'].includes(job.phase)){if(job.phase==='printing')this.deliveryUncertain=true;job.phase='cancelled';}
    for(const command of this.commands.values())if(command.state==='pending'){command.state='interrupted';command.result={error:reason};}
    this.endedAt=this.now();this.state=state;this.pauseReason=null;this.busy=false;this.emitLifecycle('stop');this.log('session.'+state,{reason});
    for(const timer of this.timers)clearTimeout(timer);this.timers.clear();
  }
  refund(){
    const paid=this.payments.filter(p=>p.amountPaid>0);const uncertain=this.deliveryUncertain||this.jobs.some(j=>j.copiesDone>0)||!!this.share;
    const failed=this.faults.refundFailure;
    this.stop('stopped','Приложение запросило проверку возврата');
    for(const payment of paid){payment.refundStatus='requested';payment.refundMessage='Запрос принят симулятором';}
    this.log('refund.requested',{payments:paid.length});
    this.schedule(()=>{
      for(const p of paid){
        p.refundStatus=uncertain||p.method!=='card'?'manual_required':failed?'failed':'refunded';
        p.refundAmount=p.refundStatus==='refunded'?p.amountPaid:0;
        p.refundMessage=p.refundStatus==='manual_required'?'Требуется ручная сверка (имитация)':failed?'Возврат отклонён (имитация)':'Возврат подтверждён симулятором; реальные деньги не перемещались';
        this.log('refund.'+p.refundStatus,{operationId:p.operationId,amount:p.refundAmount});
      }
    },500);
  }
  observe(batch){
    if(!batch||!Array.isArray(batch.events)||batch.events.length<1||batch.events.length>5)fail('validation_error','Допустимо 1..5 событий');
    for(const event of batch.events){
      if(!event||Object.keys(event).some(key=>!['event_id','kind','name','message','stack','data','elapsed_ms'].includes(key)))fail('validation_error','Неизвестное поле события');
      if(event.data!==undefined&&(!event.data||typeof event.data!=='object'||Array.isArray(event.data)||Object.keys(event.data).length>10))fail('validation_error','Некорректные атрибуты события');
      for(const [key,value] of Object.entries(event.data??{})){
        if(!/^[a-z][a-z0-9_.-]{0,39}$/.test(key)||!(value===null||['string','number','boolean'].includes(typeof value))||(typeof value==='string'&&value.length>160)||(typeof value==='number'&&(!Number.isFinite(value)||Math.abs(value)>1e12)))fail('validation_error','Некорректный атрибут события');
      }
      if((event.message!==undefined&&(typeof event.message!=='string'||event.message.length>1000))||(event.stack!==undefined&&(typeof event.stack!=='string'||event.stack.length>2000))||(event.elapsed_ms!==undefined&&event.elapsed_ms!==null&&(!Number.isSafeInteger(event.elapsed_ms)||event.elapsed_ms<0)))fail('validation_error','Некорректная диагностика или время события');
    }
    let accepted=0,duplicates=0;
    for(const event of batch.events){
      if(!event||typeof event.event_id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(event.event_id)||!['event','stage','error'].includes(event.kind??'event')||!/^[a-z][a-z0-9_.-]{0,47}$/.test(event.name??''))fail('validation_error','Некорректное событие');
      const encoded=hash(JSON.stringify(event));const previous=this.observations.get(event.event_id);
      if(previous){if(previous!==encoded)fail('conflict','ID события использован с другими данными',409);duplicates++;continue;}
      if(this.observations.size>=2000)fail('rate_limited','Слишком много событий',429);
      this.observations.set(event.event_id,encoded);accepted++;
      const data={...(event.data??{})};if(event.message)data.message=String(event.message).slice(0,500);
      this.log(event.name,data,event.kind??'event');
      if(event.kind==='stage'){
        const elapsed=Number.isInteger(event.elapsed_ms)?Math.min(event.elapsed_ms,this.now()-this.created):this.now()-this.created;
        if(elapsed>=this.stageAt){if(this.stageName)this.stageDurations[this.stageName]=(this.stageDurations[this.stageName]??0)+elapsed-this.stageAt;this.stageAt=elapsed;this.stageName=event.name;}
      }
    }
    return {accepted,duplicates};
  }
  tick(){
    if(closed(this.state))return;
    const now=this.now();
    for(const p of this.payments)if(p.status==='pending'&&p.deadline<=now){p.status='timeout';p.error='Истекло ожидание оплаты (имитация)';this.log('payment.timeout',{operationId:p.operationId},'error');}
    const busy=this.busy||this.payments.some(p=>p.status==='pending')||this.jobs.some(j=>['printing','queued'].includes(j.phase));
    if(busy){this.lastActivity=now;return;}
    if(this.pauseReason&&this.pauseReason!=='idle')return;
    const suffix=this.paid()?'AfterPayment':'';const elapsed=(now-this.lastActivity)/1000;
    if(elapsed>=this.settings['idleTimeout'+suffix+'Seconds'])this.stop('stopped','Выход по бездействию');
    else if(!this.pauseReason&&elapsed>=this.settings['idleWarning'+suffix+'Seconds'])this.pause('idle');
  }
  statistics(){
    const at=this.endedAt??this.now();const stages={...this.stageDurations};if(this.stageName)stages[this.stageName]=(stages[this.stageName]??0)+Math.max(0,at-this.created-this.stageAt);
    return {durationMs:Math.floor(at-this.created),captures:[...this.photos.values()].filter(p=>p.kind==='shot').length,
      processedFiles:[...this.photos.values()].filter(p=>p.kind!=='shot').length,confirmedSheets:this.jobs.reduce((sum,j)=>sum+j.copiesDone,0),
      amountPaid:this.payments.reduce((sum,p)=>sum+money(p.amountPaid),0)/100,amountRefunded:this.payments.reduce((sum,p)=>sum+money(p.refundAmount??0),0)/100,
      acceptedCommands:this.acceptedCommands,replayedCommands:this.duplicateCommands,stageMilliseconds:stages,deliveryUncertain:this.deliveryUncertain};
  }
  summary(){return {id:this.id,sessionId:this.sessionId,state:this.state,pauseReason:this.pauseReason,
    context:this.context(),settings:this.settings,faults:this.faults,paper:this.paper,stateSnapshot:this.snapshot(),
    statistics:this.statistics(),events:this.events,share:this.share,printDetails:this.jobs.map(job=>({...job})),
    images:[...this.photos.values()].map(({data,...photo})=>({...photo,bytes:data.length,previewUrl:this.baseUrl+'/media/'+this.id+'/'+photo.photoId}))};}
  dispose(){this.stop('stopped','Песочница остановлена');for(const timer of this.timers)clearTimeout(timer);this.timers.clear();}
}
