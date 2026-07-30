/**
 * GGWP · gg-wp.mjs — entry point del módulo base de la suite Crónicas Bárdicas.
 *
 * Rol: REALCE OPCIONAL. Los satélites lo feature-detectan; nunca es dependencia
 * dura. Contrato para satélites:
 *
 *   Hooks.once("gg-wp.ready", (api) => {
 *     api.registerContentPack({ id, moduleId, name, tier, purchaseUrl, contentLanguages });
 *     api.registerTool({ name, title, icon, onChange });
 *   });
 *
 * También disponible sincrónico para late-listeners:
 *   const api = game.modules.get("gg-wp")?.api;
 */

import { BRAND, applyBrandTokens } from "./brand.mjs";
import { ContentPackRegistry } from "./content-packs.mjs";
import { ToolRegistry, registerGGWPControls } from "./controls.mjs";
import { openAboutDialog } from "./about.mjs";

const MODULE_ID = "gg-wp";

const packs = new ContentPackRegistry();
const tools = new ToolRegistry();

/** Construye la API pública expuesta en game.modules.get("gg-wp").api */
function buildApi() {
  return {
    id: MODULE_ID,
    version: game.modules.get(MODULE_ID)?.version ?? "0.0.0",
    brand: BRAND,

    // Content-packs
    registerContentPack: (pack) => packs.register(pack),
    getContentPacks: () => packs.all(),
    getContentPack: (id) => packs.get(id),

    // Tools de la sección GGWP en scene-controls
    registerTool: (tool) => tools.register(tool),
    getTools: () => tools.all(),

    // Utilidades
    openAbout: () => openAboutDialog(packs)
  };
}

Hooks.once("init", () => {
  const mod = game.modules.get(MODULE_ID);
  const api = buildApi();
  if (mod) mod.api = api; // sincrónico para late-listeners
  applyBrandTokens();     // inyecta --ggwp-* en :root
  console.log(`${MODULE_ID} | init — API lista`);
});

Hooks.once("ready", () => {
  const api = game.modules.get(MODULE_ID)?.api ?? buildApi();
  Hooks.callAll(`${MODULE_ID}.ready`, api);
  console.log(`${MODULE_ID} | ready — hook "${MODULE_ID}.ready" emitido`);
});

Hooks.on("getSceneControlButtons", (controls) => {
  registerGGWPControls(controls, tools, packs);
});
