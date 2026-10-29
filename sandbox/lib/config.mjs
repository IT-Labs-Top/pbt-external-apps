import { realpath,readFile,stat } from 'node:fs/promises';
import path from 'node:path';

export const CAPABILITIES=['capture:main','capture:secondary','payment','print','result:write','config:read'];
export const CAMERAS=['main','top','side'];
export const defaultManifest={schema_version:1,id:'sandbox.sdk-check',version:'1.0.0',name:'Проверка SDK',
  entry:'index.html',sdk:'1',capabilities:CAPABILITIES,requires_online:false,network:{allowed_origins:[]}};
export const frames=[{id:100,title:'Без рамки',isPlain:true,formatKey:'4x6',printFormat:'4x6',previewUrls:[],layout:null},
  {id:101,title:'Тестовая рамка',isPlain:false,formatKey:'4x6',printFormat:'4x6',
    frameUrl:'/api/v1/external/runtime/assets/frame.svg',largePhotoFrameUrl:null,
    previewUrls:['/api/v1/external/runtime/assets/frame.svg'],layout:{kind:'single',strips:null,framesPerStrip:1,orientation:'portrait'}}];
export const effects=[{id:10,title:'Без эффекта',cssFilter:'none',previewUrl:null},
  {id:11,title:'Чёрно-белый',cssFilter:'grayscale(1)',previewUrl:null},
  {id:12,title:'Сепия',cssFilter:'sepia(0.85)',previewUrl:null}];
