/* ========================================
   me2me — Data Broker Analytics
   Vanilla JS — All data collection, scoring,
   dashboard rendering, and AI prompt generation
   ======================================== */

// ---------------------
// Simple Hash (djb2)
// ---------------------
function simpleHash(str) {
  var hash = 5381;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // convert to 32-bit int
  }
  var hex = (hash >>> 0).toString(16);
  return hex;
}

// ---------------------
// Data Collection Functions
// ---------------------

function collectBrowserInfo() {
  try {
    return {
      userAgent: navigator.userAgent || 'Not available',
      platform: navigator.platform || 'Not available',
      vendor: navigator.vendor || 'Not available',
      appVersion: navigator.appVersion || 'Not available',
      language: navigator.language || 'Not available',
      languages: navigator.languages ? Array.from(navigator.languages) : ['Not available'],
      cookieEnabled: navigator.cookieEnabled
    };
  } catch (e) {
    return { error: 'Not available' };
  }
}

function collectScreenInfo() {
  try {
    var orient = 'Not available';
    if (screen.orientation && screen.orientation.type) {
      orient = screen.orientation.type;
    } else if (typeof window.orientation !== 'undefined') {
      orient = window.orientation === 0 ? 'portrait' : 'landscape';
    }
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: orient
    };
  } catch (e) {
    return { error: 'Not available' };
  }
}

function collectHardwareInfo() {
  try {
    var gpuRenderer = 'Not available';
    var gpuVendor = 'Not available';
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        }
        var loseCtx = gl.getExtension('WEBGL_lose_context');
        if (loseCtx) loseCtx.loseContext();
      }
    } catch (glErr) {
      // GPU info not available
    }
    return {
      cpuCores: navigator.hardwareConcurrency || 'Not available',
      deviceMemory: navigator.deviceMemory || 'Not available',
      gpuRenderer: gpuRenderer,
      gpuVendor: gpuVendor
    };
  } catch (e) {
    return { error: 'Not available' };
  }
}

