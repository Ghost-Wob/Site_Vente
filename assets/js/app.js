/* app.js : partagé par toutes les pages (réglages, structure commune, menu, navbar). Le fond circuit est dans circuit.js, chargé en différé. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

/* ===== RÉGLAGES DU SITE : une seule source pour les coordonnées (toute valeur entre [crochets] est à renseigner) ===== */
const SITE={
  brand:'Ghost-Wob',                       // nom affiché (logo et pied de page)
  email:'[À RENSEIGNER] email professionnel',
  github:'https://github.com/Ghost-Wob',
  linkedin:'[À RENSEIGNER] URL LinkedIn',
  formEndpoint:''                          // URL d'un service de formulaire (Formspree, Netlify…) ; vide = ouverture de la messagerie
};

/* ===== PAGES DU SITE : pour ajouter une page, ajouter UNE ligne ici (fichier, libellé, emplacement facultatif)
   sans 3e valeur : menu principal | 'tool' : menu principal, en dernier et en gris (outil personnel) + pied de page | 'home' : pied de page seulement (le logo mène à l'accueil) | 'extra' : « Projets personnels » en pied de page seulement ===== */
const PAGES=[
  ['index.html','Accueil','home'],
  ['services.html','Services'],
  ['realisations.html','Réalisations'],
  ['a-propos.html','À propos'],
  ['contact.html','Contact'],
  ['constructions.html','Constructions','extra'],
  ['planning.html','Planning','tool']
];

/* ===== STRUCTURE COMMUNE : fond, en-tête, pied de page et notification sont injectés sur chaque page ===== */
(()=>{
  const id=u=>u.replace(/\.html$/,''),cur=id(location.pathname.split('/').pop()||'index');
  const a=([h,t,w])=>`<a href="${h}"${w==='tool'?' class="tool"':''}${id(h)===cur?' aria-current="page"':''}>${t}</a>`;
  const nav=PAGES.filter(p=>!p[2]).concat(PAGES.filter(p=>p[2]==='tool')).map(a).join('');
  const fnav=PAGES.filter(p=>!p[2]||p[2]==='home').map(([h,t])=>`<a href="${h}">${t}</a>`).join('');
  const fextra=PAGES.filter(p=>p[2]==='extra'||p[2]==='tool').map(([h,t])=>`<a href="${h}">${t}</a>`).join('');
  const logo=`<b>${SITE.brand.split('-')[0]}</b>${SITE.brand.includes('-')?'-'+SITE.brand.split('-').slice(1).join('-'):''}`;
  document.body.insertAdjacentHTML('afterbegin',`<div id="pcb" aria-hidden="true"><canvas id="cv0"></canvas><canvas id="cv"></canvas><canvas id="fx"></canvas></div>
<a class="skip" href="#main">Aller au contenu</a>
<header class="top"><div class="wrap bar"><a class="logo" href="index.html" aria-label="${SITE.brand}, accueil">${logo}</a><nav aria-label="Navigation principale"><div class="nav" id="nav">${nav}</div></nav><a class="btn fill head-cta" href="contact.html">Parler de mon projet</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button></div></header>`);
  document.body.insertAdjacentHTML('beforeend',`<footer><div class="wrap foot">
<div class="foot-brand"><a class="logo" href="index.html">${logo}</a><p>Développeur web indépendant. Je crée et améliore des sites web modernes, rapides et adaptés aux besoins des entreprises et indépendants.</p></div>
<nav class="foot-col" aria-label="Pied de page"><p class="foot-h">Navigation</p>${fnav}</nav>
<nav class="foot-col" aria-label="Projets personnels"><p class="foot-h">Projets personnels</p>${fextra}</nav>
<div class="foot-col"><p class="foot-h">Contact</p><a class="js-email" href="contact.html">Écrire un message</a><a class="js-github" href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a><a class="js-linkedin" href="#" target="_blank" rel="noopener noreferrer">LinkedIn</a></div>
</div><div class="wrap foot-end"><p>© ${new Date().getFullYear()} ${SITE.brand}</p></div></footer>
<div id="toast" role="status" aria-live="polite"></div>`);
})();

