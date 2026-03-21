/* me2me — Main App: Orchestrator, Renderer, Score, Prompt Generator */

/* ---- Scan Orchestrator ---- */
async function runFullScan() {
  const scanBtn = document.getElementById('scan-btn');
  const progressSection = document.getElementById('scan-progress');
  const progressFill = document.getElementById('progress-fill');
  const scanStatus = document.getElementById('scan-status');

  scanBtn.classList.add('scanning');
  scanBtn.textContent = 'Scanning...';
  progressSection.style.display = 'block';
  document.getElementById('previous-scan-notice').style.display = 'none';

  const modules = [
    { name: 'Browser & OS', key: 'browser', fn: function() { return collectBrowserInfo(); } },
    { name: 'Screen & Display', key: 'screen', fn: function() { return collectScreenInfo(); } },
    { name: 'Hardware', key: 'hardware', fn: function() { return collectHardwareInfo(); } },
    { name: 'Canvas Fingerprint', key: 'canvas', fn: function() { return collectCanvasFingerprint(); } },
    { name: 'WebGL Fingerprint', key: 'webgl', fn: function() { return collectWebGLFingerprint(); } },
    { name: 'Audio Fingerprint', key: 'audio', fn: function() { return collectAudioFingerprint(); } },
    { name: 'Network Info', key: 'network', fn: function() { return collectNetworkInfo(); } },
    { name: 'Battery Status', key: 'battery', fn: function() { return collectBatteryInfo(); } },
    { name: 'IP Geolocation', key: 'geo', fn: function() { return collectGeolocation(); } },
    { name: 'Font Detection', key: 'fonts', fn: function() { return collectFonts(); } },
    { name: 'Browser Plugins', key: 'plugins', fn: function() { return collectPlugins(); } },
    { name: 'Privacy Settings', key: 'privacy', fn: function() { return collectPrivacySettings(); } },
    { name: 'Input Capabilities', key: 'input', fn: function() { return collectInputCapabilities(); } },
    { name: 'Media Devices', key: 'media', fn: function() { return collectMediaDevices(); } },
    { name: 'Timezone & Locale', key: 'timezone', fn: function() { return collectTimezoneInfo(); } },
    { name: 'Cookies & Storage', key: 'cookies', fn: function() { return collectCookieInfo(); } }
  ];

  const data = { timestamp: new Date().toISOString() };

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    scanStatus.textContent = 'Scanning: ' + mod.name + '...';
    progressFill.style.width = Math.round(((i + 1) / modules.length) * 100) + '%';
    try {
      data[mod.key] = await Promise.resolve(mod.fn());
    } catch(e) {
      data[mod.key] = { error: e.message };
    }
    await new Promise(function(r) { setTimeout(r, 80); });
  }

  scanStatus.textContent = 'Scan complete!';
  progressFill.style.width = '100%';

  try {
    localStorage.setItem('me2me_scan', JSON.stringify(data));
  } catch(e) {}

  setTimeout(function() {
    progressSection.style.display = 'none';
    scanBtn.classList.remove('scanning');
    scanBtn.innerHTML = '<span class="scan-icon">&#x1F50D;</span> Re-Scan';
    renderDashboard(data);
    calculateExposureScore(data);
    document.getElementById('score-section').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('broker-info').style.display = 'block';
    document.getElementById('prompt-section').style.display = 'block';
    document.getElementById('score-section').scrollIntoView({ behavior: 'smooth' });
  }, 500);
}

/* ---- Dashboard Renderer ---- */
function renderDashboard(data) {
  var grid = document.getElementById('cards-grid');
  grid.innerHTML = '';

  var cardDefs = [
    { title: 'Browser & OS', key: 'browser' },
    { title: 'Screen & Display', key: 'screen' },
    { title: 'Hardware', key: 'hardware' },
    { title: 'Canvas Fingerprint', key: 'canvas' },
    { title: 'WebGL Fingerprint', key: 'webgl' },
    { title: 'Audio Fingerprint', key: 'audio' },
    { title: 'Network & Location', key: 'geo' },
    { title: 'Network Connection', key: 'network' },
    { title: 'Battery Status', key: 'battery' },
    { title: 'Detected Fonts', key: 'fonts' },
    { title: 'Browser Plugins', key: 'plugins' },
    { title: 'Privacy Settings', key: 'privacy' },
    { title: 'Input Capabilities', key: 'input' },
    { title: 'Media Devices', key: 'media' },
    { title: 'Timezone & Locale', key: 'timezone' },
    { title: 'Cookies & Storage', key: 'cookies' }
  ];

  cardDefs.forEach(function(def, idx) {
    var cardData = data[def.key];
    if (!cardData) return;

    var card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = (idx * 0.06) + 's';

    var title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = def.title;
    card.appendChild(title);

    renderCardContent(card, cardData);
    grid.appendChild(card);
  });
}