function collectCanvasFingerprint() {
  try {
    var canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 60;
    var ctx = canvas.getContext('2d');
    if (!ctx) return { hash: 'Not available' };

    // Draw text
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(10, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.font = '14px Arial';
    ctx.fillText('me2me fingerprint <canvas> 1.0', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.font = '18px Times New Roman';
    ctx.fillText('me2me fingerprint <canvas> 1.0', 4, 45);

    // Draw shapes
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(255,0,255)';
    ctx.beginPath();
    ctx.arc(50, 50, 25, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgb(0,255,255)';
    ctx.beginPath();
    ctx.arc(80, 50, 25, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgb(255,255,0)';
    ctx.beginPath();
    ctx.arc(65, 30, 25, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    var dataURL = canvas.toDataURL();
    return {
      hash: simpleHash(dataURL),
      dataLength: dataURL.length
    };
  } catch (e) {
    return { hash: 'Not available' };
  }
}

function collectWebGLFingerprint() {
  try {
    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { hash: 'Not available' };

    var renderer = 'Not available';
    var vendor = 'Not available';
    var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    }

    var extensions = gl.getSupportedExtensions() || [];
    var combined = renderer + '|' + vendor + '|' + extensions.join(',');

    var loseCtx = gl.getExtension('WEBGL_lose_context');
    if (loseCtx) loseCtx.loseContext();

    return {
      renderer: renderer,
      vendor: vendor,
      extensionsCount: extensions.length,
      extensions: extensions,
      hash: simpleHash(combined)
    };
  } catch (e) {
    return { hash: 'Not available' };
  }
}

function collectAudioFingerprint() {
  try {
    var AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AudioContext) return Promise.resolve({ hash: 'Not available' });

    var context = new AudioContext(1, 44100, 44100);
    var oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    var compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);

    return context.startRendering().then(function(buffer) {
      var data = buffer.getChannelData(0);
      var sum = 0;
      for (var i = 4500; i < 5000; i++) {
        sum += Math.abs(data[i]);
      }
      return {
        hash: simpleHash(sum.toString()),
        sampleSum: sum
      };
    }).catch(function() {
      return { hash: 'Not available' };
    });
  } catch (e) {
    return Promise.resolve({ hash: 'Not available' });
  }
}

function collectNetworkInfo() {
  try {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return { status: 'Not available' };
    return {
      type: conn.type || 'Not available',
      downlink: conn.downlink !== undefined ? conn.downlink + ' Mbps' : 'Not available',
      rtt: conn.rtt !== undefined ? conn.rtt + ' ms' : 'Not available',
      effectiveType: conn.effectiveType || 'Not available',
      saveData: conn.saveData !== undefined ? conn.saveData : 'Not available'
    };
  } catch (e) {
    return { status: 'Not available' };
  }
}

function collectBatteryInfo() {
  try {
    if (!navigator.getBattery) return Promise.resolve({ status: 'Not available' });
    return navigator.getBattery().then(function(battery) {
      return {
        level: (battery.level * 100).toFixed(0) + '%',
        charging: battery.charging,
        chargingTime: battery.chargingTime === Infinity ? 'N/A' : battery.chargingTime + 's',
        dischargingTime: battery.dischargingTime === Infinity ? 'N/A' : battery.dischargingTime + 's'
      };
    }).catch(function() {
      return { status: 'Not available' };
    });
  } catch (e) {
    return Promise.resolve({ status: 'Not available' });
  }
}

function collectGeolocation() {
  return fetch('http://ip-api.com/json/')
    .then(function(res) {
      if (!res.ok) throw new Error('Primary API failed');
      return res.json();
    })
    .then(function(data) {
      return {
        ip: data.query || 'Not available',
        city: data.city || 'Not available',
        region: data.regionName || 'Not available',
        country: data.country || 'Not available',
        isp: data.isp || 'Not available',
        lat: data.lat || 'Not available',
        lon: data.lon || 'Not available',
        org: data.org || 'Not available',
        timezone: data.timezone || 'Not available'
      };
    })
    .catch(function() {
      // Fallback to ipapi.co
      return fetch('https://ipapi.co/json/')
        .then(function(res) {
          if (!res.ok) throw new Error('Fallback API failed');
          return res.json();
        })
        .then(function(data) {
          return {
            ip: data.ip || 'Not available',
            city: data.city || 'Not available',
            region: data.region || 'Not available',
            country: data.country_name || 'Not available',
            isp: data.org || 'Not available',
            lat: data.latitude || 'Not available',
            lon: data.longitude || 'Not available',
            org: data.org || 'Not available',
            timezone: data.timezone || 'Not available'
          };
        })
        .catch(function() {
          return { ip: 'Not available', city: 'Not available', error: 'Geolocation lookup failed' };
        });
    });
}

function collectFonts() {
  try {
    var testFonts = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Bookman Old Style', 'Calibri',
      'Cambria', 'Century', 'Century Gothic', 'Comic Sans MS', 'Consolas',
      'Constantia', 'Corbel', 'Courier', 'Courier New', 'Garamond',
      'Geneva', 'Georgia', 'Gill Sans', 'Helvetica', 'Helvetica Neue',
      'Impact', 'Lucida Console', 'Lucida Grande', 'Lucida Sans Unicode',
      'Microsoft Sans Serif', 'Monaco', 'Palatino', 'Palatino Linotype',
      'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS',
      'Verdana', 'Wingdings', 'Futura', 'Optima', 'Candara',
      'Franklin Gothic Medium', 'Rockwell'
    ];

    var canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 40;
    var ctx = canvas.getContext('2d');
    if (!ctx) return { detected: [], count: 0 };

    var testString = 'mmmmmmmmmmlli10OQ';
    var baseFont = 'monospace';
    var fontSize = '72px';

    // Measure baseline
    ctx.font = fontSize + ' ' + baseFont;
    var baselineWidth = ctx.measureText(testString).width;

    var detected = [];
    for (var i = 0; i < testFonts.length; i++) {
      ctx.font = fontSize + ' "' + testFonts[i] + '", ' + baseFont;
      var testWidth = ctx.measureText(testString).width;
      if (testWidth !== baselineWidth) {
        detected.push(testFonts[i]);
      }
    }

    return {
      detected: detected,
      count: detected.length,
      hash: simpleHash(detected.join(','))
    };
  } catch (e) {
    return { detected: [], count: 0, error: 'Not available' };
  }
}

function collectPlugins() {
  try {
    var plugins = [];
    if (navigator.plugins && navigator.plugins.length > 0) {
      for (var i = 0; i < navigator.plugins.length; i++) {
        plugins.push({
          name: navigator.plugins[i].name,
          filename: navigator.plugins[i].filename,
          description: navigator.plugins[i].description
        });
      }
    }

    var mimeTypes = [];
    if (navigator.mimeTypes && navigator.mimeTypes.length > 0) {
      for (var j = 0; j < navigator.mimeTypes.length; j++) {
        mimeTypes.push(navigator.mimeTypes[j].type);
      }
    }

    return {
      plugins: plugins.length > 0 ? plugins : 'None detected',
      pluginCount: plugins.length,
      mimeTypes: mimeTypes.length > 0 ? mimeTypes : 'None detected',
      mimeTypeCount: mimeTypes.length
    };
  } catch (e) {
    return { plugins: 'Not available', mimeTypes: 'Not available' };
  }
}

function collectPrivacySettings() {
  try {
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    var dntStatus;
    if (dnt === '1' || dnt === 'yes') {
      dntStatus = 'Enabled';
    } else if (dnt === '0' || dnt === 'no') {
      dntStatus = 'Disabled';
    } else {
      dntStatus = 'Not set';
    }

    var localStorageAvailable = false;
    try {
      localStorage.setItem('__me2me_test__', '1');
      localStorage.removeItem('__me2me_test__');
      localStorageAvailable = true;
    } catch (e) {
      localStorageAvailable = false;
    }

    var sessionStorageAvailable = false;
    try {
      sessionStorage.setItem('__me2me_test__', '1');
      sessionStorage.removeItem('__me2me_test__');
      sessionStorageAvailable = true;
    } catch (e) {
      sessionStorageAvailable = false;
    }

    // Ad blocker detection
    var adBlockDetected = false;
    try {
      var adDiv = document.createElement('div');
      adDiv.className = 'adsbox ad-placement ad-banner textAd advertisment';
      adDiv.style.position = 'absolute';
      adDiv.style.left = '-9999px';
      adDiv.style.top = '-9999px';
      adDiv.style.width = '1px';
      adDiv.style.height = '1px';
      adDiv.innerHTML = '&nbsp;';
      document.body.appendChild(adDiv);
      if (adDiv.offsetHeight === 0 || adDiv.offsetParent === null ||
          window.getComputedStyle(adDiv).display === 'none' ||
          window.getComputedStyle(adDiv).visibility === 'hidden') {
        adBlockDetected = true;
      }
      document.body.removeChild(adDiv);
    } catch (e) {
      adBlockDetected = false;
    }

    return {
      doNotTrack: dntStatus,
      cookieEnabled: navigator.cookieEnabled,
      localStorageAvailable: localStorageAvailable,
      sessionStorageAvailable: sessionStorageAvailable,
      adBlockerDetected: adBlockDetected
    };
  } catch (e) {
    return { error: 'Not available' };
  }
}

function collectInputCapabilities() {
  try {
    var maxTouchPoints = navigator.maxTouchPoints || 0;
    var hasTouchStart = 'ontouchstart' in window;
    var pointerType = 'Not available';

    if (window.PointerEvent) {
      if (maxTouchPoints > 0) {
        pointerType = 'touch + pointer';
      } else {
        pointerType = 'pointer (mouse/pen)';
      }
    } else if (hasTouchStart) {
      pointerType = 'touch';
    } else {
      pointerType = 'mouse';
    }

    return {
      maxTouchPoints: maxTouchPoints,
      touchSupport: hasTouchStart,
      pointerType: pointerType
    };
  } catch (e) {
    return { error: 'Not available' };
  }
}

function collectMediaDevices() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return Promise.resolve({ status: 'Not available' });
    }
    return navigator.mediaDevices.enumerateDevices().then(function(devices) {
      var counts = { audioinput: 0, audiooutput: 0, videoinput: 0 };
      devices.forEach(function(device) {
        if (counts[device.kind] !== undefined) {
          counts[device.kind]++;
        }
      });
      return {
        microphones: counts.audioinput,
        speakers: counts.audiooutput,
        cameras: counts.videoinput,
        totalDevices: devices.length
      };
    }).catch(function() {
      return { status: 'Not available' };
    });
  } catch (e) {
    return Promise.resolve({ status: 'Not available' });
  }
}

