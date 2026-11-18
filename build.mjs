import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
fs.mkdirSync('dist',{recursive:true});
const raw=JSON.parse(fs.readFileSync('us-states.geojson','utf8'));
// Albers equal-area conic projection, contiguous United States.
const rad=Math.PI/180, p1=29.5*rad,p2=45.5*rad,n=(Math.sin(p1)+Math.sin(p2))/2,C=Math.cos(p1)**2+2*n*Math.sin(p1);
function project([lon,lat]){let r=Math.sqrt(C-2*n*Math.sin(lat*rad))/n,t=n*(lon+96)*rad;return [r*Math.sin(t),-r*Math.cos(t)];}
const excluded=['Alaska','Hawaii','Puerto Rico','District of Columbia'];
let states=raw.features.filter(f=>!excluded.includes(f.properties.name)).map(f=>({name:f.properties.name,rings:(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).flatMap(p=>p.slice(0,1)).map(r=>r.map(project))}));
let pts=states.flatMap(s=>s.rings.flat()),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),scale=940/(Math.max(...xs)-minX);
function area(r){return Math.abs(r.reduce((a,p,i)=>{let q=r[(i+1)%r.length];return a+p[0]*q[1]-q[0]*p[1]},0)/2)}
states=states.map(s=>{let rings=s.rings.map(r=>r.map(([x,y])=>[+(30+(x-minX)*scale).toFixed(2),+(30+(y-minY)*scale).toFixed(2)]));let r=[...rings].sort((a,b)=>area(b)-area(a))[0],a=0,x=0,y=0;for(let i=0;i<r.length;i++){let p=r[i],q=r[(i+1)%r.length],cross=p[0]*q[1]-q[0]*p[1];a+=cross;x+=(p[0]+q[0])*cross;y+=(p[1]+q[1])*cross;}return {...s,rings,x:x/(3*a),y:y/(3*a)};});
fs.writeFileSync('dist/map.json',JSON.stringify(states));
execFileSync(process.execPath,['package/lib/tsc.js','-p','tsconfig.json'],{stdio:'inherit'});
for(const f of fs.readdirSync('public'))fs.copyFileSync('public/'+f,'dist/'+f);
console.log('Production build: dist, '+states.length+' states');