/* Contenu : à modifier ici, toutes les pages s'adaptent */
const DATA={
  builds:[25,46,80,130,160,199].map(n=>({n,thumb:`img/builds/miniatures/miniature_build_${n}.png`,full:`img/builds/profil/build_${n}.png`}))
};

/* Constructions : grille (limitée par data-limit sur l'accueil) et modale */
const grid=$('#grid');
if(grid){
  const list=DATA.builds.slice(0,+grid.dataset.limit||DATA.builds.length);
  grid.innerHTML=list.map((b,i)=>`<li><button class="card" data-i="${i}"><span class="thumb"><img src="${b.thumb}" alt="Build n°${b.n}" width="640" height="384" loading="lazy" decoding="async" onerror="this.hidden=true"><b>#${b.n}</b></span><span class="meta"><strong>Build #${b.n}</strong><small>Cliquer pour agrandir</small></span></button></li>`).join('');
  const dlg=$('#dlg'),dImg=$('#dlgImg'),dCap=$('#dlgCap');
  grid.addEventListener('click',e=>{
    const c=e.target.closest('.card');if(!c)return;
    const b=DATA.builds[c.dataset.i];
    dImg.onerror=()=>{dImg.onerror=null;dImg.src=b.thumb}; /* repli sur la miniature si la version complète manque */
    dImg.src=b.full;dImg.alt=dCap.textContent=`Build n°${b.n}`;
    dlg.showModal();
  });
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
}

/* Notification (Planning, formulaire de contact) */
let tt;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2800)}

/* Coordonnées : injectées partout où une classe js-* est présente (valeurs réglées dans SITE) */
const real=v=>v&&!/^\[/.test(v);
$$('.js-email').forEach(e=>{if(real(SITE.email)){e.href='mailto:'+SITE.email;e.textContent=SITE.email}});
$$('.js-github').forEach(e=>{if(real(SITE.github))e.href=SITE.github});
$$('.js-linkedin').forEach(e=>{if(real(SITE.linkedin))e.href=SITE.linkedin;else e.hidden=true});

/* Menu mobile */
const burger=$('.burger'),nav=$('#nav');
burger.addEventListener('click',()=>burger.setAttribute('aria-expanded',nav.classList.toggle('open')));
const links=$$('.nav a');

/* Navbar : circuit à angles droits dessiné à la taille exacte de chaque lien ; 3 variantes pour un léger désordre */
const enc=t=>encodeURIComponent(t).replace(/'/g,'%27');
function navCircuit(a){
  const W=a.clientWidth,H=a.clientHeight;if(!W)return;
  const y=H/2,x0=13.5,xe=W-8,L=xe-x0,u=Math.min(9,y-4),e3=xe-14,
    p=[[.26,.5,.9,.7],[.36,.6,.7,1],[.2,.44,1,.8]][a.dataset.i%3],d1=u*p[2],d2=u*p[3],
    sq=(x,yy,c)=>`<rect x='${x-2.5}' y='${yy-2.5}' width='5' height='5' fill='${c}'/>`;
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'><g stroke='#0ff' stroke-width='1.2' fill='none' stroke-opacity='.85'><path d='M${x0} ${y}H${x0+L*p[0]}V${y-d1}H${xe}'/><path d='M${x0} ${y}H${x0+L*p[1]}V${y+d2}H${xe}'/><path d='M${x0} ${y}H${e3}'/></g>${sq(xe,y-d1,'#0ff')}${sq(xe,y+d2,'#0ff')}${sq(e3,y,'#90f')}</svg>`;
  a.style.setProperty('--circuit',`url("data:image/svg+xml,${enc(svg)}")`);
}
const ro=new ResizeObserver(es=>es.forEach(e=>navCircuit(e.target)));
links.forEach((a,i)=>{a.dataset.i=i;ro.observe(a)});

/* Fond circuit : chargé quand la page est affichée et le navigateur au repos, pour ne pas retarder le contenu */
const loadBg=()=>{const s=document.createElement('script');s.src='assets/js/circuit.js';document.head.appendChild(s)};
addEventListener('load',()=>('requestIdleCallback' in window)?requestIdleCallback(loadBg,{timeout:1500}):setTimeout(loadBg,400));
