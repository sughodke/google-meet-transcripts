# 📝 google-meet-transcripts

Google Chrome Extension for recording Google Meet transcripts

This extension will allow you to record the closed captions provided in Google Meet. The meeting transcript can be copied to the clipboard.

There are a couple settings available to be read and written in the console by calling `__gmt_get(key)` and `__gmt_set(key, value)`:

- `speaker-name-map`: Replace speaker names, e.g. `{"You": "Michael", "Jim Halpert": "Jim" }`
- `transcript-format-meeting`: The format to used for the meeting details when copying the transcript to the clipboard
- `transcript-format-session-join`: The string to use to join multiple sessions within a meeting. New sessions are created every time transcribing begins.
- `transcript-format-speaker`: The format used for individual comments in the transcript.
- `transcript-format-speaker-join`: The string used to join multiple comments in the transcript.

## Release Process

1. Commit changes
2. Bump versions in `manifest.json` and `package.json`
3. Zip `src` directory, place in `dist`
4. Create release commit with new zip and json configs
5. Upload to Chrome Web Store