# Right of Way demo — rule interpretations (v0.5b + line limit)

## v0.5c: Office light rail bonus (approved by Chris, Oct 2026)
- **Office +$1 per filled slot** when an **operational** light rail station (any owner) is within **radius 1**. Before this, light rail's job bonus applied only to Mixed-Use; the "+$1 per filled slot within radius 1" rule is the heavy rail **Hub** bonus, which a light rail Office did not get. The two now **stack**: an Office at a Hub with light rail adjacent earns $2 + $1 + $1 per slot. The bonus applies once, however many stations are nearby. E4/E5 zoning extensions don't count; it needs a real light rail station within radius 1.
- **Appendix A:** Red's Office F7 is next to Blue's (7,6) station, so Red's gross is $27 (was $26), $21 after Overhead, and Red ends with $23 (was $22, Progress 31%).
- **AI:** the follow-up lookahead now includes all Office candidates, and Office lots near any operational light rail station are considered. Money and balanced AIs also propose light rail anchored in Downtown and value their light rail stations that have an empty Downtown lot within radius 1. Open Office slots are valued at about 40% of their projected income, because commuters arrive over later rounds. Before this, the AI essentially never built light rail Offices, so the rule had no measurable effect.

## v0.5b balance changes (approved by Chris, Oct 2026)
- **Parks give no Pop of their own** (owner or anyone). They keep everything else: they make adjacent residential and Mixed-Use Livable and adjacent waterfront Prime, trigger board reactions, count for the Waterfront hearing and Mayor mandates (Ward, Okonkwo), and protect against Heat Wave. Cost stays $3. The Stadium counts as a Park and likewise has no Pop.
- **Mixed-Use Pop 5 → 4.** **At most 1 resident** of a Mixed-Use may fill its own job slots. This is enforced as a cap in auto-assignment, AI recommutes, manual recommutes and commute validation (`ZT.MU.selfFillCap`).
- **AI:** Park lots are scored by adjacent own homes that would become Livable and by adjacent empty lots, and Park builds get the same one-step follow-up lookahead as transit builds.
- **Appendix A** (engine regression): Green ends with 23 Pop under v0.5b (it was 26 under v0.5; the rulebook printed 25). Cash is unchanged (18/22/22).


This file records every place where the app had to interpret, simplify or fix the v0.5 rulebook.

## Errata found while implementing
- **Appendix A arithmetic:** Green's I6 Townhomes is inside the walkshed of Blue's light-rail station at (9,6), so it should also get the +1 light-rail density bonus. That makes Green's Pop **26**, not the 25 the rulebook prints. Cash results match the rulebook (Blue 18 / Red 22 / Green 22), and the regression test checks them.

## Balance observations under v0.5 (before v0.5b)
- Parks ($3 for +2 Pop, with no saturation) and Mixed-Use are very strong. AI "pop" players usually win standard games in Rounds 7–9 by spamming Parks and Mixed-Use. Options to consider: a limited Park tile supply, Parks giving Livable only (no direct Pop), or diminishing returns per district.
- Treasury wins are rarer than Population wins with the current targets.

## Interpretations and simplifications
- **Line limit (house rule kept):** each player may run at most 2 bus routes, 2 ferry routes, 1 light rail line (heavy rail removed in v0.7).
- **Roads** need no connectivity to your network.
- **Transfers:** a commute is a walk, one leg, or two legs with one transfer. Hub and Park & Ride "extra leg" transfers are **not** implemented. E9 still gives its other benefits.
- **Reroute action** is omitted (C3 "free reroutes" therefore has no effect). C3's ability to combine stops and edges is simplified to "add up to 4 stops/edges per action".
- **C1 Blacktop / C10 Twin Crews:** the extra build is a separate "bonus build" step right after the transit build, inside the same action. It can be skipped.
- **Bridge Inspection** event: closes the bridge site with the most modes built on it.
- **Excused commuter cubes** (River Flood, Fog, etc.) are handled in a simplified way: affected commutes are dropped or excused for the round, not tracked cube by cube.
- **Land Assembly** (removed in v0.7): removes the rival's SFD or Duplex and places your own Duplex on the first lot.
- **Stadium:** the bid winner chooses the lot.
- **Commute routes** are re-validated each Commute phase as the cheapest valid route rather than kept as truly persistent routes. Humans can re-route a worker during Actions (free action), and AI players auto-optimize at Commute.
- **Permits:** Tax Abatement is cashed immediately when picked. If you would hold more than 2 permits, the oldest is discarded.
- **Mixed-Use decline** steps down to Neighborhood Commercial.
- **Mayor cost modifiers** (Sorensen, Reyes) also apply to Upzones into the affected type.
- **HQ "within radius 2"** is measured as Chebyshev distance ≤ 2 from either site lot.
- **Home placement:** the app generates legal layout variants (Duplex + Neighborhood Commercial + 3 roads) for the chosen district, and you cycle through them instead of placing each piece by hand.
- **Quick game** (app option, not in the rulebook): 6 rounds; eras end after Rounds 2/4/6; HQ in Round 3; elections in Rounds 2 and 4; targets 55 Pop or $95 ($90 in 2-player); a Treasury win needs 20 Pop; starting cash $20.
- **Undo** is an app feature. It rewinds your own actions this round (including AI moves made since), until another human acts.

