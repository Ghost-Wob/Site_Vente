/* circuit.js : fond circuit imprimé (puces, bus de pistes, impulsions, lampe). Chargé en différé par app.js ; animations coupées si « réduire les animations » ou « économiseur de données » est actif. */
/* Fond : puces rectangulaires sur grille, reliées par des bus de pistes parallèles à angles droits, sur deux plans de profondeur.
   Parallaxe avec le curseur, respiration lente, voyants clignotants, impulsions violettes qui allument les pastilles d'arrivée. */
const pcb=$('#pcb'),cv0=$('#cv0'),cv=$('#cv'),fx=$('#fx'),fg=fx.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion:reduce)'),saveData=!!(navigator.connection&&navigator.connection.saveData);
const M=40,N=40,TL=80,LAYERS=[[1,'rgba(153,0,255,.35)',5],[.6,'rgba(153,0,255,.85)',2.4],[.25,'rgba(224,180,255,1)',1.6]];
let buses=[],pulses=[],leds=[],flashes=[];
/* Chaque piste a sa propre impulsion : son sens (rarement inversé), sa vitesse, son attente aléatoire, parfois une rafale de 2 à 3 paquets */
const reset=(q,first)=>{
  if(first||Math.random()<.1)q.s=Math.random()<.5?1:-1;
  q.t=0;q.f=0;q.v=80+Math.random()*150;q.n=Math.random()<.3?2+(Math.random()*2|0):1;
  q.w=first?Math.random()*14:2+Math.random()*14;return q;
};
const rr=(g,x,y,w,h)=>g.rect(x,y,w,h);
const line=(g,pl)=>{g.beginPath();pl.forEach(([x,y],j)=>j?g.lineTo(x,y):g.moveTo(x,y));g.stroke()};

const mkpl=pts=>{
  const pl=[];for(const q of pts){const z=pl[pl.length-1];if(!z||Math.hypot(q[0]-z[0],q[1]-z[1])>.5)pl.push(q)}
  pl.c=[0];for(let j=1;j<pl.length;j++)pl.c.push(pl.c[j-1]+Math.hypot(pl[j][0]-pl[j-1][0],pl[j][1]-pl[j-1][1]));
  pl.L=pl.c[pl.length-1];return pl;
};

/* k pistes parallèles en escalier à angles droits, avec 1 ou 2 décrochements placés au hasard.
   La piste extérieure tourne la dernière : aucune ne se croise. */
function ribbon(p0,p1,dir,k,pitch,r){
  const v=dir[1]===1,T=q=>v?[q[1],q[0]]:q,a=T(p0),b=T(p1),span=b[0]-a[0],out=[],two=span>300,
    f1=.2+r()*.25,f2=f1+.35+r()*.2,vm=a[1]+(b[1]-a[1])*(.3+r()*.4)+(r()<.25?(r()-.5)*60:0),
    x1=a[0]+span*(two?f1:.3+r()*.4),x2=a[0]+span*f2,v1=two?vm:b[1],
    sg=(d,i)=>((d>0?k-1-i:i)-(k-1)/2)*pitch;
  for(let i=0;i<k;i++){
    const o=(i-(k-1)/2)*pitch,X1=x1+sg(v1-a[1],i),X2=x2+sg(b[1]-v1,i);
    out.push(mkpl((two?[[a[0],a[1]+o],[X1,a[1]+o],[X1,v1+o],[X2,v1+o],[X2,b[1]+o],[b[0],b[1]+o]]:[[a[0],a[1]+o],[X1,a[1]+o],[X1,b[1]+o],[b[0],b[1]+o]]).map(T)));
  }
  return out;
}

