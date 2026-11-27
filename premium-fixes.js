/* premium-fixes.js — load AFTER premium.js. Search fixes + hero/nav bug fixes. */
(function(){
const $=id=>document.getElementById(id);
const lk=document.createElement('link');lk.rel='stylesheet';
lk.href='https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&display=swap';document.head.appendChild(lk);
const st=document.createElement('style');st.textContent=`
.nav-search{position:relative}
.global-search-box{overflow:visible!important}
.global-search-suggestions,.suggestions-dropdown{z-index:80;max-height:min(60vh,420px);overflow-y:auto;background:#141418;border:1px solid #26262d;border-radius:6px;box-shadow:0 16px 40px #000c}
.suggestion-item.kb,.suggestion-item:hover{background:#ffffff14}
.search-clear{cursor:pointer}
#movie-grid,#tv-grid{scroll-margin-top:90px}
#dynamic-header::after{opacity:.5}
@media(max-width:700px){.global-search-box{max-width:calc(100vw - 24px)}}`;
document.head.appendChild(st);

// Hero: load once (premium.js re-ran it every 12s and reset the slide) + wire the buttons
const lh=window.loadTrendingHeader;let loaded=false;
window.loadTrendingHeader=async function(){
  if(loaded)return;loaded=true;await lh();
  $('header-play-btn').onclick=()=>{const i=currentHeaderItem;if(!i)return;i.media_type==='tv'?openTVEpisodes(i.id):openMovieStream(i.id)};
  $('header-info-btn').onclick=()=>{const i=currentHeaderItem;if(i)showCast(i.id,i.media_type||'movie')};
};

// Search: show results (scroll to grid), back button for actor search
const scrollTo=s=>$(s==='movie'?'movie-grid':'tv-grid')?.scrollIntoView({behavior:'smooth',block:'start'});
const rs=window.runSearch;window.runSearch=async function(s){await rs(s);scrollTo(s)};
const sa=window.searchByActor;window.searchByActor=async function(n,s){await sa(n,s);showBackBtn(s);scrollTo(s)};

// Keyboard navigation for all suggestion lists
function kbNav(input,box){
  if(!input||!box)return;
  input.addEventListener('keydown',e=>{
    const items=[...box.querySelectorAll('.suggestion-item')];
    if(!items.length||box.style.display==='none')return;
    let k=items.findIndex(x=>x.classList.contains('kb'));
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();items[k]?.classList.remove('kb');
      k=e.key==='ArrowDown'?(k+1)%items.length:(k<=0?items.length-1:k-1);
      items[k].classList.add('kb');items[k].scrollIntoView({block:'nearest'});
    }else if(e.key==='Enter'&&k>-1){e.preventDefault();e.stopImmediatePropagation();items[k].click()}
  },true);
}

document.addEventListener('DOMContentLoaded',()=>{
  kbNav($('global-search-input'),$('global-search-suggestions'));
  kbNav($('movie-search'),$('movie-suggestions'));kbNav($('tv-search'),$('tv-suggestions'));
  // Close nav search on outside click / after picking a suggestion
  const closeNav=()=>{$('main-nav').classList.remove('search-open');$('global-search-toggle')?.setAttribute('aria-expanded','false');const s=$('global-search-suggestions');if(s)s.style.display='none'};
  document.addEventListener('click',e=>{const n=document.querySelector('.nav-search');if(n&&!n.contains(e.target))closeNav()});
  $('global-search-suggestions')?.addEventListener('click',()=>$('main-nav').classList.remove('search-open'));
  // Clear (x) buttons were never wired
  [['movie-search','movie-search-clear','movie-suggestions'],['tv-search','tv-search-clear','tv-suggestions']].forEach(([i,c,s])=>{
    const inp=$(i),btn=$(c);if(!inp||!btn)return;
    const sync=()=>{btn.style.display=inp.value?'flex':'none'};
    inp.addEventListener('input',sync);inp.addEventListener('focus',sync);
    btn.addEventListener('click',()=>{inp.value='';sync();$(s).style.display='none';inp.focus()});
  });
  // Nav: one scroll threshold (inline script uses 80; premium.js used 40 and flickered); drop duplicate "Series"
  addEventListener('scroll',()=>$('main-nav').classList.toggle('scrolled',scrollY>80),{passive:true});
  [...document.querySelectorAll('.p-link')].find(b=>b.textContent==='Series')?.remove();
  // Italian was value="tr" (Turkish) in the movie filter and missing from TV
  document.querySelectorAll('#movie-language option').forEach(o=>{if(o.textContent.trim()==='Italian')o.value='it'});
  const tl=$('tv-language');if(tl&&![...tl.options].some(o=>o.value==='it'))tl.add(new Option('Italian','it'));
});
})();
