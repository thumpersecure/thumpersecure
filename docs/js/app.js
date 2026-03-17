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
TS.operatorDossier = null;
var modalOverflowCount=0;
function lockBodyScroll(){modalOverflowCount++;if(modalOverflowCount===1)document.body.style.overflow='hidden'}
function unlockBodyScroll(){modalOverflowCount=Math.max(0,modalOverflowCount-1);if(modalOverflowCount===0)document.body.style.overflow=''}

function getSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY))||{}}catch(e){return{}}}
function saveSettings(s){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}catch(e){}}
function getSetting(k,def){var s=getSettings();return s[k]!==undefined?s[k]:def}
function setSetting(k,v){var s=getSettings();s[k]=v;saveSettings(s)}

function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
// I fight for the users. — Tron
var reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ====== REQUEST ACCESS (Hollywood intro - always on refresh) ====== */
function waitForRequestAccess(){
  return new Promise(function(resolve){
    var ra=document.getElementById('requestAccessScreen');
    var btn=document.getElementById('requestAccessBtn');
    var analyze=document.getElementById('raAnalyze');
    var analyzeLines=document.getElementById('raAnalyzeLines');
    if(!ra||!btn){resolve();return}
    btn.addEventListener('click',function(){
      btn.disabled=true;
      btn.classList.add('hidden');
      if(analyze){
        analyze.classList.add('show');
        analyze.setAttribute('aria-hidden','false');
      }
      if(analyzeLines){
        [].slice.call(analyzeLines.children).forEach(function(line,idx){
          setTimeout(function(){line.classList.add('show')},160+(idx*220));
        });
      }
      setTimeout(function(){
        ra.classList.add('done');
        setTimeout(function(){if(ra.parentNode)ra.remove();resolve()},600);
      },reducedMotion?500:2200);
    });
  });
}