function paint(){
  const d=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight,P=12,snap=v=>Math.round(v/P)*P;
  buses=[];leds=[];flashes=[];
  let s=41;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  const ctx=c=>{c.width=(w+2*M)*d;c.height=(h+2*M)*d;const g=c.getContext('2d');g.setTransform(d,0,0,d,M*d,M*d);g.lineCap='butt';g.lineJoin='miter';return g};
  const g0=ctx(cv0),g=ctx(cv);fx.width=w+2*M;fx.height=h+2*M;

  /* Plan lointain : longs bus fins et pâles */
  g0.strokeStyle='rgba(0,255,255,.3)';g0.lineWidth=.9;
  for(let i=0,n=Math.max(4,w/260|0);i<n;i++){
    const hz=r()<.55,p0=hz?[-M,r()*h]:[r()*w,-M],p1=hz?[w+M,r()*h]:[r()*w,h+M];
    ribbon(p0,p1,hz?[1,0]:[0,1],2+(r()*3|0),8,r).forEach(pl=>line(g0,pl));
  }

  /* Plan principal : puces de tailles variées, colonnes décalées, quelques emplacements vides */
  g.strokeStyle='rgba(0,255,255,.62)';g.shadowColor='rgba(0,255,255,.7)';g.shadowBlur=5;g.lineWidth=1.3;
  const cols=Math.max(1,w/280|0),rows=Math.max(2,h/190|0),cx=w/cols,cy=h/rows,chip=[],all=[];
  for(let c=0;c<cols;c++){
    chip[c]=[];const sh=(r()-.5)*cy*.5;
    for(let q=0;q<rows;q++){
      if(r()<.12){chip[c][q]=null;continue}
      const k=3+2*(r()*3|0),cw=P*(4+(r()*6|0)),ch=(k+1)*P,
        o={k,cw,ch,x:snap(c*cx+(cx-cw)*(.03+.94*r())),y:snap(q*cy+sh+(cy-ch)*(.05+.9*r()))};
      chip[c][q]=o;all.push(o);
    }
  }
  for(const o of all){
    g.beginPath();g.rect(o.x,o.y,o.cw,o.ch);g.fillStyle='rgba(0,255,255,.05)';g.fill();g.stroke();
    g.globalAlpha=.4;g.beginPath();g.rect(o.x+8,o.y+8,o.cw-16,o.ch-16);g.stroke();g.globalAlpha=1;
    g.beginPath();
    for(let i=0;i<o.k;i++){const y=o.y+o.ch/2+(i-(o.k-1)/2)*P;g.moveTo(o.x,y);g.lineTo(o.x-6,y);g.moveTo(o.x+o.cw,y);g.lineTo(o.x+o.cw+6,y)}
    g.rect(o.x+o.cw-14,o.y+6,8,8);
    if(r()<.5){const px=o.x+P*(1+(r()*(o.cw/P-4)|0));g.rect(px,o.y-18,14,6);g.moveTo(px+7,o.y-12);g.lineTo(px+7,o.y)}
    g.stroke();
    leds.push({x:o.x+o.cw-10,y:o.y+10,ph:r()*6.3});
  }
  g.fillStyle='rgba(0,255,255,.7)';

  /* une liaison n'est tracée que si elle ne traverse aucune autre puce */
  const free=(pls,ex)=>pls.every(pl=>pl.every((q,j)=>{
    if(!j)return true;const [x0,y0]=pl[j-1],n=Math.ceil(Math.hypot(q[0]-x0,q[1]-y0)/8);
    for(let i=1;i<n;i++){const x=x0+(q[0]-x0)*i/n,y=y0+(q[1]-y0)*i/n;
      if(all.some(o=>!ex.includes(o)&&x>o.x-4&&x<o.x+o.cw+4&&y>o.y-4&&y<o.y+o.ch+4))return false}
    return true}));
  const add=pls=>{
    const k=pls.length;
    pls.forEach(pl=>{line(g,pl);for(const e of [pl[0],pl[pl.length-1]])g.fillRect(e[0]-2.5,e[1]-2.5,5,5)});
    if(k>1){ /* dérivation en L depuis une piste extérieure, vers une pastille carrée */
      const o=r()<.5?0:k-1,pl=pls[o],nb=pls[o?k-2:1],f=.25+r()*.35,[a,b]=[pl[0],pl[1]],
        x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f,ox=pl[0][0]-nb[0][0],oy=pl[0][1]-nb[0][1],m=Math.hypot(ox,oy)||1,
        sl=Math.hypot(b[0]-a[0],b[1]-a[1])||1,len=22+r()*28,
        q1=[x+ox/m*len,y+oy/m*len],q2=[q1[0]+(b[0]-a[0])/sl*16,q1[1]+(b[1]-a[1])/sl*16];
      g.beginPath();g.moveTo(x,y);g.lineTo(q1[0],q1[1]);g.lineTo(q2[0],q2[1]);g.stroke();
      g.strokeRect(q2[0]-3.5,q2[1]-3.5,7,7);g.fillRect(q2[0]-1.5,q2[1]-1.5,3,3);
    }else{const e=pls[0][pls[0].length-1];g.strokeRect(e[0]-4,e[1]-4,8,8)}
    buses.push(pls);
  };
  const near=(c,q)=>{const L=[q-1,q,q+1].map(i=>chip[c][i]).filter(Boolean);return L[r()*L.length|0]};
  for(let c=0;c<cols;c++)for(let q=0;q<rows;q++){
    const A=chip[c][q];if(!A)continue;const ya=A.y+A.ch/2;let rb;
    if(c<cols-1&&r()<.88){
      const B=near(c+1,q);
      if(B&&B.x-(A.x+A.cw)>110){
        let kk=Math.min(A.k,B.k);if(kk>3&&r()<.3)kk-=2;
        rb=ribbon([A.x+A.cw+6,ya],[B.x-6,B.y+B.ch/2],[1,0],kk,P,r);if(free(rb,[A,B]))add(rb);
      }
    }
    if(q<rows-1&&chip[c][q+1]&&r()<.5){
      const B=chip[c][q+1];
      if(B.y-(A.y+A.ch)>60){rb=ribbon([A.x+A.cw/2,A.y+A.ch+6],[B.x+B.cw/2,B.y-6],[0,1],3,P,r);if(free(rb,[A,B]))add(rb)}
    }
    if(c===0&&A.x>60&&r()<.8){rb=ribbon([-M,ya+(r()-.5)*120],[A.x-6,ya],[1,0],A.k,P,r);if(free(rb,[A]))add(rb)}
    if(c===cols-1&&w-(A.x+A.cw)>60&&r()<.8){rb=ribbon([A.x+A.cw+6,ya],[w+M,ya+(r()-.5)*120],[1,0],A.k,P,r);if(free(rb,[A]))add(rb)}
  }
  /* tracés isolés : partent d'une patte et errent en escalier jusqu'à une pastille */
  for(const o of all){
    if(r()>.7)continue;
    const sd=r()<.5?-1:1,i=r()*o.k|0,x0=sd<0?o.x-6:o.x+o.cw+6,y0=o.y+o.ch/2+(i-(o.k-1)/2)*P,pts=[[x0,y0]];
    let x=x0,y=y0,hz=true;
    for(let n=2+(r()*4|0);n--;){
      const L=Math.round((24+r()*90)/6)*6,nx=hz?x+sd*L:x,ny=hz?y:y+(r()<.5?-1:1)*L;
      if(nx<-M||nx>w+M||ny<-M||ny>h+M||all.some(q=>nx>q.x-10&&nx<q.x+q.cw+10&&ny>q.y-10&&ny<q.y+q.ch+10))break;
      pts.push([x=nx,y=ny]);hz=!hz;
    }
    if(pts.length>2){const pl=mkpl(pts);if(free([pl],[o]))add([pl])}
  }
  pulses=buses.flat().filter(()=>Math.random()<.65).map(p=>reset({p},true));
}

