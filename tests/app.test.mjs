import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('mobile gestures, pause, resume, persistence, levels and PWA contract',async()=>{
 const map=JSON.parse(fs.readFileSync('dist/map.json','utf8')),elements=new Map,storage=new Map;let raf;
 const context=new Proxy({isPointInPath:()=>false},{get:(o,k)=>o[k]||(()=>{})});
 function element(id){if(!elements.has(id))elements.set(id,{id,style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){}},getBoundingClientRect:()=>({width:414,height:440,left:0,top:0}),getContext:()=>context,setPointerCapture(){},remove(){},click(){this.onclick?.()}});return elements.get(id)}
 globalThis.document={getElementById:element,createElement:()=>element('hitCanvas'),querySelectorAll:()=>[],addEventListener(){}};
 globalThis.window={addEventListener(){}};globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 globalThis.fetch=async()=>({ok:true,json:async()=>map});globalThis.Path2D=class{moveTo(){}lineTo(){}closePath(){}};
 globalThis.ResizeObserver=class{observe(){}};globalThis.devicePixelRatio=3;globalThis.requestAnimationFrame=f=>{raf=f};
 await import('../dist/main.js');assert.equal(window.statefront.paused,true);element('play').click();assert.equal(window.statefront.paused,false);raf(100);
 let state=window.statefront,src=state.states.find(s=>s.owner===0),target=state.states.filter(s=>s.owner<0).sort((a,b)=>Math.hypot(src.x-a.x,src.y-a.y)-Math.hypot(src.x-b.x,src.y-b.y))[0];
 const event=s=>({pointerId:1,clientX:s.x*state.view.scale+state.view.ox,clientY:s.y*state.view.scale+state.view.oy,buttons:1});
 element('game').onpointerdown(event(src));assert.equal(window.statefront.selection.length,1);element('game').onpointermove(event(target));element('game').onpointerup(event(target));assert(window.statefront.units>0);assert.equal(window.statefront.selection.length,0);
 element('pause').click();assert.equal(window.statefront.paused,true);let saved=JSON.parse(storage.get('statefront-battle'));assert(saved.units.length>0);assert.equal(saved.states.length,48);element('resume').click();assert.equal(window.statefront.paused,false);
 element('all').click();assert(window.statefront.selection.length>0);element('game').onpointercancel();assert.equal(window.statefront.selection.length,0);
 element('percent').click();assert.equal(element('percent').textContent,'Отправка 50%');element('percent').click();assert.equal(element('percent').textContent,'Отправка 100%');element('zoom').click();assert(window.statefront.view.scale>state.view.scale);
 element('levelsBtn').click();assert(element('modal').innerHTML.includes('data-level="30"'));element('back').click();assert.equal(window.statefront.paused,false);
 const manifest=JSON.parse(fs.readFileSync('dist/manifest.webmanifest'));assert.equal(manifest.display,'standalone');assert.equal(manifest.orientation,'portrait');for(const icon of manifest.icons)assert(fs.existsSync('dist/'+icon.src));
 const sw=fs.readFileSync('dist/sw.js','utf8');for(const file of ['index.html','main.js','engine.js','map.json','style.css'])assert(sw.includes(file));assert(fs.readFileSync('dist/style.css','utf8').includes('safe-area-inset-top'));
 // Reload the application module against persisted battle snapshots.
 storage.set('statefront-battle',JSON.stringify({settings:{level:5,difficulty:1},states:map.map((s,i)=>({...s,owner:i===0?-1:0,troops:20})),units:[],time:10,sent:80,captures:4,result:''}));
 globalThis.window={addEventListener(){}};await import('../dist/main.js?victory');element('play').click();raf(200);assert.equal(window.statefront.result,'victory');assert.equal(JSON.parse(storage.get('statefront-progress')).unlocked,6);assert(JSON.parse(storage.get('statefront-progress')).completed.includes(5));element('next').click();assert.equal(window.statefront.settings.level,6);
 let before=JSON.parse(storage.get('statefront-battle'));globalThis.window={addEventListener(){}};await import('../dist/main.js?reload');element('play').click();assert.equal(window.statefront.settings.level,6);assert.equal(window.statefront.states[0].troops,before.states[0].troops);
 storage.set('statefront-battle',JSON.stringify({...before,states:map.map(s=>({...s,owner:1,troops:20})),units:[],result:''}));globalThis.window={addEventListener(){}};await import('../dist/main.js?defeat');element('play').click();raf(300);assert.equal(window.statefront.result,'defeat');assert(element('modal').innerHTML.includes('Фронт потерян'));
});