function renderCardContent(card, obj) {
  Object.keys(obj).forEach(function(key) {
    var val = obj[key];
    var row = document.createElement('div');
    row.className = 'card-row';

    var keyEl = document.createElement('span');
    keyEl.className = 'card-key';
    keyEl.textContent = formatKey(key);

    var valEl = document.createElement('span');
    valEl.className = 'card-val';

    if (Array.isArray(val)) {
      valEl.textContent = val.length > 5 ? val.slice(0, 5).join(', ') + ' (+' + (val.length - 5) + ' more)' : val.join(', ');
    } else if (typeof val === 'object' && val !== null) {
      valEl.textContent = JSON.stringify(val);
    } else {
      valEl.textContent = String(val);
    }

    row.appendChild(keyEl);
    row.appendChild(valEl);
    card.appendChild(row);
  });
}

function formatKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, function(s) { return s.toUpperCase(); }).replace(/_/g, ' ');
}

/* ---- Exposure Score ---- */
function calculateExposureScore(data) {
  var score = 0;

  if (data.geo && data.geo.city && data.geo.city !== 'N/A') score += 15;
  if (data.webgl && data.webgl.renderer && data.webgl.renderer !== 'N/A') score += 15;
  if (data.canvas && data.canvas.hash && data.canvas.hash !== 'N/A') score += 10;
  if (data.audio && data.audio.hash && data.audio.hash !== 'N/A') score += 10;
  if (data.battery && data.battery.level && data.battery.level !== 'N/A') score += 10;
  if (data.fonts && data.fonts.count && data.fonts.count > 20) score += 10;
  if (data.hardware && (data.hardware.deviceMemory !== 'N/A' || data.hardware.cpuCores !== 'N/A')) score += 10;
  if (data.media && data.media.cameras !== 'N/A') score += 5;
  if (data.network && data.network.effectiveType && data.network.effectiveType !== 'N/A') score += 5;
  if (data.privacy && data.privacy.doNotTrack === 'Disabled') score += 5;
  if (data.privacy && data.privacy.adBlocker === 'Not detected') score += 5;

  if (score > 100) score = 100;
  data.exposureScore = score;

  var circle = document.getElementById('score-circle');
  var circumference = 326.73;
  var offset = circumference - (score / 100) * circumference;
  circle.style.strokeDashoffset = offset;

  var scoreNum = document.getElementById('score-number');
  scoreNum.textContent = score;

  var ring = document.getElementById('score-ring');
  ring.classList.remove('score-low', 'score-mid', 'score-high');
  var desc = document.getElementById('score-desc');

  if (score <= 35) {
    ring.classList.add('score-low');
    desc.textContent = 'Low exposure. Your browser reveals relatively little information. Good privacy posture.';
  } else if (score <= 65) {
    ring.classList.add('score-mid');
    desc.textContent = 'Moderate exposure. Data brokers can build a partial profile from your browser fingerprint. Consider strengthening your privacy settings.';
  } else {
    ring.classList.add('score-high');
    desc.textContent = 'High exposure. Your browser is leaking significant data. Data brokers can easily fingerprint and track you across sites. Take action to reduce your digital footprint.';
  }
}

