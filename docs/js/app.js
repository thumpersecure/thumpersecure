(function(){
"use strict";

/* CSP: Content-Security-Policy should be set via meta tag in HTML for defense in depth. */

/* ====== CYBERSECURITY TOOL REFERENCE (NMAP) ======
 * NMAP — Network Mapper: industry-standard port scanner and recon tool.
 * Port scanning: nmap -p 22,80,443 target.com (common ports)
 * -sV: service/version detection (probes open ports for banners)
 * -sC: default NSE scripts (vuln checks, info disclosure)
 * -A: aggressive (OS detection, version, scripts, traceroute)
 * -Pn: skip host discovery (treat host as up; useful for firewalled targets)
 * -O: OS fingerprinting
 * Common use cases: recon before pentest, asset inventory, vuln assessment.
 * Red team: document every scan for the engagement report.
 * Blue team: baseline normal port patterns before hunting anomalies.
 */

/* ====== CYBERSECURITY TOOL REFERENCE (WIRESHARK) ======
 * WIRESHARK — Packet capture and protocol analyzer.
 * Capture: select interface, start capture; save as .pcap for later analysis.
 * Display filters: tcp.port==443, http, ip.addr==192.168.1.1, dns.qry.name
 * Follow stream: right-click packet -> Follow -> TCP/HTTP stream (reconstructs session)
 * Use cases: debugging TLS handshakes, inspecting HTTP headers, detecting beaconing,
 *            analyzing DNS exfil, validating firewall rules.
 * Red team: capture C2 traffic for post-engagement writeup.
 * Blue team: baseline normal traffic patterns; anomalies often indicate compromise.
 */

/* ====== CYBERSECURITY TOOL REFERENCE (METASPLOIT) ======
 * METASPLOIT — Exploitation framework (msfconsole).
 * search <term>: find modules (exploits, aux, post)
 * use <module>: load exploit/auxiliary/post module
 * set RHOSTS <ip>: target host(s)
 * set PAYLOAD <payload>: e.g. windows/meterpreter/reverse_http
 * set LHOST <ip>: callback listener
 * exploit / run: execute module
 * Common flow: search -> use -> set options -> exploit.
 * Red team: document every module used and outcome for the report.
 * Blue team: monitor for msf payload signatures; EDR/IDS often flag meterpreter.
 */

/* ====== GLOBAL NAMESPACE ====== */
window.TS = window.TS || {};
var SETTINGS_KEY = 'ts_cookbook_settings';
var SNAPSHOT_CACHE_KEY = 'ts_cookbook_snapshot';

function getSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY))||{}}catch(e){return{}}}
function saveSettings(s){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}catch(e){}}
function getSetting(k,def){var s=getSettings();return s[k]!==undefined?s[k]:def}
function setSetting(k,v){var s=getSettings();s[k]=v;saveSettings(s)}

function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
// I fight for the users. — Tron
var reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ====== BOOT SEQUENCE ====== */
(async function(){
  var b=document.getElementById('bootScreen'),l=document.getElementById('bootLog');
  if(!b)return;
  if(sessionStorage.getItem('cb_boot')){b.remove();return}
  if(reducedMotion){sessionStorage.setItem('cb_boot','1');b.remove();return}
  sessionStorage.setItem('cb_boot','1');
  var lines=[
    {t:'[SYS] CODE COOKBOOK v3.0',c:null},
    {t:'[SYS] THUMPERSECURE SYSTEMS',c:null},
    {t:'─────────────────────────────',c:'#44475a'},
    {t:'[INIT] Loading kernel modules...',c:null},
    {t:'[OK]   Particle renderer',c:'#00ffcc'},
    {t:'[OK]   Code rain shader',c:'#00ffcc'},
    {t:'[OK]   Glitch engine',c:'#00ffcc'},
    {t:'[OK]   CRT overlay',c:'#00ffcc'},
    {t:'[OK]   Wireframe renderer (Gibson)',c:'#00ffcc'}, // Hack the planet.
    {t:'[OK]   Snapshot data layer',c:'#18dcff'},
    {t:'[OK]   Music controller',c:'#18dcff'},
    {t:'[OK]   Effects engine',c:'#18dcff'},
    {t:'[OK]   Puzzle system',c:'#18dcff'},
    {t:'[OK]   Grid: online',c:'#18dcff'},
    {t:'─────────────────────────────',c:'#44475a'},
    {t:'OSINT & SEO SPECIALIST',c:'#ff00aa'},
    {t:'',c:null},
    {t:'Ready.',c:'#00ffcc'}
  ];
  for(var i=0;i<lines.length;i++){
    var d=document.createElement('div');
    d.textContent=lines[i].t;
    if(lines[i].c)d.style.color=lines[i].c;
    if(lines[i].t==='OSINT & SEO SPECIALIST')d.style.fontWeight='700';
    l.appendChild(d);l.scrollTop=l.scrollHeight;
    await sleep(lines[i].t?55+Math.random()*35:120);
  }
  await sleep(400);
  b.style.opacity='0';b.style.transition='opacity 0.5s ease';
  await sleep(500);b.remove();
})();

/* ====== DATA LOADER (Phase 2) ====== */
var siteData=null;
var dataSource='loading';

async function loadSiteData(){
  var devMode=getSetting('dev_mode',false);
  var base=location.pathname.replace(/\/[^\/]*$/,'/');
  // Tier 1: Fetch live snapshot
  // Blue team: baseline normal before hunting anomalies — know what "good" looks like.
  if(!devMode){
    try{
      var ctrl=new AbortController();
      var tid=setTimeout(function(){ctrl.abort()},5000);
      var r=await fetch(base+'data/site_snapshot.json',{signal:ctrl.signal});
      clearTimeout(tid);
      if(r.ok){
        var d=await r.json();
        if(d&&d.repos&&d.repos.length>0){
          siteData=d;dataSource='live';
          try{localStorage.setItem(SNAPSHOT_CACHE_KEY,JSON.stringify({ts:Date.now(),data:d}))}catch(e){}
          return d;
        }
      }
    }catch(e){/* fetch failed, try cache */}
  }
  // Tier 2: localStorage cache
  try{
    var cached=JSON.parse(localStorage.getItem(SNAPSHOT_CACHE_KEY));
    if(cached&&cached.data&&cached.data.repos&&cached.data.repos.length>0){
      var age=Date.now()-cached.ts;
      if(age<7*24*60*60*1000){
        siteData=cached.data;dataSource='cached';return cached.data;
      }
    }
  }catch(e){}
  // Tier 3: Fetch static fallback
  try{
    var fb2=await fetch(base+'data/fallback-snapshot.json',{signal:(function(){var c=new AbortController();setTimeout(function(){c.abort()},3000);return c.signal})()});
    if(fb2.ok){var fd=await fb2.json();if(fd&&fd.repos&&fd.repos.length>0){siteData=fd;dataSource='fallback';return fd}}
  }catch(e){}
  // Tier 4: Embedded fallback (minimal inline)
  var fb=getEmbeddedFallback();
  if(fb&&fb.repos&&fb.repos.length>0){siteData=fb;dataSource='embedded';return fb}
  siteData={stats:{tools_count:13,stars_total:552,featured_count:4,followers:48},repos:[]};
  dataSource='error';
  return siteData;
}

function getEmbeddedFallback(){
  try{var el=document.getElementById('fallback-snapshot');if(el)return JSON.parse(el.textContent);return null}catch(e){return null}
}

function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function safeUrl(u){if(!u||/^(javascript|data):/i.test(String(u)))return'#';try{var h=new URL(u);return(h.protocol==='https:'||h.protocol==='http:')&&(h.hostname==='github.com'||h.hostname.endsWith('.github.com')||h.hostname.endsWith('.github.io'))?u:'#'}catch(e){return'#'}}
function relDate(iso){var d=Math.floor((Date.now()-new Date(iso).getTime())/864e5);if(d<1)return'today';if(d<30)return d+'d ago';if(d<365)return Math.floor(d/30)+'mo ago';return Math.floor(d/365)+'y ago'}

/* ====== RENDER FUNCTIONS ====== */
function animateCounter(el,target){
  var c=0,s=Math.max(1,Math.floor(target/50));
  var iv=setInterval(function(){c+=s;if(c>=target){c=target;clearInterval(iv)}el.textContent=c},30);
}

function renderStats(data){
  var st=data.stats||{};
  var pairs=[['statProjects',st.tools_count],['statStars',st.stars_total],['statFeatured',st.featured_count],['statFollowers',st.followers]];
  pairs.forEach(function(p){
    var el=document.getElementById(p[0]);
    if(el&&p[1]){animateCounter(el,p[1])}
  });
  // Update NFO block
  var nfoT=document.getElementById('nfoTools');if(nfoT)nfoT.textContent=st.tools_count||13;
  var nfoS=document.getElementById('nfoStars');if(nfoS)nfoS.textContent=(st.stars_total||541)+'+';
  // Data status
  var ds=document.getElementById('dataStatus');
  if(ds){
    if(dataSource==='live'){
      var dt=data.last_updated_utc?new Date(data.last_updated_utc).toISOString().replace('T',' ').slice(0,16)+' UTC':'';
      ds.textContent='Snapshot: '+dt;ds.classList.remove('fallback');
    }else if(dataSource==='cached'){
      ds.textContent='Cached snapshot in use';ds.classList.add('fallback');
    }else if(dataSource==='embedded'){
      ds.textContent='Offline snapshot in use';ds.classList.add('fallback');
    }else if(dataSource==='fallback'){
      ds.textContent='Static fallback in use';ds.classList.add('fallback');
    }else{
      ds.textContent='Fallback data';ds.classList.add('fallback');
    }
  }
}

function buildFeaturedCards(data){
  // Red team: document everything for the report — even small details matter.
  var grid=document.getElementById('featuredGrid');if(!grid)return;
  var featured=data.repos.filter(function(r){return r.featured});
  if(!featured.length){grid.innerHTML='<div class="loading-msg">No featured recipes.</div>';return}
  grid.innerHTML='';
  featured.forEach(function(r){
    var card=document.createElement('article');card.className='recipe-card reveal visible';
    card.setAttribute('itemscope','');card.setAttribute('itemtype','https://schema.org/SoftwareApplication');
    card.innerHTML='<div class="recipe-header"><div class="recipe-label">recipe</div><h3 class="recipe-name" itemprop="name"><a href="'+safeUrl(r.html_url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.name)+'</a></h3></div><div class="recipe-body"><div class="recipe-item"><div class="recipe-item-label">method</div><div class="recipe-item-value" itemprop="description">'+esc(r.description)+'</div></div></div><div class="recipe-meta">'+(r.stars>0?'<span class="pill pill-stars">&#9733; '+r.stars+'</span>':'')+(r.language?'<span class="pill pill-lang">'+esc(r.language)+'</span>':'')+'</div>';
    grid.appendChild(card);
  });
}