## v0.5b balance run (AI self-play, archetypes rotated across seats)
Pop / money / balanced win %; win type pop / treasury / progress %; average ending round.

| Config | Before (v0.5, N=200) | After (v0.5b) |
|---|---|---|
| 2p std | 55/5/41 · 89/3/9 · R8.1 | 52/14/34 · 56/16/29 · R9.2 (N=200) |
| 3p std | 57/2/42 · 98/1/1 · R7.6 | 67/7/27 · 78/6/17 · R8.7 (N=200) |
| 4p std | 68/2/31 · 97/1/2 · R7.4 | 77/1/22 · 91/3/6 · R8.6 (N=100) |
| 2p quick | 56/4/41 · 89/1/10 · R5.0 | 55/8/38 · 64/7/30 · R5.6 (N=200) |
| 3p quick | 66/3/32 · 100/0/0 · R4.7 | 68/2/30 · 89/2/9 · R5.3 (N=113) |
| 4p quick | 62/1/38 · 100/0/1 · R4.6 | 64/2/34 · 94/1/5 · R5.1 (N=100) |

The pop archetype still wins more than 50% in 3p. It now leans on Mixed-Use (up to 8 per player). Suggested next tweaks are in rulebook Section 20, item 42.

## v0.5c balance run (Office light rail bonus + updated AI)
Pop / money / balanced win %; win type pop / treasury / progress %; avg ending round. v0.5b column = previous run. Asterisk = smaller sample.

| Config | v0.5b | v0.5c |
|---|---|---|
| 2p std | 52/14/34 · 56/16/29 · R9.2 (200) | 59/7/34 · 79/3/18 · R8.4 (160*) |
| 3p std | 67/7/27 · 78/6/17 · R8.7 (200) | 61/4/35 · 94/1/5 · R7.8 (79*) |
| 4p std | 77/1/22 · 91/3/6 · R8.6 (100) | 61/2/36 · 93/2/5 · R7.8 (44*) |
| 2p quick | 55/8/38 · 64/7/30 · R5.6 (200) | 57/8/36 · 71/2/28 · R5.5 (200) |
| 3p quick | 68/2/30 · 89/2/9 · R5.3 (113) | 66/1/33 · 96/0/4 · R5.2 (113) |
| 4p quick | 64/2/34 · 94/1/5 · R5.1 (100) | 60/2/38 · 98/0/2 · R4.8 (99) |

A partial control (same new AI, Office bonus off; 14–60 games per config) gave similar numbers. Most of the shift comes from the AI change, not the rule. The money archetype still rarely wins.

## v0.6 main rule: Net Worth victory (default $1/Pop; formerly experimental) (rulebook v0.6, Section 15)
- Choose it on the setup screen: **Victory → Net Worth**, with a rate in $ per Pop. The default is still Standard victory (v0.5c).
- There is no instant victory. The game always ends after the final round (Round 10, or Round 6 in quick mode). The winner has the highest **Net Worth = cash + Pop × rate − $8 per Bond**, with the rulebook tiebreakers: total standing, then filled job slots, then fewer Bonds.
- **Bonds count at their $8 repayment value**, so a late Bond (+$8 cash, +1 Bond) nets $0 and only costs interest. Borrowing late isn't free money.
- **Rate $0** = "most money wins": cash minus Bond debt.
- **AI under the variant:**
  - **Before the final round,** each archetype weighs Pop × max(rate, $1) × its pop weight against projected cash × its cash weight. The pop AI keeps valuing Pop even at rate 0, because Pop drives tax and wages.
  - **In the final round (endgame rule, all archetypes),** an AI scores each action by its exact end-of-game Net Worth: cash + this round's income + Pop × rate − debt. It therefore only spends when the Pop gained × rate (plus income) exceeds the cost.
  - `opts.naiveAI` turns the endgame rule off, for comparison.