/* Impulsions : un paquet traverse un ruban entier ; à l'arrivée la pastille s'allume en anneau */
function trail(p,a,b){
  a=Math.max(0,a);b=Math.min(p.L,b);if(b<=a)return null;
  fg.beginPath();let on=0,r=null;
  for(let i=1;i<p.length;i++){
    const s0=p.c[i-1],e=p.c[i];if(e<a||s0>b)continue;
    const [x0,y0]=p[i-1],[x1,y1]=p[i],L=e-s0,t0=(Math.max(a,s0)-s0)/L,t1=(Math.min(b,e)-s0)/L,
      sx=x0+(x1-x0)*t0,sy=y0+(y1-y0)*t0,ex=x0+(x1-x0)*t1,ey=y0+(y1-y0)*t1;
    on?fg.lineTo(sx,sy):(fg.moveTo(sx,sy),r=[sx,sy]);on=1;fg.lineTo(ex,ey);r[2]=ex;r[3]=ey;
  }
  fg.stroke();return r;
}
let last=0,raf2=0;
function frame(ts){
  const dt=Math.min((ts-last)/1000,.05);last=ts;
  fg.setTransform(1,0,0,1,0,0);fg.clearRect(0,0,fx.width,fx.height);fg.setTransform(1,0,0,1,M,M);
  fg.lineCap='butt';fg.lineJoin='miter';fg.globalCompositeOperation='lighter';
  for(const l of leds){fg.fillStyle=`rgba(190,120,255,${.2+.8*(.5+.5*Math.sin(ts/650+l.ph))**2})`;fg.fillRect(l.x-2.5,l.y-2.5,5,5)}
  for(const q of pulses){
    if(q.w>0){q.w-=dt;continue}
    const p=q.p;q.t+=q.v*dt;
    if(q.t>p.L+TL+(q.n-1)*55){reset(q);continue}
    for(let n=0;n<q.n;n++){
      const t=q.t-n*55,hd=q.s>0?t:p.L-t;
      if(t>=p.L&&!(q.f>>n&1)){q.f|=1<<n;const e=q.s>0?p[p.length-1]:p[0];flashes.push({x:e[0],y:e[1],t:0})}
      let ends=null;
      for(const [f,col,lw] of LAYERS){fg.strokeStyle=col;fg.lineWidth=lw;const tl=hd-q.s*TL*f;ends=trail(p,Math.min(hd,tl),Math.max(hd,tl))||ends}
      if(ends&&t>0&&t<p.L){const hx=q.s>0?ends[2]:ends[0],hy=q.s>0?ends[3]:ends[1];
        fg.fillStyle='rgba(153,0,255,.4)';fg.fillRect(hx-6,hy-6,12,12);
        fg.fillStyle='rgba(245,230,255,1)';fg.fillRect(hx-2,hy-2,4,4)}
    }
  }
  flashes=flashes.filter(f=>(f.t+=dt)<.7);
  for(const f of flashes){fg.strokeStyle=`rgba(190,120,255,${(1-f.t/.7)*.9})`;fg.lineWidth=1.5;const z=3+f.t*40;fg.strokeRect(f.x-z,f.y-z,2*z,2*z)}
  fg.globalCompositeOperation='source-over';
  raf2=requestAnimationFrame(frame);
}
const touch=matchMedia('(hover:none)');
function play(){if(!raf2&&!reduce.matches&&!saveData&&!document.hidden&&buses.length){last=performance.now();raf2=requestAnimationFrame(frame)}}
function stop(){cancelAnimationFrame(raf2);raf2=0}
paint(); /* écran tactile : circuit fixe, sans animation (économie de batterie) */
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(paint,150)});
document.addEventListener('visibilitychange',()=>document.hidden?stop():pcb.classList.contains('on')&&play());