function buildProjectCard(repo,idx){
  var c=document.createElement('article');c.className='project-card';c.style.transitionDelay=(idx*0.04)+'s';
  c.setAttribute('data-name',(repo.name||'').toLowerCase());
  c.setAttribute('data-desc',(repo.description||'').toLowerCase());
  c.setAttribute('data-lang',(repo.language||'').toLowerCase());
  c.setAttribute('data-topics',(repo.topics||[]).join(' ').toLowerCase());
  var sN=esc(repo.name),sD=esc(repo.description||'OSINT & SEO tool by THUMPERSECURE'),sL=esc(repo.language),sU=safeUrl(repo.html_url);
  c.innerHTML='<a class="project-link" href="'+sU+'" target="_blank" rel="noopener noreferrer"><div class="card-bar"><span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span><span class="card-filename">'+sN+'.ts</span></div><div class="card-body"><h3 class="card-name">'+sN+'</h3><p class="card-desc">'+sD+'</p></div><div class="card-meta">'+(repo.stars>0?'<span class="pill pill-stars">&#9733; '+repo.stars+'</span>':'')+(sL?'<span class="pill pill-lang">'+sL+'</span>':'')+'<span class="pill pill-date">'+relDate(repo.last_updated)+'</span></div></a>';
  return c;
}

var allProjectCards=[];
function renderProjectGrid(data){
  var grid=document.getElementById('projectGrid');if(!grid)return;
  grid.innerHTML='';
  if(!data.repos||!data.repos.length){grid.innerHTML='<div class="loading-msg">No repositories found.</div>';return}
  var cO=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting){en.target.classList.add('visible');cO.unobserve(en.target)}})},{threshold:0.06});
  allProjectCards=[];
  data.repos.forEach(function(r,i){var c=buildProjectCard(r,i);allProjectCards.push(c);grid.appendChild(c);cO.observe(c)});
}

// Search/filter
var searchInput=document.getElementById('repoSearch');
if(searchInput){
  searchInput.addEventListener('input',function(){
    var q=this.value.trim().toLowerCase();
    allProjectCards.forEach(function(c){
      if(!q){c.style.display='';return}
      var match=c.getAttribute('data-name').indexOf(q)!==-1||c.getAttribute('data-desc').indexOf(q)!==-1||c.getAttribute('data-lang').indexOf(q)!==-1||c.getAttribute('data-topics').indexOf(q)!==-1;
      c.style.display=match?'':'none';
    });
  });
}

// Initialize data on load
(async function(){
  var data=await loadSiteData();
  renderStats(data);
  buildFeaturedCards(data);
  renderProjectGrid(data);
})();

/* ====== COLLAPSIBLE MODULES (Phase 4) ====== */
var modules=[].slice.call(document.querySelectorAll('.ts-module'));
modules.forEach(function(mod){
  var header=mod.querySelector('.ts-module-header');
  var body=mod.querySelector('.ts-module-body');
  if(!header||!body)return;
  header.addEventListener('click',function(){toggleModule(mod)});
  header.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleModule(mod)}
  });
});

function toggleModule(mod,forceOpen){
  var header=mod.querySelector('.ts-module-header');
  var body=mod.querySelector('.ts-module-body');
  if(!header||!body)return;
  var isOpen=header.getAttribute('aria-expanded')==='true';
  if(forceOpen!==undefined){if(forceOpen===isOpen)return;isOpen=!forceOpen}
  if(isOpen){
    body.style.maxHeight='0';body.classList.remove('open');
    header.setAttribute('aria-expanded','false');
  }else{
    body.style.maxHeight=body.scrollHeight+2000+'px';body.classList.add('open');
    header.setAttribute('aria-expanded','true');
  }
}

var expandAllBtn=document.getElementById('expandAllBtn');
var collapseAllBtn=document.getElementById('collapseAllBtn');
var moduleCtrlStatus=document.getElementById('moduleCtrlStatus');
function pulseModuleCtrl(btn){
  if(!btn||reducedMotion)return;
  btn.classList.remove('tron-pulse');
  requestAnimationFrame(function(){
    btn.classList.add('tron-pulse');
    setTimeout(function(){btn.classList.remove('tron-pulse')},460);
  });
}
function setModuleCtrlStatus(msg){
  if(moduleCtrlStatus)moduleCtrlStatus.textContent=msg;
}
function toggleAllModules(forceOpen){
  var step=reducedMotion?0:70;
  modules.forEach(function(m,i){
    if(step===0){toggleModule(m,forceOpen);return}
    setTimeout(function(){toggleModule(m,forceOpen)},i*step);
  });
}
if(expandAllBtn)expandAllBtn.addEventListener('click',function(){
  pulseModuleCtrl(expandAllBtn);
  toggleAllModules(true);
  setModuleCtrlStatus('All modules expanded');
});
if(collapseAllBtn)collapseAllBtn.addEventListener('click',function(){
  pulseModuleCtrl(collapseAllBtn);
  toggleAllModules(false);
  setModuleCtrlStatus('All modules collapsed');
});

/* ====== BACK TO TOP ====== */
var backToTopBtn=document.getElementById('backToTopBtn');
function toggleBackToTop(){
  if(!backToTopBtn)return;
  backToTopBtn.classList.toggle('show',window.scrollY>420);
}
if(backToTopBtn){
  window.addEventListener('scroll',toggleBackToTop,{passive:true});
  backToTopBtn.addEventListener('click',function(){
    window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'});
  });
  toggleBackToTop();
}

/* ====== MUSIC CONTROLLER (Phase 5) ====== */
var TRACK_CONFIG=[
  {local:'Tron-Website-Music-Spoken-Words.m4a',query:'TRON 1982 End Titles Wendy Carlos',label:'Tron — Spoken Words'},
  {local:'Swordfish_track2-website.m4a',query:'Swordfish soundtrack Paul Oakenfold',label:'Swordfish — Track 2'},
  {local:'Track3-Music-forwebsite.mp3',query:'Swordfish soundtrack Paul Oakenfold',label:'Track 3 — Music'} // The password is always swordfish.
];
var mPlayer=document.getElementById('musicPlayer');
var mBtns=[].slice.call(document.querySelectorAll('.music-btn'));
var mStatus=document.getElementById('musicStatus');
var mFallback=document.getElementById('musicFallback');
var mMuteBtn=document.getElementById('musicMute');
var mNextBtn=document.getElementById('musicNext');
var autoplayBanner=document.getElementById('autoplayBanner');
var mPanel=document.getElementById('musicPanel');
var mPanelToggle=document.getElementById('musicPanelToggle');
var mPanelMq=window.matchMedia?window.matchMedia('(max-width: 640px)'):null;
var mCurrentIndex=-1;
var mIsMuted=getSetting('music_muted',false);
var mCache={};
var mAutoplayPending=false;

function setMusicPanelExpanded(expanded){
  if(!mPanel||!mPanelToggle)return;
  mPanel.hidden=!expanded;
  mPanelToggle.classList.toggle('on',expanded);
  mPanelToggle.setAttribute('aria-expanded',expanded?'true':'false');
  mPanelToggle.setAttribute('aria-label',expanded?'Hide audio controls':'Show audio controls');
  mPanelToggle.textContent=expanded?'Hide audio controls':'Show audio controls';
}

function syncMusicPanelForViewport(){
  if(!mPanel||!mPanelToggle)return;
  var isMobile=!!(mPanelMq&&mPanelMq.matches);
  mPanelToggle.hidden=!isMobile;
  if(!isMobile){setMusicPanelExpanded(true);return}
  setMusicPanelExpanded(getSetting('music_panel_open',false));
}

function setMusicStatus(txt,state){
  if(!mStatus)return;
  mStatus.textContent=txt;
  mStatus.classList.remove('playing','error');
  if(state)mStatus.classList.add(state);
}

function setActiveBtn(idx){
  mBtns.forEach(function(b,i){var on=i===idx;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});
}

function updateMuteUI(){
  if(!mMuteBtn)return;
  mMuteBtn.textContent=mIsMuted?'\uD83D\uDD07':'\uD83D\uDD0A';
  mMuteBtn.classList.toggle('muted',mIsMuted);
  mMuteBtn.setAttribute('aria-label',mIsMuted?'Unmute audio':'Mute audio');
  if(mPlayer)mPlayer.volume=mIsMuted?0:1;
}

function hideFallback(){if(mFallback)mFallback.hidden=true}
function showFallback(query){
  if(!mFallback)return;
  mFallback.href='https://www.youtube.com/results?search_query='+encodeURIComponent(query);
  mFallback.hidden=false;
}

async function loadPreview(query){
  if(mCache[query]!==undefined)return mCache[query];
  try{
    var r=await fetch('https://itunes.apple.com/search?term='+encodeURIComponent(query)+'&entity=song&limit=8');
    if(!r.ok)throw new Error('itunes '+r.status);
    var data=await r.json();
    var hit=(data.results||[]).find(function(x){return !!x.previewUrl})||null;
    mCache[query]=hit;return hit;
  }catch(e){mCache[query]=null;return null}
}

async function resolveTrackUrl(idx){
  var cfg=TRACK_CONFIG[idx];
  // Try local file first
  if(cfg.local){
    try{
      var base=location.pathname.replace(/\/[^\/]*$/,'/');
      var r=await fetch(base+cfg.local,{method:'HEAD'});
      if(r.ok)return base+cfg.local;
    }catch(e){}
  }
  // Fall back to iTunes preview
  var hit=await loadPreview(cfg.query);
  if(hit&&hit.previewUrl)return hit.previewUrl;
  return null;
}

async function playTrack(idx){
  if(!mPlayer)return;
  var cfg=TRACK_CONFIG[idx];
  hideFallback();
  mCurrentIndex=idx;
  setSetting('music_track_index',idx);
  setActiveBtn(idx);
  setMusicStatus('loading: '+cfg.label.toLowerCase()+' ...', null);
  var url=await resolveTrackUrl(idx);
  if(!url){
    setMusicStatus('preview unavailable','error');
    showFallback(cfg.query);return;
  }
  if(mPlayer.src!==url){mPlayer.src=url;mPlayer.load()}
  mPlayer.volume=mIsMuted?0:1;
  try{
    await mPlayer.play();
    setMusicStatus('playing: '+cfg.label.toLowerCase(),'playing');
    hideAutoplayBanner();
  }catch(e){
    setMusicStatus('tap to play: '+cfg.label.toLowerCase(),null);
    showAutoplayBanner();
    mAutoplayPending=true;
  }
}