function collectTimezoneInfo() {
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Not available';
    var offset = new Date().getTimezoneOffset();
    var offsetHours = -(offset / 60);
    var offsetStr = 'UTC' + (offsetHours >= 0 ? '+' : '') + offsetHours;
    var locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || 'Not available';

    return {
      timezone: tz,
      utcOffset: offsetStr,
      locale: locale,
      timezoneOffsetMinutes: offset
    };
  } catch (e) {
    return { timezone: 'Not available', utcOffset: 'Not available', locale: 'Not available' };
  }
}

function collectCookieInfo() {
  try {
    var cookieNames = [];
    if (document.cookie && document.cookie.length > 0) {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var name = cookies[i].trim().split('=')[0];
        if (name) cookieNames.push(name);
      }
    }

    var result = {
      cookieNames: cookieNames.length > 0 ? cookieNames : 'None',
      cookieCount: cookieNames.length
    };

    if (navigator.storage && navigator.storage.estimate) {
      return navigator.storage.estimate().then(function(estimate) {
        result.storageQuota = formatBytes(estimate.quota);
        result.storageUsage = formatBytes(estimate.usage);
        return result;
      }).catch(function() {
        result.storageQuota = 'Not available';
        result.storageUsage = 'Not available';
        return result;
      });
    }

    return Promise.resolve(result);
  } catch (e) {
    return Promise.resolve({ cookieNames: 'Not available', cookieCount: 0 });
  }
}