/* ---- AI Prompt Generator ---- */
function generateAIPrompt(data) {
  var sections = [
    { label: 'Browser & OS', key: 'browser' },
    { label: 'Screen & Display', key: 'screen' },
    { label: 'Hardware', key: 'hardware' },
    { label: 'Network & Location', key: 'geo' },
    { label: 'Network Connection', key: 'network' },
    { label: 'Battery Status', key: 'battery' },
    { label: 'Detected Fonts', key: 'fonts' },
    { label: 'Browser Plugins', key: 'plugins' },
    { label: 'Privacy Settings', key: 'privacy' },
    { label: 'Input Capabilities', key: 'input' },
    { label: 'Media Devices', key: 'media' },
    { label: 'Timezone & Locale', key: 'timezone' },
    { label: 'Cookies & Storage', key: 'cookies' }
  ];

  var dataStr = '';
  sections.forEach(function(s) {
    if (data[s.key]) {
      dataStr += '### ' + s.label + '\n' + JSON.stringify(data[s.key], null, 2) + '\n\n';
    }
  });

  var prompt = 'You are a privacy analyst and digital security expert. I have just run a browser fingerprint and data exposure scan using the me2me tool. Below is everything my browser revealed to any website I visit — without me clicking "agree" or granting any special permissions.\n\n';
  prompt += 'Please analyze this data and provide:\n\n';
  prompt += '1. **Uniqueness Assessment**: How unique and trackable is my browser fingerprint? Out of how many browsers would mine stand out? Could data brokers identify me specifically from this fingerprint alone?\n\n';
  prompt += '2. **Data Broker Exposure**: Based on my IP-derived location, device profile, and browser configuration, what would data brokers like Spokeo, Acxiom, Experian, BeenVerified, LexisNexis, and others likely know or infer about me? What categories of information would they cross-reference?\n\n';
  prompt += '3. **Cross-Reference Risk**: How could this browser data be combined with public records, social media profiles, purchase history, and location data to build a comprehensive personal profile? Give specific examples.\n\n';
  prompt += '4. **Privacy Vulnerabilities**: What are my biggest privacy weaknesses based on this scan? What is leaking the most identifying information?\n\n';
  prompt += '5. **Actionable Recommendations**: Give me specific, prioritized steps I can take RIGHT NOW to reduce my digital exposure. Include browser settings, extensions, OS changes, and data broker opt-out steps.\n\n';
  prompt += '---\n\n';
  prompt += '## My Scan Results\n\n';
  prompt += 'Scan timestamp: ' + (data.timestamp || 'N/A') + '\n\n';
  prompt += dataStr;
  prompt += '### Fingerprint Hashes\n';
  prompt += '- Canvas: ' + (data.canvas ? data.canvas.hash : 'N/A') + '\n';
  prompt += '- WebGL: ' + (data.webgl ? data.webgl.hash : 'N/A') + '\n';
  prompt += '- Audio: ' + (data.audio ? data.audio.hash : 'N/A') + '\n\n';
  prompt += '## Data Broker Context\n\n';
  prompt += 'Major data brokers that may have my information:\n';
  prompt += '- **Spokeo** — phone, email, address, social media, court records\n';
  prompt += '- **BeenVerified** — contact info, criminal records, property, assets\n';
  prompt += '- **WhitePages** — name, address, phone, relatives, neighbors\n';
  prompt += '- **Acxiom** — demographics, purchase behavior, financial data (2.5B+ profiles)\n';
  prompt += '- **Experian** — credit history, financial records, identity data\n';
  prompt += '- **Equifax** — credit reports, employment, financial history\n';
  prompt += '- **LexisNexis** — public records, court filings, property, licenses\n';
  prompt += '- **Radaris** — contact info, social profiles, property records\n';
  prompt += '- **Intelius** — background checks, criminal, address, phone\n';
  prompt += '- **PeopleFinder** — address history, phone, email, relatives\n\n';
  prompt += 'These companies collect and sell: public records, purchase history, location data, social media profiles, financial records, health interests, political affiliations, and browser/device fingerprints.\n\n';
  prompt += '## Privacy Exposure Score: ' + (data.exposureScore || 'N/A') + ' / 100\n\n';
  prompt += 'Please be specific and practical in your analysis. Reference my actual data points above. Explain what each data point reveals and how it can be used against my privacy.';

  return prompt;
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('scan-btn').addEventListener('click', function() {
    runFullScan();
  });

  document.getElementById('generate-prompt-btn').addEventListener('click', function() {
    var stored = localStorage.getItem('me2me_scan');
    if (!stored) { alert('Please run a scan first.'); return; }
    var data = JSON.parse(stored);
    var prompt = generateAIPrompt(data);
    document.getElementById('prompt-text').value = prompt;
    document.getElementById('prompt-output').style.display = 'block';
  });

  document.getElementById('copy-prompt-btn').addEventListener('click', function() {
    var textarea = document.getElementById('prompt-text');
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(textarea.value).then(function() {
      var fb = document.getElementById('copy-feedback');
      fb.style.display = 'block';
      setTimeout(function() { fb.style.display = 'none'; }, 2000);
    }).catch(function() {
      document.execCommand('copy');
    });
  });

  document.getElementById('load-previous-btn').addEventListener('click', function() {
    var stored = localStorage.getItem('me2me_scan');
    if (stored) {
      var data = JSON.parse(stored);
      renderDashboard(data);
      calculateExposureScore(data);
      document.getElementById('score-section').style.display = 'flex';
      document.getElementById('dashboard').style.display = 'block';
      document.getElementById('broker-info').style.display = 'block';
      document.getElementById('prompt-section').style.display = 'block';
      document.getElementById('previous-scan-notice').style.display = 'none';
    }
  });

  // Check for previous scan
  var prev = localStorage.getItem('me2me_scan');
  if (prev) {
    try {
      var prevData = JSON.parse(prev);
      var notice = document.getElementById('previous-scan-notice');
      var timeEl = document.getElementById('prev-scan-time');
      timeEl.textContent = new Date(prevData.timestamp).toLocaleString();
      notice.style.display = 'block';
    } catch(e) {}
  }
});
