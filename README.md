# Right of Way — playable demo (rules v0.7)

A self-contained browser version of the board game, so you can try it without printing anything.

## Run it
- Unzip and double-click `index.html`. It works offline from `file://` with no server or install.
- Or serve the folder: `python3 -m http.server 8000`, then open http://localhost:8000.

## What's in it
- Full v0.7 rules engine (`engine.js` and `ui.js` are built from `src/` and `uisrc/` by `build.sh`), including the line limit.
- SVG board with legal-move highlighting (green lots, edges and nodes) and live cost breakdowns before you confirm.
- Player mats, a City Hall panel (mayor, event, councils, congestion, projects), a filterable game log, and a per-round income breakdown with a progress chart.
- 2–4 players, mixing hotseat humans (with pass-the-device screens for secret bids and choices) and AI opponents (pop, money or balanced).
- **v0.7 streamlined rules:** no heavy rail; highways are now freight roads; the River Line is part of the ferry; Pilot, Land Assembly, Demolish, Petitions and Headhunt are gone; Era III programs are BRT only; 8 permit kinds. Economy: Consult pays $1 once per round, Overhead starts at $30/$60, light rail fare $2 with upkeep $1 per 2 stations.
- **Net Worth victory** (default) (default): the game always runs 10 rounds (quick: 6); highest cash + $1 × Pop − $8 per Bond wins. The old first-to-target race is the optional **Race to Target** variant on the setup screen (see RULES_NOTES.md).
- Tutorial game (you vs 2 AIs, with phase tips), a quick 6-round mode, Undo (Ctrl+Z), and autosave/resume (stored in the browser).

## Tests
`node tests/run.js` runs geometry and council invariants, the Appendix A regression, rules details, and AI smoke games for 2/3/4 players in standard and quick modes. `--fast` skips the AI games.

See `RULES_NOTES.md` for rule interpretations and balance notes.

## Phone & tablet
- Open `index.html` on the device (or host the folder on any static site). Layout adapts automatically:
  phones and portrait tablets get the board on top with a bottom tab drawer (tap the active tab to collapse it);
  landscape tablets get board + side panel (⇥ collapses it). Desktop with a mouse is unchanged.
- Pinch to zoom, drag to pan when zoomed, or use the + / − / ⤢ buttons. Tap underlined/tokens/standing chips for their info; long-press a button to see its tooltip.
- Served over http(s) it is installable (Add to Home Screen) and works offline via `sw.js`. From `file://` the manifest and service worker are skipped.
