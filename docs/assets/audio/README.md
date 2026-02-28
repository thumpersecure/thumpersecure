# Audio Files

Place local audio files here for the Code Cookbook music player.

## Expected files

| Track | Filename | Format | Notes |
|-------|----------|--------|-------|
| 1 (Tron) | `../Tron-Website-Music-Spoken-Words.m4a` | M4A | Currently in docs/ root |
| 2 (Mr Robot) | `track-2.mp3` | MP3 | Falls back to iTunes preview if missing |
| 3 (Swordfish) | `track-3.mp3` | MP3 | Falls back to iTunes preview if missing |

## Adding tracks

1. Place the audio file in this directory (or `docs/` root)
2. Update the track configuration in `docs/index.html` (search for `TRACK_CONFIG`)
3. Supported formats: MP3, M4A, OGG, WAV

## Autoplay

The first track attempts autoplay on page load. Browsers may block autoplay until the user interacts with the page. A "tap to play" notice will appear if autoplay is blocked.

## Licensing

Ensure all audio files have appropriate licensing for public use. Do not commit copyrighted audio without permission.