function showAutoplayBanner(){if(autoplayBanner)autoplayBanner.classList.add('show')}
function hideAutoplayBanner(){if(autoplayBanner)autoplayBanner.classList.remove('show')}

function nextTrack(){
  var next=(mCurrentIndex+1)%TRACK_CONFIG.length;
  playTrack(next);
}

if(mPanel&&mPanelToggle){
  mPanelToggle.addEventListener('click',function(){
    var nextOpen=mPanel.hidden;
    setMusicPanelExpanded(nextOpen);
    setSetting('music_panel_open',nextOpen);
  });
  if(mPanelMq&&typeof mPanelMq.addEventListener==='function'){
    mPanelMq.addEventListener('change',syncMusicPanelForViewport);
  }else if(mPanelMq&&typeof mPanelMq.addListener==='function'){
    mPanelMq.addListener(syncMusicPanelForViewport);
  }
  syncMusicPanelForViewport();
}

// Mute toggle
if(mMuteBtn){
  updateMuteUI();
  mMuteBtn.addEventListener('click',function(){
    mIsMuted=!mIsMuted;setSetting('music_muted',mIsMuted);updateMuteUI();
  });
}

// Track buttons
mBtns.forEach(function(btn,i){
  btn.addEventListener('click',function(){
    if(mCurrentIndex===i&&mPlayer&&!mPlayer.paused){
      mPlayer.pause();setMusicStatus('paused: '+TRACK_CONFIG[i].label.toLowerCase(),null);return;
    }
    if(mCurrentIndex===i&&mPlayer&&mPlayer.paused&&mPlayer.src){
      mPlayer.play().then(function(){setMusicStatus('playing: '+TRACK_CONFIG[i].label.toLowerCase(),'playing')}).catch(function(){});return;
    }
    playTrack(i);
  });
});

// Next button
if(mNextBtn)mNextBtn.addEventListener('click',nextTrack);

// Playlist auto-advance
if(mPlayer){
  mPlayer.addEventListener('ended',function(){nextTrack()});
  mPlayer.addEventListener('error',function(){setMusicStatus('audio source failed','error')});
}

// Autoplay banner click
if(autoplayBanner){
  autoplayBanner.addEventListener('click',function(){
    if(mPlayer&&mPlayer.src){
      mPlayer.play().then(function(){
        setMusicStatus('playing: '+TRACK_CONFIG[mCurrentIndex].label.toLowerCase(),'playing');
        hideAutoplayBanner();mAutoplayPending=false;
      }).catch(function(){});
    }
  });
  autoplayBanner.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      autoplayBanner.click();
    }
  });
}

// Resume from stored preferences + attempt autoplay
(function(){
  var storedIdx=getSetting('music_track_index',0);
  if(typeof storedIdx==='number'&&storedIdx>=0&&storedIdx<TRACK_CONFIG.length){
    playTrack(storedIdx);
  }else{
    playTrack(0);
  }
})();

// Global gesture handler for autoplay
document.addEventListener('click',function onFirstGesture(){
  if(mAutoplayPending&&mPlayer&&mPlayer.src){
    mPlayer.play().then(function(){
      setMusicStatus('playing: '+TRACK_CONFIG[mCurrentIndex].label.toLowerCase(),'playing');
      hideAutoplayBanner();mAutoplayPending=false;
    }).catch(function(){});
  }
  document.removeEventListener('click',onFirstGesture);
},{once:false});

/* ====== AI DEFENSE EFFECTS (Phase 6) ====== */
var FX_EVENTS=[
  {icon:'&#128302;',label:'SIMULATION',msg:'Bot-3 traced anomaly in sector 7\u2026 quarantined.'},
  {icon:'&#128274;',label:'DEMO',msg:'Firewall puzzle gate: passcode accepted.'},
  {icon:'&#127912;',label:'SIMULATION',msg:'Packet mirage deployed \u2014 3 decoys active.'},
  {icon:'&#128196;',label:'DEMO',msg:'Recipe index decrypted \u2014 13 entries verified.'},
  {icon:'&#128737;',label:'SIMULATION',msg:'Intrusion probe deflected by AI layer.'},
  {icon:'&#128225;',label:'DEMO',msg:'Telemetry pulse: all signals nominal.'},
  {icon:'&#128272;',label:'SIMULATION',msg:'Encrypted handshake completed \u2014 channel secure.'},
  {icon:'&#129302;',label:'DEMO',msg:'Bot swarm neutralized \u2014 0 breaches detected.'}
];
var FX_SCROLL_EVENTS=[
  {key:'cinema',selector:'#mod-cinema',icon:'&#127910;',label:'DEMO',msg:'Cinema grid entered \u2014 wireframe channels are live.'},
  {key:'archives',selector:'#mod-archives',icon:'&#128190;',label:'SIMULATION',msg:'Archive lane opened \u2014 BBS artifacts loaded.'},
  {key:'index',selector:'#recipe-index-section',icon:'&#128218;',label:'SIMULATION',msg:'Recipe index sweep complete \u2014 pattern map updated.'},
  {key:'ingredients',selector:'#mod-ingredients',icon:'&#128197;',label:'DEMO',msg:'Timeline grid synced \u2014 legacy-to-modern bridge stable.'},
  {key:'quotes',selector:'#mod-quotes',icon:'&#128172;',label:'SIMULATION',msg:'Legend quote wall energized \u2014 rotating hot feed active.'},
  {key:'glossary',selector:'#mod-glossary',icon:'&#128295;',label:'DEMO',msg:'Threat glossary parsed \u2014 defensive vocabulary armed.'},
  {key:'misc',selector:'#mod-misc',icon:'&#128240;',label:'SIMULATION',msg:'Misc resources loaded \u2014 newsletter relay active.'},
  {key:'fieldintel',selector:'#mod-fieldintel',icon:'&#128225;',label:'SIMULATION',msg:'Field intel pager online \u2014 29 signals decoded.'},
  {key:'darkweb',selector:'#mod-darkweb',icon:'&#128274;',label:'SIMULATION',msg:'Onion routing active \u2014 dark web module decrypted.'},
  {key:'investigators',selector:'#mod-investigators',icon:'&#128269;',label:'DEMO',msg:'Investigator timeline loaded \u2014 mail carriers to OSINT.'}
];
var fxContainer=document.getElementById('fxToastContainer');
var modeDark=getSetting('display_mode','dark')!=='reading';
var fxEnabled=modeDark&&!reducedMotion;
var fxTimer=null;
var fxVisibleCount=0;
var fxScrollObserver=null;
var fxScrollMap={};
var fxScrollSeen={};

function applyDisplayModeClass(){
  document.body.classList.toggle('reading-mode',!modeDark);
}

function applyCanvasVisibility(){
  var bgAnimEnabled=getSetting('bg_anim',true);
  var show=modeDark&&bgAnimEnabled;
  document.querySelectorAll('#particleCanvas,#rainCanvas,#tronGridCanvas').forEach(function(c){
    c.style.display=show?'':'none';
  });
}

function updateModeUI(){
  var btn=document.getElementById('toggleMode');
  if(btn){
    btn.textContent='Mode: '+(modeDark?'Dark':'Reading');
    btn.classList.toggle('on',modeDark);
    btn.setAttribute('aria-pressed',modeDark?'true':'false');
  }
  var stBtn=document.getElementById('settingMode');
  if(stBtn){
    var readingOn=!modeDark;
    stBtn.classList.toggle('on',readingOn);
    stBtn.setAttribute('aria-checked',readingOn?'true':'false');
  }
}

function fxShowToast(evt){
  if(!fxContainer||fxVisibleCount>=2)return;
  var toast=document.createElement('div');toast.className='fx-toast';
  toast.setAttribute('role','status');
  /* evt.icon: hardcoded HTML entities from FX_EVENTS/FX_SCROLL_EVENTS only — safe for innerHTML */
  toast.innerHTML='<span class="fx-toast-icon">'+evt.icon+'</span><div class="fx-toast-body"><div class="fx-toast-label">'+esc(evt.label)+'</div><div class="fx-toast-msg">'+esc(evt.msg)+'</div></div><button class="fx-toast-close" aria-label="Dismiss">&times;</button>';
  fxContainer.appendChild(toast);fxVisibleCount++;
  requestAnimationFrame(function(){toast.classList.add('show')});
  var closeBtn=toast.querySelector('.fx-toast-close');
  function remove(){
    toast.classList.remove('show');
    setTimeout(function(){if(toast.parentNode)toast.parentNode.removeChild(toast);fxVisibleCount=Math.max(0,fxVisibleCount-1)},350);
  }
  if(closeBtn)closeBtn.addEventListener('click',remove);
  setTimeout(remove,6000+Math.random()*2000);
}

function fxScheduleNext(){
  if(!fxEnabled)return;
  var delay=15000+Math.random()*30000;
  fxTimer=setTimeout(function(){
    var evt=FX_EVENTS[Math.floor(Math.random()*FX_EVENTS.length)];
    fxShowToast(evt);
    fxScheduleNext();
  },delay);
}

function fxStart(){
  if(fxEnabled)return;
  fxEnabled=true;
  fxScheduleNext();
}

function fxStop(){
  fxEnabled=false;
  if(fxTimer)clearTimeout(fxTimer);
  fxTimer=null;
}

function setDisplayMode(dark){
  modeDark=!!dark;
  setSetting('display_mode',modeDark?'dark':'reading');
  applyDisplayModeClass();
  if(modeDark&&!reducedMotion){fxStart()}else{fxStop()}
  applyCanvasVisibility();
  updateModeUI();
}

function fxShowScrollToast(key){
  var evt=fxScrollMap[key];
  if(!evt||!fxEnabled)return;
  fxShowToast(evt);
}

function fxInitScrollToasts(){
  if(!('IntersectionObserver' in window)||fxScrollObserver)return;
  fxScrollObserver=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting||!fxEnabled)return;
      var key=en.target.getAttribute('data-fx-scroll-key');
      if(!key||fxScrollSeen[key])return;
      fxScrollSeen[key]=true;
      fxShowScrollToast(key);
      fxScrollObserver.unobserve(en.target);
    });
  },{threshold:0.22,rootMargin:'0px 0px -20% 0px'});
  FX_SCROLL_EVENTS.forEach(function(evt){
    var el=document.querySelector(evt.selector);
    if(!el)return;
    fxScrollMap[evt.key]=evt;
    el.setAttribute('data-fx-scroll-key',evt.key);
    fxScrollObserver.observe(el);
  });
}

var toggleModeBtn=document.getElementById('toggleMode');
if(toggleModeBtn){
  toggleModeBtn.addEventListener('click',function(){setDisplayMode(!modeDark)});
}

applyDisplayModeClass();
applyCanvasVisibility();
if(fxEnabled)fxScheduleNext();
updateModeUI();
fxInitScrollToasts();