function formatBytes(bytes) {
  if (bytes === 0 || bytes === undefined) return '0 Bytes';
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  var i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

// ---------------------
// Orchestrator
// ---------------------

var scanData = null;

async function runFullScan() {
  var scanBtn = document.getElementById('scan-btn');
  var progressSection = document.getElementById('scan-progress');
  var progressFill = document.getElementById('progress-fill');
  var scanStatus = document.getElementById('scan-status');

  scanBtn.classList.add('scanning');
  scanBtn.textContent = 'Scanning...';
  progressSection.style.display = '';
  progressFill.style.width = '0%';

  var modules = [
    { key: 'browser', name: 'Browser Info', fn: function() { return collectBrowserInfo(); } },
    { key: 'screen', name: 'Screen Info', fn: function() { return collectScreenInfo(); } },
    { key: 'hardware', name: 'Hardware Info', fn: function() { return collectHardwareInfo(); } },
    { key: 'canvas', name: 'Canvas Fingerprint', fn: function() { return collectCanvasFingerprint(); } },
    { key: 'webgl', name: 'WebGL Fingerprint', fn: function() { return collectWebGLFingerprint(); } },
    { key: 'audio', name: 'Audio Fingerprint', fn: function() { return collectAudioFingerprint(); } },
    { key: 'network', name: 'Network Info', fn: function() { return collectNetworkInfo(); } },
    { key: 'battery', name: 'Battery Info', fn: function() { return collectBatteryInfo(); } },
    { key: 'geo', name: 'Geolocation (IP)', fn: function() { return collectGeolocation(); } },
    { key: 'fonts', name: 'Font Detection', fn: function() { return collectFonts(); } },
    { key: 'plugins', name: 'Plugins & MIME Types', fn: function() { return collectPlugins(); } },
    { key: 'privacy', name: 'Privacy Settings', fn: function() { return collectPrivacySettings(); } },
    { key: 'input', name: 'Input Capabilities', fn: function() { return collectInputCapabilities(); } },
    { key: 'media', name: 'Media Devices', fn: function() { return collectMediaDevices(); } },
    { key: 'timezone', name: 'Timezone Info', fn: function() { return collectTimezoneInfo(); } },
    { key: 'cookies', name: 'Cookie Info', fn: function() { return collectCookieInfo(); } }
  ];

  var data = {};
  var total = modules.length;

  for (var i = 0; i < modules.length; i++) {
    var mod = modules[i];
    scanStatus.textContent = 'Scanning: ' + mod.name + '...';
    var pct = Math.round(((i) / total) * 100);
    progressFill.style.width = pct + '%';

    try {
      var result = mod.fn();
      if (result && typeof result.then === 'function') {
        data[mod.key] = await result;
      } else {
        data[mod.key] = result;
      }
    } catch (e) {
      data[mod.key] = { error: 'Collection failed' };
    }

    // Small delay so user can see progress
    await new Promise(function(resolve) { setTimeout(resolve, 80); });
  }

  data.timestamp = new Date().toISOString();
  progressFill.style.width = '100%';
  scanStatus.textContent = 'Scan complete!';

  // Save to localStorage
  try {
    localStorage.setItem('me2me_scan', JSON.stringify(data));
  } catch (e) {
    // Storage might be full or unavailable
  }

  scanData = data;

  // Short pause then show results
  await new Promise(function(resolve) { setTimeout(resolve, 400); });

  renderDashboard(data);
  calculateExposureScore(data);

  // Show sections
  document.getElementById('score-section').style.display = '';
  document.getElementById('dashboard').style.display = '';
  document.getElementById('broker-info').style.display = '';
  document.getElementById('prompt-section').style.display = '';

  // Reset scan button
  scanBtn.classList.remove('scanning');
  scanBtn.innerHTML = '<span class="scan-icon">&#x1F50D;</span> Scan Again';

  // Scroll to score
  document.getElementById('score-section').scrollIntoView({ behavior: 'smooth' });
}

// ---------------------
// Dashboard Renderer
// ---------------------

var categoryLabels = {
  browser: 'Browser',
  screen: 'Screen',
  hardware: 'Hardware',
  canvas: 'Canvas Fingerprint',
  webgl: 'WebGL Fingerprint',
  audio: 'Audio Fingerprint',
  network: 'Network',
  battery: 'Battery',
  geo: 'Geolocation',
  fonts: 'Fonts',
  plugins: 'Plugins',
  privacy: 'Privacy',
  input: 'Input Capabilities',
  media: 'Media Devices',
  timezone: 'Timezone',
  cookies: 'Cookies'
};

function renderDashboard(data) {
  var grid = document.getElementById('cards-grid');
  grid.innerHTML = '';

  var keys = ['browser', 'screen', 'hardware', 'canvas', 'webgl', 'audio',
              'network', 'battery', 'geo', 'fonts', 'plugins', 'privacy',
              'input', 'media', 'timezone', 'cookies'];

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var catData = data[key];
    if (!catData) continue;

    var card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = (i * 0.05) + 's';

    var title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = categoryLabels[key] || key;
    card.appendChild(title);

    renderCardContent(card, catData);
    grid.appendChild(card);
  }
}