function fetchJsonWithTimeout(url,timeout){
  return new Promise(function(resolve,reject){
    var ctrl=new AbortController();
    var done=false;
    var timer=setTimeout(function(){
      if(done)return;
      done=true;
      ctrl.abort();
      reject(new Error('timeout'));
    },timeout||4000);
    fetch(url,{signal:ctrl.signal,cache:'no-store'}).then(function(r){
      if(done)return;
      if(!r.ok)throw new Error('http '+r.status);
      return r.json();
    }).then(function(data){
      if(done)return;
      done=true;
      clearTimeout(timer);
      resolve(data);
    }).catch(function(err){
      if(done)return;
      done=true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

function formatWallclock(ts){
  return new Date(ts).toLocaleString('en-US',{
    weekday:'short',year:'numeric',month:'short',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false
  });
}

function renderBootList(container,items){
  if(!container)return;
  container.innerHTML='';
  items.forEach(function(item){
    var row=document.createElement('div');
    row.className='boot-kv-row';
    var key=document.createElement('span');
    key.className='boot-k';
    key.textContent=item.k;
    var value=document.createElement('span');
    value.className='boot-v';
    value.textContent=item.v;
    row.appendChild(key);
    row.appendChild(value);
    container.appendChild(row);
  });
}

function getRdapVcardField(entity,name){
  try{
    var arr=entity&&entity.vcardArray&&entity.vcardArray[1];
    if(!arr)return null;
    for(var i=0;i<arr.length;i++){
      if(arr[i][0]===name)return arr[i][3];
    }
  }catch(e){}
  return null;
}

function deriveFingerprintCode(seed){
  var hash=0;
  var src=String(seed||'THUMPERSECURE');
  for(var i=0;i<src.length;i++)hash=((hash<<5)-hash)+src.charCodeAt(i);
  hash=Math.abs(hash);
  var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var out='';
  for(var j=0;j<6;j++){
    out+=chars.charAt(hash%chars.length);
    hash=Math.floor(hash/chars.length)||Math.abs(hash*33+17);
  }
  return out;
}

function getLocalLanIp(){
  return new Promise(function(resolve){
    if(!window.RTCPeerConnection){resolve('Local IP address is not supported in this browser');return}
    var pc;
    var settled=false;
    function finish(val){
      if(settled)return;
      settled=true;
      try{if(pc)pc.close()}catch(e){}
      resolve(val||'Local IP address is not supported in this browser');
    }
    try{
      pc=new RTCPeerConnection({iceServers:[]});
      pc.createDataChannel('probe');
      pc.onicecandidate=function(ev){
        if(!ev||!ev.candidate||!ev.candidate.candidate)return;
        var m=ev.candidate.candidate.match(/([0-9]{1,3}(?:\.[0-9]{1,3}){3})/);
        if(m&&m[1]&&!/^0\.0\.0\.0$/.test(m[1]))finish(m[1]);
      };
      pc.createOffer().then(function(of){return pc.setLocalDescription(of)}).catch(function(){finish()});
      setTimeout(function(){finish()},1500);
    }catch(e){finish()}
  });
}

function buildCookieSummary(){
  if(!navigator.cookieEnabled)return 'Disabled';
  if(!document.cookie)return 'Enabled (no cookies visible to this origin)';
  return 'Enabled ('+document.cookie.split(/;\s*/).length+' visible)';
}

function buildPluginSummary(){
  if(!navigator.plugins||!navigator.plugins.length)return 'No plugin enumeration available';
  return [].slice.call(navigator.plugins,0,5).map(function(p){return p.name}).join(' | ');
}

async function collectOperatorDossier(){
  var query=location.search?location.search.slice(1):'(none)';
  var now=Date.now();
  var ipPromise=fetchJsonWithTimeout('https://api64.ipify.org?format=json',3500).catch(function(){return null});
  var ipInfoPromise=fetchJsonWithTimeout('https://ipwho.is/',3500).catch(function(){return null});
  var echoPromise=fetchJsonWithTimeout('https://httpbin.org/anything?ts='+now,3500).catch(function(){return null});
  var lanPromise=getLocalLanIp();
  var ipData=await ipPromise;
  var publicIp=ipData&&ipData.ip?ipData.ip:'Unavailable';
  var rdapPromise=publicIp!=='Unavailable'
    ?fetchJsonWithTimeout('https://rdap.arin.net/registry/ip/'+encodeURIComponent(publicIp),4500).catch(function(){return null})
    :Promise.resolve(null);
  var ipInfo=await ipInfoPromise;
  var echo=await echoPromise;
  var lanIp=await lanPromise;
  var rdap=await rdapPromise;
  var headers=echo&&echo.headers?echo.headers:{};
  var proxyHints=[echo&&echo.origin&&String(echo.origin).indexOf(',')!==-1?echo.origin:null,headers['Via'],headers['X-Forwarded-For'],headers['Forwarded']].filter(Boolean);
  var proxyLabel=proxyHints.length?'Possible intermediary observed: '+proxyHints.join(' | '):'No visible proxy or relay markers detected';
  var requestTimeFloat=(now/1000).toFixed(3);
  var requestTime=requestTimeFloat+' ('+formatWallclock(now)+')';
  var cidr=(rdap&&rdap.cidr0_cidrs&&rdap.cidr0_cidrs.length)
    ?rdap.cidr0_cidrs.map(function(entry){return entry.v4prefix+'/'+entry.length}).join(', ')
    :(ipInfo&&ipInfo.connection&&ipInfo.connection.asn?('ASN '+ipInfo.connection.asn):'Unavailable');
  var registrant=(rdap&&rdap.entities||[]).filter(function(entity){
    return entity.roles&&entity.roles.indexOf('registrant')!==-1;
  })[0];
  var registrantName=getRdapVcardField(registrant,'fn')||'Unavailable';
  var networkItems=[
    {k:'Hostname',v:publicIp},
    {k:'Proxy',v:proxyLabel},
    {k:'Internal LAN IP',v:lanIp},
    {k:'SCRIPT_URL',v:location.pathname},
    {k:'SCRIPT_URI',v:location.href},
    {k:'HTTPS',v:location.protocol==='https:'?'on':'off'},
    {k:'SSL_TLS_SNI',v:location.hostname||'Unavailable'},
    {k:'HTTP_HOST',v:location.host||'Unavailable'},
    {k:'HTTP_SEC_FETCH_DEST',v:headers['Sec-Fetch-Dest']||'not exposed on navigation request'},
    {k:'HTTP_USER_AGENT',v:navigator.userAgent||'Unavailable'},
    {k:'HTTP_ACCEPT',v:headers['Accept']||'not exposed on navigation request'},
    {k:'HTTP_REFERER',v:document.referrer||'(none)'},
    {k:'HTTP_SEC_FETCH_SITE',v:headers['Sec-Fetch-Site']||'not exposed on navigation request'},
    {k:'HTTP_SEC_FETCH_MODE',v:headers['Sec-Fetch-Mode']||'not exposed on navigation request'},
    {k:'HTTP_ACCEPT_LANGUAGE',v:navigator.languages&&navigator.languages.length?navigator.languages.join(', '):(navigator.language||'Unavailable')},
    {k:'HTTP_PRIORITY',v:headers['Priority']||'not exposed by browser runtime'},
    {k:'HTTP_ACCEPT_ENCODING',v:headers['Accept-Encoding']||'browser-managed'},
    {k:'HTTP_COOKIE',v:document.cookie||'No cookies visible to this origin'},
    {k:'HTTP_CONNECTION',v:headers['Connection']||'not exposed by browser runtime'},
    {k:'SERVER_SIGNATURE',v:'not exposed by browser runtime'},
    {k:'SERVER_SOFTWARE',v:'telemetry relay only (static client page)'},
    {k:'SERVER_NAME',v:location.hostname||'Unavailable'},
    {k:'SERVER_ADDR',v:'not exposed by browser runtime'},
    {k:'SERVER_PORT',v:location.port||(location.protocol==='https:'?'443':'80')},
    {k:'REQUEST_SCHEME',v:location.protocol.replace(':','')},
    {k:'CONTEXT_PREFIX',v:'(none)'},
    {k:'REMOTE_PORT',v:'not exposed by browser runtime'},
    {k:'GATEWAY_INTERFACE',v:'not exposed by browser runtime'},
    {k:'SERVER_PROTOCOL',v:'not exposed by browser runtime'},
    {k:'REQUEST_METHOD',v:'GET'},
    {k:'QUERY_STRING',v:query},
    {k:'REQUEST_URI',v:location.pathname+location.search},
    {k:'SCRIPT_NAME',v:location.pathname},
    {k:'REQUEST_TIME_FLOAT',v:requestTimeFloat},
    {k:'REQUEST_TIME',v:requestTime}
  ];
  var browserItems=[
    {k:'Refered From',v:document.referrer||'(none)'},
    {k:'User Agent',v:navigator.userAgent||'Unavailable'},
    {k:'Screen Resolution',v:(window.screen&&screen.width?screen.width+' x '+screen.height+' (pixels)':'Unavailable')},
    {k:'Browser Dimensions',v:window.innerWidth+' x '+window.innerHeight+' (pixels)'},
    {k:'Cookie Status',v:buildCookieSummary()},
    {k:'Cookies (Visible to this origin)',v:document.cookie||'(none)'},
    {k:'Browser Plugins',v:buildPluginSummary()}
  ];
  var whoisItems=[
    {k:'NetRange',v:rdap&&rdap.startAddress&&rdap.endAddress?(rdap.startAddress+' - '+rdap.endAddress):'Unavailable'},
    {k:'CIDR',v:cidr},
    {k:'NetName',v:rdap&&rdap.name?rdap.name:'Unavailable'},
    {k:'NetHandle',v:rdap&&rdap.handle?rdap.handle:'Unavailable'},
    {k:'Parent',v:rdap&&rdap.parentHandle?rdap.parentHandle:'Unavailable'},
    {k:'NetType',v:rdap&&rdap.type?rdap.type:'Unavailable'},
    {k:'Organization',v:registrantName!=='Unavailable'?registrantName:(ipInfo&&ipInfo.connection&&ipInfo.connection.org?ipInfo.connection.org:'Unavailable')},
    {k:'OriginAS',v:ipInfo&&ipInfo.connection&&ipInfo.connection.asn?String(ipInfo.connection.asn):'Unavailable'},
    {k:'Country',v:ipInfo&&ipInfo.country?(ipInfo.country+' ('+ipInfo.country_code+')'):'Unavailable'},
    {k:'Reference',v:publicIp!=='Unavailable'?'https://rdap.arin.net/registry/ip/'+publicIp:'Unavailable'}
  ];
  var fingerprintCode=deriveFingerprintCode([
    publicIp,
    navigator.userAgent,
    navigator.language,
    window.screen&&screen.width,
    window.screen&&screen.height,
    ipInfo&&ipInfo.connection&&ipInfo.connection.asn
  ].join('|'));
  return{
    collectedAt:now,
    timestampLabel:formatWallclock(now),
    fingerprintCode:fingerprintCode,
    publicIp:publicIp,
    networkItems:networkItems,
    browserItems:browserItems,
    whoisItems:whoisItems
  };
}

function armFingerprintGate(dossier){
  return new Promise(function(resolve){
    var gate=document.getElementById('fingerprintGate');
    var scanner=document.getElementById('fingerprintScanner');
    var canvas=document.getElementById('fingerprintCanvas');
    var fill=document.getElementById('fingerprintProgressFill');
    var status=document.getElementById('fingerprintStatus');
    if(!gate||!scanner||!canvas||!fill||!status){resolve();return}
    gate.hidden=false;
    var ctx=canvas.getContext('2d');
    var holdStart=0;
    var holdActive=false;
    var holdProgress=0;
    var solved=false;
    var tick=0;
    function draw(){
      if(!ctx)return;
      var w=canvas.width,h=canvas.height,cx=w/2,cy=h/2;
      ctx.clearRect(0,0,w,h);
      var bg=ctx.createRadialGradient(cx,cy,10,cx,cy,w*0.45);
      bg.addColorStop(0,'rgba(10,25,40,0.92)');
      bg.addColorStop(1,'rgba(2,4,10,0.12)');
      ctx.fillStyle=bg;
      ctx.fillRect(0,0,w,h);
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(Math.sin(tick*0.01)*0.06);
      for(var ring=0;ring<10;ring++){
        var rad=42+ring*16;
        ctx.strokeStyle=ring%2===0?'rgba(24,220,255,0.28)':'rgba(255,0,170,0.18)';
        ctx.lineWidth=1.2;
        ctx.beginPath();
        for(var a=0;a<Math.PI*2;a+=0.04){
          var wobble=Math.sin(a*3+(tick*0.015)+(ring*0.8))*6;
          var ovalX=(rad+wobble)*(1.06+Math.sin(ring*0.4)*0.06);
          var ovalY=(rad*0.82)+Math.cos(a*2+(ring*0.6))*5;
          var px=Math.cos(a)*ovalX;
          var py=Math.sin(a)*ovalY;
          if(a===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }
      for(var i=0;i<48;i++){
        var ang=(i/48)*Math.PI*2+(tick*0.004);
        var dist=140+Math.sin(tick*0.02+i)*10;
        ctx.fillStyle=i%3===0?'rgba(0,255,204,0.35)':'rgba(24,220,255,0.22)';
        ctx.beginPath();
        ctx.arc(Math.cos(ang)*dist,Math.sin(ang)*dist,1.7,0,Math.PI*2);
        ctx.fill();
      }
      var sweepY=-150+((tick*2)%300);
      var sweep=ctx.createLinearGradient(0,sweepY-24,0,sweepY+24);
      sweep.addColorStop(0,'rgba(24,220,255,0)');
      sweep.addColorStop(0.5,holdActive?'rgba(0,255,204,0.55)':'rgba(24,220,255,0.45)');
      sweep.addColorStop(1,'rgba(24,220,255,0)');
      ctx.fillStyle=sweep;
      ctx.fillRect(-170,sweepY-24,340,48);
      ctx.restore();
      ctx.strokeStyle=holdActive?'rgba(0,255,204,0.9)':'rgba(24,220,255,0.35)';
      ctx.lineWidth=8;
      ctx.beginPath();
      ctx.arc(cx,cy,188,-Math.PI/2,(-Math.PI/2)+(Math.PI*2*holdProgress));
      ctx.stroke();
      tick++;
      if(!solved)requestAnimationFrame(draw);
    }
    function updateProgress(ts){
      if(!holdActive||solved)return;
      holdProgress=Math.min(1,(ts-holdStart)/2000);
      fill.style.width=(holdProgress*100)+'%';
      status.textContent=holdProgress>=1
        ?'Biometric pressure lock matched. Opening main grid...'
        :'Hold steady... '+Math.ceil((1-holdProgress)*2*10)/10+'s remaining';
      if(holdProgress>=1){
        solved=true;
        scanner.classList.add('armed');
        fill.style.width='100%';
        setTimeout(resolve,350);
        return;
      }
      requestAnimationFrame(updateProgress);
    }
    function beginHold(){
      if(solved||holdActive)return;
      holdActive=true;
      holdStart=performance.now();
      scanner.classList.add('holding');
      requestAnimationFrame(updateProgress);
    }
    function cancelHold(){
      if(solved)return;
      holdActive=false;
      holdProgress=0;
      fill.style.width='0%';
      scanner.classList.remove('holding');
      status.textContent='Press and hold on the scanner for 2 seconds. Fingerprint: '+dossier.fingerprintCode;
    }
    function startHoldEvent(e){if(e)e.preventDefault();beginHold()}
    function cancelHoldEvent(e){if(e)e.preventDefault();cancelHold()}
    scanner.addEventListener('pointerdown',startHoldEvent);
    scanner.addEventListener('mousedown',startHoldEvent);
    scanner.addEventListener('touchstart',startHoldEvent,{passive:false});
    ['pointerup','pointerleave','pointercancel','mouseup','mouseleave','touchend','touchcancel'].forEach(function(type){scanner.addEventListener(type,cancelHoldEvent,{passive:false})});
    scanner.addEventListener('keydown',function(e){
      if(e.key===' '||e.key==='Enter'){e.preventDefault();beginHold()}
    });
    scanner.addEventListener('keyup',function(e){
      if(e.key===' '||e.key==='Enter'){e.preventDefault();cancelHold()}
    });
    scanner.addEventListener('contextmenu',function(e){e.preventDefault()});
    status.textContent='Press and hold on the scanner for 2 seconds. Fingerprint: '+dossier.fingerprintCode;
    draw();
  });
}

/* ====== BOOT SEQUENCE ====== */
(async function(){
  await waitForRequestAccess();
  var b=document.getElementById('bootScreen'),l=document.getElementById('bootLog');
  var networkInfo=document.getElementById('bootNetworkInfo');
  var browserInfo=document.getElementById('bootBrowserInfo');
  var whoisInfo=document.getElementById('bootWhoisInfo');
  var intelStatus=document.getElementById('bootIntelStatus');
  var intelTimestamp=document.getElementById('bootIntelTimestamp');
  if(!b||!l)return;
  if(reducedMotion)b.classList.add('reduced-motion');
  if(intelStatus)intelStatus.textContent='requesting live telemetry';
  var dossierPromise=collectOperatorDossier().catch(function(){
    return{
      collectedAt:Date.now(),
      timestampLabel:'telemetry unavailable',
      fingerprintCode:'UNKWN0',
      publicIp:'Unavailable',
      networkItems:[{k:'Telemetry',v:'Unable to collect remote dossier at this time'}],
      browserItems:[{k:'Browser',v:navigator.userAgent||'Unavailable'}],
      whoisItems:[{k:'WHOIS',v:'Unavailable'}]
    };
  });
  var lines=[
    {t:'[SYS] THUMPERSECURE FORENSIC CONSOLE',c:null},
    {t:'[SYS] REQUEST ACCESS ACKNOWLEDGED',c:null},
    {t:'─────────────────────────────',c:'#44475a'},
    {t:'[INIT] Spooling handshake transcript...',c:null},
    {t:'[OK]   TLS client hints parsed',c:'#00ffcc'},
    {t:'[OK]   Header echo relay contacted',c:'#00ffcc'},
    {t:'[OK]   RDAP ownership lookup queued',c:'#18dcff'},
    {t:'[OK]   Screen and plugin telemetry acquired',c:'#18dcff'},
    {t:'[OK]   Wireless / wire correlation model online',c:'#18dcff'},
    {t:'[WARN] Browser runtime limits some server-side fields',c:'#ffb86c'},
    {t:'[WAIT] Rendering operator dossier and thumbprint gate...',c:'#ff79c6'},
    {t:'─────────────────────────────',c:'#44475a'},
    {t:'FORENSIC REVIEW READY',c:'#00ffcc'}
  ];
  function appendBootLine(line){
    var d=document.createElement('div');
    d.textContent=line.t;
    if(line.c)d.style.color=line.c;
    if(line.t==='FORENSIC REVIEW READY')d.style.fontWeight='700';
    l.appendChild(d);
    l.scrollTop=l.scrollHeight;
  }
  for(var i=0;i<lines.length;i++){
    appendBootLine(lines[i]);
    if(!reducedMotion)await sleep(lines[i].t?55+Math.random()*35:120);
  }
  var dossier=await dossierPromise;
  TS.operatorDossier=dossier;
  renderBootList(networkInfo,dossier.networkItems);
  renderBootList(browserInfo,dossier.browserItems);
  renderBootList(whoisInfo,dossier.whoisItems);
  if(intelStatus)intelStatus.textContent='live telemetry ready';
  if(intelTimestamp)intelTimestamp.textContent=dossier.timestampLabel;
  await armFingerprintGate(dossier);
  b.style.opacity='0';
  b.style.transition='opacity 0.5s ease';
  await sleep(500);
  b.remove();
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
  if(fb&&fb.stats&&Array.isArray(fb.repos)){siteData=fb;dataSource='embedded';return fb}
  siteData={stats:{tools_count:13,stars_total:552,featured_count:4,followers:48},repos:[]};
  dataSource='error';
  return siteData;
}

function getEmbeddedFallback(){
  try{var el=document.getElementById('fallback-snapshot');if(el)return JSON.parse(el.textContent);return null}catch(e){return null}
}

function parseDateMs(iso){var t=Date.parse(iso);return Number.isFinite(t)?t:null}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function safeUrl(u){if(!u||/^(javascript|data):/i.test(String(u)))return'#';try{var h=new URL(u);return(h.protocol==='https:'||h.protocol==='http:')&&(h.hostname==='github.com'||h.hostname.endsWith('.github.com')||h.hostname.endsWith('.github.io'))?u:'#'}catch(e){return'#'}}
function relDate(iso){var ts=parseDateMs(iso);if(ts===null)return'unknown';var d=Math.floor((Date.now()-ts)/864e5);if(d<1)return'today';if(d<30)return d+'d ago';if(d<365)return Math.floor(d/30)+'mo ago';return Math.floor(d/365)+'y ago'}

/* ====== RENDER FUNCTIONS ====== */
function animateCounter(el,target){
  if(!target||target<=0){el.textContent=0;return}
  var c=0,s=Math.max(1,Math.floor(target/50));
  var iv=setInterval(function(){c+=s;if(c>=target){c=target;clearInterval(iv)}el.textContent=c},30);
}

var statsPendingPairs=null;
function renderStats(data){
  var st=data.stats||{};
  var pairs=[['statProjects',st.tools_count],['statStars',st.stars_total],['statFeatured',st.featured_count],['statFollowers',st.followers]];
  var statsSection=document.getElementById('statsSection');
  if(statsSection&&statsSection.hasAttribute('data-stats-pending')){
    statsPendingPairs=pairs;
    pairs.forEach(function(p){
      var el=document.getElementById(p[0]);
      if(el&&p[1]!=null){el.textContent='0'}
    });
    var rect=statsSection.getBoundingClientRect();
    if(rect.top<window.innerHeight&&rect.bottom>0){
      pairs.forEach(function(p){var el=document.getElementById(p[0]);if(el&&p[1]!=null)animateCounter(el,p[1])});
      statsPendingPairs=null;statsSection.removeAttribute('data-stats-pending');
    }
  }else{
    pairs.forEach(function(p){
      var el=document.getElementById(p[0]);
      if(el&&p[1]!=null){animateCounter(el,p[1])}
    });
  }
  // Update NFO block
  var nfoT=document.getElementById('nfoTools');if(nfoT)nfoT.textContent=st.tools_count||13;
  var nfoS=document.getElementById('nfoStars');if(nfoS)nfoS.textContent=(st.stars_total||541)+'+';
  // Data status
  var ds=document.getElementById('dataStatus');
  if(ds){
    if(dataSource==='live'){
      var ts=parseDateMs(data.last_updated_utc);
      var dt=ts===null?'unknown':new Date(ts).toISOString().replace('T',' ').slice(0,16)+' UTC';
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
  c.setAttribute('data-search',[(repo.name||''),(repo.description||''),(repo.language||''),(repo.topics||[]).join(' ')].join(' ').toLowerCase());
  var sN=esc(repo.name),sD=esc(repo.description||'OSINT & SEO tool by THUMPERSECURE'),sL=esc(repo.language),sU=safeUrl(repo.html_url);
  c.innerHTML='<a class="project-link" href="'+sU+'" target="_blank" rel="noopener noreferrer"><div class="card-bar"><span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span><span class="card-filename">'+sN+'.ts</span></div><div class="card-body"><h3 class="card-name">'+sN+'</h3><p class="card-desc">'+sD+'</p></div><div class="card-meta">'+(repo.stars>0?'<span class="pill pill-stars">&#9733; '+repo.stars+'</span>':'')+(sL?'<span class="pill pill-lang">'+sL+'</span>':'')+'<span class="pill pill-date">'+relDate(repo.last_updated)+'</span></div></a>';
  return c;
}

var allProjectCards=[];
var projectGridObserver=null;
function renderProjectGrid(data){
  var grid=document.getElementById('projectGrid');if(!grid)return;
  if(projectGridObserver){projectGridObserver.disconnect();projectGridObserver=null}
  grid.innerHTML='';
  if(!data.repos||!data.repos.length){grid.innerHTML='<div class="loading-msg">No repositories found.</div>';return}
  projectGridObserver=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting){en.target.classList.add('visible');projectGridObserver.unobserve(en.target)}})},{threshold:0.06});
  allProjectCards=[];
  data.repos.forEach(function(r,i){var c=buildProjectCard(r,i);allProjectCards.push(c);grid.appendChild(c);projectGridObserver.observe(c)});
}

// Search/filter
var searchInput=document.getElementById('repoSearch');
var searchDebounceTimer=null;
function applyProjectFilter(q){
  allProjectCards.forEach(function(c){
    if(!q){c.style.display='';return}
    var match=(c.getAttribute('data-search')||'').indexOf(q)!==-1;
    c.style.display=match?'':'none';
  });
}
if(searchInput){
  searchInput.addEventListener('input',function(){
    var q=this.value.trim().toLowerCase();
    if(searchDebounceTimer){clearTimeout(searchDebounceTimer)}
    searchDebounceTimer=setTimeout(function(){applyProjectFilter(q)},100);
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

function findHashTarget(hash){
  var raw=(hash||'').replace(/^#/,'').trim();
  if(!raw)return null;
  var id;
  try{id=decodeURIComponent(raw)}catch(e){id=raw}
  if(!id)return null;
  return document.getElementById(id);
}

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

function revealHashTarget(hash,opts){
  var options=opts||{};
  var target=findHashTarget(hash);
  if(!target)return false;
  var mod=target.closest('.ts-module');
  if(mod)toggleModule(mod,true);
  if(options.updateHistory){
    var nextHash=hash.charAt(0)==='#'?hash:'#'+hash;
    if(location.hash!==nextHash){
      history.pushState(null,'',nextHash);
    }
  }
  requestAnimationFrame(function(){
    target.scrollIntoView({block:'start',behavior:reducedMotion?'auto':'smooth'});
    if(options.focus&&typeof target.focus==='function'&&target.tabIndex>=0){
      target.focus({preventScroll:true});
    }
  });
  return true;
}

document.addEventListener('click',function(e){
  var link=e.target.closest('a[href^="#"]');
  if(!link)return;
  var href=link.getAttribute('href')||'';
  if(href==='#')return;
  if(!findHashTarget(href))return;
  e.preventDefault();
  revealHashTarget(href,{updateHistory:true});
});
window.addEventListener('hashchange',function(){revealHashTarget(location.hash)});
if(location.hash){
  requestAnimationFrame(function(){revealHashTarget(location.hash)});
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

(function(){
  var gate=document.getElementById('fingerprintGate');
  var scanner=document.getElementById('fingerprintScanner');
  if(!gate||!scanner||!('MutationObserver' in window))return;
  function revealGate(){
    if(gate.hidden)return;
    requestAnimationFrame(function(){
      gate.scrollIntoView({block:'center',behavior:reducedMotion?'auto':'smooth'});
      if(typeof scanner.focus==='function')scanner.focus({preventScroll:true});
    });
  }
  var ob=new MutationObserver(revealGate);
  ob.observe(gate,{attributes:true,attributeFilter:['hidden']});
  revealGate();
})();

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
var mMiniBar=document.getElementById('musicMiniBar');
var mMuteBtnMini=document.getElementById('musicMuteMini');
var mNextBtnMini=document.getElementById('musicNextMini');
var mTrackIndicator=document.getElementById('musicTrackIndicator');
var mPanelMq=window.matchMedia?window.matchMedia('(max-width: 640px)'):null;
var mCurrentIndex=-1;
var mResizeDebounce=null;
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
  if(mMiniBar){
    var showMini=!expanded&&!!(mPanelMq&&mPanelMq.matches);
    if(showMini)mMiniBar.removeAttribute('hidden');else mMiniBar.setAttribute('hidden','');
  }
}

function syncMusicPanelForViewport(){
  if(!mPanel||!mPanelToggle)return;
  var isMobile=!!(mPanelMq&&mPanelMq.matches);
  mPanelToggle.hidden=!isMobile;
  if(!isMobile){setMusicPanelExpanded(true);return}
  setMusicPanelExpanded(getSetting('music_panel_open',false));
}
function debouncedResize(){
  if(mResizeDebounce)clearTimeout(mResizeDebounce);
  mResizeDebounce=setTimeout(function(){
    mResizeDebounce=null;
    syncMusicPanelForViewport();
    updateMusicTrackIndicator();
  },120);
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
  var icon=mIsMuted?'\uD83D\uDD07':'\uD83D\uDD0A';
  var label=mIsMuted?'Unmute audio':'Mute audio';
  if(mMuteBtn){mMuteBtn.textContent=icon;mMuteBtn.classList.toggle('muted',mIsMuted);mMuteBtn.setAttribute('aria-label',label)}
  if(mMuteBtnMini){mMuteBtnMini.textContent=icon;mMuteBtnMini.classList.toggle('muted',mIsMuted);mMuteBtnMini.setAttribute('aria-label',label)}
  if(mPlayer)mPlayer.volume=mIsMuted?0:1;
}
function updateMusicTrackIndicator(){
  if(!mTrackIndicator||!TRACK_CONFIG.length)return;
  var n=TRACK_CONFIG.length;
  var idx=mCurrentIndex>=0&&mCurrentIndex<n?mCurrentIndex:0;
  mTrackIndicator.textContent=(idx+1)+'/'+n;
  mTrackIndicator.classList.toggle('playing',!!(mPlayer&&mPlayer.src&&!mPlayer.paused));
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
    var ctrl=new AbortController();
    var tid=setTimeout(function(){ctrl.abort()},6000);
    var r=await fetch('https://itunes.apple.com/search?term='+encodeURIComponent(query)+'&entity=song&limit=8',{signal:ctrl.signal});
    clearTimeout(tid);
    if(!r.ok)throw new Error('itunes '+r.status);
    var data=await r.json();
    var hit=(data.results||[]).find(function(x){return !!x.previewUrl})||null;
    mCache[query]=hit;return hit;
  }catch(e){mCache[query]=null;return null}
}

async function resolveTrackUrl(idx){
  if(idx<0||idx>=TRACK_CONFIG.length)return null;
  var cfg=TRACK_CONFIG[idx];
  if(!cfg)return null;
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

var mPlayGeneration=0;
async function playTrack(idx){
  if(!mPlayer||!TRACK_CONFIG.length)return;
  if(idx<0||idx>=TRACK_CONFIG.length)idx=0;
  var gen=++mPlayGeneration;
  var cfg=TRACK_CONFIG[idx];
  if(!cfg)return;
  hideFallback();
  mCurrentIndex=idx;
  setSetting('music_track_index',idx);
  setActiveBtn(idx);
  updateMusicTrackIndicator();
  setMusicStatus('loading: '+cfg.label.toLowerCase()+' ...', null);
  var url=await resolveTrackUrl(idx);
  if(gen!==mPlayGeneration)return;
  if(!url){
    setMusicStatus('preview unavailable','error');
    showFallback(cfg.query);return;
  }
  var absUrl;try{absUrl=new URL(url,location.href).href}catch(e){absUrl=url}
  if(mPlayer.src!==absUrl){mPlayer.src=url;mPlayer.load()}
  mPlayer.volume=mIsMuted?0:1;
  try{
    await mPlayer.play();
    if(gen!==mPlayGeneration)return;
    setMusicStatus('playing: '+cfg.label.toLowerCase(),'playing');
    updateMusicTrackIndicator();
    hideAutoplayBanner();
  }catch(e){
    if(gen!==mPlayGeneration)return;
    setMusicStatus('tap to play: '+cfg.label.toLowerCase(),null);
    updateMusicTrackIndicator();
    showAutoplayBanner();
    mAutoplayPending=true;
  }
}

function showAutoplayBanner(){if(autoplayBanner)autoplayBanner.classList.add('show')}
function hideAutoplayBanner(){if(autoplayBanner)autoplayBanner.classList.remove('show')}

function nextTrack(){
  if(!TRACK_CONFIG.length)return;
  var len=TRACK_CONFIG.length;
  var next=(mCurrentIndex<0?0:mCurrentIndex+1)%len;
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
  window.addEventListener('resize',debouncedResize);
  syncMusicPanelForViewport();
}

function handleMuteClick(){mIsMuted=!mIsMuted;setSetting('music_muted',mIsMuted);updateMuteUI()}
if(mMuteBtn){updateMuteUI();mMuteBtn.addEventListener('click',handleMuteClick)}
if(mMuteBtnMini){updateMuteUI();mMuteBtnMini.addEventListener('click',handleMuteClick)}

// Track buttons
mBtns.forEach(function(btn,i){
  btn.addEventListener('click',function(){
    if(i<0||i>=TRACK_CONFIG.length)return;
    if(mCurrentIndex===i&&mPlayer&&!mPlayer.paused){
      mPlayer.pause();setMusicStatus('paused: '+TRACK_CONFIG[i].label.toLowerCase(),null);updateMusicTrackIndicator();return;
    }
    if(mCurrentIndex===i&&mPlayer&&mPlayer.paused&&mPlayer.src){
      mPlayer.play().then(function(){setMusicStatus('playing: '+TRACK_CONFIG[i].label.toLowerCase(),'playing');updateMusicTrackIndicator()}).catch(function(){});return;
    }
    playTrack(i);
  });
});

// Next button
if(mNextBtn)mNextBtn.addEventListener('click',nextTrack);
if(mNextBtnMini)mNextBtnMini.addEventListener('click',nextTrack);

// Playlist auto-advance
if(mPlayer){
  mPlayer.addEventListener('ended',function(){nextTrack()});
  mPlayer.addEventListener('error',function(){setMusicStatus('audio source failed','error');updateMusicTrackIndicator()});
  mPlayer.addEventListener('pause',function(){updateMusicTrackIndicator()});
  mPlayer.addEventListener('play',function(){updateMusicTrackIndicator()});
}

// Autoplay banner click
if(autoplayBanner){
  autoplayBanner.addEventListener('click',function(){
    if(mPlayer&&mPlayer.src&&mCurrentIndex>=0&&mCurrentIndex<TRACK_CONFIG.length){
      mPlayer.play().then(function(){
        setMusicStatus('playing: '+TRACK_CONFIG[mCurrentIndex].label.toLowerCase(),'playing');
        updateMusicTrackIndicator();
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
  if(mAutoplayPending&&mPlayer&&mPlayer.src&&mCurrentIndex>=0&&mCurrentIndex<TRACK_CONFIG.length){
    mPlayer.play().then(function(){
      setMusicStatus('playing: '+TRACK_CONFIG[mCurrentIndex].label.toLowerCase(),'playing');
      updateMusicTrackIndicator();
      hideAutoplayBanner();mAutoplayPending=false;
    }).catch(function(){});
  }
},{once:true});

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
  {key:'puzzles',selector:'#mod-puzzles',icon:'&#9889;',label:'SIMULATION',msg:'Invite code forge opened \u2014 holographic pulse lattice armed.'},
  {key:'packetwire',selector:'#mod-packetwire',icon:'&#128268;',label:'DEMO',msg:'Packet-over-wire module opened \u2014 packet and wireless views synchronized.'},
  {key:'threatexamples',selector:'#mod-threat-examples',icon:'&#128737;',label:'DEMO',msg:'Threat lab examples active \u2014 covert channels and tripwires live.'},
  {key:'quotes',selector:'#mod-quotes',icon:'&#128172;',label:'SIMULATION',msg:'Legend quote wall energized \u2014 rotating hot feed active.'},
  {key:'glossary',selector:'#mod-glossary',icon:'&#128295;',label:'DEMO',msg:'Threat glossary parsed \u2014 defensive vocabulary armed.'},
  {key:'misc',selector:'#mod-misc',icon:'&#128240;',label:'SIMULATION',msg:'Misc resources loaded \u2014 newsletter relay active.'},
  {key:'fieldtools',selector:'#mod-fieldtools',icon:'&#128225;',label:'SIMULATION',msg:'Field tools pager online \u2014 31 signals decoded.'},
  {key:'darkweb',selector:'#mod-darkweb',icon:'&#128274;',label:'SIMULATION',msg:'Onion routing active \u2014 dark web module decrypted.'},
  {key:'investigators',selector:'#mod-investigators',icon:'&#128269;',label:'DEMO',msg:'Investigator timeline loaded \u2014 mail carriers to OSINT.'}
];
var fxContainer=document.getElementById('fxToastContainer');
var DISPLAY_MODES=['dark','engage','read'];
function getDisplayMode(){
  var m=getSetting('display_mode','dark');
  if(m==='reading'){setSetting('display_mode','engage');return 'engage'}
  return DISPLAY_MODES.indexOf(m)!==-1?m:'dark';
}
var displayMode=getDisplayMode();
var modeDark=displayMode==='dark';
var fxEnabled=modeDark&&!reducedMotion;
var fxTimer=null;
var fxVisibleCount=0;
var fxScrollObserver=null;
var fxScrollMap={};
var fxScrollSeen={};

function applyDisplayModeClass(){
  document.body.classList.remove('engage-mode','read-mode');
  if(displayMode==='engage')document.body.classList.add('engage-mode');
  else if(displayMode==='read')document.body.classList.add('read-mode');
}

function applyCanvasVisibility(){
  var bgAnimEnabled=getSetting('bg_anim',true);
  var show=modeDark&&bgAnimEnabled;
  document.querySelectorAll('#particleCanvas,#rainCanvas,#tronGridCanvas').forEach(function(c){
    c.style.display=show?'':'none';
  });
}

function getModeLabel(m){return m==='dark'?'Dark':m==='engage'?'Engage':'Read'}
function updateModeUI(){
  var btn=document.getElementById('toggleMode');
  if(btn){
    btn.textContent='Mode: '+getModeLabel(displayMode);
    btn.classList.toggle('on',modeDark);
    btn.setAttribute('aria-pressed',modeDark?'true':'false');
  }
  var sel=document.getElementById('settingMode');
  if(sel&&sel.tagName==='SELECT'){
    sel.value=displayMode;
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

function setDisplayMode(mode){
  displayMode=mode;
  modeDark=displayMode==='dark';
  setSetting('display_mode',displayMode);
  applyDisplayModeClass();
  if(modeDark&&!reducedMotion){fxStart()}else{fxStop()}
  applyCanvasVisibility();
  updateModeUI();
}
function cycleDisplayMode(){
  var i=DISPLAY_MODES.indexOf(displayMode);
  setDisplayMode(DISPLAY_MODES[(i+1)%DISPLAY_MODES.length]);
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
  toggleModeBtn.addEventListener('click',function(){cycleDisplayMode()});
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

TS.puzzleSkip=function(id){
  setPuzzleState(id,true);
  if(id==='inviteforge'&&typeof TS.finishInviteForge==='function')TS.finishInviteForge(true);
};

/* ====== AUTO-SCROLL (steady rate, pause at puzzles, exclude bottom) ====== */
var AUTO_SCROLL_PUZZLES=['inviteforge'];
var autoScrollEnabled=getSetting('auto_scroll',true);
var autoScrollSpeed=18;
var autoScrollRaf=null;
var autoScrollPaused=false;

function getPuzzleArea(id){
  var area=document.querySelector('[data-puzzle="'+id+'"]');
  return area?area.getBoundingClientRect():null;
}

function isPuzzleBlockingScroll(){
  var vh=window.innerHeight;
  var threshold=vh*0.6;
  for(var i=0;i<AUTO_SCROLL_PUZZLES.length;i++){
    var id=AUTO_SCROLL_PUZZLES[i];
    if(getPuzzleState(id))continue;
    var r=getPuzzleArea(id);
    if(!r)continue;
    if(r.top<threshold&&r.bottom>0)return true;
  }
  return false;
}

function runAutoScroll(){
  if(!autoScrollEnabled||autoScrollPaused||reducedMotion)return;
  if(isPuzzleBlockingScroll()){autoScrollRaf=requestAnimationFrame(runAutoScroll);return;}
  var maxScroll=document.documentElement.scrollHeight-window.innerHeight;
  if(window.scrollY>=maxScroll-5)return;
  window.scrollBy(0,autoScrollSpeed*0.016);
  autoScrollRaf=requestAnimationFrame(runAutoScroll);
}

function startAutoScroll(){
  if(!autoScrollRaf&&autoScrollEnabled&&!reducedMotion)runAutoScroll();
}

function stopAutoScroll(){
  if(autoScrollRaf){cancelAnimationFrame(autoScrollRaf);autoScrollRaf=null;}
}

TS.toggleAutoScroll=function(){
  autoScrollEnabled=!autoScrollEnabled;
  setSetting('auto_scroll',autoScrollEnabled);
  if(autoScrollEnabled)startAutoScroll();else stopAutoScroll();
  return autoScrollEnabled;
};

document.addEventListener('scroll',function(){
  if(!autoScrollEnabled)return;
  var nearBottom=window.scrollY>=document.documentElement.scrollHeight-window.innerHeight-100;
  if(nearBottom)stopAutoScroll();
},{passive:true});

setTimeout(function(){
  if(autoScrollEnabled&&!reducedMotion)startAutoScroll();
},3000);

/* ====== HERO HOLOGRAPHIC VARIATIONS (different on each refresh) ====== */
(function(){
  var hero=document.getElementById('heroSection');
  if(!hero)return;
  var themes=['tron-grid','matrix-rain','hologram-scan','neon-pulse'];
  var idx=Math.floor(Math.random()*themes.length);
  hero.setAttribute('data-hero-theme',themes[idx]);
})();

TS.resetAllPuzzles=function(){
  ['inviteforge','unscramble','math','checksum','pattern','phishing','decrypt','portscan','circuit','bottom'].forEach(function(id){
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

// Settings: display mode dropdown
var settingModeSel=document.getElementById('settingMode');
if(settingModeSel&&settingModeSel.tagName==='SELECT'){
  settingModeSel.value=displayMode;
  settingModeSel.addEventListener('change',function(){setDisplayMode(this.value)});
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
    if(!pX)return;
    if(document.hidden||pC.style.display==='none'){requestAnimationFrame(dP);return}
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
    if(!tGX)return;
    if(document.hidden||tGC.style.display==='none'){requestAnimationFrame(dTGC);return}
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
    if(!rX)return;
    if(document.hidden||rCv.style.display==='none'){requestAnimationFrame(dR);return}
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
var rO=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting){en.target.classList.add('visible');rO.unobserve(en.target);if(en.target.id==='statsSection'&&statsPendingPairs){statsPendingPairs.forEach(function(p){var el=document.getElementById(p[0]);if(el&&p[1]!=null)animateCounter(el,p[1])});statsPendingPairs=null;if(en.target.removeAttribute)en.target.removeAttribute('data-stats-pending')}})},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(function(el){rO.observe(el)});

/* ====== MOBILE: HERO PARALLAX & SCROLL PROGRESS ====== */
var heroSection=document.getElementById('heroSection');
var scrollProgressEl=document.getElementById('scrollProgress');
var isMobile=function(){return window.innerWidth<=640};
function onScrollMobile(){
  if(!heroSection||!scrollProgressEl)return;
  var y=window.scrollY||window.pageYOffset;
  var docH=document.documentElement.scrollHeight-window.innerHeight;
  if(docH>0){var pct=Math.min(100,Math.round((y/docH)*100));scrollProgressEl.style.width=pct+'%';scrollProgressEl.setAttribute('aria-valuenow',pct);scrollProgressEl.setAttribute('aria-hidden',pct<2?'true':'false')}
  if(isMobile()&&!reducedMotion){
    var heroH=heroSection?heroSection.offsetHeight:0;
    if(y<heroH){var factor=0.15;heroSection.style.setProperty('--hero-parallax-y',(y*factor)+'px')}
    else{heroSection.style.setProperty('--hero-parallax-y','0')}
  }
}
window.addEventListener('scroll',function(){requestAnimationFrame(onScrollMobile)},{passive:true});
onScrollMobile();

/* ====== CINEMA CAROUSEL (mobile swipe) ====== */
(function(){
  var wrap=document.getElementById('cinemaCarouselWrap');
  var track=document.getElementById('cinemaCarouselTrack');
  var dotsEl=document.getElementById('cinemaCarouselDots');
  if(!wrap||!track||!dotsEl)return;
  var quotes=[].slice.call(track.querySelectorAll('.movie-quote'));
  if(quotes.length<2)return;
  var idx=0,startX=0,startScroll=0;
  function buildDots(){dotsEl.innerHTML='';for(var i=0;i<quotes.length;i++){var d=document.createElement('button');d.type='button';d.className='cinema-dot'+(i===0?' active':'');d.setAttribute('aria-label','Quote '+(i+1)+' of '+quotes.length);d.addEventListener('click',function(j){return function(){goTo(j)}}(i));dotsEl.appendChild(d)}}
  function goTo(i){idx=Math.max(0,Math.min(i,quotes.length-1));updateCarousel()}
  function updateCarousel(){var w=wrap.offsetWidth;track.style.transform='translateX(-'+idx*w+'px)';[].slice.call(dotsEl.children).forEach(function(d,i){d.classList.toggle('active',i===idx)})}
  function onResize(){if(window.innerWidth>640){track.style.transform='';track.style.scrollSnapType='';return}updateCarousel()}
  buildDots();
  wrap.addEventListener('touchstart',function(e){if(window.innerWidth>640)return;startX=e.touches[0].clientX;startScroll=idx},{passive:true});
  wrap.addEventListener('touchend',function(e){if(window.innerWidth>640)return;var dx=startX-e.changedTouches[0].clientX;if(Math.abs(dx)>50){goTo(dx>0?idx+1:idx-1)}},{passive:true});
  window.addEventListener('resize',onResize);
  if(window.innerWidth<=640)updateCarousel();
})();

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
  function rWC(){var s=wC.parentElement;if(!s)return;wC.width=s.clientWidth;wC.height=s.clientHeight}
  rWC();
  var cube=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  var edg=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  function pr(p,a){
    var ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(a*0.7),sb=Math.sin(a*0.7);
    var x1=p[0]*ca-p[2]*sa,z1=p[0]*sa+p[2]*ca;
    var y1=p[1]*cb-z1*sb,z2=p[1]*sb+z1*cb;
    var sc=wC.width*0.28,d=3+z2||1;
    return[x1/d*sc+wC.width/2,y1/d*sc+wC.height/2,z2];
  }
  function dW(){
    if(!wX)return;
    if(document.hidden){requestAnimationFrame(dW);return}
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
    if(iX)iX.setTransform(dpr,0,0,dpr,0,0);
  }
  function dIC(){
    if(!iX)return;
    if(document.hidden){requestAnimationFrame(dIC);return}
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
    if(qX)qX.setTransform(dpr,0,0,dpr,0,0);
  }
  function dQC(){
    if(!qX)return;
    if(document.hidden){requestAnimationFrame(dQC);return}
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

/* ====== PACKET GRID CANVAS (Tron-style packet flow) ====== */
var pktCv=document.getElementById('packetGridCanvas');
if(pktCv&&!reducedMotion){
  var pktX=pktCv.getContext('2d'),pktT=0,pktTrails=[],pktPackets=[];
  function rPkt(){var p=pktCv.parentElement;if(!p)return;var w=p.clientWidth;var h=320;pktCv.width=w;pktCv.height=h}
  function dPkt(){
    if(!pktX)return;
    if(document.hidden||pktCv.style.display==='none'){requestAnimationFrame(dPkt);return}
    var w=pktCv.width,h=pktCv.height;
    pktX.fillStyle='rgba(2,2,8,0.15)';pktX.fillRect(0,0,w,h);
    var cols=20,rows=12,spacing=Math.min(w/cols,h/rows)*0.9;
    var cx=w/2,cy=h*0.5,perspective=0.3;
    pktX.strokeStyle='rgba(24,220,255,0.08)';pktX.lineWidth=0.5;
    for(var r=0;r<=rows;r++){
      var py=cy+r*spacing*0.55;
      var scale=1+(py/h-0.5)*perspective;
      pktX.beginPath();
      for(var c=0;c<=cols;c++){
        var px=cx+(c-cols/2)*spacing*scale;
        if(c===0)pktX.moveTo(px,py);else pktX.lineTo(px,py);
      }
      pktX.stroke();
    }
    for(var c=0;c<=cols;c++){
      pktX.beginPath();
      for(var r=0;r<=rows;r++){
        var py=cy+r*spacing*0.55;
        var scale=1+(py/h-0.5)*perspective;
        var px=cx+(c-cols/2)*spacing*scale;
        if(r===0)pktX.moveTo(px,py);else pktX.lineTo(px,py);
      }
      pktX.stroke();
    }
    if(Math.random()<0.04)pktTrails.push({x:Math.random()*w*0.3,y:h*0.2,vx:2+Math.random()*3,vy:0,col:Math.random()>0.5?'#18dcff':'#00ffcc',life:1});
    if(Math.random()<0.03)pktTrails.push({x:w*0.7+Math.random()*w*0.3,y:h*0.8,vx:-2-Math.random()*2,vy:0,col:'#ff00aa',life:1});
    pktTrails=pktTrails.filter(function(tr){
      tr.x+=tr.vx;tr.y+=tr.vy;tr.life-=0.012;
      if(tr.life<=0)return false;
      pktX.strokeStyle=tr.col;pktX.globalAlpha=tr.life;pktX.lineWidth=2;
      pktX.beginPath();pktX.moveTo(tr.x,tr.y);pktX.lineTo(tr.x-tr.vx*6,tr.y);pktX.stroke();
      pktX.globalAlpha=1;return true;
    });
    if(Math.random()<0.02)pktPackets.push({x:w*0.15,y:h*0.5,tx:w*0.85,ty:h*0.5,t:0,col:'#18dcff'});
    pktPackets=pktPackets.filter(function(p){
      p.t+=0.02;
      var nx=p.x+(p.tx-p.x)*p.t,ny=p.y+(p.ty-p.y)*p.t;
      pktX.fillStyle=p.col;pktX.globalAlpha=1-p.t*0.5;
      pktX.beginPath();pktX.arc(nx,ny,4,0,Math.PI*2);pktX.fill();
      pktX.globalAlpha=1;
      return p.t<1;
    });
    pktT+=0.02;requestAnimationFrame(dPkt);
  }
  rPkt();dPkt();window.addEventListener('resize',rPkt);
}

/* ====== KISMET SIGNAL CANVAS ====== */
var kismetCv=document.getElementById('kismetSignalCanvas');
if(kismetCv){
  var kX=kismetCv.getContext('2d'),kTick=0;
  function drawKismet(){
    if(!kX)return;
    if(document.hidden){if(!reducedMotion)requestAnimationFrame(drawKismet);return}
    var w=kismetCv.width,h=kismetCv.height,cx=w/2,cy=h/2;
    kX.clearRect(0,0,w,h);
    kX.fillStyle='rgba(3,6,16,0.95)';
    kX.fillRect(0,0,w,h);
    for(var ring=1;ring<=4;ring++){
      kX.strokeStyle='rgba(24,220,255,'+(0.12+(ring*0.03))+')';
      kX.lineWidth=1;
      kX.beginPath();
      kX.arc(cx,cy,ring*24,0,Math.PI*2);
      kX.stroke();
    }
    for(var i=0;i<10;i++){
      var ang=(i/10)*Math.PI*2+(kTick*0.006);
      var dist=42+(i%4)*18;
      kX.fillStyle=i%2===0?'rgba(0,255,204,0.28)':'rgba(255,0,170,0.2)';
      kX.beginPath();
      kX.arc(cx+Math.cos(ang)*dist,cy+Math.sin(ang)*dist,2.2,0,Math.PI*2);
      kX.fill();
    }
    var sweepAng=(kTick*0.03)%(Math.PI*2);
    kX.strokeStyle='rgba(0,255,204,0.55)';
    kX.lineWidth=2;
    kX.beginPath();
    kX.moveTo(cx,cy);
    kX.lineTo(cx+Math.cos(sweepAng)*92,cy+Math.sin(sweepAng)*92);
    kX.stroke();
    kTick++;
    if(!reducedMotion)requestAnimationFrame(drawKismet);
  }
  drawKismet();
}

/* ====== STEGO + THREAT DEMOS ====== */
var stegoCv=document.getElementById('stegoCanvas');
if(stegoCv){
  var sX=stegoCv.getContext('2d'),sw=stegoCv.width,sh=stegoCv.height;
  var stegoMsg='MASK THE PATTERN';
  var stegoBits=[];
  for(var i=0;i<stegoMsg.length;i++){
    var cc=stegoMsg.charCodeAt(i);
    for(var bit=7;bit>=0;bit--)stegoBits.push((cc>>bit)&1);
  }
  function paintStego(){
    if(!sX)return;
    for(var y=0;y<sh-20;y+=4){
      for(var x=0;x<sw;x+=4){
        var r=35+((x+y)%80);
        var g=70+((x*3+y)%120);
        var b=110+((y*2)%120);
        sX.fillStyle='rgb('+r+','+g+','+b+')';
        sX.fillRect(x,y,4,4);
      }
    }
    var bitPtr=0;
    for(var bandY=sh-16;bandY<sh&&bitPtr<stegoBits.length;bandY+=4){
      for(var bandX=0;bandX<sw&&bitPtr<stegoBits.length;bandX+=4){
        var br=28+((bandX*2)%80);
        var bg=55+((bandY*5)%90);
        var bb=150+((bandX+bandY)%80);
        bb=bb-(bb%2)+stegoBits[bitPtr++];
        sX.fillStyle='rgb('+br+','+bg+','+bb+')';
        sX.fillRect(bandX,bandY,4,4);
      }
    }
    sX.fillStyle='rgba(255,255,255,0.06)';
    sX.fillRect(22,18,176,96);
    sX.fillStyle='rgba(24,220,255,0.75)';
    sX.font='700 14px JetBrains Mono';
    sX.fillText('photo_8821.png',34,42);
    sX.fillStyle='rgba(0,255,204,0.45)';
    sX.fillText('normal image // nothing obvious',34,66);
  }
  function decodeStegoBits(){
    if(!sX)return '';
    var data=sX.getImageData(0,0,sw,sh).data;
    var bits=[],out='';
    for(var yy=sh-16;yy<sh&&bits.length<stegoMsg.length*8;yy+=4){
      for(var xx=0;xx<sw&&bits.length<stegoMsg.length*8;xx+=4){
        var px=((yy*sw)+xx)*4;
        bits.push(data[px+2]&1);
      }
    }
    for(var n=0;n<bits.length;n+=8){
      var code=0;
      for(var m=0;m<8;m++)code=(code<<1)|bits[n+m];
      out+=String.fromCharCode(code);
    }
    return out;
  }
  function paintDecodedStego(decoded){
    sX.fillStyle='#050510';
    sX.fillRect(0,0,sw,sh);
    for(var bandY=sh-16;bandY<sh;bandY+=4){
      for(var bandX=0;bandX<sw;bandX+=4){
        var br=0;var bg=255;var bb=65;
        sX.fillStyle='rgba('+br+','+bg+','+bb+',0.25)';
        sX.fillRect(bandX,bandY,4,4);
      }
    }
    sX.fillStyle='rgba(0,255,65,0.12)';
    sX.fillRect(0,sh-16,sw,16);
    sX.fillStyle='rgba(0,255,204,0.85)';
    sX.font='700 11px JetBrains Mono';
    sX.fillText('LSB PAYLOAD EXTRACTED',14,28);
    sX.fillStyle='#00ff41';
    sX.font='700 16px JetBrains Mono';
    sX.fillText(decoded,14,58);
    sX.fillStyle='rgba(24,220,255,0.5)';
    sX.font='700 9px JetBrains Mono';
    sX.fillText('source: blue-channel band (y='+String(sh-16)+'..'+String(sh)+')',14,82);
    sX.fillText(String(stegoMsg.length*8)+' bits \u2192 '+String(stegoMsg.length)+' bytes decoded',14,98);
    sX.strokeStyle='rgba(0,255,65,0.4)';
    sX.lineWidth=1;
    sX.strokeRect(8,sh-18,sw-16,18);
  }
  paintStego();
  var decodeBtn=document.getElementById('decodeStegoBtn');
  var stegoHint=document.getElementById('stegoHint');
  var stegoDecoded=false;
  function resetStegoDemo(){
    stegoDecoded=false;
    paintStego();
    if(decodeBtn){decodeBtn.textContent='Decode message';decodeBtn.disabled=false}
    if(stegoHint)stegoHint.textContent='pixels encode bits \u2192 decode to reveal';
  }
  if(decodeBtn&&stegoHint){
    decodeBtn.addEventListener('click',function(){
      if(stegoDecoded){resetStegoDemo();return}
      var decoded=decodeStegoBits();
      paintDecodedStego(decoded);
      stegoHint.textContent='decoded payload \u2192 '+decoded;
      decodeBtn.textContent='Reset demo';
      stegoDecoded=true;
    });
  }
  window.addEventListener('pageshow',function(e){if(e.persisted)resetStegoDemo()});
}

(function(){
  var inspectBtn=document.getElementById('inspectHomoglyphBtn');
  var domain=document.getElementById('homoglyphDomain');
  var status=document.getElementById('homoglyphStatus');
  var homoglyphRevealed=false;
  var domainOriginal=domain?domain.textContent:'';
  function resetHomoglyph(){
    homoglyphRevealed=false;
    if(domain)domain.textContent=domainOriginal;
    if(status)status.textContent='';
    if(inspectBtn){inspectBtn.textContent='Inspect glyphs';inspectBtn.disabled=false}
  }
  if(inspectBtn&&domain&&status){
    inspectBtn.addEventListener('click',function(){
      if(homoglyphRevealed){resetHomoglyph();return}
      domain.textContent='paypaI-secure.com  →  paypal-secure.com';
      status.textContent='Capital I is standing in for lowercase l — same silhouette, different glyph.';
      inspectBtn.textContent='Reset demo';
      homoglyphRevealed=true;
    });
  }
  window.addEventListener('pageshow',function(e){if(e.persisted)resetHomoglyph()});
})();

(function(){
  var tripBtn=document.getElementById('tripHoneytokenBtn');
  var consoleEl=document.getElementById('honeytokenConsole');
  var honeytokenTripped=false;
  var consoleOriginal=consoleEl?consoleEl.textContent:'';
  function resetHoneytoken(){
    honeytokenTripped=false;
    if(consoleEl)consoleEl.textContent=consoleOriginal;
    if(tripBtn){tripBtn.textContent='Trip honeytoken';tripBtn.disabled=false}
  }
  if(tripBtn&&consoleEl){
    tripBtn.addEventListener('click',function(){
      if(honeytokenTripped){resetHoneytoken();return}
      var ip=(TS.operatorDossier&&TS.operatorDossier.publicIp)||'unknown';
      consoleEl.textContent='status: beacon tripped\ncallback: https://pixel-gate.local/open.gif?src=bait-doc\noperator: '+ip+' at '+formatWallclock(Date.now());
      tripBtn.textContent='Reset demo';
      honeytokenTripped=true;
    });
  }
  window.addEventListener('pageshow',function(e){if(e.persisted)resetHoneytoken()});
})();

/* ====== INVITE CODE FORGE ====== */
(function(){
  var cv=document.getElementById('inviteForgeCanvas');
  var status=document.getElementById('forgeStatus');
  var depth=document.getElementById('forgeSequenceDepth');
  var glow=document.getElementById('forgeGlowIndex');
  var replayBtn=document.getElementById('forgeReplayBtn');
  var resetBtn=document.getElementById('forgeResetBtn');
  var codeOutput=document.getElementById('forgeCodeOutput');
  var latency=document.getElementById('forgeLatency');
  var traceList=document.getElementById('forgeTraceList');
  if(!cv||!status||!depth||!glow||!replayBtn||!resetBtn||!codeOutput||!latency)return;
  var ctx=cv.getContext('2d');
  var dpr=Math.max(1,window.devicePixelRatio||1);
  var labels=['A7','C1','F3','J2','L8','N4','Q6','T1','V5','X9'];
  var baseSeed=deriveFingerprintCode(location.host+navigator.userAgent);
  var solvedCode='INVITE // '+deriveFingerprintCode(baseSeed+'-'+location.pathname);
  var nodes=[],sequence=[],selected=[],particles=[],tick=0,playback=true,playbackIndex=-1,playbackSince=0,solved=false;
  function resizeForge(){
    var w=cv.clientWidth||920,h=cv.clientHeight||540;
    cv.width=Math.floor(w*dpr);
    cv.height=Math.floor(h*dpr);
    if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);
    nodes=[
      {x:w*0.18,y:h*0.28},{x:w*0.33,y:h*0.18},{x:w*0.49,y:h*0.28},{x:w*0.66,y:h*0.18},{x:w*0.82,y:h*0.3},
      {x:w*0.74,y:h*0.68},{x:w*0.52,y:h*0.78},{x:w*0.3,y:h*0.68},{x:w*0.18,y:h*0.52},{x:w*0.52,y:h*0.5}
    ];
  }
  function rebuildSequence(){
    sequence=[];
    var pool=[0,1,2,3,4,5,6,7,8,9];
    while(sequence.length<6){
      var idx=Math.floor(Math.random()*pool.length);
      sequence.push(pool[idx]);
      pool.splice(idx,1);
    }
  }
  function updateForgeCopy(msg){
    status.textContent=msg;
    depth.textContent=selected.length+'/'+sequence.length;
    var nextIdx=sequence[Math.min(selected.length,sequence.length-1)];
    glow.textContent=labels[nextIdx];
    latency.textContent=(selected.length*13+47)+' ms';
    codeOutput.textContent=solved?solvedCode:'INVITE // '+sequence.map(function(idx,i){
      return i<selected.length?labels[idx]:'--';
    }).join('-');
    if(traceList){
      traceList.innerHTML=sequence.map(function(idx,i){
        var state=i<selected.length?'armed':(i===selected.length?'next':'standby');
        return '<div class="'+state+'">'+labels[idx]+'</div>';
      }).join('');
    }
  }
  function beginReplay(){
    selected=[];
    playback=true;
    playbackIndex=-1;
    playbackSince=performance.now();
    solved=false;
    updateForgeCopy('Watch the surge route, then replay it on the lattice.');
  }
  function finishForge(skipped){
    solved=true;
    playback=false;
    selected=sequence.slice();
    setPuzzleState('inviteforge',true);
    updateForgeCopy(skipped?'Invite forge bypassed. Section unlocked.':'Invite code forged. Lattice stable.');
    codeOutput.textContent=solvedCode;
  }
  function attemptNode(idx){
    if(solved||playback)return false;
    var expected=sequence[selected.length];
    if(idx===expected){
      selected.push(idx);
      if(selected.length===sequence.length){
        finishForge(false);
      }else{
        updateForgeCopy('Signal captured. Continue following the route.');
      }
      return true;
    }
    selected=[];
    updateForgeCopy('Sequence break. The lattice purged your path — replay and try again.');
    return false;
  }
  TS.finishInviteForge=finishForge;
  TS.inviteForgeState={
    getSequence:function(){return sequence.slice()},
    getNodes:function(){return nodes.map(function(node){return{x:node.x,y:node.y}})},
    replay:beginReplay,
    select:attemptNode
  };
  function spawnParticles(){
    if(particles.length<26&&Math.random()<0.25){
      particles.push({x:Math.random()*(cv.clientWidth||920),y:Math.random()*(cv.clientHeight||540),vx:-0.4+Math.random()*0.8,vy:-0.25+Math.random()*0.5,life:1});
    }
    particles=particles.filter(function(p){p.x+=p.vx;p.y+=p.vy;p.life-=0.012;return p.life>0});
  }
  function drawForge(){
    if(!ctx)return;
    if(document.hidden){requestAnimationFrame(drawForge);return}
    var w=cv.clientWidth||920,h=cv.clientHeight||540,cx=w/2,cy=h/2;
    ctx.clearRect(0,0,w,h);
    var bg=ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,'rgba(4,8,20,0.96)');
    bg.addColorStop(1,'rgba(8,3,18,0.96)');
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,w,h);
    for(var gy=0;gy<7;gy++){
      ctx.strokeStyle='rgba(24,220,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(0,(gy+1)*(h/8));
      ctx.lineTo(w,(gy+1)*(h/8));
      ctx.stroke();
    }
    for(var gx=0;gx<11;gx++){
      ctx.beginPath();
      ctx.moveTo((gx+1)*(w/12),0);
      ctx.lineTo((gx+1)*(w/12),h);
      ctx.stroke();
    }
    for(var ring=0;ring<4;ring++){
      ctx.strokeStyle=ring%2===0?'rgba(24,220,255,0.2)':'rgba(255,0,170,0.16)';
      ctx.lineWidth=1.1;
      ctx.beginPath();
      ctx.ellipse(cx,cy,(w*0.14)+(ring*70),(h*0.14)+(ring*36),Math.sin(tick*0.005+ring)*0.25,0,Math.PI*2);
      ctx.stroke();
    }
    if(playback){
      var elapsed=performance.now()-playbackSince;
      playbackIndex=Math.min(sequence.length-1,Math.floor(elapsed/550));
      if(elapsed>(sequence.length*550)+400){
        playback=false;
        playbackIndex=-1;
        updateForgeCopy('Replay the pulse by clicking the glowing nodes in the same order.');
      }
    }
    for(var ln=0;ln<nodes.length;ln++){
      var node=nodes[ln];
      for(var lk=ln+1;lk<nodes.length;lk++){
        var next=nodes[lk];
        var dist=Math.hypot(node.x-next.x,node.y-next.y);
        if(dist<260){
          ctx.strokeStyle='rgba(24,220,255,0.08)';
          ctx.lineWidth=1;
          ctx.beginPath();
          ctx.moveTo(node.x,node.y);
          ctx.lineTo(next.x,next.y);
          ctx.stroke();
        }
      }
    }
    if(selected.length>1){
      ctx.strokeStyle='rgba(0,255,204,0.65)';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(nodes[selected[0]].x,nodes[selected[0]].y);
      for(var s=1;s<selected.length;s++)ctx.lineTo(nodes[selected[s]].x,nodes[selected[s]].y);
      ctx.stroke();
    }
    nodes.forEach(function(node,idx){
      var isSeq=sequence.indexOf(idx)!==-1;
      var isSelected=selected.indexOf(idx)!==-1;
      var isPlayback=playback&&sequence[playbackIndex]===idx;
      var radius=isPlayback?20:(isSeq?15:10);
      var grad=ctx.createRadialGradient(node.x,node.y,2,node.x,node.y,radius*2.8);
      grad.addColorStop(0,isSelected?'rgba(0,255,204,0.95)':(isPlayback?'rgba(255,0,170,0.95)':'rgba(24,220,255,0.82)'));
      grad.addColorStop(1,'rgba(24,220,255,0)');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(node.x,node.y,radius*2.2,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle=isSelected?'#00ffcc':(isPlayback?'#ff79c6':'#18dcff');
      ctx.beginPath();
      ctx.arc(node.x,node.y,radius,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.85)';
      ctx.lineWidth=1.3;
      ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.85)';
      ctx.font='700 12px JetBrains Mono';
      ctx.fillText(labels[idx],node.x-14,node.y+4);
    });
    spawnParticles();
    particles.forEach(function(p){
      ctx.fillStyle='rgba(255,255,255,'+Math.max(0,p.life*0.5)+')';
      ctx.beginPath();
      ctx.arc(p.x,p.y,1.8,0,Math.PI*2);
      ctx.fill();
    });
    tick++;
    requestAnimationFrame(drawForge);
  }
  function clickForge(e){
    if(solved||playback)return;
    var rect=cv.getBoundingClientRect();
    var x=e.clientX-rect.left,y=e.clientY-rect.top;
    for(var i=0;i<nodes.length;i++){
      if(Math.hypot(x-nodes[i].x,y-nodes[i].y)<26){
        attemptNode(i);
        break;
      }
    }
  }
  cv.addEventListener('click',clickForge);
  replayBtn.addEventListener('click',function(){beginReplay()});
  resetBtn.addEventListener('click',function(){rebuildSequence();beginReplay()});
  resizeForge();
  window.addEventListener('resize',resizeForge);
  rebuildSequence();
  if(getPuzzleState('inviteforge'))finishForge(true);else beginReplay();
  drawForge();
})();

/* ====== QUOTE CYCLER ====== */
var lQ=[].slice.call(document.querySelectorAll('.legend-quote-card')),lQi=0,lQTimer=null;
if(lQ.length&&!reducedMotion){lQTimer=setInterval(function(){lQ.forEach(function(c){c.classList.remove('hot')});lQ[lQi].classList.add('hot');lQi=(lQi+1)%lQ.length},2400)}

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
  function kh(e){if(e.key==='Escape'&&backdrop.classList.contains('on')){e.preventDefault();closeM()}}
  function openM(){backdrop.classList.add('on');lockBodyScroll();document.addEventListener('keydown',kh);setTimeout(function(){input.focus()},40)}
  function closeM(){document.removeEventListener('keydown',kh);backdrop.classList.remove('on');unlockBodyScroll();if(!done)sessionStorage.setItem('cb_rx_dismissed','1');setTimeout(function(){backdrop.remove()},260)}
  close.addEventListener('click',closeM);
  backdrop.addEventListener('click',function(e){if(e.target===backdrop)closeM()});
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
  if(!s)return;
  var fired=false;
  var ob=null;
  function cleanup(){
    window.removeEventListener('scroll',checkSentinel);
    window.removeEventListener('resize',checkSentinel);
    if(ob)ob.disconnect();
  }
  function trigger(){
    if(fired)return;
    fired=true;
    cleanup();
    setTimeout(cbInitBottomPuzzle,140);
  }
  function checkSentinel(){
    if(fired)return;
    var rect=s.getBoundingClientRect();
    var visible=Math.min(rect.bottom,window.innerHeight)-Math.max(rect.top,0);
    var ratio=rect.height>0?visible/rect.height:0;
    if(rect.top<window.innerHeight&&rect.bottom>0&&ratio>=0.12)trigger();
  }
  if('IntersectionObserver' in window){
    ob=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting&&en.intersectionRatio>=0.12)trigger();
      });
    },{threshold:0.12});
    ob.observe(s);
  }
  window.addEventListener('scroll',checkSentinel,{passive:true});
  window.addEventListener('resize',checkSentinel);
  requestAnimationFrame(checkSentinel);
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
  var activeTrigger=null;

  function setActiveTrigger(trigger){
    if(activeTrigger&&activeTrigger!==trigger)activeTrigger.setAttribute('aria-expanded','false');
    activeTrigger=trigger||null;
    if(activeTrigger)activeTrigger.setAttribute('aria-expanded','true');
  }

  function openCveModal(cveId,detail,trigger){
    setActiveTrigger(trigger);
    lastFocus=trigger||document.activeElement;
    title.textContent=cveId+' — Plain-Language Explanation';
    body.textContent=detail;
    overlay.classList.add('open');
    lockBodyScroll();
    setTimeout(function(){closeBtn.focus()},30);
  }

  function closeCveModal(){
    overlay.classList.remove('open');
    unlockBodyScroll();
    setActiveTrigger(null);
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
    openCveModal(cveId,detail,btn);
  });
})();

/* ====== BFCACHE RESTORATION ====== */
window.addEventListener('pageshow',function(e){
  if(!e.persisted)return;
  if(mPlayer&&mPlayer.src){
    if(!mPlayer.paused)setMusicStatus('playing: '+TRACK_CONFIG[Math.max(0,mCurrentIndex)].label.toLowerCase(),'playing');
    else setMusicStatus('paused — tap play to resume',null);
  }
});

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
