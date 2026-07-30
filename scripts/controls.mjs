/**
 * GGWP · controls.mjs
 * Sección GGWP en los controles de escena.
 *
 * Facts de Foundry v13+ que este archivo respeta:
 *  - getSceneControlButtons pasa un RECORD (no un array) → se asigna controls[name].
 *  - Un control o tool SIN onChange tira TypeError → onChange garantizado en todos.
 *  - Una capa de tools VACÍA crashea en v14 → siempre hay al menos el tool "Acerca de".
 */

import { openAboutDialog } from "./about.mjs";

const MODULE_ID = "gg-wp";

/** onChange no-op seguro (v13+ lo exige en control y tools). */
const NOOP = () => {};

function t(key, fallback) {
  const s = game?.i18n?.localize?.(key);
  return (s && s !== key) ? s : fallback;
}

/** Registro de tools que los satélites cuelgan en la sección GGWP. */
export class ToolRegistry {
  #tools = new Map();

  /**
   * @param {Object} tool
   * @param {string} tool.name              Requerido, único.
   * @param {string} [tool.title]
   * @param {string} [tool.icon]            Clase FontAwesome. Default "fas fa-circle".
   * @param {number} [tool.order]
   * @param {boolean} [tool.button=true]    Acción (no cambia de capa).
   * @param {boolean} [tool.toggle=false]
   * @param {Function} [tool.onChange]      (event, active) => void
   * @returns {boolean}
   */
  register(tool) {
    if (!tool?.name || typeof tool.name !== "string") {
      console.warn(`${MODULE_ID} | registerTool: falta "name" válido`, tool);
      return false;
    }
    if (this.#tools.has(tool.name)) {
      console.warn(`${MODULE_ID} | registerTool: "${tool.name}" ya registrado; se sobreescribe.`);
    }
    this.#tools.set(tool.name, tool);
    return true;
  }

  all() {
    return [...this.#tools.values()];
  }
}

/** Normaliza una lista de tools al record que espera v13+, con onChange garantizado. */
function toToolRecord(list) {
  const rec = {};
  let order = 0;
  for (const tool of list) {
    if (!tool?.name) continue;
    rec[tool.name] = {
      name: tool.name,
      order: tool.order ?? order++,
      title: tool.title ?? tool.name,
      icon: tool.icon ?? "fas fa-circle",
      visible: tool.visible ?? true,
      button: tool.button ?? true,
      toggle: tool.toggle ?? false,
      active: tool.active ?? false,
      onChange: typeof tool.onChange === "function" ? tool.onChange : NOOP
    };
  }
  return rec;
}

/**
 * Inyecta la sección GGWP en el hook getSceneControlButtons.
 * @param {Record<string, object>|Array} controls
 * @param {ToolRegistry} toolRegistry
 * @param {import("./content-packs.mjs").ContentPackRegistry} packRegistry
 */
export function registerGGWPControls(controls, toolRegistry, packRegistry) {
  try {
    // Tool built-in que garantiza que la sección nunca quede vacía (crash v14).
    const aboutTool = {
      name: "gg-wp-about",
      title: t("GGWP.controls.about", "Acerca de la suite"),
      icon: "fas fa-circle-info",
      order: -1,
      button: true,
      onChange: () => openAboutDialog(packRegistry)
    };

    const toolsRecord = toToolRecord([aboutTool, ...toolRegistry.all()]);
    const firstTool = Object.keys(toolsRecord)[0];
    if (!firstTool) return; // salvaguarda extra; en la práctica siempre está "about".

    const control = {
      name: MODULE_ID,
      title: t("GGWP.controls.title", "Crónicas Bárdicas"),
      icon: "ggwp-lute", // clase custom → máscara CSS con la silueta del laúd
      order: 90,
      visible: true,
      tools: toolsRecord,
      activeTool: firstTool,
      onChange: NOOP // requerido en v13+
    };

    if (controls && !Array.isArray(controls) && typeof controls === "object") {
      // v13+ : record
      controls[MODULE_ID] = control;
    } else if (Array.isArray(controls)) {
      // Shape de array (v12 y anteriores): gg-wp targetea v13+. No inyectamos
      // para no colgar botones con contrato distinto (onClick vs onChange).
      console.warn(`${MODULE_ID} | scene-controls en shape de array (v12); gg-wp targetea v13+, sección omitida.`);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | getSceneControlButtons falló`, err);
  }
}