function renderCardContent(card, obj) {
  if (typeof obj !== 'object' || obj === null) {
    var row = document.createElement('div');
    row.className = 'card-row';
    var valSpan = document.createElement('span');
    valSpan.className = 'card-val';
    valSpan.textContent = String(obj);
    row.appendChild(valSpan);
    card.appendChild(row);
    return;
  }

  var entries = Object.keys(obj);
  for (var i = 0; i < entries.length; i++) {
    var k = entries[i];
    var v = obj[k];

    var row = document.createElement('div');
    row.className = 'card-row';

    var keySpan = document.createElement('span');
    keySpan.className = 'card-key';
    keySpan.textContent = formatKeyName(k);

    var valSpan = document.createElement('span');
    valSpan.className = 'card-val';

    if (Array.isArray(v)) {
      if (v.length === 0) {
        valSpan.textContent = 'None';
      } else if (v.length <= 5) {
        valSpan.textContent = v.join(', ');
      } else {
        valSpan.textContent = v.slice(0, 5).join(', ') + ' ... (' + v.length + ' total)';
      }
    } else if (typeof v === 'object' && v !== null) {
      // Nested objects: show as key-value pairs
      var parts = [];
      var subKeys = Object.keys(v);
      for (var j = 0; j < subKeys.length; j++) {
        parts.push(subKeys[j] + ': ' + v[subKeys[j]]);
      }
      valSpan.textContent = parts.join(', ');
    } else if (typeof v === 'boolean') {
      valSpan.textContent = v ? 'Yes' : 'No';
    } else {
      valSpan.textContent = String(v);
    }

    row.appendChild(keySpan);
    row.appendChild(valSpan);
    card.appendChild(row);
  }
}

