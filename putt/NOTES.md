# How putt.day plays (study notes, Oct 12 2026)

Source: public HTML + JS bundles from https://putt.day (Vite/React app, `three.js` via react-three-fiber).
Only behaviour/tuning was studied; no code or assets were copied into Trop Shot.

## Rendering / camera
- Real 3D (three.js, WebGL). Low-poly floating "island" tiles: green felt top, chunky wooden rails,
  brown earth underside, floating over teal water; perspective camera.
- Holes are built from 1 m grid pieces (`start`, `straight`, `round-corner`, `obstacle-block`, `hole-round` …)
  with `x/z` grid coords and a rotation; decor (trees, bushes, rocks) sits around the course.
- Camera has two modes, toggled by a button: **Follow** (behind/above the ball, chases it while rolling)
  and **Overview** (whole course). A setting "Aim camera at hole after each shot" re-points the
  follow camera toward the cup when the ball stops.
- Drag on empty space orbits/looks around; pinch or scroll zooms. Free-fly cam exists for dev only.
- Render loop capped to 60 fps.

## Physics tuning (from its config object, units = metres, seconds)
| param | value | meaning |
|---|---|---|
| ballRadius | 0.06 | ball is small vs a 1 m tile |
| maxShotSpeed | 10 m/s | full-power launch |
| minPull / maxPull | 0.12 / 1.8 m | drag shorter than 0.12 m cancels; 1.8 m (world) = full power |
| rollDecel | 0.8 m/s² | constant rolling resistance |
| linearDamping | 0.25 /s | plus speed-proportional drag |
| wallRestitution / wallFriction | 0.7 / 0.1 | lively rails |
| floorRestitution | 0.05 | no bouncing on the felt |
| captureSpeed | 2.6 m/s | slower than this over the cup = holed |
| cupRadius | 0.134 m | |
| cupAssistRadius / Accel / MaxSpeed | 0.42 m / 5.5 m/s² / 3.4 m/s | gentle pull toward cup when close & slow |
| stopSpeed / stillSeconds | 0.12 m/s / 0.17 s | ball declared stopped quickly |
| watchdog | 10 s | force-stop |
- Input: grab the ball, drag back, release. Pull vector in world space; power ∝ pull length up to maxPull
  (linear curve assumed — the exact curve is in a chunk not inspected).
- Water: returns to previous lie; a first-stroke water shot doesn't count. Off-course (y < -2) = reset.

## What Trop Shot now copies in *feel* (own implementation)
- three.js perspective view, follow + overview camera, auto-aim toward cup after each stop.
- Same scale (1 m tiles, 6 cm ball) and same tuning numbers above, simulated in my own fixed-step 2D
  (x/z) engine at 240 Hz; slopes are flat tiles with a constant downhill push.
- Holes are ASCII tile maps (1 tile = 1 m) with rails auto-built on every open edge.

## v3 (harder holes + secrets)
- 15 hand-drawn twisty layouts (par 3-5) plus 15 mirrored variants = 30 holes.
- Ball can now be airborne (y, vy, gravity 9.8, small landing hop, rails ignored above 7 cm).
- Each hole has one hidden kicker wedge (darker felt with a thin light-blue lip). It only fires if
  the ball crosses it within 6° of the tee-to-wedge line at >= 88% of full-power pace; it then lofts
  the ball to land just short of the cup. `node check_holes.js` verifies normal route <= par+1,
  no 0/1-bank one-shot aces (1° x 4% grid), and that the secret aces.
