/* me2me — Data Collection Modules */

function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function collectBrowserInfo() {
  try {
    return {
      userAgent: navigator.userAgent || 'N/A',
      platform: navigator.platform || 'N/A',
      vendor: navigator.vendor || 'N/A',
      appVersion: navigator.appVersion || 'N/A',
      language: navigator.language || 'N/A',
      languages: navigator.languages ? Array.from(navigator.languages) : ['N/A'],
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'N/A',
      maxTouchPoints: navigator.maxTouchPoints || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 'N/A',
      pdfViewerEnabled: navigator.pdfViewerEnabled !== undefined ? navigator.pdfViewerEnabled : 'N/A'
    };
  } catch(e) { return { error: e.message }; }
}

function collectScreenInfo() {
  try {
    const s = window.screen;
    return {
      width: s.width,
      height: s.height,
      availWidth: s.availWidth,
      availHeight: s.availHeight,
      colorDepth: s.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: s.orientation ? s.orientation.type : 'N/A',
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  } catch(e) { return { error: e.message }; }
}

function collectHardwareInfo() {
  try {
    const result = {
      cpuCores: navigator.hardwareConcurrency || 'N/A',
      deviceMemory: navigator.deviceMemory || 'N/A',
      gpu: { renderer: 'N/A', vendor: 'N/A' }
    };
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbg) {
          result.gpu.renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
          result.gpu.vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
        }
      }
    } catch(e) {}
    return result;
  } catch(e) { return { error: e.message }; }
}

function collectCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 150;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('me2me fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('me2me fingerprint', 4, 17);
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    const dataURL = canvas.toDataURL();
    return { hash: simpleHash(dataURL) };
  } catch(e) { return { hash: 'N/A', error: e.message }; }
}

function collectWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { hash: 'N/A', renderer: 'N/A', vendor: 'N/A', extensions: [] };
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    const extensions = gl.getSupportedExtensions() || [];
    const hashStr = renderer + vendor + extensions.join(',');
    return { hash: simpleHash(hashStr), renderer, vendor, extensionCount: extensions.length };
  } catch(e) { return { hash: 'N/A', error: e.message }; }
}

function collectAudioFingerprint() {
  try {
    const AudioCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AudioCtx) return Promise.resolve({ hash: 'N/A' });
    return new Promise(function(resolve) {
      try {
        const ctx = new AudioCtx(1, 44100, 44100);
        const oscillator = ctx.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, ctx.currentTime);
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, ctx.currentTime);
        compressor.knee.setValueAtTime(40, ctx.currentTime);
        compressor.ratio.setValueAtTime(12, ctx.currentTime);
        compressor.attack.setValueAtTime(0, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);
        oscillator.connect(compressor);
        compressor.connect(ctx.destination);
        oscillator.start(0);
        ctx.startRendering().then(function(buffer) {
          const data = buffer.getChannelData(0);
          let sum = 0;
          for (let i = 4500; i < 5000; i++) sum += Math.abs(data[i]);
          resolve({ hash: simpleHash(sum.toString()) });
        }).catch(function() { resolve({ hash: 'N/A' }); });
      } catch(e) { resolve({ hash: 'N/A' }); }
    });
  } catch(e) { return Promise.resolve({ hash: 'N/A' }); }
}

function collectNetworkInfo() {
  try {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return { type: 'N/A', downlink: 'N/A', rtt: 'N/A', effectiveType: 'N/A' };
    return {
      type: conn.type || 'N/A',
      downlink: conn.downlink || 'N/A',
      rtt: conn.rtt !== undefined ? conn.rtt : 'N/A',
      effectiveType: conn.effectiveType || 'N/A',
      saveData: conn.saveData || false
    };
  } catch(e) { return { error: e.message }; }
}

async function collectBatteryInfo() {
  try {
    if (!navigator.getBattery) return { level: 'N/A', charging: 'N/A' };
    const battery = await navigator.getBattery();
    return {
      level: Math.round(battery.level * 100) + '%',
      charging: battery.charging,
      chargingTime: battery.chargingTime === Infinity ? 'N/A' : battery.chargingTime,
      dischargingTime: battery.dischargingTime === Infinity ? 'N/A' : battery.dischargingTime
    };
  } catch(e) { return { level: 'N/A', charging: 'N/A' }; }
}

async function collectGeolocation() {
  try {
    const resp = await fetch('http://ip-api.com/json/?fields=status,message,query,city,regionName,country,isp,lat,lon,timezone');
    if (resp.ok) {
      const d = await resp.json();
      if (d.status === 'success') {
        return { ip: d.query, city: d.city, region: d.regionName, country: d.country, isp: d.isp, lat: d.lat, lon: d.lon, timezone: d.timezone };
      }
    }
  } catch(e) {}
  try {
    const resp2 = await fetch('https://ipapi.co/json/');
    if (resp2.ok) {
      const d2 = await resp2.json();
      return { ip: d2.ip, city: d2.city, region: d2.region, country: d2.country_name, isp: d2.org, lat: d2.latitude, lon: d2.longitude, timezone: d2.timezone };
    }
  } catch(e2) {}
  return { ip: 'N/A', city: 'N/A', region: 'N/A', country: 'N/A', isp: 'N/A', lat: 'N/A', lon: 'N/A', timezone: 'N/A' };
}

