# GGWP · Crónicas Bárdicas

Base module for the **Crónicas Bárdicas** suite by **GegesVTT**, for Foundry VTT
(D&D 5e). It is an **optional enhancement**: satellite modules feature-detect it
via the `gg-wp.ready` hook and keep working standalone when it is absent.

## What it provides

- **Shared brand tokens** — canonical palette and OFL typography, injected as
  `--ggwp-*` CSS custom properties and exposed on the API as `api.brand`.
- **GGWP scene-controls section** — a home in the scene controls where satellites
  hang their tools. Built for Foundry v13+ (record-shaped controls, guaranteed
  `onChange`, never-empty tool layer).
- **Content-pack contract** — a central registry (`registerContentPack`) that
  powers the "Buy" CTA on premium packs.

## For satellite authors

```js
Hooks.once("gg-wp.ready", (api) => {
  // Register a content pack (drives the About dialog + premium CTA)
  api.registerContentPack({
    id: "my-pack",
    moduleId: "gg-my-module",
    name: "My Pack",
    tier: "premium",              // "free" | "premium"
    purchaseUrl: "https://…",     // shown as "Buy" on premium
    contentLanguages: ["es", "en"]
  });

  // Add a tool button to the GGWP scene-controls section
  api.registerTool({
    name: "gg-my-module-open",
    title: "Open My Module",
    icon: "fas fa-dice-d20",
    onChange: () => { /* … */ }
  });
});
```

The API is also available synchronously for late listeners:

```js
const api = game.modules.get("gg-wp")?.api;
```

### API surface

| Method | Description |
|---|---|
| `api.brand` | Frozen object with canonical colors and font families. |
| `api.registerContentPack(pack)` | Register a content pack. Returns `boolean`. |
| `api.getContentPacks()` | Array of registered packs. |
| `api.getContentPack(id)` | Single pack or `null`. |
| `api.registerTool(tool)` | Add a tool to the GGWP scene-controls section. |
| `api.getTools()` | Array of registered tools. |
| `api.openAbout()` | Open the "About the suite" dialog. |

## Compatibility

- Foundry VTT **v13+** (v13/v14).
- `compatibility.verified` is bumped only after real in-world testing.

## License

Code under MIT (see `LICENSE`). Bundled fonts are loaded from Google Fonts and
are OFL-licensed.
