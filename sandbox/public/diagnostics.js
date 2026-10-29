/* Loaded before application scripts. Diagnostics must preserve fetch, console and lifecycle behavior. */
(()=>{
  const nativeFetch=window.fetch.bind(window);const queue=[];let dropped=0,sdkDropped=null,sending=false,stopped=false,lastDropped=-1,lastSdkDropped;
  const environment={userAgent:navigator.userAgent,language:navigator.language,viewport:{width:innerWidth,height:innerHeight},reportedBy:'browser'};
  const text=value=>value instanceof Error?value.message:String(value??'').slice(0,2000);
  function record(name,data){
    if(queue.length>=64){dropped++;return;}
    const bounded=Object.fromEntries(Object.entries(data).slice(0,12).map(([key,value])=>[key,typeof value==='string'?value.slice(0,2000):typeof value==='number'||value===null?value:String(value??'').slice(0,200)]));
    queue.push({id:'browser_'+crypto.randomUUID(),name,data:{...bounded,clientElapsedMs:Math.round(performance.now())}});
  }
  async function flush(keepalive=false){
    if(sending)return;sending=true;const events=[];
    for(const event of queue.slice(0,5)){if(new TextEncoder().encode(JSON.stringify({events:[...events,event],environment,dropped,sdkDropped})).length>14000)break;events.push(event);}
    const sentDropped=dropped,sentSdkDropped=sdkDropped;
    try{
      const response=await nativeFetch('/__sandbox/diagnostics',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({events,environment,dropped,sdkDropped}),keepalive,signal:AbortSignal.timeout(2000)});
      if(response.ok){queue.splice(0,events.length);lastDropped=sentDropped;lastSdkDropped=sentSdkDropped;}
      else if(response.status===401){stopped=true;clearInterval(timer);}
    }catch{/* The bounded queue retries with the same event IDs. */}
    finally{sending=false;}
  }
  Object.defineProperty(window,'pbtSandboxDiagnostics',{value:Object.freeze({
    reportSdkDropped(value){if(Number.isSafeInteger(value)&&value>=0)sdkDropped=Math.max(sdkDropped??0,value);},
  }),configurable:false,writable:false});
  window.addEventListener('error',event=>{
    if(event.target!==window){const element=event.target;record('browser.resource_error',{tag:element?.tagName,url:element?.src??element?.href??''});}
    else record('browser.javascript_error',{message:text(event.error??event.message),stack:event.error?.stack??'',file:event.filename,line:event.lineno,column:event.colno});
  },true);
  window.addEventListener('unhandledrejection',event=>record('browser.promise_error',{message:text(event.reason),stack:event.reason?.stack??''}));
  window.addEventListener('securitypolicyviolation',event=>record('browser.csp_error',{directive:event.effectiveDirective,blockedUrl:event.blockedURI,file:event.sourceFile,line:event.lineNumber}));
  for(const level of ['error','warn']){
    const original=console[level].bind(console);
    console[level]=(...args)=>{original(...args);try{record('browser.console_'+level,{message:args.slice(0,5).map(text).join(' ')});}catch{}};
  }
  window.fetch=async(input,init)=>{
    let url;try{url=new URL(input instanceof Request?input.url:String(input),location.href);}catch{return nativeFetch(input,init);}
    if(url.pathname.startsWith('/__sandbox/'))return nativeFetch(input,init);
    const started=performance.now();const clientRequestId='browser_'+crypto.randomUUID();let requestId=null,action=null;
    const method=init?.method??(input instanceof Request?input.method:'GET');
    let options=init;
    if(url.origin===location.origin&&url.pathname.startsWith('/api/v1/external/runtime/')){
      const headers=new Headers(init?.headers??(input instanceof Request?input.headers:undefined));headers.set('X-Sandbox-Trace',clientRequestId);
      requestId=headers.get('X-Request-Id');options={...init,headers};
      if(url.pathname.endsWith('/commands')&&typeof init?.body==='string')try{const body=JSON.parse(init.body);requestId=body.request_id;action=body.action;}catch{}
    }
    const base={clientRequestId,requestId,action,method,route:url.origin+url.pathname};
    try{
      const response=await nativeFetch(input,options);
      record('browser.http',{...base,status:response.status,outcome:'response_received',durationMs:Math.round(performance.now()-started)});return response;
    }catch(error){
      record('browser.http_error',{...base,status:null,outcome:error.name==='TimeoutError'?'timeout':error.name==='AbortError'?'abort':'network_error',
        durationMs:Math.round(performance.now()-started),message:text(error)});throw error;
    }
  };
  const timer=setInterval(()=>{if(!stopped&&(queue.length||sdkDropped!==lastSdkDropped||dropped!==lastDropped))void flush();},500);
  window.addEventListener('pagehide',()=>{clearInterval(timer);void flush(true);});
  record('browser.loaded',{readyState:document.readyState});void flush();
})();
