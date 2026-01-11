<div align="center">

#  telephone 💫 numsint

### Telespot, Telespotter, and TelespotXX

---

## The Telespot Ecosystem
(New for 2026)

*A complete toolkit for phone number intelligence*

---

## Read the Case Study

[**Building the Telespot Ecosystem: A Phone Number OSINT Case Study**](https://github.com/thumpersecure/Telespot/blob/main/CASE_STUDY.md)

*Architecture decisions, performance optimization, and lessons learned*

---

### Telespot - The Original

[![Telespot Stars](https://img.shields.io/github/stars/thumpersecure/Telespot?style=for-the-badge&logo=github&label=Stars&color=gold)](https://github.com/thumpersecure/Telespot/stargazers)
<a href="https://github.com/thumpersecure/Telespot" title="Star Telespot" aria-label="Star Telespot" style="text-decoration:none;">
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#8b949e" style="vertical-align:middle;">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
</a>

<a href="https://github.com/thumpersecure/Telespot" title="Star this repository">
  <img src="https://img.shields.io/badge/☆%20Star-grey?style=flat&color=30363d" />
</a>

**Python CLI** | Multi-engine search | Pattern analysis | 10 format variations

---

### Telespotter - The Fast One

[![Telespotter Stars](https://img.shields.io/github/stars/thumpersecure/Telespotter?style=for-the-badge&logo=github&label=Stars&color=gold)](https://github.com/thumpersecure/Telespotter/stargazers)
<a href="https://github.com/thumpersecure/Telespotter" title="Star Telespotter" aria-label="Star Telespotter" style="text-decoration:none;">
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#8b949e" style="vertical-align:middle;">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
</a>

<a href="https://github.com/thumpersecure/Telespot" title="Star this repository">
  <img src="https://img.shields.io/badge/☆%20Star-grey?style=flat&color=30363d" />
</a>

**Rust CLI** | 3.6x faster | 6x less memory | People search databases | Auto-chain OSINT tools

---

### TelespotXX - The Web UI

[![TelespotXX Stars](https://img.shields.io/github/stars/thumpersecure/TelespotXX?style=for-the-badge&logo=github&label=Stars&color=gold)](https://github.com/thumpersecure/TelespotXX/stargazers)
<a href="https://github.com/thumpersecure/TelespotXX" title="Star TelespotXX" aria-label="Star TelespotXX" style="text-decoration:none;">
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#8b949e" style="vertical-align:middle;">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
</a>

<a href="https://github.com/thumpersecure/Telespot" title="Star this repository">
  <img src="https://img.shields.io/badge/☆%20Star-grey?style=flat&color=30363d" />
</a>

**Flask + WebSocket** | Real-time streaming | Dark theme | Export to JSON/CSV/TXT

</div>

<details>
<summary><strong>Read more</strong></summary>

<br>

## Tech Stack

<div align="center">

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-DEA584?style=for-the-badge&logo=rust&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

<div align="center">

*for the OSINT community*

</div>

---

## Philosophy

Telespot is a phone number–focused OSINT reconnaissance tool designed for early-stage intelligence gathering. It automates multi-format phone number searches across multiple public search engines and correlates repeated identity indicators such as names, locations, and usernames.

Unlike general-purpose OSINT frameworks, Telespot treats the phone number as the primary investigative entity rather than secondary enrichment data. This approach allows analysts to quickly assess whether a number has meaningful public footprint before committing time to deeper investigation.

Telespot is lightweight, script-based, and transparent by design. It is intended to be run locally, requires minimal configuration, and exposes all logic directly in code.

### Intended Use

Telespot is designed for reconnaissance and triage. It is most effective when used early in an investigation to determine whether a phone number warrants further analysis using larger OSINT frameworks or manual techniques.

Typical use cases include fraud and phishing research, investigation of suspicious or unsolicited calls, identity correlation, and OSINT pivoting where a phone number is the strongest available identifier.

### Design Philosophy

Telespot follows a focused, Unix-style philosophy. It does one task well: surface correlation and repetition around a phone number from unstructured public data.

The tool prioritizes signal discovery over data collection. It does not attempt attribution, identity resolution, or automated conclusions. Instead, it highlights patterns and frequency so that analysts can apply human judgment.

Two execution modes are provided to support different operational requirements. The standard mode emphasizes stealth and completeness, while the fast mode prioritizes speed through parallel execution.

### When Not To Use Telespot

Telespot is not a replacement for full OSINT frameworks or graph-based investigation tools. Analysts requiring entity graphing, long-term case management, or large-scale data aggregation should use more comprehensive platforms.

It is not intended for bulk or unattended scraping. High-volume automated execution increases the risk of rate limiting and detection and falls outside the tool’s intended scope.

Telespot does not provide definitive attribution or verification. All results are correlations derived from public sources and must be validated independently.

The tool operates exclusively on publicly accessible information and optional third-party APIs supplied by the user. It is not suitable for accessing restricted, private, or closed-source databases.

### Workflow Integration

Telespot is designed to run early in an OSINT workflow, prior to deeper analysis with tools such as Maltego, SpiderFoot, breach analysis platforms, or manual research.

In this role, it fills a narrow but practical gap by helping analysts quickly decide whether a phone number is worth further investigative effort.

</details>
