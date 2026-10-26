# Arcade mode plan

Status: the local player-versus-CPU slice below is playable. The 3D production pass remains dependent on rigged character models and animations.

## Playable first slice

- Enter Arcade from the main menu and choose Majembe or Mbavu. The other fighter is controlled by the game. Both fighters are available in Arcade; Story mode unlock rules stay separate.
- Run a best-of-three, 90-second fight on one fixed horizontal plane with movement, jump, punch, kick, block, health, rounds, rematch, and return to selection.
- Render the Archives arena as separate layers: clean building/road plate, animated matatu and four shuffling pedestrians, transparent fence, then fighters and match interface. Load Arcade assets only after entering the mode.
- Animate both fighters' walking with compact WebP sheets. Verify both fighter choices, CPU movement and attacks, layered traffic, knockouts, timer, and rematch in a browser.

## 3D production pass

- Create original, rigged 3D models for Majembe and Mbavu with consistent proportions, punch/kick/block/hit/fall animation clips, and export compact glTF assets.
- Keep the combat simulation on the 2D plane. Replace fighter sprites with WebGL-rendered models driven by the same positions and combat states. Use a fixed side camera and an optional subtle parallax camera response.
- Profile desktop and mobile browsers before adding more fighters or effects. Keep the flat Arcade renderer as a fallback until 3D performance and art quality are proven.

## Later expansion

- Add optional local two-player mode, the wider fighter roster, arenas, crowd reactions, music, sound effects, training, and accessibility settings.
- For online fights, add a server and a latency-tolerant synchronization design; the static GitHub Pages site alone cannot host matchmaking or authoritative sessions.
