/**
 * GGWP · gg-wp.mjs — entry point del módulo base de la suite Crónicas Bárdicas.
 *
 * Rol: REALCE OPCIONAL. Los satélites lo feature-detectan; nunca es dependencia
 * dura. Contrato para satélites:
 *
 *   Hooks.once("gg-wp.ready", (api) => {
 *     api.registerModule("gg-mi-modulo");            // membresía en la suite
 *     api.registerTool({ name, title, icon, onChange }); // botón en la sección GGWP
 *     api.registerContentPack({ id, moduleId, name, tier, purchaseUrl, contentLanguages });
 *   });
 *
 * También disponible sincrónico para late-listeners:
 *   const api = game.modules.get("gg-wp")?.api;
 */

import { BRAND, applyBrandTokens } from "./brand.mjs";
import { ContentPackRegistry } from "./content-packs.mjs";
import { ToolRegistry, registerGGWPControls } from "./controls.mjs";
import { SuiteRegistry } from "./suite.mjs";
import { openAboutDialog } from "./about.mjs";

const MODULE_ID = "gg-wp";

const packs = new ContentPackRegistry();
const tools = new ToolRegistry();
const suite = new SuiteRegistry();

/** Construye la API pública expuesta en game.modules.get("gg-wp").api */
function buildApi() {
  return {
    id: MODULE_ID,
    version: game.modules.get(MODULE_ID)?.version ?? "0.0.0",
    brand: BRAND,

    // Membresía en la suite (opt-in; reemplaza la autodetección por prefijo gg-*)
    registerModule: (entry) => suite.register(entry),
    getSuiteModules: () => suite.active(),

    // Content-packs
    registerContentPack: (pack) => packs.register(pack),
    getContentPacks: () => packs.all(),
    getContentPack: (id) => packs.get(id),

    // Tools de la sección GGWP en scene-controls
    registerTool: (tool) => tools.register(tool),
    getTools: () => tools.all(),

    // Utilidades
    openAbout: () => openAboutDialog(packs, suite)
  };
}

Hooks.once("init", () => {
  const mod = game.modules.get(MODULE_ID);
  const api = buildApi();
  if (mod) mod.api = api; // sincrónico para late-listeners
  applyBrandTokens();     // inyecta --ggwp-* en :root
  console.log(`${MODULE_ID} | init — API lista`);
});

/*
 * POR QUÉ EL HOOK SE EMITE EN "setup" Y NO EN "ready".
 *
 * Foundry pinta los controles de escena durante "ready". Si los satélites
 * registran sus tools recién ahí, getSceneControlButtons ya corrió con el
 * registro vacío y la sección queda congelada sin ellos.
 *
 * Redibujar después no sirve: SceneControls#initialize está deprecado desde v13
 * y no vuelve a disparar el hook, y render() solo repinta lo ya preparado.
 *
 * "setup" corre después de i18nInit (así que game.i18n.localize ya funciona en
 * los satélites) y antes de que se pinten los controles. Todo llega a tiempo y
 * no hace falta ningún redibujo.
 */
Hooks.once("setup", () => {
  const api = game.modules.get(MODULE_ID)?.api ?? buildApi();

  // Los satélites registran sus tools DENTRO de este callAll, de forma síncrona.
  Hooks.callAll(`${MODULE_ID}.ready`, api);

  const mod = game.modules.get(MODULE_ID);
  if (mod) (mod.flags ??= {}).ggwpToolCount = tools.all().length;

  console.log(
    `${MODULE_ID} | setup — hook "${MODULE_ID}.ready" emitido | ` +
    `${suite.ids().length} módulo(s), ${tools.all().length} tool(s), ${packs.all().length} pack(s)`
  );
});

/*
 * Red de seguridad para satélites que se registren tarde (por ejemplo, un módulo
 * que escuche "ready" en vez del hook). Solo redibuja si aparecieron tools
 * después de setup; en el camino normal no hace nada.
 */
Hooks.once("ready", () => {
  const alSetup = Number(game.modules.get(MODULE_ID)?.flags?.ggwpToolCount ?? -1);
  if (alSetup >= 0 && tools.all().length > alSetup) {
    try { ui.controls?.render?.({ force: true }); } catch { /* no crítico */ }
  }
});

Hooks.on("getSceneControlButtons", (controls) => {
  registerGGWPControls(controls, tools, packs, suite);
});