function formatKeyName(key) {
  // camelCase to Title Case
  var result = key.replace(/([A-Z])/g, ' $1');
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

// ---------------------
// Exposure Score
// ---------------------

function calculateExposureScore(data) {
  var score = 0;

  // +15 if geo has city
  if (data.geo && data.geo.city && data.geo.city !== 'Not available') {
    score += 15;
  }

  // +15 if webgl has specific GPU renderer
  if (data.webgl && data.webgl.renderer && data.webgl.renderer !== 'Not available') {
    score += 15;
  }

  // +10 if canvas hash exists
  if (data.canvas && data.canvas.hash && data.canvas.hash !== 'Not available') {
    score += 10;
  }

  // +10 if audio hash exists
  if (data.audio && data.audio.hash && data.audio.hash !== 'Not available') {
    score += 10;
  }

  // +10 if battery info available
  if (data.battery && !data.battery.status) {
    score += 10;
  }

  // +10 if fonts detected > 20
  if (data.fonts && data.fonts.count && data.fonts.count > 20) {
    score += 10;
  }

  // +10 if hardware has deviceMemory or cpuCores
  if (data.hardware && (
      (data.hardware.deviceMemory && data.hardware.deviceMemory !== 'Not available') ||
      (data.hardware.cpuCores && data.hardware.cpuCores !== 'Not available')
    )) {
    score += 10;
  }

  // +5 if media devices found
  if (data.media && data.media.totalDevices && data.media.totalDevices > 0) {
    score += 5;
  }

  // +5 if network info available
  if (data.network && !data.network.status) {
    score += 5;
  }

  // +5 if DNT is off
  if (data.privacy && (data.privacy.doNotTrack === 'Disabled' || data.privacy.doNotTrack === 'Not set')) {
    score += 5;
  }

  // +5 if no ad blocker
  if (data.privacy && data.privacy.adBlockerDetected === false) {
    score += 5;
  }

  // Cap at 100
  if (score > 100) score = 100;

  // Update UI
  var circumference = 326.73;
  var offset = circumference - (score / 100) * circumference;
  var circle = document.getElementById('score-circle');
  var scoreNum = document.getElementById('score-number');
  var scoreDesc = document.getElementById('score-desc');
  var scoreRing = document.getElementById('score-ring');

  circle.style.strokeDashoffset = offset;
  scoreNum.textContent = score;

  // Remove old classes
  scoreRing.classList.remove('score-low', 'score-mid', 'score-high');

  if (score <= 35) {
    scoreRing.classList.add('score-low');
    scoreDesc.textContent = 'Low exposure. Your browser reveals relatively little identifying information. Good privacy posture.';
  } else if (score <= 65) {
    scoreRing.classList.add('score-mid');
    scoreDesc.textContent = 'Moderate exposure. Data brokers can build a partial profile from your browser fingerprint. Consider reviewing your privacy settings.';
  } else {
    scoreRing.classList.add('score-high');
    scoreDesc.textContent = 'High exposure. Your browser is leaking significant identifying data. Data brokers can likely build a detailed profile of you. Immediate action recommended.';
  }

  return score;
}

// ---------------------
// AI Prompt Generator
// ---------------------

function generateAIPrompt(data) {
  var score = calculateExposureScore(data);

  var prompt = 'You are a privacy analyst and digital security expert. I have run a browser fingerprint and data exposure scan using the me2me tool. Please analyze the following data and provide:\n\n';
  prompt += '1. UNIQUENESS ANALYSIS: How unique is my browser fingerprint? How easily could I be identified across websites?\n';
  prompt += '2. DATA BROKER EXPOSURE: Which major data brokers (Spokeo, Acxiom, Experian, Equifax, LexisNexis, BeenVerified, WhitePages, Radaris, Intelius, PeopleFinder) could use this data to build or enhance a profile on me?\n';
  prompt += '3. CROSS-REFERENCE RISK: How could this browser data be combined with public records, purchase history, social media, or location data to build a more complete profile?\n';
  prompt += '4. PRIVACY VULNERABILITIES: What are the most critical privacy vulnerabilities revealed by this scan?\n';
  prompt += '5. ACTIONABLE RECOMMENDATIONS: Provide specific, prioritized steps I can take right now to reduce my digital exposure.\n\n';
  prompt += '---\n\n';
  prompt += 'PRIVACY EXPOSURE SCORE: ' + score + '/100\n\n';

  var categories = [
    { key: 'browser', label: 'BROWSER INFO' },
    { key: 'screen', label: 'SCREEN INFO' },
    { key: 'hardware', label: 'HARDWARE INFO' },
    { key: 'canvas', label: 'CANVAS FINGERPRINT' },
    { key: 'webgl', label: 'WEBGL FINGERPRINT' },
    { key: 'audio', label: 'AUDIO FINGERPRINT' },
    { key: 'network', label: 'NETWORK INFO' },
    { key: 'battery', label: 'BATTERY INFO' },
    { key: 'geo', label: 'GEOLOCATION (IP-BASED)' },
    { key: 'fonts', label: 'DETECTED FONTS' },
    { key: 'plugins', label: 'PLUGINS & MIME TYPES' },
    { key: 'privacy', label: 'PRIVACY SETTINGS' },
    { key: 'input', label: 'INPUT CAPABILITIES' },
    { key: 'media', label: 'MEDIA DEVICES' },
    { key: 'timezone', label: 'TIMEZONE INFO' },
    { key: 'cookies', label: 'COOKIE INFO' }
  ];

  for (var i = 0; i < categories.length; i++) {
    var cat = categories[i];
    prompt += '--- ' + cat.label + ' ---\n';
    if (data[cat.key]) {
      prompt += JSON.stringify(data[cat.key], null, 2) + '\n\n';
    } else {
      prompt += 'Not collected\n\n';
    }
  }

  prompt += '---\n\n';
  prompt += 'DATA BROKER CONTEXT:\n';
  prompt += 'Major data brokers that may use browser fingerprinting and associated data:\n';
  prompt += '- Spokeo: Aggregates phone, email, address, social media, court records\n';
  prompt += '- Acxiom: Collects demographics, purchase behavior, financial data\n';
  prompt += '- Experian: Tracks credit history, financial records, identity data\n';
  prompt += '- Equifax: Maintains credit reports, employment, financial history\n';
  prompt += '- LexisNexis: Aggregates public records, court filings, property, licenses\n';
  prompt += '- BeenVerified: Compiles contact info, criminal records, property, assets\n';
  prompt += '- WhitePages: Links name, address, phone, relatives, neighbors\n';
  prompt += '- Radaris: Collects contact info, social profiles, property records\n';
  prompt += '- Intelius: Runs background checks, criminal, address, phone lookups\n';
  prompt += '- PeopleFinder: Tracks address history, phone, email, relatives\n\n';
  prompt += 'Please provide a thorough analysis with specific, actionable recommendations based on my actual data above.';

  return prompt;
}

// ---------------------
// Event Listeners
// ---------------------

document.addEventListener('DOMContentLoaded', function() {

  // Check for previous scan
  try {
    var saved = localStorage.getItem('me2me_scan');
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && parsed.timestamp) {
        var notice = document.getElementById('previous-scan-notice');
        var timeSpan = document.getElementById('prev-scan-time');
        var scanDate = new Date(parsed.timestamp);
        timeSpan.textContent = scanDate.toLocaleString();
        notice.style.display = '';
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  // Scan button
  document.getElementById('scan-btn').addEventListener('click', function() {
    runFullScan();
  });

  // Load previous scan
  document.getElementById('load-previous-btn').addEventListener('click', function() {
    try {
      var saved = localStorage.getItem('me2me_scan');
      if (saved) {
        var data = JSON.parse(saved);
        scanData = data;
        renderDashboard(data);
        calculateExposureScore(data);
        document.getElementById('score-section').style.display = '';
        document.getElementById('dashboard').style.display = '';
        document.getElementById('broker-info').style.display = '';
        document.getElementById('prompt-section').style.display = '';
        document.getElementById('score-section').scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e) {
      alert('Failed to load previous scan data.');
    }
  });

  // Generate AI prompt
  document.getElementById('generate-prompt-btn').addEventListener('click', function() {
    if (!scanData) {
      alert('Please run a scan first.');
      return;
    }
    var prompt = generateAIPrompt(scanData);
    var textarea = document.getElementById('prompt-text');
    textarea.value = prompt;
    document.getElementById('prompt-output').style.display = '';
  });

  // Copy prompt to clipboard
  document.getElementById('copy-prompt-btn').addEventListener('click', function() {
    var textarea = document.getElementById('prompt-text');
    var feedback = document.getElementById('copy-feedback');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textarea.value).then(function() {
        feedback.style.display = '';
        setTimeout(function() {
          feedback.style.display = 'none';
        }, 2000);
      }).catch(function() {
        fallbackCopy(textarea, feedback);
      });
    } else {
      fallbackCopy(textarea, feedback);
    }
  });

});

function fallbackCopy(textarea, feedback) {
  textarea.select();
  textarea.setSelectionRange(0, 99999);
  try {
    document.execCommand('copy');
    feedback.style.display = '';
    setTimeout(function() {
      feedback.style.display = 'none';
    }, 2000);
  } catch (e) {
    alert('Failed to copy. Please select the text and copy manually.');
  }
}
