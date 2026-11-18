export type Territory={name:string,x:number,y:number,rings:number[][][],owner:number,troops:number};
export type Unit={x:number,y:number,tx:number,ty:number,target:number,owner:number,delay:number};
export type Settings={level:number,difficulty:number};
export class Battle {
 states:Territory[]; units:Unit[]=[]; time=0; aiClock=0; result=''; sent=0; captures=0; events:{x:number,y:number,owner:number}[]=[];
 constructor(map:Territory[],public settings:Settings){this.states=JSON.parse(JSON.stringify(map));this.setup();}
 setup(){const l=this.settings.level;this.states.forEach((s,i)=>{s.owner=-1;s.troops=5+(i*7+l*3)%13});
 const starts=['California','Florida','Washington','Maine','Texas','Michigan','Arizona','New York','Oregon','Georgia'];
 const home=starts[(l-1)%starts.length];const player=this.states.find(s=>s.name===home)!;player.owner=0;player.troops=55;
 let enemies=1+Math.floor((l-1)/6); enemies=Math.min(enemies,4);
 let chosen=[player];for(let owner=1;owner<=enemies;owner++){let candidates=this.states.filter(s=>s.owner<0).sort((a,b)=>Math.min(...chosen.map(c=>Math.hypot(b.x-c.x,b.y-c.y)))-Math.min(...chosen.map(c=>Math.hypot(a.x-c.x,a.y-c.y))));let s=candidates[(l*3+owner)%Math.min(5,candidates.length)];s.owner=owner;s.troops=30+l*.8;chosen.push(s);}
 if(l>10){let s=this.states.filter(s=>s.owner<0).sort((a,b)=>this.dist(a,player)-this.dist(b,player))[0];s.owner=0;s.troops=20;}
 }
 dist(a:{x:number,y:number},b:{x:number,y:number}){return Math.hypot(a.x-b.x,a.y-b.y)}
 send(sources:number[],target:number,fraction=.8){if(this.result)return 0;let sent=0;for(const id of new Set(sources)){let s=this.states[id],t=this.states[target];if(!s||!t||id===target||s.troops<2)continue;let count=Math.floor(s.troops*fraction);s.troops-=count;sent+=count;for(let i=0;i<count;i++){let lane=((i%5)-2)*2.2;let d=this.dist(s,t),nx=-(t.y-s.y)/d,ny=(t.x-s.x)/d;this.units.push({x:s.x+nx*lane,y:s.y+ny*lane,tx:t.x+nx*lane,ty:t.y+ny*lane,target,owner:s.owner,delay:i*.022});}}
 this.sent+=sent;return sent;}
 update(dt:number){if(this.result)return;dt=Math.min(dt,.1);this.time+=dt;this.events=[];
 for(const s of this.states)if(s.owner>=0)s.troops=Math.min(500,s.troops+dt*(s.owner===0?1.65:1.2+this.settings.level*.015+this.settings.difficulty*.16));
 const alive:Unit[]=[];for(const u of this.units){u.delay-=dt;if(u.delay>0){alive.push(u);continue;}let d=Math.hypot(u.tx-u.x,u.ty-u.y),step=145*dt;if(d<=step+6){let t=this.states[u.target];if(t.owner===u.owner)t.troops=Math.min(500,t.troops+1);else {t.troops-=1;this.events.push({x:t.x,y:t.y,owner:u.owner});if(t.troops<0){t.owner=u.owner;t.troops=-t.troops;this.captures++;}}}else {u.x+=(u.tx-u.x)/d*step;u.y+=(u.ty-u.y)/d*step;alive.push(u);}}
 this.units=alive;
 // Opposing dots cancel on contact. Spatial buckets avoid quadratic work.
 const buckets=new Map<string,Map<number,Unit[]>>(),dead=new Set<Unit>();for(const u of this.units){if(u.delay>0)continue;let gx=Math.floor(u.x/9),gy=Math.floor(u.y/9);collision:for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const near=buckets.get(`${gx+dx},${gy+dy}`);if(!near)continue;for(const [owner,group] of near){if(owner===u.owner)continue;for(const v of group){if(!dead.has(v)&&this.dist(u,v)<5){dead.add(u);dead.add(v);this.events.push({x:u.x,y:u.y,owner:u.owner});break collision;}}}}if(!dead.has(u)){let key=`${gx},${gy}`,cell=buckets.get(key)||new Map<number,Unit[]>(),group=cell.get(u.owner)||[];group.push(u);cell.set(u.owner,group);buckets.set(key,cell);}}if(dead.size)this.units=this.units.filter(u=>!dead.has(u));
 this.aiClock-=dt;if(this.aiClock<=0){this.aiClock=Math.max(.45,2.2-this.settings.level*.025-this.settings.difficulty*.35);this.think();}
 this.checkResult();}
 think(){for(let owner=1;owner<=4;owner++){const own=this.states.filter(s=>s.owner===owner);if(!own.length)continue;
 const sources=[...own].sort((a,b)=>b.troops-a.troops);let actions=this.settings.difficulty===2?2:1;
 for(const s of sources){if(actions<=0||s.troops<12)continue;let incoming=this.units.filter(u=>u.target===this.states.indexOf(s)&&u.owner!==owner).length;
 if(incoming>s.troops*.6&&this.settings.difficulty>0){const help=sources.find(h=>h!==s&&h.troops>20);if(help)this.send([this.states.indexOf(help)],this.states.indexOf(s),.6);}
 const targets=this.states.filter(t=>t.owner!==owner).map(t=>{let allied=this.units.filter(u=>u.target===this.states.indexOf(t)&&u.owner===owner).length;return {t,score:this.dist(s,t)*.09+t.troops*1.8+allied*2-(t.owner===0?this.settings.difficulty*10:0)}}).sort((a,b)=>a.score-b.score);
 const t=targets[0]?.t;if(t&&s.troops*.8>t.troops+3){this.send([this.states.indexOf(s)],this.states.indexOf(t));actions--;}
 else if(own.length>1&&s.troops>40){const frontier=own.filter(t=>t!==s).sort((a,b)=>Math.min(...targets.map(x=>this.dist(a,x.t)))-Math.min(...targets.map(x=>this.dist(b,x.t))))[0];if(frontier){this.send([this.states.indexOf(s)],this.states.indexOf(frontier),.55);actions--;}}
 }}}
 checkResult(){let player=this.states.some(s=>s.owner===0)||this.units.some(u=>u.owner===0);let enemy=this.states.some(s=>s.owner>0)||this.units.some(u=>u.owner>0);if(!player)this.result='defeat';else if(!enemy)this.result='victory';return this.result;}
}
