import {appendFile,mkdir,readFile,readdir,rename,rm,stat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

export const DIAGNOSTICS_VERSION=1;
export const SANDBOX_VERSION='0.2.0';
const idPattern=/^[a-f0-9]{32}$/;
const privateKey=/(?:password|passwd|secret|token|cookie|authorization|api.?key|email|phone|card.?number|cvv|base64|publicConfig|fiscalQr|^config$)/i;
export function scrubText(value,limit=4000){
  return String(value)
    .replace(/data:[^\s"'<>]+/gi,'[data removed]')
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g,'[private key removed]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,'[token removed]')
    .replace(/[A-Za-z0-9+/]{200,}={0,2}/g,'[encoded data removed]')
    .replace(/(?:tskey-[\w-]+|dvt_[\w-]+|Bearer\s+[^\s,;"']+)/gi,'[redacted]')
    .replace(/((?:password|passwd|secret|token|cookie|authorization|api[_-]?key)[\s"':=]+)[^\s,;}]+/gi,'$1[redacted]')
    .replace(/https?:\/\/[^\s)"'<>]+/gi,raw=>{try{const url=new URL(raw);const location=raw.match(/:\d+:\d+$/)?.[0]??'';return url.origin+url.pathname+((url.search||url.hash)&&location?location:'');}catch{return '[url removed]';}})
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[email removed]')
    .replace(/(?<![\w-])\+?\d[\d ()-]{8,}\d(?![\w-])/g,'[number removed]')
    .replace(/[A-Z]:[\\/]Users[\\/][^\\/\s:]+/gi,'[user-home]')
    .replace(/\/(?:home|Users)\/[^/\s:]+/g,'[user-home]')
    .slice(0,limit);
}
export function sanitize(value,key='',depth=0){
  if(privateKey.test(key))return '[redacted]';
  if(Buffer.isBuffer(value)||ArrayBuffer.isView(value))return '[binary removed]';
  if(depth>16)return '[depth limit]';
  if(typeof value==='string')return scrubText(value);
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  if(Array.isArray(value))return value.slice(0,100000).map(item=>sanitize(item,'',depth+1));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).slice(0,2000).map(([name,item])=>[name,sanitize(item,name,depth+1)]));
  return null;
}
export function defaultDiagnosticsDirectory(){
  if(process.platform==='win32')return path.join(process.env.LOCALAPPDATA??path.join(os.homedir(),'AppData/Local'),'PBT','external-apps-sandbox','diagnostics');
  if(process.platform==='darwin')return path.join(os.homedir(),'Library/Application Support/PBT/external-apps-sandbox/diagnostics');
  return path.join(process.env.XDG_STATE_HOME??path.join(os.homedir(),'.local/state'),'pbt-external-apps-sandbox','diagnostics');
}
export async function fingerprint(root,{maxFiles=10000,maxBytes=512*1024*1024}={}){
  const hash=createHash('sha256');let files=0,bytes=0;
  async function walk(directory,relative=''){
    const entries=(await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'));
    for(const entry of entries){
      if(entry.name==='.git'||entry.name==='node_modules')continue;
      const name=relative+entry.name;const full=path.join(directory,entry.name);
      if(entry.isSymbolicLink())throw new Error('Fingerprint does not follow symbolic links');
      if(entry.isDirectory())await walk(full,name+'/');
      else if(entry.isFile()){
        const info=await stat(full);if(++files>maxFiles||(bytes+=info.size)>maxBytes)throw new Error('Application fingerprint limit exceeded');
        hash.update(name+'\0'+info.size+'\0');hash.update(await readFile(full));
      }
    }
  }
  try{await walk(root);return {sha256:hash.digest('hex'),files,bytes,complete:true};}
  catch(error){return {sha256:null,files,bytes,complete:false,reason:scrubText(error.code??error.message,200)};}
}
const diskUsage=async directory=>{let size=0;for(const file of await readdir(directory)){const info=await stat(path.join(directory,file));if(info.isFile())size+=info.size;}return size;};

/** Persist only sanitized metadata. Images, HTTP bodies, headers and real credentials never enter this store. */
export class DiagnosticStore{
  constructor({directory=defaultDiagnosticsDirectory(),maxSessions=50,maxSessionBytes=8*1024*1024,maxTotalBytes=128*1024*1024,maxAgeDays=30,maxPending=256}={}){
    this.directory=directory;this.limits={maxSessions,maxSessionBytes,maxTotalBytes,maxAgeDays,maxPending};
    this.records=new Map();this.pending=0;this.tail=Promise.resolve();this.timer=null;this.dirty=new Set();
    this.health={enabled:directory!==false,available:directory!==false,writeErrors:0,queueDropped:0,corruptFiles:0,lastError:null};
  }
  async open(){
    if(!this.directory)return this;
    try{
      await mkdir(this.directory,{recursive:true});
      for(const item of await readdir(this.directory,{withFileTypes:true})){
        if(!item.isDirectory()||!idPattern.test(item.name))continue;
        const filename=path.join(this.directory,item.name,'session.json');
        try{
          if((await stat(filename)).size>2*1024*1024)throw new Error('Snapshot limit');
          const saved=JSON.parse(await readFile(filename,'utf8'));
          if(saved.schemaVersion!==1||saved.summary?.id!==item.name)throw new Error('Invalid snapshot');
          if(!['completed','stopped'].includes(saved.summary.state)){
            saved.summary.state='interrupted';saved.incomplete=true;saved.interruption='Process ended without a recorded session shutdown';
          }
          this.records.set(item.name,{...saved,run:null,bytes:await diskUsage(path.join(this.directory,item.name)),dirty:false});
        }catch{
          this.health.corruptFiles++;
          const createdAt=(await stat(path.join(this.directory,item.name))).birthtime.toISOString();
          this.records.set(item.name,{schemaVersion:1,createdAt,updatedAt:createdAt,environment:{},run:null,bytes:await diskUsage(path.join(this.directory,item.name)),incomplete:true,
            interruption:'Missing or corrupted session snapshot',summary:{id:item.name,sessionId:null,state:'interrupted',context:{},events:[],statistics:{confirmedSheets:null,amountPaid:null,captures:null}}});
        }
      }
      await this.prune();
    }catch(error){this.failed(error);}
    return this;
  }
  failed(error,record){this.health.available=false;this.health.writeErrors++;this.health.lastError=String(error.code??'write_failed');if(record)record.writeErrors=(record.writeErrors??record.losses?.writeErrors??0)+1;}
  enqueue(work,record){
    if(!this.directory)return true;
    if(this.pending>=this.limits.maxPending){this.health.queueDropped++;if(record)record.queueDropped=(record.queueDropped??record.losses?.queueDropped??0)+1;return false;}
    this.pending++;
    this.tail=this.tail.then(work).catch(error=>this.failed(error,record)).finally(()=>this.pending--);
    return true;
  }
  attach(run,environment){
    const record={schemaVersion:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),environment:sanitize(environment),
      summary:null,run,bytes:0,diskDropped:0,queueDropped:0,browser:{received:0,duplicates:0,dropped:0,sdkDropped:null},browserIds:new Set()};
    this.records.set(run.id,record);
    run.onDiagnosticEvent=event=>this.record(run,event);
    for(const event of run.events)this.record(run,event);
    this.mark(run.id);this.enqueue(()=>this.prune(),record);
    return record;
  }
  record(run,event){
    const record=this.records.get(run.id);if(!record)return;
    const line=JSON.stringify(sanitize(event))+'\n';const bytes=Buffer.byteLength(line);
    if(record.bytes+bytes>this.limits.maxSessionBytes)record.diskDropped++;
    else{
      record.bytes+=bytes;
      this.enqueue(async()=>{if(this.records.get(run.id)!==record)return;const folder=path.join(this.directory,run.id);await mkdir(folder,{recursive:true});await appendFile(path.join(folder,'events.jsonl'),line,'utf8');},record);
    }
    this.mark(run.id);
  }
  mark(id){this.dirty.add(id);if(!this.timer){this.timer=setTimeout(()=>{this.timer=null;this.saveDirty();},250);this.timer.unref();}}
  detach(run){const record=this.records.get(run.id);if(!record)return;const snapshot=this.snapshot(record);Object.assign(record,snapshot,{run:null});run.onDiagnosticEvent=null;this.mark(run.id);}
  snapshot(record){
    const summary=record.run?record.run.summary():record.summary;
    return sanitize({schemaVersion:1,createdAt:record.createdAt,updatedAt:new Date().toISOString(),environment:record.environment,
      summary,incomplete:record.incomplete??false,interruption:record.interruption??null,
      losses:{writeErrors:record.writeErrors??record.losses?.writeErrors??0,memoryEvicted:record.run?.diagnosticsEvicted??record.losses?.memoryEvicted??0,diskDropped:record.diskDropped??record.losses?.diskDropped??0,
        queueDropped:record.queueDropped??record.losses?.queueDropped??0,browser:record.browser??record.losses?.browser},storage:this.health});
  }
  saveDirty(){
    for(const id of this.dirty){
      const record=this.records.get(id);if(!record)continue;
      const snapshot=this.snapshot(record);record.summary=snapshot.summary;record.updatedAt=snapshot.updatedAt;
      if(this.enqueue(async()=>{if(this.records.get(id)!==record)return;const folder=path.join(this.directory,id);await mkdir(folder,{recursive:true});await writeFile(path.join(folder,'session.tmp'),JSON.stringify(snapshot),'utf8');await rename(path.join(folder,'session.tmp'),path.join(folder,'session.json'));},record))this.dirty.delete(id);
    }
  }
  browser(run,packet){
    const record=this.records.get(run.id);if(!record)return;
    if(!packet||typeof packet!=='object'||!Array.isArray(packet.events)||packet.events.length>5)throw new Error('Invalid browser diagnostic batch');
    if(packet.environment&&!record.environment.browser)record.environment.browser=sanitize(packet.environment);
    if(Number.isSafeInteger(packet.dropped)&&packet.dropped>=0)record.browser.dropped=Math.max(record.browser.dropped,packet.dropped);
    if(Number.isSafeInteger(packet.sdkDropped)&&packet.sdkDropped>=0)record.browser.sdkDropped=Math.max(record.browser.sdkDropped??0,packet.sdkDropped);
    for(const event of packet.events){
      if(typeof event?.id!=='string'||!/^browser_[a-f0-9-]{36}$/.test(event.id)||typeof event.name!=='string'||!/^browser\.[a-z_.]{1,50}$/.test(event.name))throw new Error('Invalid browser diagnostic event');
      if(record.browserIds.has(event.id)){record.browser.duplicates++;continue;}
      if(record.browserIds.size>=2000){record.browser.dropped++;continue;}
      record.browserIds.add(event.id);record.browser.received++;
      run.log(event.name,{source:'browser',...sanitize(event.data??{})},event.name.includes('error')?'error':'diagnostic');
    }
    this.mark(run.id);return {accepted:packet.events.length};
  }
  list(){return [...this.records.entries()].map(([id,record])=>{
    const summary=record.run?record.run.summary():record.summary;
    return {id,sessionId:summary.sessionId,state:summary.state,appId:summary.context?.appId??record.environment.application?.id,
      appVersion:summary.context?.version,createdAt:record.createdAt,statistics:summary.statistics,persisted:!!this.directory};
  }).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
  async events(id){
    const record=this.records.get(id);if(!record)return null;
    await this.flush();
    if(!this.directory)return {events:record.run?.events??record.summary.events??[],corruptLines:0};
    let text;try{const filename=path.join(this.directory,id,'events.jsonl');if((await stat(filename)).size>this.limits.maxSessionBytes+16384)throw Object.assign(new Error('Diagnostic file exceeds limit'),{code:'file_limit'});text=await readFile(filename,'utf8');}catch(error){this.failed(error,record);return {events:record.run?.events??[],corruptLines:0};}
    const events=[];let corruptLines=0;for(const line of text.split('\n'))if(line){try{events.push(JSON.parse(line));}catch{corruptLines++;}}
    return {events,corruptLines};
  }
  async export(id,report={}){
    if(!idPattern.test(id??''))return null;
    const record=this.records.get(id);if(!record)return null;
    const journal=await this.events(id);
    const snapshot=this.snapshot(record);const losses=snapshot.losses;
    return sanitize({format:'pbt-sandbox-diagnostics',schemaVersion:DIAGNOSTICS_VERSION,exportedAt:new Date().toISOString(),
      report:{steps:scrubText(report.steps??''),expected:scrubText(report.expected??''),actual:scrubText(report.actual??'')},
      ...snapshot,events:journal.events,corruptLines:journal.corruptLines,
      completeness:{serverJournal:!this.directory?'memory_only':losses.diskDropped||losses.queueDropped||losses.writeErrors||journal.corruptLines?'losses_detected':record.incomplete?'interrupted':'no_known_losses',
        browser:'best_effort',sdkLossCount:losses.browser?.sdkDropped===null||losses.browser?.sdkDropped===undefined?'not_reported':'reported_by_application'},
      notice:'No JPEGs, request bodies, headers or config values. Review free text before sharing. Browser and SDK telemetry is best effort; null means unavailable.'});
  }
  async detail(id){const bundle=await this.export(id);if(!bundle)return null;return {...bundle,events:bundle.events.slice(-500)};}
  async clearHistory(keepId){
    await this.flush();
    for(const [id,record] of this.records)if(id!==keepId){
      const folder=this.directory?path.resolve(this.directory,id):null;
      if(folder){if(!idPattern.test(id)||path.dirname(folder)!==path.resolve(this.directory))throw new Error('Unsafe diagnostic deletion path');await rm(folder,{recursive:true,force:true});}
      this.records.delete(id);this.dirty.delete(id);
    }
  }
  async prune(){
    if(!this.directory)return;
    const entries=[...this.records.entries()].sort((a,b)=>b[1].createdAt.localeCompare(a[1].createdAt));
    let total=0;
    for(let index=0;index<entries.length;index++){
      const [id,record]=entries[index];try{record.bytes=await diskUsage(path.join(this.directory,id));}catch(error){if(error.code!=='ENOENT')throw error;}total+=record.bytes??0;
      const tooOld=Date.now()-Date.parse(record.createdAt)>this.limits.maxAgeDays*86400000;
      if(record.run&&!['stopped','completed'].includes(record.run.state))continue;
      if(index>=this.limits.maxSessions||total>this.limits.maxTotalBytes||tooOld){
        const folder=path.resolve(this.directory,id);if(!idPattern.test(id)||path.dirname(folder)!==path.resolve(this.directory))throw new Error('Unsafe diagnostic retention path');
        await rm(folder,{recursive:true,force:true});this.records.delete(id);this.dirty.delete(id);total-=record.bytes??0;
      }
    }
  }
  async flush(){if(this.timer){clearTimeout(this.timer);this.timer=null;}await this.tail;this.saveDirty();await this.tail;}
  async close(){await this.flush();try{await this.prune();}catch(error){this.failed(error);}}
}