/* Lampe : suit le curseur avec inertie ; les animations ne tournent que lorsque le circuit est visible */
let tx=0,ty=0,x=0,y=0,raf=0;
function tick(){
  x+=(tx-x)*.2;y+=(ty-y)*.2;
  pcb.style.setProperty('--x',x+'px');pcb.style.setProperty('--y',y+'px');
  pcb.style.setProperty('--ox',(x/innerWidth-.5).toFixed(3));pcb.style.setProperty('--oy',(y/innerHeight-.5).toFixed(3));
  raf=Math.abs(tx-x)+Math.abs(ty-y)>.5?requestAnimationFrame(tick):0;
}
addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  if(!pcb.classList.contains('on')){x=tx=e.clientX;y=ty=e.clientY;pcb.classList.add('on');play()}
  tx=e.clientX;ty=e.clientY;if(!raf)raf=requestAnimationFrame(tick);
},{passive:true});
document.documentElement.addEventListener('mouseleave',()=>{pcb.classList.remove('on');stop()});

/* La position de la lampe est mémorisée d'une page à l'autre : le fond ne disparaît plus à chaque navigation.
   À la première visite, la lampe s'allume dans la partie droite de l'écran puis suit le curseur. */
const LK='ghostwob-lens';
if(!touch.matches){
  let sv=null;try{sv=JSON.parse(sessionStorage.getItem(LK))}catch{}
  x=tx=sv?Math.min(sv[0],innerWidth):innerWidth*.62;y=ty=sv?Math.min(sv[1],innerHeight):innerHeight*.4;
  tick();pcb.classList.add('on');play();
}
addEventListener('pagehide',()=>{try{sessionStorage.setItem(LK,JSON.stringify([tx,ty]))}catch{}});
