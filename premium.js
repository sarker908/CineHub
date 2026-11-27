/* CineHub premium layer — reuses script.js globals (api, createCard, IMG, toggleWatchlist, switchSection…). */
(function(){
const $=id=>document.getElementById(id);
let slides=[],idx=0,timer=null;

// ── Nav: scrolled state + extra links ──
function setupNav(){
  const nav=$('main-nav');if(!nav)return;
  const on=()=>nav.classList.toggle('scrolled',scrollY>40);on();addEventListener('scroll',on,{passive:true});
  const first=document.querySelector('.nav-btn[data-section]');if(!first)return;
  const add=(label,fn)=>{const b=document.createElement('button');b.className='nav-btn p-link';b.textContent=label;b.onclick=fn;first.parentNode.appendChild(b)};
  add('Series',()=>{switchSection('tvshows');document.getElementById('tvshows-section')?.scrollIntoView({behavior:'smooth'})});
  add('Anime',()=>viewAnime());
  add('Genres',()=>{const tv=$('tvshows-section').classList.contains('active');const s=$(tv?'tv-genre':'movie-genre');s?.scrollIntoView({behavior:'smooth',block:'center'});s?.focus()});
}
function viewAnime(){switchSection('tvshows');$('tv-genre').value='16';$('tv-language').value='ja';$('tv-apply-filters').click();$('tvshows-section').scrollIntoView({behavior:'smooth'})}

// ── Hero carousel (replaces the random 12s swap; same IDs, same buttons) ──
async function loadHero(){
  try{
    const d=await api('trending/all/week');
    slides=d.results.filter(r=>r.backdrop_path&&r.media_type!=='person').slice(0,7);
    if(!slides.length)return;
    buildControls();show(0);restart();
  }catch(e){console.warn('hero',e)}
}
function buildControls(){
  const h=$('dynamic-header');if(!h||$('p-ctrl'))return;
  const meta=document.createElement('div');meta.className='p-meta';meta.id='p-meta';
  const tag=$('header-tagline');tag?.insertAdjacentElement('afterend',meta);
  const act=$('header-play-btn')?.parentNode;
  if(act){act.classList.add('p-actions');
    for(const [t,f] of [['Watch Trailer',trailer],['+ Watchlist',()=>{const s=slides[idx];toggleWatchlist(s.id,s.media_type,s)}]]){
      const b=document.createElement('button');b.textContent=t;b.onclick=f;act.appendChild(b)}}
  const c=document.createElement('div');c.className='p-ctrl';c.id='p-ctrl';
  c.innerHTML='<button aria-label="Previous">‹</button><div class="p-dots"></div><button aria-label="Next">›</button>';
  const [pv,nx]=c.querySelectorAll('button');pv.onclick=()=>{show(idx-1);restart()};nx.onclick=()=>{show(idx+1);restart()};
  c.querySelector('.p-dots').innerHTML=slides.map(()=>'<i></i>').join('');
  h.appendChild(c);h.addEventListener('mouseenter',()=>clearInterval(timer));h.addEventListener('mouseleave',restart);
}
function show(i){
  idx=(i+slides.length)%slides.length;const s=slides[idx];
  currentHeaderItem=s;
  const img=new Image();img.onload=()=>{
    $('dynamic-header').style.backgroundImage=`url('${IMG}original${s.backdrop_path}')`;
    $('header-bg')?.classList.remove('skel-loading');};
  img.src=`${IMG}original${s.backdrop_path}`;
  const t=$('header-title'),g=$('header-tagline');
  t.style.opacity=g.style.opacity=0;
  setTimeout(()=>{
    const y=(s.release_date||s.first_air_date||'').slice(0,4);
    t.innerHTML=`${escHtml(s.title||s.name)}<br><em>${y}</em>`;
    g.textContent=s.overview?s.overview.slice(0,150)+'…':'Now trending';
    const m=$('p-meta');if(m)m.innerHTML=`<span class="p-imdb">★ ${s.vote_average?s.vote_average.toFixed(1):'N/A'}</span><span>${y}</span><span class="p-type">${s.media_type==='tv'?'TV Series':'Movie'}</span>`;
    t.style.opacity=g.style.opacity=1;},220);
  document.querySelectorAll('.p-dots i').forEach((d,k)=>d.classList.toggle('on',k===idx));
}
function restart(){clearInterval(timer);timer=setInterval(()=>show(idx+1),8000)}
async function trailer(){
  const s=slides[idx];try{
    const d=await api(`${s.media_type}/${s.id}/videos`);
    const v=d.results.find(x=>x.site==='YouTube'&&x.type==='Trailer')||d.results.find(x=>x.site==='YouTube');
    if(v)open(`https://www.youtube.com/watch?v=${v.key}`,'_blank','noopener');else notify('No trailer available','info');
  }catch{notify('Could not load trailer','error')}
}

// ── Horizontal rows (real TMDB data, existing card component) ──
const ROWS=[
 {t:'Trending Now',ep:'trending/all/day',go:()=>switchSection('movies')},
 {t:'Popular Movies',ep:'movie/popular',type:'movie',go:()=>switchSection('movies')},
 {t:'Top Rated Movies',ep:'movie/top_rated',type:'movie',go:()=>{switchSection('movies');document.querySelector('[data-movie-endpoint="movie/top_rated"]')?.click()}},
 {t:'Popular TV Series',ep:'tv/popular',type:'tv',go:()=>switchSection('tvshows')},
 {t:'Anime',ep:'discover/tv',p:{with_genres:'16',with_original_language:'ja',sort_by:'popularity.desc'},type:'tv',go:viewAnime},
];
function buildRows(){
  const h=$('dynamic-header');if(!h||$('premium-rows'))return;
  const root=document.createElement('div');root.id='premium-rows';h.insertAdjacentElement('afterend',root);
  ROWS.forEach(async r=>{
    const sec=document.createElement('section');sec.className='p-row';
    sec.innerHTML=`<div class="p-row-head"><h2>${r.t}</h2><button>View all</button></div>
      <div class="p-row-wrap"><button class="p-arrow l" aria-label="Scroll left">‹</button><div class="p-track">${'<div class="p-skel"></div>'.repeat(8)}</div><button class="p-arrow r" aria-label="Scroll right">›</button></div>`;
    root.appendChild(sec);
    const tr=sec.querySelector('.p-track');
    sec.querySelector('.p-row-head button').onclick=()=>{r.go();$('movies-section').scrollIntoView({behavior:'smooth'})};
    sec.querySelector('.l').onclick=()=>tr.scrollBy({left:-tr.clientWidth*.85,behavior:'smooth'});
    sec.querySelector('.r').onclick=()=>tr.scrollBy({left:tr.clientWidth*.85,behavior:'smooth'});
    try{
      const d=await api(r.ep,r.p||{});tr.innerHTML='';
      d.results.filter(x=>x.poster_path&&x.media_type!=='person').slice(0,18).forEach(x=>tr.appendChild(createCard(x,r.type||x.media_type||'movie')));
      updateWatchlistBtns();
    }catch{sec.remove()}
  });
}

// Take over the hero loader before init() runs (init resolves it by name at call time).
window.loadTrendingHeader=loadHero;
document.addEventListener('DOMContentLoaded',()=>{setupNav();buildRows()});
})();
