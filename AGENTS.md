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
