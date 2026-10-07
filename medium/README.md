# Medium

Articles written for Medium, kept here as source.

| Article | Markdown | Import-ready HTML |
| :--- | :--- | :--- |
| The $3 Chip That Was Secretly a Software-Defined Radio (ESP32 hidden SDR, Oct 2026) | [esp32-hidden-sdr.md](esp32-hidden-sdr.md) | [esp32-hidden-sdr.html](esp32-hidden-sdr.html) |

Images live in [`images/`](images/).

## Importing into Medium

Medium's importer takes a **public URL** to a rendered web page. It can't read a file upload or a raw GitHub file.

1. Use a page that renders this article. Either:
   - copy `esp32-hidden-sdr.html` into `docs/medium/` so GitHub Pages serves it at
     `https://thumpersecure.github.io/thumpersecure/medium/esp32-hidden-sdr.html`, or
   - use the GitHub page for `esp32-hidden-sdr.md`.
2. In Medium, open your profile, then **Stories → Import a story**, paste the URL, and click **Import**.
3. Check the draft. Fix any captions, add the tags listed at the end of the article, and pick a cover image.

The HTML version doesn't use tables, because Medium doesn't support them. Its images point to `raw.githubusercontent.com/.../main/medium/images/`, so they only resolve once this folder is on `main`.

You can also skip the importer: open the rendered Markdown on GitHub, copy all of it, and paste it into a new Medium story. Medium keeps headings, bold, links, lists and images when you paste.