function collectFonts() {
  try {
    const testFonts = [
      'Arial','Arial Black','Arial Narrow','Bookman Old Style','Calibri','Cambria',
      'Century Gothic','Comic Sans MS','Consolas','Courier','Courier New','Garamond',
      'Georgia','Helvetica','Impact','Lucida Console','Lucida Sans Unicode',
      'Microsoft Sans Serif','Monaco','Palatino Linotype','Segoe UI','Tahoma',
      'Times','Times New Roman','Trebuchet MS','Verdana','Wingdings',
      'Roboto','Open Sans','Lato','Montserrat','Source Code Pro','Fira Code',
      'SF Pro Display','Menlo','Ubuntu','Cantarell','DejaVu Sans','Liberation Mono'
    ];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const testStr = 'mmmmmmmmmmlli';
    const baseFont = 'monospace';
    ctx.font = '72px ' + baseFont;
    const baseWidth = ctx.measureText(testStr).width;
    const detected = [];
    testFonts.forEach(function(font) {
      ctx.font = '72px "' + font + '", ' + baseFont;
      const w = ctx.measureText(testStr).width;
      if (w !== baseWidth) detected.push(font);
    });
    return { detected: detected, count: detected.length, tested: testFonts.length };
  } catch(e) { return { detected: [], count: 0, error: e.message }; }
}

function collectPlugins() {
  try {
    const plugins = [];
    if (navigator.plugins) {
      for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
      }
    }
    return { list: plugins.length > 0 ? plugins : ['None detected'], count: plugins.length };
  } catch(e) { return { list: ['N/A'], count: 0 }; }
}

function collectPrivacySettings() {
  try {
    let adBlocker = false;
    try {
      const ad = document.createElement('div');
      ad.innerHTML = '&nbsp;';
      ad.className = 'adsbox ad-placement ad-banner textads sponsor';
      ad.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;';
      document.body.appendChild(ad);
      adBlocker = ad.offsetHeight === 0 || ad.clientHeight === 0;
      document.body.removeChild(ad);
    } catch(e) { adBlocker = true; }
    let lsAvail = false;
    try { localStorage.setItem('_test', '1'); localStorage.removeItem('_test'); lsAvail = true; } catch(e) {}
    let ssAvail = false;
    try { sessionStorage.setItem('_test', '1'); sessionStorage.removeItem('_test'); ssAvail = true; } catch(e) {}
    return {
      doNotTrack: navigator.doNotTrack === '1' || window.doNotTrack === '1' ? 'Enabled' : 'Disabled',
      cookieEnabled: navigator.cookieEnabled ? 'Yes' : 'No',
      localStorage: lsAvail ? 'Available' : 'Blocked',
      sessionStorage: ssAvail ? 'Available' : 'Blocked',
      adBlocker: adBlocker ? 'Detected' : 'Not detected'
    };
  } catch(e) { return { error: e.message }; }
}

function collectInputCapabilities() {
  try {
    return {
      touchSupport: 'ontouchstart' in window ? 'Yes' : 'No',
      maxTouchPoints: navigator.maxTouchPoints || 0,
      pointerType: window.PointerEvent ? 'Supported' : 'Not supported',
      onscreenKeyboard: navigator.virtualKeyboard ? 'Available' : 'N/A'
    };
  } catch(e) { return { error: e.message }; }
}

async function collectMediaDevices() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { cameras: 'N/A', microphones: 'N/A', speakers: 'N/A' };
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    let cameras = 0, mics = 0, speakers = 0;
    devices.forEach(function(d) {
      if (d.kind === 'videoinput') cameras++;
      else if (d.kind === 'audioinput') mics++;
      else if (d.kind === 'audiooutput') speakers++;
    });
    return { cameras: cameras, microphones: mics, speakers: speakers };
  } catch(e) { return { cameras: 'N/A', microphones: 'N/A', speakers: 'N/A' }; }
}

function collectTimezoneInfo() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions();
    return {
      timezone: tz.timeZone || 'N/A',
      utcOffset: 'UTC' + (new Date().getTimezoneOffset() <= 0 ? '+' : '-') + Math.abs(Math.floor(new Date().getTimezoneOffset() / 60)),
      locale: tz.locale || navigator.language || 'N/A',
      calendar: tz.calendar || 'N/A',
      numberingSystem: tz.numberingSystem || 'N/A'
    };
  } catch(e) { return { error: e.message }; }
}

async function collectCookieInfo() {
  try {
    const cookieStr = document.cookie;
    const names = cookieStr ? cookieStr.split(';').map(function(c) { return c.trim().split('=')[0]; }) : [];
    let quota = 'N/A', usage = 'N/A';
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        quota = (est.quota / (1024 * 1024)).toFixed(0) + ' MB';
        usage = (est.usage / (1024 * 1024)).toFixed(2) + ' MB';
      } catch(e) {}
    }
    return {
      cookieCount: names.length,
      cookieNames: names.length > 0 ? names : ['None'],
      storageQuota: quota,
      storageUsage: usage
    };
  } catch(e) { return { error: e.message }; }
}
