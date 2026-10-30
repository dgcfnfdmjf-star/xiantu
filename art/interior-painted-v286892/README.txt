Hand-painted interior assets, V28.68.92

Source: image generation guided by the user's second reference image on 2026-10-30.
room-source.png: empty cutaway xianxia room, ink outlines, aged wood, ivory walls, warm lattice windows, stone floor.
props-source.png: transparent furniture atlas (bed, desk, bookcase, bronze furnace, throne/screen, dragon column, cushion, red and jade rugs).
Original generated files remain in /workspace/generated_images; these are copies retained for project handoff.

Runtime: xiantu-v2831-scroll/interior-painted-v286892/room.webp and props.webp, plus manifest.json.
Build: node scripts/build-interior-painted.cjs (development prerequisite: sharp).
The build encodes the originals, validates atlas source rectangles and writes the manifest. No creative image edits or color-keying.
The runtime draws atlas regions directly; alpha is preserved, with furniture separate from the floor and player.
Details and validation: docs/interior-painted-v286892.txt.
