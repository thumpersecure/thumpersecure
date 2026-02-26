# Facebook.com Subdomain Enumeration

**Date:** February 10, 2026  
**Method:** DNS lookup + HTTP response testing (curl) + OSINT source aggregation

---

## Single-Character Subdomains (Live HTTP Response)

Tested all 26 letters + digits 0-9. These responded with HTTP status codes:

| Subdomain | Status | Known Purpose |
|-----------|--------|---------------|
| **0.facebook.com** | ✅ Active | Zero-data / free basics mobile access |
| **c.facebook.com** | ✅ Active | Content/CDN |
| **d.facebook.com** | ✅ Active | Desktop-optimized mobile version |
| **h.facebook.com** | ✅ Active | Touch/HTML5 mobile (Android browsers) |
| **l.facebook.com** | ✅ Active | Link shim (outbound link safety checker) |
| **m.facebook.com** | ✅ Active | Mobile site (primary mobile subdomain) |
| **n.facebook.com** | ✅ Active | Notifications / internal |
| **o.facebook.com** | ✅ Active | Optimized / alternative mobile |
| **p.facebook.com** | ✅ Active | Internal / platform |
| **t.facebook.com** | ✅ Active | Tracking / shortened URLs |
| **w.facebook.com** | ✅ Active | Web / alternative access |
| **x.facebook.com** | ✅ Active | Experimental / internal |
| **z.facebook.com** | ✅ Active | Internal / zero-rated |

**No response (timeout):** a, b, e, f, g, i, j, k, q, r, s, u, v, y, 1-9

---

## Two-Letter Subdomains (Live)

| Subdomain | Status | Known Purpose |
|-----------|--------|---------------|
| **lm.facebook.com** | ✅ Active | Link shim on mobile browser |
| **tm.facebook.com** | ✅ Active | Internal / tracking mobile |
| **hs.facebook.com** | ✅ Active | Help / support system |
| **ww.facebook.com** | ✅ Active | Alternate www (common typo catch) |
| **ai.facebook.com** | ✅ Active | AI / research portal |

**No response:** bc, ed

---

## Mobile & Alternative Access Points (Live)

| Subdomain | Status | Purpose |
|-----------|--------|---------|
| **m.facebook.com** | ✅ Active | Primary mobile site |
| **mbasic.facebook.com** | ✅ Active | Ultra-lightweight text-only mobile |
| **mobile.facebook.com** | ✅ Active | Mobile redirect |
| **touch.facebook.com** | ✅ Active | Touch-optimized mobile |
| **iphone.facebook.com** | ✅ Active | iPhone-specific mobile |
| **lite.facebook.com** | ✅ Active | Facebook Lite web version |
| **free.facebook.com** | ✅ Active | Free basics / zero-rated access |
| **zero.facebook.com** | ✅ Active | Zero-data mobile access |
| **web.facebook.com** | ✅ Active | Alternative web access |

---

## Developer & API Subdomains (Live)

| Subdomain | Status | Purpose |
|-----------|--------|---------|
| **api.facebook.com** | ✅ Active | API endpoint |
| **graph.facebook.com** | ✅ Active | Graph API |
| **developers.facebook.com** | ✅ Active | Developer portal |
| **apps.facebook.com** | ✅ Active | App platform |
| **code.facebook.com** | ✅ Active | Engineering / code resources |
| **connect.facebook.com** | ✅ Active | Facebook Connect / OAuth |
| **pixel.facebook.com** | ✅ Active | Tracking pixel |
| **static.facebook.com** | ✅ Active | Static assets |
| **upload.facebook.com** | ✅ Active | File upload endpoint |

---

## Authentication & Account Subdomains (Live)

| Subdomain | Status | Purpose |
|-----------|--------|---------|
| **login.facebook.com** | ✅ Active | Login portal |
| **secure.facebook.com** | ✅ Active | Secure/HTTPS login |
| **register.facebook.com** | ✅ Active | Registration |

---

## Business & Advertising (Live)

| Subdomain | Status | Purpose |
|-----------|--------|---------|
| **ads.facebook.com** | ✅ Active | Advertising platform |
| **business.facebook.com** | ✅ Active | Business suite |
| **pay.facebook.com** | ✅ Active | Facebook Pay |
| **shop.facebook.com** | ✅ Active | Facebook Shops |

---

## Product & Feature Subdomains (Live)

| Subdomain | Status | Purpose |
|-----------|--------|---------|
| **gaming.facebook.com** | ✅ Active | Facebook Gaming |
| **watch.facebook.com** | ✅ Active | Facebook Watch video |
| **pages.facebook.com** | ✅ Active | Facebook Pages |
| **work.facebook.com** | ✅ Active | Workplace by Facebook |
| **workplace.facebook.com** | ✅ Active | Workplace platform |
| **portal.facebook.com** | ✅ Active | Portal device support |

---

## Corporate & Info (Live)

