# Gwintforce character artwork

`portraits.webp` is an original generated, painted atlas created for Bulk Import v23.
It contains a 4×4 grid of sixteen human, alien and creature portraits, without
external URLs or fonts. It was generated for this task, then encoded as WebP for
the standalone HTML. The source PNG remains outside the repository in the task's
generated image artifacts; the game needs only this WebP.

`minigames/cards-art.js` maps all 49 cards to appropriate characters. Related Batch,
Flow and Excel troop variants share an archetype. Weather and special cards show
the person or creature casting their effect. Names, abilities and power remain
separate accessible text. `multiplayer/build-client.cjs` embeds the atlas once as
CSS; individual cards store only their tile coordinates. The same artwork appears
in collection, hand, rows and rival portraits. No geometric placeholder artwork
or runtime image download is used.