/* ====== PUZZLES (Phase 7) ====== */
function getPuzzleState(id){return getSetting('puzzle_'+id,false)}
// Blue team: treat puzzle state like access logs — verify integrity.
function setPuzzleState(id,solved){setSetting('puzzle_'+id,solved);updatePuzzleUI(id)}
function updatePuzzleUI(id){
  var area=document.querySelector('[data-puzzle="'+id+'"]');
  if(!area)return;
  if(getPuzzleState(id)){area.classList.add('solved')}else{area.classList.remove('solved')}
}

// Puzzle E: Word Unscramble Grid
(function(){
  var grid=document.getElementById('unscrambleGrid');
  var status=document.getElementById('unscrambleStatus');
  if(!grid)return;
  var alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var words=['NET','KEY','LOG','RAM','DNS'];
  var targetWord=words[Math.floor(Math.random()*words.length)];
  var selected=[];
  var positions=[];for(var p=0;p<16;p++)positions.push(p);
  for(var i=positions.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=positions[i];positions[i]=positions[j];positions[j]=t}
  var hintIndices=positions.slice(0,3);
  var letters=[];
  for(var c=0;c<16;c++)letters.push(alphabet[Math.floor(Math.random()*alphabet.length)]);
  hintIndices.forEach(function(idx,ord){letters[idx]=targetWord.charAt(ord)});
  for(var n=0;n<16;n++){
    var btn=document.createElement('button');
    var row=Math.floor(n/4)+1,col=(n%4)+1;
    var isHint=hintIndices.indexOf(n)!==-1;
    btn.type='button';
    btn.className='checksum-cell';
    btn.textContent=letters[n];
    btn.setAttribute('data-idx',String(n));
    btn.setAttribute('aria-label','Grid row '+row+' column '+col+' letter '+letters[n]+(isHint?', highlighted hint':''));
    if(isHint)btn.classList.add('hint');
    grid.appendChild(btn);
  }
  if(status)status.textContent='selected 0/3';
  grid.addEventListener('click',function(e){
    var btn=e.target.closest('.checksum-cell');if(!btn)return;
    if(getPuzzleState('unscramble'))return;
    var idx=parseInt(btn.getAttribute('data-idx'),10);
    if(btn.classList.contains('selected'))return;
    var expected=hintIndices[selected.length];
    if(idx===expected){
      btn.classList.add('selected');
      selected.push(idx);
      if(status)status.textContent='selected '+selected.length+'/3';
      if(selected.length===3){
        if(status)status.textContent='Welcome, codebreaker.';
        setPuzzleState('unscramble',true);
      }
    }else{
      btn.classList.add('wrong');
      if(status)status.textContent='sequence mismatch — follow the highlighted trail';
      setTimeout(function(){btn.classList.remove('wrong')},450);
    }
  });
  if(getPuzzleState('unscramble')&&status)status.textContent='Welcome, codebreaker.';
  updatePuzzleUI('unscramble');
})();

// Puzzle F: Simple Math Challenge
(function(){
  var container=document.getElementById('mathOptions');
  var status=document.getElementById('mathStatus');
  if(!container)return;
  var answers=[8,10,11,14];
  for(var i=answers.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=answers[i];answers[i]=answers[j];answers[j]=t}
  answers.forEach(function(val){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='pattern-opt math-opt';
    btn.textContent=String(val);
    btn.setAttribute('aria-label','Answer option '+String(val));
    btn.addEventListener('click',function(){
      if(getPuzzleState('math'))return;
      if(val===11){
        btn.classList.add('correct');
        if(status)status.textContent='Access verified. Continue exploring.';
        setPuzzleState('math',true);
      }else{
        btn.classList.add('wrong');
        if(status)status.textContent='incorrect answer — try again';
        setTimeout(function(){btn.classList.remove('wrong')},450);
      }
    });
    container.appendChild(btn);
  });
  if(getPuzzleState('math')&&status)status.textContent='Access verified. Continue exploring.';
  updatePuzzleUI('math');
})();

// Puzzle A: Terminal Checksum
(function(){
  var grid=document.getElementById('checksumGrid');
  var status=document.getElementById('checksumStatus');
  if(!grid)return;
  var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var cells=[];var hintIndices=[];var selected=[];var code='';
  // Generate grid
  for(var i=0;i<36;i++){
    var ch=chars[Math.floor(Math.random()*chars.length)];
    var btn=document.createElement('button');btn.type='button';btn.className='checksum-cell';
    btn.textContent=ch;btn.setAttribute('data-idx',i);btn.setAttribute('tabindex','0');
    btn.setAttribute('aria-label','Character '+ch);
    cells.push({el:btn,ch:ch});grid.appendChild(btn);
  }
  // Pick 3 hint cells
  var pool=[];for(var j=0;j<36;j++)pool.push(j);
  for(var k=0;k<3;k++){var ri=Math.floor(Math.random()*pool.length);hintIndices.push(pool[ri]);code+=cells[pool[ri]].ch;pool.splice(ri,1)}
  hintIndices.forEach(function(hi){
    cells[hi].el.classList.add('hint');
    cells[hi].el.setAttribute('aria-label','Character '+cells[hi].ch+', highlighted hint');
  });
  // Click handler
  grid.addEventListener('click',function(e){
    var btn=e.target.closest('.checksum-cell');if(!btn)return;
    var idx=parseInt(btn.getAttribute('data-idx'));
    if(btn.classList.contains('selected'))return;
    var expected=hintIndices[selected.length];
    if(idx===expected){
      btn.classList.add('selected');selected.push(idx);
      if(status)status.textContent='selected: '+selected.length+'/3';
      if(selected.length===3){
        if(status)status.textContent='checksum verified: '+code;
        setPuzzleState('checksum',true);
      }
    }else{
      btn.classList.add('wrong');
      if(status)status.textContent='wrong character — try the glowing ones';
      setTimeout(function(){btn.classList.remove('wrong')},600);
    }
  });
  updatePuzzleUI('checksum');
})();

// Puzzle B: Pattern Match
(function(){
  var container=document.getElementById('patternOptions');
  if(!container)return;
  var options=[
    {name:'palm-tree',correct:true},
    {name:'Telespot',correct:false},
    {name:'Spin',correct:false},
    {name:'TeleSTOP',correct:false}
  ];
  // Shuffle
  for(var i=options.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=options[i];options[i]=options[j];options[j]=t}
  options.forEach(function(opt){
    var btn=document.createElement('button');btn.type='button';btn.className='pattern-opt';
    btn.textContent=opt.name;btn.setAttribute('tabindex','0');
    btn.addEventListener('click',function(){
      if(opt.correct){
        btn.classList.add('correct');
        setPuzzleState('pattern',true);
      }else{
        btn.classList.add('wrong');
        setTimeout(function(){btn.classList.remove('wrong')},600);
      }
    });
    container.appendChild(btn);
  });
  updatePuzzleUI('pattern');
})();

// Puzzle: Phishing Detection
(function(){
  var container=document.getElementById('phishingOptions');
  var status=document.getElementById('phishingStatus');
  if(!container)return;
  var options=[
    {text:'Hi Sarah, Your March statement is ready. Sign in at yourbank.com to view. — Customer Service',correct:false},
    {text:'URGENT! Your account will be SUSPENDED in 24h! Click secure-paypal-verify.com to restore. Act now!',correct:true},
    {text:'Your package shipped. Track at ups.com. Order #88472. — UPS',correct:false},
    {text:'Meeting reminder: Tomorrow 2pm, Room B. — HR',correct:false}
  ];
  for(var i=options.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=options[i];options[i]=options[j];options[j]=t}
  options.forEach(function(opt){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='pattern-opt phishing-opt';
    btn.textContent=opt.text;
    btn.setAttribute('aria-label','Email option');
    btn.addEventListener('click',function(){
      if(getPuzzleState('phishing'))return;
      if(opt.correct){
        btn.classList.add('correct');
        if(status)status.textContent='Phishing detected. Access verified.';
        setPuzzleState('phishing',true);
      }else{
        btn.classList.add('wrong');
        if(status)status.textContent='Look for urgent language, mismatched domains, generic greetings.';
        setTimeout(function(){btn.classList.remove('wrong')},600);
      }
    });
    container.appendChild(btn);
  });
  if(getPuzzleState('phishing')&&status)status.textContent='Phishing detected. Access verified.';
  updatePuzzleUI('phishing');
})();

// Puzzle C: Decrypt Slider
(function(){
  var target=document.getElementById('dialTarget');
  var statusEl=document.getElementById('decryptStatus');
  if(!target)return;
  // Generate random target hex prefix
  var a=Math.floor(Math.random()*256),b=Math.floor(Math.random()*256),c=Math.floor(Math.random()*256);
  var hex=function(n){return n.toString(16).padStart(2,'0').toUpperCase()};
  var targetStr=hex(a)+hex(b)+hex(c);
  target.textContent='Target: '+targetStr;
  TS.decryptTarget={a:a,b:b,c:c,str:targetStr};
  updatePuzzleUI('decrypt');
})();

// Puzzle D: Port Scan
(function(){
  var container=document.getElementById('portScanRow');
  var targetEl=document.getElementById('portTarget');
  var statusEl=document.getElementById('portScanStatus');
  if(!container||!targetEl)return;
  var ports=[22,80,443,8080,3000];
  var shuffled=ports.slice();
  for(var i=shuffled.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var t=shuffled[i];shuffled[i]=shuffled[j];shuffled[j]=t;
  }
  var targetOpen=shuffled.slice(0,3).sort(function(a,b){return a-b});
  targetEl.textContent='Target: open '+targetOpen.join(', ');
  TS.portScanTarget=targetOpen.slice();
  ports.forEach(function(port){
    var btn=document.createElement('button');
    btn.type='button';btn.className='port-btn';
    btn.textContent=String(port);
    btn.setAttribute('data-port',String(port));
    btn.setAttribute('aria-label','Toggle port '+String(port));
    btn.addEventListener('click',function(){
      btn.classList.toggle('open');
      if(statusEl)statusEl.textContent='open ports selected: '+document.querySelectorAll('#portScanRow .port-btn.open').length;
    });
    container.appendChild(btn);
  });
  updatePuzzleUI('portscan');
})();

TS.checkDecrypt=function(){
  var dA=document.getElementById('dialA'),dB=document.getElementById('dialB'),dC=document.getElementById('dialC');
  var statusEl=document.getElementById('decryptStatus');
  if(!dA||!dB||!dC||!TS.decryptTarget)return;
  var va=parseInt(dA.value,16),vb=parseInt(dB.value,16),vc=parseInt(dC.value,16);
  if(isNaN(va)||isNaN(vb)||isNaN(vc)){if(statusEl)statusEl.textContent='enter valid hex values (00-FF)';return}
  if(va===TS.decryptTarget.a&&vb===TS.decryptTarget.b&&vc===TS.decryptTarget.c){
    if(statusEl)statusEl.textContent='decrypted! access granted.';
    setPuzzleState('decrypt',true);
  }else{
    if(statusEl)statusEl.textContent='mismatch — adjust dials and try again';
  }
};

