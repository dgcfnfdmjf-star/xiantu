> Ported onto main after V8 (晨风铃谷 / PR #60). Clipping helpers load before journey/chime scripts; chapter-4 behaviour unchanged.

# 暮色浮岛 V7: clipping (穿模) audit

Fixes are in `src/clipping.js` (shared footprints and push-out helpers, bundled into the journey script), `src/journey.js`, `src/level3fx.js`, `src/voyage.js`, and the "Clipping fixes" block in `scripts/build.py`. Save keys, music and the V5 source are unchanged.

## Terrain facts that shaped the fixes
- The island top is a flat disc (radius 5, height `TOP_Y` = 0.25), so `TOP_Y` is the true ground height and no raycast or height sampling is needed. Kittens were checked against it by vertex.
- There is no water mesh except the flat pond. The paper boat rides a cloud over the grass, so there is no waterline to hold. Its equivalent problem is the hull meeting flowers and props.
- `canPlant()` also filters saved flowers on load. Tightening it would delete flowers from existing saves, so stricter rules apply to tap planting only.

## Issues fixed
| Object | Issue | Fix |
|---|---|---|
| Camera | Near plane 0.1 wasted depth precision | Near raised to 0.5 |
| Clouds | Camera could fly through them; could hit floating rocks; depth writes cut off things behind them | Orbit radius 13.5–18, kept 5 from the camera, `depthWrite: false` |
| Floating rocks | Different speeds let them catch each other | Same speed, so spacing stays fixed |
| Pond | Disc 0.01 above the grass risked z-fighting | `polygonOffset`, `depthWrite: false` |
| Grass tufts, pebbles | Random placement poked through lamps, cat, bushes, trunk | Placement avoids all prop footprints |
| Fireflies | Lowest ones dipped under the grass | Minimum height raised |
| Sparks, petals, rain | Passed through the island | Sparks settle on the grass; petals and rain respawn on contact |
| Glow sprites (flowers, lanterns, butterfly and kitten halos, lamps, boat) | Sliced in a straight line by ground and nearby meshes | `depthTest: false` |
| Birds | Both perches were inside the canopy; flight orbit grazed the top blob | Perches moved to the canopy surface; orbit radius +0.4 |
| Cat | Breathing pushed the belly under the grass | Body raised 0.012 |
| Butterflies | Flew through canopy, cat, flower heads, chime and each other; wing tips hit the grass; could reach the camera | Push-out each frame, floor 0.65, flower dance 1.35 above the root, kept 1.6 from the camera |
| Kittens | Walked through bushes, flowers, cat, chime, yarn and each other; hid inside bushes; torso sank when curled | Separation each frame, playing or sleeping kittens stay put, wider hide gaps and pile rings, curl height corrected |
| Yarn | Landed inside the kitten's chest | Kitten stops 0.55 from it instead of 0.3 |
| Wish chime | Foot floated 0.1 up; stood on the pond stones; middle bell inside the pole | Foot on the grass, moved to (3.3, -2.1), bell moved in front of the pole |
| Lanterns | Cap overlapped body; rose through canopy and flower heads; overlapped each other | Cap seated; spawn point moved clear; steer round the tree and each other |
| Wisps (星萤) | Flew through canopy, lamps, chime, boat and each other; wings cut into the gem | Push-out each frame, base height 1.55, wings moved out |
| Paper boat | Keel cut through flower heads (hover 0.62, flowers reach about 1.08) | Rises smoothly over flowers, including during the fast finale lap |
| Flowers | Planted too close together, on lamps or in bushes | Tap planting needs 0.6 spacing and clear ground; old saved flowers are moved on screen only, and the save keeps their original spot |

## Checked, no change needed
- **Coplanar caps:** grass/dirt and dirt/rock caps face away from the camera or are covered, and the camera stays above them.
- **Butterfly wings:** left and right wings never cross, and the rare glow wing uses identical geometry with equal depth.
- **Stars and moon:** they don't write depth and draw behind everything.
- **Kitten legs:** feet already sit on the ground. An attempted "fix" here was wrong (the geometry's pivot is at the hip) and the measurement test caught it, so it was reverted.
- **Boat and lamps:** closest approach measured 0.88 between centres.

## Not fixed, or only partly
- **Intended overlaps:** kitten head and torso, lamp ring and stem, crown gems on the hoop, and bushes sitting about 0.1 into the ground all read as joined or planted.
- **Butterfly wing tips:** bodies keep clear, but wings span about 0.7, so tips can still brush a neighbour or canopy for a moment.
- **Close flowers in old saves:** pairs 0.5–0.6 apart stay as saved, because moving them would need a save change.
- **Brief passes:** a lantern can touch the thin crown hoop, a bird leaving its perch can graze the canopy, and a petal can pass near the camera at extreme zoom.
- **Props are approximated:** collision uses circles and spheres, not triangles, so wisps and butterflies curve round the tree a little earlier than a perfect fit.
- **Glow side effect:** glows with `depthTest: false` show faintly through anything in front of them.

## Small visible behaviour changes
- Tapping to plant is refused in more spots.
- Hiding kittens sit further from their bush.
- Butterflies and wisps fly slightly higher.
- Clouds sit a little further out.
- The chime has moved.

## Verification (2026-11-05, Linux Chrome, software rendering)
- `python3 games/healing-game/scripts/build.py`: passes.
- `python3 games/healing-game/tests/test_package.py`: 5 tests pass.
- `tests/clipping-browser.js` (new): passes, sampling 2,700–4,000 simulated steps per level with synthetic saves.

| Measured minimum | Value |
|---|---|
| Butterfly above grass | 0.65 |
| Butterfly to canopy centre (canopy reach 1.4) | 1.59 |
| Butterfly to camera | 8.95 |
| Kitten lowest vertex vs grass | -0.011 |
| Kitten to kitten | 0.58 |
| Kitten to bush centre | 0.86 |
| Kitten to flower | 0.44 |
| Kitten to yarn | 0.59 |
| Boat keel above tallest flower | +0.26 |
| Wisp to canopy centre | 1.85 |
| Wisp to lamp core | 0.80 |
| Wisp to wisp | 0.76 |
| Cloud to camera | 5.0 |
| Cloud centre to rock | 5.7 |

- `tests/voyage-browser.js` and `tests/finale-audio-browser.js`: pass.
- `tests/journey-browser.js`: passed 3 of 3 final runs, after failing once earlier on "duplicate tap cannot collect same wisp". The clean `HEAD` build failed the same check in 2 of 3 runs, so this flake is not new.

Not verified:
- Real iPhone or other physical GPUs, including z-fighting on low-precision depth buffers.
- Triangle-level intersection; most distances are between centres.
- Camera clearance at extreme zoom and tilt; the runs kept the default camera, which orbits slowly.
- A full playthrough by eye; only screenshots of levels 2 and 3 were reviewed.
