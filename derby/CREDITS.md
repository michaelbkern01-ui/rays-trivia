# Rays Derby: credits and licenses

| Asset | Author | License | Where used |
|---|---|---|---|
| **Universal Base Characters** (`models/player.glb`, from `Superhero_Male_FullBody`) | Quaternius ([quaternius.com](https://quaternius.com), [itch.io](https://quaternius.itch.io/universal-base-characters)) | **CC0 1.0 Universal** (public domain). The license file in the pack says "CC0 1.0 Universal … Models by @Quaternius". | Pitcher, batter, catcher and umpire. One rig is reused for all four. Uniforms are recoloured at runtime with a shader, and the poses come from procedural IK. Before shipping, the model was compressed with gltf-transform (prune, 512px WebP textures, quantize) to about 413 KB. |
| three.js r160 (`../putt/three.module.min.js`) | three.js authors | MIT | Renderer |
| `lib/loaders/GLTFLoader.js`, `lib/utils/BufferGeometryUtils.js`, `lib/utils/SkeletonUtils.js`, `lib/environments/RoomEnvironment.js` (three@0.160.0 addons) | three.js authors | MIT | Model loading, rig cloning, image-based lighting |

Everything else was made for this game and is procedural or drawn on a canvas: the stadium, crowd, textures, sounds and animation.
Baseball names and colours are used only as a fan tribute. This game is not affiliated with MLB or the Tampa Bay Rays.