TS.checkPortScan=function(){
  var statusEl=document.getElementById('portScanStatus');
  if(!TS.portScanTarget||!statusEl)return;
  var selected=[].slice.call(document.querySelectorAll('#portScanRow .port-btn.open')).map(function(btn){
    return parseInt(btn.getAttribute('data-port'),10);
  }).sort(function(a,b){return a-b});
  var ok=selected.length===TS.portScanTarget.length&&selected.every(function(v,i){return v===TS.portScanTarget[i]});
  if(ok){
    statusEl.textContent='port map verified. access granted.';
    setPuzzleState('portscan',true);
  }else{
    statusEl.textContent='mismatch — adjust port states and retry';
  }
};

TS.puzzleSkip=function(id){setPuzzleState(id,true)};
TS.resetAllPuzzles=function(){
  ['unscramble','math','checksum','pattern','phishing','decrypt','portscan','bottom'].forEach(function(id){
    setSetting('puzzle_'+id,false);updatePuzzleUI(id);
  });
  localStorage.removeItem('cb_puzzle_solved');
  localStorage.removeItem('cb_puzzle_dismissed');
  sessionStorage.removeItem('cb_rx_dismissed');
  window.location.reload();
};

/* ====== SETTINGS PANEL (Phase 9) ====== */
var settingsOverlay=document.getElementById('settingsOverlay');
var settingsCloseBtn=document.getElementById('settingsClose');
var toggleSettingsBtn=document.getElementById('toggleSettings');
var lastSettingsFocus=null;

function openSettings(){
  if(!settingsOverlay)return;
  lastSettingsFocus=document.activeElement;
  settingsOverlay.classList.add('open');
  setTimeout(function(){if(settingsCloseBtn)settingsCloseBtn.focus()},20);
}

function closeSettings(){
  if(!settingsOverlay)return;
  settingsOverlay.classList.remove('open');
  if(lastSettingsFocus&&typeof lastSettingsFocus.focus==='function')lastSettingsFocus.focus();
}

if(toggleSettingsBtn)toggleSettingsBtn.addEventListener('click',openSettings);
if(settingsCloseBtn)settingsCloseBtn.addEventListener('click',closeSettings);
if(settingsOverlay)settingsOverlay.addEventListener('click',function(e){if(e.target===settingsOverlay)closeSettings()});
document.addEventListener('keydown',function(e){
  if(!settingsOverlay||!settingsOverlay.classList.contains('open'))return;
  if(e.key==='Escape'){closeSettings();return}
  if(e.key!=='Tab')return;
  var focusables=[].slice.call(settingsOverlay.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(function(el){
    return !el.hasAttribute('disabled')&&el.offsetParent!==null;
  });
  if(!focusables.length)return;
  var first=focusables[0],last=focusables[focusables.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});

// Settings toggles
var settingModeBtn=document.getElementById('settingMode');
if(settingModeBtn){
  settingModeBtn.classList.toggle('on',!modeDark);
  settingModeBtn.setAttribute('aria-checked',(!modeDark)?'true':'false');
  settingModeBtn.addEventListener('click',function(){setDisplayMode(!modeDark)});
}

var settingBgAnimBtn=document.getElementById('settingBgAnim');
if(settingBgAnimBtn){
  var bgAnimOn=getSetting('bg_anim',true);
  settingBgAnimBtn.classList.toggle('on',bgAnimOn);
  settingBgAnimBtn.setAttribute('aria-checked',bgAnimOn?'true':'false');
  settingBgAnimBtn.addEventListener('click',function(){
    var on=this.classList.toggle('on');
    this.setAttribute('aria-checked',on?'true':'false');
    setSetting('bg_anim',on);
    applyCanvasVisibility();
  });
}

var settingDevModeBtn=document.getElementById('settingDevMode');
if(settingDevModeBtn){
  var dm=getSetting('dev_mode',false);
  settingDevModeBtn.classList.toggle('on',dm);settingDevModeBtn.setAttribute('aria-checked',dm?'true':'false');
  settingDevModeBtn.addEventListener('click',function(){
    var on=this.classList.toggle('on');
    this.setAttribute('aria-checked',on?'true':'false');
    setSetting('dev_mode',on);
  });
}

var settingResetPuzzlesBtn=document.getElementById('settingResetPuzzles');
if(settingResetPuzzlesBtn)settingResetPuzzlesBtn.addEventListener('click',function(){TS.resetAllPuzzles()});

/* ====== PARTICLE CANVAS ====== */
// There is no spoon. — The Matrix
var rPC=null,mkP=null,rRC=null,iR=null;
var pC=document.getElementById('particleCanvas');
if(pC){
  var pX=pC.getContext('2d'),pts=[],mouse={x:-9999,y:-9999};
  var COLS=['#00ffcc','#00ff41','#8b5cf6','#ff00aa','#18dcff'],LD=130,MR=110;
  function isMob(){return window.innerWidth<640}
  rPC=function(){pC.width=window.innerWidth;pC.height=window.innerHeight};
  mkP=function(){var n=isMob()?50:130;pts=[];for(var i=0;i<n;i++)pts.push({x:Math.random()*pC.width,y:Math.random()*pC.height,vx:(Math.random()-0.5)*0.35,vy:(Math.random()-0.5)*0.35,r:Math.random()*2+0.8,col:COLS[Math.floor(Math.random()*COLS.length)],a:Math.random()*0.4+0.2})};
  function dP(){
    if(pC.style.display==='none'){requestAnimationFrame(dP);return}
    pX.clearRect(0,0,pC.width,pC.height);var n=pts.length;
    for(var i=0;i<n;i++){var a=pts[i],dx=a.x-mouse.x,dy=a.y-mouse.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<MR&&d>0){var f=(MR-d)/MR*0.6;a.vx+=(dx/d)*f*0.25;a.vy+=(dy/d)*f*0.25}
      a.vx*=0.99;a.vy*=0.99;a.x+=a.vx;a.y+=a.vy;
      if(a.x<0)a.x=pC.width;if(a.x>pC.width)a.x=0;if(a.y<0)a.y=pC.height;if(a.y>pC.height)a.y=0;
      pX.beginPath();pX.arc(a.x,a.y,a.r,0,Math.PI*2);pX.fillStyle=a.col;pX.globalAlpha=a.a;pX.fill();
      for(var j=i+1;j<n;j++){var b=pts[j],lx=a.x-b.x,ly=a.y-b.y,ld=Math.sqrt(lx*lx+ly*ly);
        if(ld<LD){pX.beginPath();pX.moveTo(a.x,a.y);pX.lineTo(b.x,b.y);pX.strokeStyle=a.col;pX.globalAlpha=(1-ld/LD)*0.12;pX.lineWidth=0.5;pX.stroke()}}
    }pX.globalAlpha=1;requestAnimationFrame(dP);
  }
  rPC();mkP();dP();
  document.addEventListener('mousemove',function(e){mouse.x=e.clientX;mouse.y=e.clientY});
  document.addEventListener('mouseleave',function(){mouse.x=-9999;mouse.y=-9999});
}

/* ====== TRON GRID CANVAS (perspective grid + light trails) ====== */
var tGC=document.getElementById('tronGridCanvas');
if(tGC&&!reducedMotion){
  var tGX=tGC.getContext('2d'),tGT=0,tGTrails=[];
  function rTGC(){tGC.width=window.innerWidth;tGC.height=window.innerHeight}
  function dTGC(){
    if(tGC.style.display==='none'){requestAnimationFrame(dTGC);return}
    var w=tGC.width,h=tGC.height;
    var docSpan=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    var scrollProgress=Math.min(1,Math.max(0,window.scrollY/docSpan));
    document.documentElement.style.setProperty('--tron-scroll-progress',scrollProgress.toFixed(4));
    var scrollWave=0.5+0.5*Math.sin((scrollProgress*Math.PI*2)+(tGT*0.2));
    var musicPlaying=!!(mPlayer&&!mPlayer.paused&&mPlayer.src);
    var beatPulse=0.5+0.5*Math.sin(tGT*0.15);
    var gridOpacity=musicPlaying?0.12+beatPulse*0.06:0.12;
    gridOpacity+=scrollWave*0.03;
    var trailChance=musicPlaying?0.035+beatPulse*0.015:0.02;
    trailChance+=scrollProgress*0.01;
    var spacingMult=musicPlaying?0.9+beatPulse*0.03:0.9;
    tGX.fillStyle='rgba(6,6,14,0.08)';tGX.fillRect(0,0,w,h);
    var cols=24,rows=14,spacing=Math.min(w/cols,h/rows)*spacingMult;
    var cx=w/2,cy=h*(0.57+scrollProgress*0.1),perspective=0.34+scrollProgress*0.16;
    tGX.strokeStyle='rgba(24,220,255,'+gridOpacity+')';tGX.lineWidth=0.5;
    for(var r=0;r<=rows;r++){
      var py=cy+r*spacing*0.6;
      var scale=1+(py/h-0.5)*perspective;
      tGX.beginPath();
      for(var c=0;c<=cols;c++){
        var px=cx+(c-cols/2)*spacing*scale;
        if(c===0)tGX.moveTo(px,py);else tGX.lineTo(px,py);
      }
      tGX.stroke();
    }
    for(var c=0;c<=cols;c++){
      tGX.beginPath();
      for(var r=0;r<=rows;r++){
        var py=cy+r*spacing*0.6;
        var scale=1+(py/h-0.5)*perspective;
        var px=cx+(c-cols/2)*spacing*scale;
        if(r===0)tGX.moveTo(px,py);else tGX.lineTo(px,py);
      }
      tGX.stroke();
    }
    // Red team: document everything for the report — trail frequency = engagement log.
    if(Math.random()<trailChance)tGTrails.push({x:Math.random()*w,y:0,vx:(Math.random()-0.5)*2,vy:2+Math.random()*3,col:Math.random()>0.5?'#18dcff':'#00ffcc',life:1});
    tGTrails=tGTrails.filter(function(tr){
      tr.x+=tr.vx;tr.y+=tr.vy;tr.life-=0.015;
      if(tr.life<=0)return false;
      tGX.strokeStyle=tr.col;tGX.globalAlpha=tr.life;tGX.lineWidth=2;
      tGX.beginPath();tGX.moveTo(tr.x,tr.y);tGX.lineTo(tr.x-tr.vx*4,tr.y-tr.vy*4);tGX.stroke();
      tGX.globalAlpha=1;return true;
    });
    tGT+=0.02;requestAnimationFrame(dTGC);
  }
  rTGC();dTGC();window.addEventListener('resize',rTGC);
}

/* ====== CODE RAIN ====== */
var rCv=document.getElementById('rainCanvas');
if(rCv&&!reducedMotion){
  var rX=rCv.getContext('2d'),RC='01{}[];:<>?/\\|abcdef$#@!',FS=14,rCol,rDr;
  rRC=function(){rCv.width=window.innerWidth;rCv.height=window.innerHeight};
  iR=function(){rCol=Math.floor(rCv.width/FS);rDr=new Array(rCol).fill(1)};
  function dR(){
    if(rCv.style.display==='none'){requestAnimationFrame(dR);return}
    rX.fillStyle='rgba(6,6,14,0.12)';rX.fillRect(0,0,rCv.width,rCv.height);rX.fillStyle='#00ff41';rX.font=FS+'px monospace';
    for(var i=0;i<rCol;i++){rX.fillText(RC[Math.floor(Math.random()*RC.length)],i*FS,rDr[i]*FS);if(rDr[i]*FS>rCv.height&&Math.random()>0.975)rDr[i]=0;rDr[i]++}
    requestAnimationFrame(dR);
  }
  rRC();iR();dR();
}

/* ====== RESIZE HANDLER ====== */
var rt;
window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){
  if(pC){rPC();mkP()}
  if(tGC&&!reducedMotion){tGC.width=window.innerWidth;tGC.height=window.innerHeight}
  if(rCv&&!reducedMotion){rRC();iR()}
},250)});

