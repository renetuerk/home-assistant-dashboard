<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- The browser talks directly to Home Assistant over its WebSocket API (URL + long-lived token in localStorage); no backend, because HA runs on the user's local network.
- Without a saved connection the dashboard runs on demo data from src/lib/ha-demo.ts so the design is always previewable.
- Self-hosting via Docker builds with NITRO_PRESET=node-server (see Dockerfile).
- Use the shared ha-activity classifier for device activity grouping; continuous numeric readings stay separate because their values do not represent on/off states.
- Keep device appearance preferences separate from HA connection settings and apply styles via global semantic CSS tokens so changing or clearing a connection does not reset appearance.
- Select dashboard devices through the shared registry-aware selector; omit infrastructure/configuration switches and prefer covers over same-device relay switches so garage controls use cover services.
- Cameras use periodically refreshed Home Assistant still-image URLs restricted to its origin; never put long-lived login tokens in image URLs or attempt native RTSP playback in the browser.
