# hardtab launch video

Remotion cut of a real screen capture of https://hardtab.amanv.dev.

```sh
bun run record   # Playwright records the live site (WebGPU on) -> public/capture.webm + marks.json
ffmpeg -i public/capture.webm -c:v libx264 -crf 18 -pix_fmt yuv420p public/capture.mp4
bun run dev      # Remotion Studio
bun run render   # -> out/hardtab.mp4
```

`marks.json` carries named timestamps from the capture (landing, drag-start, strike, win, …);
`src/HardtabVideo.tsx` derives every shot from them, so re-recording never breaks the cut.