/* ====== TYPEWRITER ====== */
var phrases=['$ recipe: osint reconnaissance','$ recipe: seo optimization','$ recipe: privacy toolkit','$ recipe: phone intelligence','$ recipe: data aggregation']; // Control is an illusion. — Mr Robot
var tyE=document.getElementById('typerText'),pI=0,cI=0,del=false;
function tL(){if(!tyE)return;var c=phrases[pI];if(!del){tyE.textContent=c.slice(0,cI+1);cI++;if(cI>=c.length){setTimeout(function(){del=true;tL()},2000);return}setTimeout(tL,50+Math.random()*30)}else{tyE.textContent=c.slice(0,cI);cI--;if(cI<0){del=false;cI=0;pI=(pI+1)%phrases.length;setTimeout(tL,300);return}setTimeout(tL,25)}}
if(reducedMotion){
  if(tyE)tyE.textContent=phrases[0];
}else{
  tL();
}

/* ====== INTERSECTION OBSERVER ====== */
var rO=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting){en.target.classList.add('visible');rO.unobserve(en.target)}})},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(function(el){rO.observe(el)});

/* ====== TERMINAL ====== */
var tLines=[
  {type:'cmd',text:'$ cat /etc/cookbook/manifesto'},
  {type:'out',text:'> information is leverage'},
  {type:'out',text:'> code is the skeleton key'},
  {type:'cmd',text:'$ ls -la /tools/thumpersecure/'},
  {type:'out',text:'drwxr-xr-x  palm-tree/    139\u2605  Python'},
  {type:'out',text:'drwxr-xr-x  Telespot/      99\u2605  JavaScript'},
  {type:'out',text:'drwxr-xr-x  Spin/          77\u2605  Rust'},
  {type:'cmd',text:'$ echo $MISSION'},
  {type:'out',text:'OSINT & SEO \u2014 the code cookbook'},
  {type:'cmd',text:'$ echo "I fight for the users."'},
  {type:'out',text:'\u2014 Tron'},
  {type:'cmd',text:'$ nmap -sV -O -Pn target.example.com'},
  {type:'out',text:'PORT     STATE SERVICE  VERSION'},
  {type:'out',text:'22/tcp   open  ssh       OpenSSH 8.2'},
  {type:'out',text:'443/tcp  open  ssl/http  nginx 1.18.0'},
  {type:'cmd',text:'$ whois example.com | grep -E "Registrar|Name Server"'},
  {type:'out',text:'Registrar: EXAMPLE-REG, Inc.'},
  {type:'out',text:'Name Server: ns1.example-dns.com'},
  {type:'cmd',text:'$ theHarvester -d target.com -b all'},
  {type:'out',text:'[*] Emails: 47 | Hosts: 12 | IPs: 8'},
  {type:'cmd',text:'$ curl -s "https://api.github.com/users/thumpersecure/repos" | jq ".[].name"'},
  {type:'out',text:'"palm-tree"'},
  {type:'out',text:'"Telespot"'},
  {type:'out',text:'"Spin"'},
  {type:'cmd',text:'$ hashcat -m 0 hashes.txt rockyou.txt'},
  {type:'out',text:'Session..........: hashcat'},
  {type:'out',text:'Status...........: Cracked'},
  {type:'cmd',text:'$ hydra -l admin -P wordlist.txt ssh://192.168.1.1'},
  {type:'out',text:'[22][ssh] host: 192.168.1.1   login: admin   password: swordfish'},
  {type:'cmd',text:'$ wireshark -r capture.pcap -Y "http.request"'},
  {type:'out',text:'Frame 42: 74 bytes on wire'},
  {type:'out',text:'GET /admin HTTP/1.1'},
  {type:'cmd',text:'$ sqlmap -u "https://target.com/page?id=1" --dbs'},
  {type:'out',text:'available databases [2]:'},
  {type:'out',text:'[*] information_schema'},
  {type:'out',text:'[*] production_db'},
  {type:'cmd',text:'$ john --wordlist=rockyou.txt shadow.txt'},
  {type:'out',text:'Loaded 1 password hash (crypt, generic crypt(3) [?/64])'},
  {type:'out',text:'root:password123 (root)'},
  {type:'cmd',text:'$ echo "Hack the planet!"'},
  {type:'out',text:'Hack the planet!'},
  {type:'cmd',text:'$ traceroute -n 8.8.8.8'},
  {type:'out',text:' 1  10.0.0.1  1.2ms'},
  {type:'out',text:' 2  172.16.0.1  5.1ms'},
  {type:'out',text:' 3  * * *'},
  {type:'cmd',text:'$ ./cook --recipe=all --serve'},
  {type:'out',text:'[+] Code Cookbook served. Bon app\u00e9tit.'},
  {type:'cmd',text:'$ cmatrix'},
  {type:'matrix',text:'0 1 0 1 1 0 0 1 1 0 1 0 0 1 1 0 0 1\n1 0 1 0 0 1 1 0 0 1 0 1 1 0 0 1 1 0\nA 0 K 3 7 2 0 1 9 8 4 5 6 0 1 2 3 4\n0 1 0 1 1 0 0 1 1 0 1 0 0 1 1 0 0 1\n9 8 7 6 5 4 3 2 1 0 9 8 7 6 5 4 3 2\n1 0 1 0 0 1 1 0 0 1 0 1 1 0 0 1 1 0\nZ Y X W V U T S R Q P O N M L K J I\n0 1 0 1 1 0 0 1 1 0 1 0 0 1 1 0 0 1\n# $ % @ ! ^ * ( ) _ + = [ ] { } : ;\n1 0 1 0 0 1 1 0 0 1 0 1 1 0 0 1 1 0'}
];
var tB=document.getElementById('termBody'),tS=false,tSec=document.querySelector('.terminal-section');
var tO=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting&&!tS){tS=true;rT();tO.unobserve(en.target)}})},{threshold:0.25});
if(tSec)tO.observe(tSec);