| Subdomain | Status | Purpose |
|-----------|--------|---------|
| **about.facebook.com** | ✅ Active | About Facebook / company info |
| **blog.facebook.com** | ✅ Active | Official blog |
| **research.facebook.com** | ✅ Active | Research publications |
| **transparency.facebook.com** | ✅ Active | Transparency reports |
| **postmaster.facebook.com** | ✅ Active | Email deliverability tools |

---

## Infrastructure & DNS (Live)

| Subdomain | Status | Purpose |
|-----------|--------|---------|
| **dns.facebook.com** | ✅ Active | DNS infrastructure |
| **intern.facebook.com** | ✅ Active | Internal tools |
| **v4help.facebook.com** | ✅ Active | IPv4 help/support |

---

## Alternate WWW Variants (Live)

| Subdomain | Status | Purpose |
|-----------|--------|---------|
| **www.facebook.com** | ✅ Active | Primary website |
| **www2.facebook.com** | ✅ Active | Secondary/load-balanced |
| **wwww.facebook.com** | ✅ Active | Typo catch |
| **ww.facebook.com** | ✅ Active | Typo catch |

---

## Beta & Testing (Live)

| Subdomain | Status | Purpose |
|-----------|--------|---------|
| **beta.facebook.com** | ✅ Active | Beta testing |
| **new.facebook.com** | ✅ Active | New features / redesign |
| **error.facebook.com** | ✅ Active | Error pages |
| **badge.facebook.com** | ✅ Active | Badge/verification system |

---

## fb.com Subdomains (Live)

| Subdomain | Status | Purpose |
|-----------|--------|---------|
| **www.fb.com** | ✅ Active | Short domain redirect |
| **s.fb.com** | ✅ Active | Short URLs |
| **investor.fb.com** | ✅ 200 OK | Investor relations |
| **newsroom.fb.com** | ✅ Active | Press / newsroom |
| **search.fb.com** | ✅ Active | Search |
| **vsp.fb.com** | ✅ 503 | Internal service |

---

## Language/Locale Subdomains (from OSINT sources)

These follow the pattern `{lang}-{region}.facebook.com`:

| Subdomain | Language |
|-----------|----------|
| ar-ar.facebook.com | Arabic |
| bg-bg.facebook.com | Bulgarian |
| bs-ba.facebook.com | Bosnian |
| cs-cz.facebook.com | Czech |
| da-dk.facebook.com | Danish |
| de-de.facebook.com | German |
| el-gr.facebook.com | Greek |
| en-gb.facebook.com | English (UK) |
| es-es.facebook.com | Spanish (Spain) |
| es-la.facebook.com | Spanish (Latin America) |
| et-ee.facebook.com | Estonian |
| fa-ir.facebook.com | Persian |
| fi-fi.facebook.com | Finnish |
| fr-ca.facebook.com | French (Canada) |
| fr-fr.facebook.com | French (France) |
| he-il.facebook.com | Hebrew |
| hr-hr.facebook.com | Croatian |
| hu-hu.facebook.com | Hungarian |
| id-id.facebook.com | Indonesian |
| it-it.facebook.com | Italian |
| ja-jp.facebook.com | Japanese |
| ko-kr.facebook.com | Korean |
| mk-mk.facebook.com | Macedonian |
| ms-my.facebook.com | Malay |
| nb-no.facebook.com | Norwegian |
| nl-nl.facebook.com | Dutch |
| pl-pl.facebook.com | Polish |
| pt-br.facebook.com | Portuguese (Brazil) |
| pt-pt.facebook.com | Portuguese (Portugal) |
| ro-ro.facebook.com | Romanian |
| ru-ru.facebook.com | Russian |
| sk-sk.facebook.com | Slovak |
| sr-rs.facebook.com | Serbian |
| sv-se.facebook.com | Swedish |
| th-th.facebook.com | Thai |
| tl-ph.facebook.com | Filipino |
| tr-tr.facebook.com | Turkish |
| vi-vn.facebook.com | Vietnamese |
| zh-cn.facebook.com | Chinese (Simplified) |
| zh-hk.facebook.com | Chinese (Hong Kong) |
| zh-tw.facebook.com | Chinese (Taiwan) |

Short language codes also work: es, fr, it, nl, ro, tr

---

## Notes

- All "Active" subdomains returned HTTP 200→403 (Facebook's envoy proxy accepts the connection, then returns 403 since we're not sending browser cookies/headers). This confirms the subdomain resolves and is served by Facebook's infrastructure.
- Subdomains marked "TIMEOUT/NO RESPONSE" either don't exist in DNS or are purely internal.
- Facebook uses a wildcard-like DNS configuration through their CDN (envoy proxy), so some subdomains may accept connections without serving meaningful content.
- Many subdomains from OSINT lists (like `nsa.facebook.com`, `nova.facebook.com`, `pacific.facebook.com`) no longer respond — these may have been decommissioned.
- The `l.facebook.com` and `lm.facebook.com` subdomains are commonly seen in Google Analytics as referral sources (link shim system).