export function money(value,allowZero=true){
  const cents=value*100;
  if(typeof value!=='number'||!Number.isFinite(value)||value<(allowZero?0:0.01)||value>1_000_000||Math.abs(cents-Math.round(cents))>1e-7)
    throw new Error('Укажите сумму в рублях с точностью до копейки');
  return Math.round(cents);
}
const bounded=(value,min,max,name)=>{
  if(!Number.isInteger(value)||value<min||value>max)throw new Error(`${name}: допустимо целое ${min}..${max}`);
  return value;
};
export function origins(values=[]){
  if(!Array.isArray(values)||values.length>32)throw new Error('Допустимо до 32 сетевых адресов');
  const result=[...new Set(values.map(value=>{
    if(typeof value!=='string'||value.length>512||!/^https?:\/\/[^/?#\\\s]+\/?$|^wss?:\/\/[^/?#\\\s]+\/?$/i.test(value)||value.includes('*'))
      throw new Error('Укажите точный origin без пути, масок и параметров');
    const url=new URL(value);
    if(url.username||url.password||!/^[-a-zA-Z0-9_.:\[\]]+$/.test(url.hostname)||url.hostname.endsWith('.svc.localhost')||url.hostname==='svc.localhost')throw new Error('Недопустимый origin');
    return url.origin;
  }))];
  if(result.join('\n').length>2048)throw new Error('Список сетевых адресов превышает 2048 символов');
  return result;
}
export function validateManifest(value){
  const m={schema_version:1,entry:'index.html',sdk:'1',capabilities:[],requires_online:false,network:{allowed_origins:[]},...value};
  if(Object.keys(m).some(key=>!Object.keys(defaultManifest).includes(key)))throw new Error('Неизвестное поле service.json');
  if(m.schema_version!==1||m.sdk!=='1'||!/^([a-z][a-z0-9-]{0,39}\.){1,3}[a-z][a-z0-9-]{0,39}$/.test(m.id??'')||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(m.version??'')||typeof m.name!=='string'||!m.name.trim()||m.name.length>120)
    throw new Error('Некорректные id, version, name или версия SDK в service.json');
  if(typeof m.requires_online!=='boolean'||typeof m.entry!=='string'||!m.entry||m.entry.startsWith('/')||m.entry.includes('\\')||m.entry.split('/').some(p=>!p||p==='.'||p==='..'))throw new Error('Некорректный entry или requires_online');
  if(!Array.isArray(m.capabilities)||m.capabilities.length>6||new Set(m.capabilities).size!==m.capabilities.length||m.capabilities.some(p=>!CAPABILITIES.includes(p)))throw new Error('Некорректные capabilities');
  if(!m.network||typeof m.network!=='object'||Object.keys(m.network).some(k=>k!=='allowed_origins'))throw new Error('Некорректная network');
  m.network={allowed_origins:origins(m.network.allowed_origins)};
  return m;
}
export function defaults(manifest=defaultManifest){return {
  price:350,sheetPrice:100,fulfillment:manifest.capabilities.includes('print')?'print':'digital',
  permissions:[...manifest.capabilities],publicConfig:{welcome:'Проверка приложения без оборудования'},
  cameras:CAMERAS.map((id,i)=>({id,label:['Главная камера','Верхняя камера','Боковая камера'][i],enabled:i<2,orientation:'normal'})),
  frameIds:[100,101],effectIds:[10,11,12],paper:40,cashWaitSeconds:60,
  idleWarningSeconds:45,idleTimeoutSeconds:60,idleWarningAfterPaymentSeconds:75,idleTimeoutAfterPaymentSeconds:90,
};}
export function validateSettings(raw,manifest){
  const base=defaults(manifest);
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!Object.hasOwn(base,k)))throw new Error('Неизвестные настройки песочницы');
  const s={...base,...raw};
  if(money(s.price)>10_000_000||money(s.sheetPrice)>10_000_000)throw new Error('Цена услуги и листа не должна превышать 100 000 ₽');
  if(!['print','digital'].includes(s.fulfillment))throw new Error('Неизвестный способ предоставления результата');
  if(!Array.isArray(s.permissions)||new Set(s.permissions).size!==s.permissions.length||s.permissions.some(p=>!manifest.capabilities.includes(p)))throw new Error('Разрешения должны быть объявлены в service.json');
  if(!s.publicConfig||typeof s.publicConfig!=='object'||Array.isArray(s.publicConfig)||JSON.stringify(s.publicConfig).length>32768)throw new Error('Публичные настройки должны быть JSON-объектом до 32 КиБ');
  if(!Array.isArray(s.cameras)||s.cameras.length!==3||new Set(s.cameras.map(c=>c.id)).size!==3||s.cameras.some(c=>!CAMERAS.includes(c.id)||typeof c.enabled!=='boolean'||!['normal','mirror','flip','rotate180'].includes(c.orientation)||typeof c.label!=='string'||c.label.length>80))throw new Error('Некорректные настройки камер');
  for(const [key,catalog] of [['frameIds',frames],['effectIds',effects]])
    if(!Array.isArray(s[key])||new Set(s[key]).size!==s[key].length||s[key].some(id=>!catalog.some(row=>row.id===id)))throw new Error(`Неизвестный элемент ${key}`);
  bounded(s.paper,0,1000,'Бумага');bounded(s.cashWaitSeconds,5,600,'Ожидание наличных');
  for(const suffix of ['', 'AfterPayment']){
    const warning=bounded(s['idleWarning'+suffix+'Seconds'],5,3600,'Предупреждение ожидания');
    const timeout=bounded(s['idleTimeout'+suffix+'Seconds'],10,3605,'Выход по бездействию');
    if(warning>timeout-5)throw new Error('Предупреждение должно появляться минимум за 5 секунд до выхода');
  }
  return structuredClone(s);
}
export const defaultFaults={apiOffline:false,managementOffline:false,cameraFailure:false,printerFailure:false,
  refundFailure:false,apiDelayMs:0,operationDelayMs:250,sheetDelayMs:1000,failAfterSheets:-1,loseNextCommandReply:false};
export function validateFaults(raw){
  if(!raw||typeof raw!=='object'||Object.keys(raw).some(k=>!Object.hasOwn(defaultFaults,k)))throw new Error('Неизвестный сценарий сбоя');
  const f={...defaultFaults,...raw};
  for(const key of ['apiOffline','managementOffline','cameraFailure','printerFailure','refundFailure','loseNextCommandReply'])if(typeof f[key]!=='boolean')throw new Error(`Некорректный ${key}`);
  bounded(f.apiDelayMs,0,30000,'Задержка HTTP');bounded(f.operationDelayMs,0,30000,'Задержка команды');
  bounded(f.sheetDelayMs,50,30000,'Время листа');bounded(f.failAfterSheets,-1,10,'Листов до ошибки');
  return f;
}
export async function safeFile(root,relative){
  const resolved=await realpath(path.resolve(root,relative));
  if(resolved!==root&&!resolved.startsWith(root+path.sep))throw new Error('Файл находится вне каталога приложения');
  if(!(await stat(resolved)).isFile())throw new Error('Файл не найден');
  return resolved;
}
export async function loadApplication(directory,builtin){
  const root=await realpath(directory??builtin);
  const manifest=directory?validateManifest(JSON.parse(await readFile(await safeFile(root,'service.json'),'utf8'))):structuredClone(defaultManifest);
  await safeFile(root,manifest.entry);
  return {root,manifest,builtin:!directory};
}