async function rT(){
  if(!tB)return;
  var tShell=tB.closest('.terminal');
  if(tShell)tShell.classList.add('is-live');
  for(var i=0;i<tLines.length;i++){var ln=tLines[i],el=document.createElement('div');el.className='term-line';tB.appendChild(el);
    if(ln.type==='cmd'){await tpL(el,ln.text,30)}
    else if(ln.type==='matrix'){el.innerHTML='<pre class="term-matrix output">'+ln.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';el.classList.add('typed')}
    else{el.innerHTML='<span class="output">'+ln.text+'</span>';el.classList.add('typed')}
    await sleep(250);
  }var cur=document.createElement('span');cur.className='term-cursor-end';cur.innerHTML='&nbsp;';tB.appendChild(cur);
}
function tpL(el,text,spd){return new Promise(function(res){el.classList.add('typed');var i=0,iv=setInterval(function(){el.textContent=text.slice(0,i+1);i++;if(i>=text.length){clearInterval(iv);res()}},spd)})}

/* ====== WIREFRAME CUBE ====== */
var wC=document.getElementById('wireframeCanvas');
if(wC){
  var wX=wC.getContext('2d'),wAng=0;
  function rWC(){var s=wC.parentElement;wC.width=s.clientWidth;wC.height=s.clientHeight}
  rWC();
  var cube=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  var edg=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  function pr(p,a){
    var ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(a*0.7),sb=Math.sin(a*0.7);
    var x1=p[0]*ca-p[2]*sa,z1=p[0]*sa+p[2]*ca;
    var y1=p[1]*cb-z1*sb,z2=p[1]*sb+z1*cb;
    var sc=wC.width*0.28,d=3+z2;
    return[x1/d*sc+wC.width/2,y1/d*sc+wC.height/2,z2];
  }
  function dW(){
    wX.clearRect(0,0,wC.width,wC.height);
    var p2=cube.map(function(p){return pr(p,wAng)});
    var tronPulse=0.5+0.5*Math.sin(wAng*2);
    var cubeColor=tronPulse>0.5?'#18dcff':'#00ffcc';
    wX.shadowColor=cubeColor;wX.shadowBlur=8+tronPulse*6;wX.lineWidth=1.5;
    edg.forEach(function(e){
      var a=p2[e[0]],b=p2[e[1]];
      wX.globalAlpha=0.25+Math.max(0,(a[2]+b[2])/4)*0.25;
      wX.strokeStyle=cubeColor;
      wX.beginPath();wX.moveTo(a[0],a[1]);wX.lineTo(b[0],b[1]);wX.stroke();
    });
    p2.forEach(function(p){
      wX.globalAlpha=0.4+Math.max(0,p[2]/2)*0.4;
      wX.fillStyle=cubeColor;wX.beginPath();wX.arc(p[0],p[1],2.5,0,Math.PI*2);wX.fill();
    });
    wX.globalAlpha=1;wX.shadowBlur=0;
    wAng+=0.008;requestAnimationFrame(dW);
  }
  dW();window.addEventListener('resize',rWC);
}

/* ====== MULTI-MONITOR ====== */
function fillMon(id,lines){var el=document.getElementById(id);if(!el)return;var txt=lines.join('\n');el.textContent=txt+'\n'+txt}
fillMon('mon1',['> hack the gibson','CONNECT 192.168.1.1','AUTH: root@gibson','GRANTED','ls /secret/','garbage.dat   2.1K','worm.dat      8.4K','da_vinci.exe  41K','> cat da_vinci.exe','4F 50 45 4E 20 48','TRACE DETECTED','> evade --stealth','Routing thru 7 proxies','Connection masked']);
fillMon('mon2',['TRACE: 10.0.0.1','  > 172.16.0.1','HOP 1: 52ms  NYC','HOP 2: 89ms  LON','HOP 3: 134ms TYO','HOP 4: 201ms SYD','PKT LOSS: 0.2%','TTL: 64','PROTO: TCP/443','CIPHER: AES-256-GCM','TLS 1.3 OK','CERT: *.gibson.corp','OSINT SCAN: ACTIVE','PORTS: 22,80,443']);
fillMon('mon3',['DECRYPTING...','KEY: 2048-bit RSA','BLOCK: 16 bytes','MODE: CBC','IV: a3f2c881...','ROUND  1/14: OK','ROUND  2/14: OK','ROUND  3/14: OK','SUBSTITUTION: DONE','PERMUTATION: DONE','XOR: COMPLETE','PLAINTEXT READY','PASSWORD: *********','PASSWORD: swordfish']); // Would you like to play a game? — WOPR
fillMon('mon4',['$ ./swordfish --crack','TARGET: DOD.GOV','TIME: 60s','Brute force: 2^28','Rainbow table: LOADED','Hash collision: FOUND','Firewall bypass: OK','IDS evasion: ACTIVE','Rootkit: DEPLOYED','ACCESS: GRANTED','Elapsed: 58.7s','> You got the job.']);

/* ====== INGREDIENTS TIMELINE ====== */
var iCv=document.getElementById('ingredientsCanvas');
if(iCv){
  var iX=iCv.getContext('2d'),iTick=0,iYears=[1986,1988,1996,2001,2007,2013,2019,2026];
  function rIC(){
    var dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
    var w=iCv.clientWidth,h=iCv.clientHeight;
    iCv.width=Math.floor(w*dpr);iCv.height=Math.floor(h*dpr);
    iX.setTransform(dpr,0,0,dpr,0,0);
  }
  function dIC(){
    var w=iCv.clientWidth,h=iCv.clientHeight;
    iX.clearRect(0,0,w,h);
    var l=24,r=w-24,y=Math.floor(h*0.48),span=r-l;
    iX.strokeStyle='rgba(24,220,255,0.22)';iX.lineWidth=1;
    iX.beginPath();iX.moveTo(l,y);iX.lineTo(r,y);iX.stroke();
    for(var i=0;i<iYears.length;i++){
      var x=l+span*(i/(iYears.length-1)),p=0.5+0.5*Math.sin(iTick*0.06+i*0.85),rad=3.8+p*1.6;
      iX.fillStyle='rgba(0,255,204,'+(0.35+p*0.45)+')';
      iX.beginPath();iX.arc(x,y,rad,0,Math.PI*2);iX.fill();
      iX.strokeStyle='rgba(0,255,204,0.22)';
      iX.beginPath();iX.arc(x,y,rad+5.5,0,Math.PI*2);iX.stroke();
      iX.fillStyle='#6272a4';iX.font='11px JetBrains Mono, monospace';iX.textAlign='center';
      iX.fillText(String(iYears[i]),x,y+24);
    }
    var t=(Math.sin(iTick*0.022)+1)/2,bx=l+span*t;
    var g=iX.createRadialGradient(bx,y,2,bx,y,35);
    g.addColorStop(0,'rgba(255,0,170,0.75)');g.addColorStop(1,'rgba(255,0,170,0)');
    iX.fillStyle=g;iX.beginPath();iX.arc(bx,y,35,0,Math.PI*2);iX.fill();
    iTick+=1;requestAnimationFrame(dIC);
  }
  rIC();dIC();window.addEventListener('resize',rIC);
}

/* ====== QUOTE SIGNAL CANVAS ====== */
var qCv=document.getElementById('quoteSignalCanvas');
if(qCv){
  var qX=qCv.getContext('2d'),qT=0;
  function rQC(){
    var dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
    var w=qCv.clientWidth,h=qCv.clientHeight;
    qCv.width=Math.floor(w*dpr);qCv.height=Math.floor(h*dpr);
    qX.setTransform(dpr,0,0,dpr,0,0);
  }
  function dQC(){
    var w=qCv.clientWidth,h=qCv.clientHeight;
    qX.clearRect(0,0,w,h);
    qX.fillStyle='rgba(6,8,14,0.26)';qX.fillRect(0,0,w,h);
    for(var i=0;i<3;i++){
      var amp=12+i*8,off=(i+1)*0.011,yy=h*(0.28+i*0.18);
      qX.strokeStyle=i===1?'rgba(24,220,255,0.45)':'rgba(0,255,204,0.22)';
      qX.lineWidth=i===1?1.4:1;
      qX.beginPath();
      for(var x=0;x<=w;x+=3){
        var y=yy+Math.sin((x*off)+qT*(0.03+i*0.01))*amp;
        if(x===0)qX.moveTo(x,y);else qX.lineTo(x,y);
      }
      qX.stroke();
    }
    var px=((Math.sin(qT*0.017)+1)/2)*(w-48)+24;
    var pg=qX.createRadialGradient(px,h*0.5,2,px,h*0.5,28);
    pg.addColorStop(0,'rgba(255,0,170,0.75)');pg.addColorStop(1,'rgba(255,0,170,0)');
    qX.fillStyle=pg;qX.beginPath();qX.arc(px,h*0.5,28,0,Math.PI*2);qX.fill();
    qT+=1;requestAnimationFrame(dQC);
  }
  rQC();dQC();window.addEventListener('resize',rQC);
}

/* ====== QUOTE CYCLER ====== */
var lQ=[].slice.call(document.querySelectorAll('.legend-quote-card')),lQi=0;
if(lQ.length&&!reducedMotion){setInterval(function(){lQ.forEach(function(c){c.classList.remove('hot')});lQ[lQi].classList.add('hot');lQi=(lQi+1)%lQ.length},2400)}

/* ====== BOTTOM PUZZLE (existing, migrated to localStorage) ====== */
var cbPuzzleSeen=false;
function cbRot13(s){return String(s||'').replace(/[a-zA-Z]/g,function(ch){var c=ch.charCodeAt(0);var a=c>=97?97:65;return String.fromCharCode(((c-a+13)%26)+a)})}
function cbTryAtob(b64){try{return atob(String(b64||'').replace(/\s+/g,''))}catch(e){return null}}
function cbBytes(s){return new TextEncoder().encode(String(s||''))}
async function cbSha256Hex(s){if(!window.crypto||!crypto.subtle)return null;var buf=await crypto.subtle.digest('SHA-256',cbBytes(s));return[].slice.call(new Uint8Array(buf)).map(function(x){return x.toString(16).padStart(2,'0')}).join('')}
function cbEl(tag,cls){var el=document.createElement(tag);if(cls)el.className=cls;return el}

function cbMountToast(openFn){
  var t=cbEl('div','cb-toast');t.setAttribute('role','status');t.setAttribute('aria-live','polite');
  var inner=cbEl('div','cb-toast-inner');
  var icon=cbEl('div','cb-toast-icon');icon.textContent='RX';
  var copy=cbEl('div');
  var title=cbEl('div','cb-toast-title');title.textContent='incoming transmission';
  var desc=cbEl('div','cb-toast-desc');desc.textContent='You hit the bottom of the grid. An encrypted packet is waiting \u2014 crack it to unlock a fingerprint.';
  var actions=cbEl('div','cb-toast-actions');
  var open=cbEl('button','cb-mini-btn');open.type='button';open.textContent='open puzzle';
  var dismiss=cbEl('button','cb-mini-btn secondary');dismiss.type='button';dismiss.textContent='dismiss';
  actions.appendChild(open);actions.appendChild(dismiss);
  copy.appendChild(title);copy.appendChild(desc);copy.appendChild(actions);
  inner.appendChild(icon);inner.appendChild(copy);t.appendChild(inner);document.body.appendChild(t);
  requestAnimationFrame(function(){t.classList.add('on')});
  function kill(){t.classList.remove('on');setTimeout(function(){t.remove()},240)}
  open.addEventListener('click',function(){kill();openFn()});
  dismiss.addEventListener('click',function(){sessionStorage.setItem('cb_rx_dismissed','1');kill()});
  return{remove:kill};
}

function cbBuildModal(){
  var payloadB64='UEhBU0VfMjogUk9UMTMKVE9LRU46IGZ2dGFueS1uZy1ndXItb2JnZ2J6Ck5FWFQ6IHNoYTI1NihwbGFpbnRleHQpIC0+IGZpcnN0IDYgaGV4Cg==';
  var expectedPlain='signal-at-the-bottom';
  var backdrop=cbEl('div','cb-backdrop');backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.setAttribute('aria-label','Cyber puzzle modal');
  var modal=cbEl('div','cb-modal');
  var head=cbEl('div','cb-head');var ht=cbEl('div','cb-head-title');
  var kick=cbEl('div','cb-kicker');kick.textContent='futuristic puzzle protocol';
  var h1=cbEl('div','cb-title');h1.textContent='TRANSMISSION INTERCEPTED \u2014 DECRYPT THE HANDSHAKE';
  ht.appendChild(kick);ht.appendChild(h1);
  var close=cbEl('button','cb-close');close.type='button';close.setAttribute('aria-label','Close');close.textContent='\u00d7';
  head.appendChild(ht);head.appendChild(close);
  var body=cbEl('div','cb-body');
  var left=cbEl('div','cb-panel');var lh=cbEl('div','cb-panel-h');
  var lhl=cbEl('div','l');lhl.textContent='packet capture';var lhr=cbEl('div','r');lhr.textContent='base64 payload';
  lh.appendChild(lhl);lh.appendChild(lhr);
  var code=cbEl('div','cb-code');code.textContent=payloadB64+'\n\n';
  var dim=cbEl('span','dim');dim.textContent='hint: decode base64, extract TOKEN, apply ROT13, then compute sha256 fingerprint.';
  code.appendChild(dim);left.appendChild(lh);left.appendChild(code);
  var right=cbEl('div','cb-panel');var rh=cbEl('div','cb-panel-h');
  var rhl=cbEl('div','l');rhl.textContent='challenge console';var rhr=cbEl('div','r');rhr.textContent='zero-trust gate';
  rh.appendChild(rhl);rh.appendChild(rhr);
  var con=cbEl('div','cb-console');
  function mkStep(n,t,p){var s=cbEl('div','cb-step');var num=cbEl('div','cb-step-num');num.textContent=n;var txt=cbEl('div','cb-step-text');var b=cbEl('b');b.textContent=t;var pp=cbEl('p');pp.textContent=p;txt.appendChild(b);txt.appendChild(pp);s.appendChild(num);s.appendChild(txt);return s}
  con.appendChild(mkStep('1','decode','Turn the packet from base64 into plain text.'));
  con.appendChild(mkStep('2','rot13','Transform the TOKEN line with ROT13.'));
  con.appendChild(mkStep('3','unlock','Enter the plaintext phrase to mint your fingerprint.'));
  con.appendChild(mkStep('4','contact handshake','Use your fingerprint key to unlock the secure contact channel.'));
  var field=cbEl('div','cb-field');var lab=document.createElement('label');lab.setAttribute('for','cbPuzzleInput');lab.textContent='plaintext phrase';
  var input=cbEl('input','cb-input');input.id='cbPuzzleInput';input.autocomplete='off';input.spellcheck=false;input.placeholder='type the decrypted plaintext here';
  field.appendChild(lab);field.appendChild(input);
  var tools=cbEl('div','cb-tools');
  var btnDecode=cbEl('button','cb-mini-btn');btnDecode.type='button';btnDecode.textContent='decode base64';
  var btnRot=cbEl('button','cb-mini-btn secondary');btnRot.type='button';btnRot.textContent='apply rot13';
  var btnUnlock=cbEl('button','cb-mini-btn');btnUnlock.type='button';btnUnlock.textContent='unlock';
  tools.appendChild(btnDecode);tools.appendChild(btnRot);tools.appendChild(btnUnlock);
  var out=cbEl('div','cb-out');out.innerHTML='<span class="warn">awaiting tools.</span> Click <span class="hl">decode base64</span> to begin.';
  var fp=cbEl('div','cb-fp');
  var contactWrap=cbEl('div','cb-contact');contactWrap.style.display='none';
  var contactLabel=document.createElement('label');contactLabel.setAttribute('for','cbContactInput');contactLabel.textContent='fingerprint key';
  var contactInput=cbEl('input','cb-input');contactInput.id='cbContactInput';contactInput.autocomplete='off';contactInput.spellcheck=false;contactInput.placeholder='enter 6-character key';
  var contactTools=cbEl('div','cb-tools');
  var contactBtn=cbEl('button','cb-mini-btn');contactBtn.type='button';contactBtn.textContent='reveal contact';
  contactTools.appendChild(contactBtn);
  var contactOut=cbEl('div','cb-out');contactOut.innerHTML='<span class="warn">awaiting unlock.</span> complete step 3 to arm this channel.';
  contactWrap.appendChild(contactLabel);contactWrap.appendChild(contactInput);contactWrap.appendChild(contactTools);contactWrap.appendChild(contactOut);
  con.appendChild(field);con.appendChild(tools);con.appendChild(out);con.appendChild(fp);con.appendChild(contactWrap);
  right.appendChild(rh);right.appendChild(con);
  body.appendChild(left);body.appendChild(right);modal.appendChild(head);modal.appendChild(body);
  backdrop.appendChild(modal);document.body.appendChild(backdrop);
  var decoded=null,token=null,rot=null,done=false,contactKey=null;
  var contactB64='dGh1bXBlcnNlY3VyZUBwbS5tZQ==';
  function setOut(html){out.innerHTML=html}
  function parseToken(txt){var m=String(txt||'').match(/^\s*TOKEN:\s*(.+?)\s*$/mi);return m?m[1].trim():null}
  btnDecode.addEventListener('click',function(){
    decoded=cbTryAtob(payloadB64);if(!decoded){setOut('<span class="bad">decode failed.</span>');return}
    token=parseToken(decoded);
    setOut('<span class="ok">decoded.</span><br><br><span class="hl">'+String(decoded).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</span>');
  });
  btnRot.addEventListener('click',function(){
    if(!decoded){setOut('<span class="warn">decode first.</span>');return}
    if(!token){setOut('<span class="bad">TOKEN not found.</span>');return}
    rot=cbRot13(token);
    setOut('<span class="ok">rot13 complete.</span> TOKEN \u2192 <span class="hl">'+token+'</span><br>PLAINTEXT \u2192 <span class="hl">'+rot+'</span>');
    input.value=rot;input.focus();
  });
  btnUnlock.addEventListener('click',async function(){
    var got=String(input.value||'').trim().toLowerCase();
    if(!got){setOut('<span class="warn">enter plaintext.</span>');return}
    if(got!==expectedPlain){setOut('<span class="bad">access denied.</span> plaintext mismatch.');return}
    var hx=await cbSha256Hex(got);
    if(hx){
      contactKey=hx.slice(0,6).toUpperCase();
      setOut('<span class="ok">access granted.</span> fingerprint key: <span class="hl">'+contactKey+'</span>');
      fp.textContent='sha256: '+hx;
    }else{
      contactKey=String(got).replace(/[^a-z0-9]/gi,'').slice(0,6).toUpperCase().padEnd(6,'X');
      setOut('<span class="ok">access granted.</span> fallback key: <span class="hl">'+contactKey+'</span>');
    }
    contactWrap.style.display='block';
    contactInput.value='';
    contactOut.innerHTML='<span class="warn">final handshake required.</span> enter the fingerprint key above to reveal contact.';
    contactInput.focus();
  });
  contactBtn.addEventListener('click',function(){
    var typed=String(contactInput.value||'').trim().toUpperCase();
    if(!typed){contactOut.innerHTML='<span class="warn">enter fingerprint key.</span>';return}
    if(!contactKey||typed!==contactKey){contactOut.innerHTML='<span class="bad">handshake failed.</span> key mismatch.';return}
    var email=cbTryAtob(contactB64)||'thumpersecure@pm.me';
    contactOut.innerHTML='<span class="ok">channel unlocked.</span> contact: <a class="hl" href="mailto:'+email+'">'+email+'</a>';
    setOut('<span class="ok">contact handshake complete.</span> secure channel delivered.');
    setSetting('puzzle_bottom',true);done=true;
    contactBtn.disabled=true;contactBtn.textContent='channel open';
  });
  contactInput.addEventListener('keydown',function(e){
    if(e.key==='Enter'){e.preventDefault();contactBtn.click()}
  });
  function openM(){backdrop.classList.add('on');document.body.style.overflow='hidden';setTimeout(function(){input.focus()},40)}
  function closeM(){backdrop.classList.remove('on');document.body.style.overflow='';if(!done)sessionStorage.setItem('cb_rx_dismissed','1');setTimeout(function(){backdrop.remove()},260)}
  close.addEventListener('click',closeM);
  backdrop.addEventListener('click',function(e){if(e.target===backdrop)closeM()});
  document.addEventListener('keydown',function kh(e){if(e.key==='Escape'&&backdrop.classList.contains('on')){e.preventDefault();closeM();document.removeEventListener('keydown',kh)}});
  return{open:openM,close:closeM};
}

function cbInitBottomPuzzle(){
  if(cbPuzzleSeen)return;cbPuzzleSeen=true;
  if(getPuzzleState('bottom'))return;
  if(sessionStorage.getItem('cb_rx_dismissed'))return;
  var modal=null;
  function openModal(){if(!modal)modal=cbBuildModal();modal.open()}
  cbMountToast(openModal);
}
(function(){
  var s=document.getElementById('cbBottomSentinel');
  if(!s||!('IntersectionObserver' in window))return;
  var ob=new IntersectionObserver(function(entries){entries.forEach(function(en){if(en.isIntersecting){ob.disconnect();setTimeout(cbInitBottomPuzzle,140)}})},{threshold:0.12});
  ob.observe(s);
})();

/* ====== CVE MODAL SYSTEM ====== */
(function(){
  var overlay=document.createElement('div');
  overlay.className='cve-modal-overlay';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','CVE detail modal');
  var modal=document.createElement('div');
  modal.className='cve-modal';
  var closeBtn=document.createElement('button');
  closeBtn.className='cve-modal-close';
  closeBtn.setAttribute('aria-label','Close');
  closeBtn.innerHTML='&times;';
  var title=document.createElement('div');
  title.className='cve-modal-title';
  var body=document.createElement('div');
  body.className='cve-modal-body';
  modal.appendChild(closeBtn);
  modal.appendChild(title);
  modal.appendChild(body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  var lastFocus=null;

  function openCveModal(cveId,detail){
    lastFocus=document.activeElement;
    title.textContent=cveId+' — Plain-Language Explanation';
    body.textContent=detail;
    overlay.classList.add('open');
    document.body.style.overflow='hidden';
    setTimeout(function(){closeBtn.focus()},30);
  }

  function closeCveModal(){
    overlay.classList.remove('open');
    document.body.style.overflow='';
    if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus();
  }

  closeBtn.addEventListener('click',closeCveModal);
  overlay.addEventListener('click',function(e){if(e.target===overlay)closeCveModal()});
  document.addEventListener('keydown',function(e){
    if(!overlay.classList.contains('open'))return;
    if(e.key==='Escape'){closeCveModal();return}
    if(e.key!=='Tab')return;
    var focusables=[].slice.call(modal.querySelectorAll('button,[href],input,[tabindex]:not([tabindex="-1"])')).filter(function(el){return el.offsetParent!==null});
    if(!focusables.length)return;
    var first=focusables[0],last=focusables[focusables.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });

  document.addEventListener('click',function(e){
    var btn=e.target.closest('.cve-more-btn');
    if(!btn)return;
    var card=btn.closest('.cve-card');
    var cveIdEl=card?card.querySelector('.cve-id'):null;
    var cveId=cveIdEl?cveIdEl.textContent:'CVE Details';
    var detail=btn.getAttribute('data-cve-detail')||'No additional information available.';
    btn.setAttribute('aria-expanded','true');
    openCveModal(cveId,detail);
  });
})();

/* ====== UPDATE FX SCROLL EVENTS FOR RENAMED MODULES ====== */
(function(){
  var newKeys=[
    {key:'recent_case_files',selector:'#mod-recent-case-files',icon:'&#128194;',label:'DEMO',msg:'Recent case files opened — milestone archive loaded.'},
    {key:'misc',selector:'#mod-misc',icon:'&#128240;',label:'SIMULATION',msg:'Misc resources loaded — newsletter relay active.'}
  ];
  if(typeof FX_SCROLL_EVENTS!=='undefined'){
    newKeys.forEach(function(evt){
      var el=document.querySelector(evt.selector);
      if(!el||!fxScrollObserver)return;
      fxScrollMap[evt.key]=evt;
      el.setAttribute('data-fx-scroll-key',evt.key);
      fxScrollObserver.observe(el);
    });
  }
})();

})();
