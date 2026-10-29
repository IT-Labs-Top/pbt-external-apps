(()=>{
  const listeners=new Set();let cursor=0,stopped=false,sent=0;
  Object.defineProperty(window,'pbtService',{value:Object.freeze({protocol:1,
    onLifecycle(handler){listeners.add(handler);return()=>listeners.delete(handler);},
    async requestExit(){const response=await fetch('/__sandbox/request-exit',{method:'POST'});if(!response.ok)throw new Error('Не удалось открыть подтверждение выхода');},
  }),writable:false,configurable:false});
  const timer=setInterval(async()=>{
    if(stopped)return;
    try{
      const response=await fetch('/__sandbox/lifecycle?after='+cursor,{cache:'no-store'});const data=await response.json();
      for(const item of data.events){cursor=Math.max(cursor,item.seq);for(const handler of listeners){try{handler(item.event);}catch(error){console.error(error);}}if(item.event==='stop'){stopped=true;clearInterval(timer);}}
    }catch{/* A closed local simulator cannot accept further equipment operations. */}
  },300);
  for(const type of ['pointerdown','keydown','touchstart','wheel','input'])window.addEventListener(type,event=>{
    if(!event.isTrusted||stopped||Date.now()-sent<1000)return;sent=Date.now();
    void fetch('/api/v1/external/runtime/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).catch(()=>{});
  },{passive:true,capture:true});
  window.addEventListener('pagehide',()=>clearInterval(timer));
})();
