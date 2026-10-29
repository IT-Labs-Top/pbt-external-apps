import {ExternalClient} from '/__sandbox/sdk.js';
const client=new ExternalClient();const $=id=>document.getElementById(id);let photo,paused=false,stopped=false,preview=true,pendingUpload;
const requests=new Map();let paymentOperation,printJob,paymentArgs,captureArgs,printArgs,shareArgs;
const opts=action=>({requestId:requests.get(action)??requests.set(action,crypto.randomUUID()).get(action),timeoutMs:Number($('timeout').value)});
const show=value=>{$('result').textContent=JSON.stringify(value,null,2);};
const status=text=>{$('status').textContent=text;};
const remove=window.pbtService?.onLifecycle(event=>{
  client.track('probe.lifecycle',{event});paused=event==='pause'||event==='stop';document.body.classList.toggle('paused',paused);
  if(paused)$('preview').removeAttribute('src');if(event==='resume'&&preview)$('preview').src=client.previewUrl($('camera').value);
  if(event==='stop'){stopped=true;client.dispose();}
});
window.addEventListener('pagehide',()=>{remove?.();client.dispose();});
function action(id,run){$(id).addEventListener('click',async()=>{
  if(paused||stopped)return;$(id).disabled=true;
  try{client.stage(id.replaceAll('-','_'));const result=await run();if(result!==undefined)show(result);}
  catch(error){if(stopped)return;client.logError(error,{action:id});show({message:error.message,code:error.code,requestId:error.requestId,operationId:error.operationId,jobId:error.jobId,result:error.result});status(error.message);
    if(error.operationId)paymentOperation=error.operationId;if(error.jobId)printJob=error.jobId;
    if(error.code==='failed'&&id!=='share'&&!(id==='pay'&&error.result?.amountPaid>0)){requests.delete(id);if(id==='pay'){paymentOperation=undefined;paymentArgs=undefined;}if(id==='print'){printJob=undefined;printArgs=undefined;}if(id==='capture')captureArgs=undefined;}
  }finally{$(id).disabled=false;}
});}
action('pay',async()=>{status('Подтвердите карту или внесите наличные в панели разработчика');
  paymentArgs??={amount:Number($('amount').value),requestId:opts('pay').requestId};
  const options={...opts('pay'),requestId:paymentArgs.requestId,onProgress:p=>status(`Внесено ${p.amountPaid} из ${p.amountDue} ₽ · ожидание ${p.remainingSeconds??'—'} с`)};
  const payment=paymentOperation?await client.waitPayment(paymentOperation,options):await client.payment(paymentArgs.amount,options);
  paymentArgs=undefined;paymentOperation=undefined;requests.delete('pay');status('Оплата подтверждена симулятором');return payment;});
action('extend',async()=>{const result=await client.extendCashWait(opts('extend'));requests.delete('extend');status('Ожидание наличных продлено');return result;});
action('refund',async()=>{const result=await client.requestRefund({requestId:opts('refund').requestId});status('Запрос возврата принят. Смотрите результат в панели разработчика.');return result;});
action('capture',async()=>{status('Получение тестового снимка…');captureArgs??={requestId:opts('capture').requestId,camera:$('camera').value};const result=await client.capture({...opts('capture'),...captureArgs});photo=result;
  $('photo').src=client.photoUrl(photo.photoId);$('photo').hidden=false;captureArgs=undefined;requests.delete('capture');status('Снимок получен');return result;});
$('upload').addEventListener('change',async event=>{if(paused||stopped)return;const file=event.target.files[0];if(!file)return;
  pendingUpload??={file,id:crypto.randomUUID()};try{photo=await client.upload(pendingUpload.file,pendingUpload.id);show(photo);$('photo').src=client.photoUrl(photo.photoId);$('photo').hidden=false;pendingUpload=undefined;status('JPEG сохранён');}
  catch(error){status(error.message);show({message:error.message,requestId:pendingUpload.id});}event.target.value='';});
action('print',async()=>{if(!photo)throw new Error('Сначала снимите или загрузите JPEG');status('Имитация печати…');
  printArgs??={requestId:opts('print').requestId,photoId:photo.photoId,copies:Number($('copies').value),cut:$('cut').checked};
  const options={...opts('print'),requestId:printArgs.requestId,cut:printArgs.cut,onProgress:j=>status(`Печать: ${j.phase}, ${j.copiesDone}/${j.copies} листов`)};
  const result=printJob?await client.waitPrint(printJob,options):await client.print(printArgs.photoId,printArgs.copies,options);
  printArgs=undefined;printJob=undefined;requests.delete('print');status('Все листы подтверждены симулятором');return result;});
async function showShare(result){$('qr').src=result.qrUrl;$('gallery').textContent=result.downloadUrl;$('share-result').hidden=false;status('Локальная ссылка готова');return result;}
action('share',async()=>{if(!photo)throw new Error('Сначала снимите или загрузите JPEG');shareArgs??={photoIds:[photo.photoId],requestId:opts('share').requestId};return showShare(await client.share(shareArgs.photoIds,{...opts('share'),requestId:shareArgs.requestId}));});
action('read-share',async()=>showShare(await client.sharedPhotos()));
action('complete',()=>client.complete({requestId:opts('complete').requestId}));
action('request-exit',()=>client.requestExit());action('exit',()=>client.exit(opts('exit').requestId));
action('inspect',()=>client.state());action('catalog',async()=>({frames:await client.frames(),effects:await client.effects()}));
action('activity',async()=>{await client.resetIdleTimer();status('Ожидание продлено');});
action('test-error',()=>{client.logError(new Error('Преднамеренная ошибка для проверки журнала'),{},'probe.intentional.error');status('Тестовая ошибка записана');});
action('flush',()=>client.flushTelemetry());
action('preview-toggle',()=>{preview=!preview;if(preview)$('preview').src=client.previewUrl($('camera').value);else $('preview').removeAttribute('src');$('preview-toggle').textContent=preview?'Остановить предпросмотр':'Показать предпросмотр';});
$('camera').addEventListener('change',()=>{$('preview').removeAttribute('src');if(preview&&!paused)$('preview').src=client.previewUrl($('camera').value);$('camera-label').textContent=$('camera').selectedOptions[0]?.textContent??'';});
try{
  const context=await client.context();$('amount').value=context.price;
  await client.ready();client.stage('start');$('identity').textContent=`runId: ${context.runId} · sessionId: ${context.sessionId}`;
  try{const value=await client.cameras();for(const camera of value.cameras){const option=document.createElement('option');option.value=camera.id;option.textContent=camera.label;$('camera').append(option);}if(value.cameras.length)$('preview').src=client.previewUrl($('camera').value);}catch(error){status(error.message);}
  $('pay').disabled=false;show(context);status('Выберите действие для проверки');
}catch(error){status(error.message);}
