/**
 * GGWP · controls.mjs
 * Sección GGWP en los controles de escena.
 *
 * Facts de Foundry v13+ que este archivo respeta:
 *  - getSceneControlButtons pasa un RECORD (no un array) → se asigna controls[name].
 *  - Un control o tool SIN onChange tira TypeError → onChange garantizado en todos.
 *  - Una capa de tools VACÍA crashea en v14 → siempre hay al menos el tool "Acerca de".
 *  - Foundry invoca el onChange del `activeTool` al ACTIVAR el grupo, sin evento
 *    de usuario. Para tools de acción (button: true) eso significa que la acción
 *    se dispara sola cada vez que entrás a la sección. Ver GUARD más abajo.
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

/**
 * GUARD DE ACTIVACIÓN.
 *
 * Foundry dispara el onChange del activeTool cuando el grupo se activa, no solo
 * cuando el usuario hace clic. Para una tool de acción eso es un bug visible:
 * "Acerca de" se abría solo al entrar a la sección, y lo mismo le pasaría a
 * cualquier satélite que quedara primero en el orden.
 *
 * Un clic real trae un Event; la activación programática no. Envolvemos toda
 * tool de acción para que solo corra ante un evento de usuario.
 *
 * Los toggles quedan afuera: para ellos onChange(event, active) sí es legítimo
 * durante la activación.
 */
function guardAction(fn, { isToggle }) {
  if (typeof fn !== "function") return NOOP;
  if (isToggle) return fn;
  return function (event, ...rest) {
    if (!event) return; // activación de capa, no clic → no hacemos nada
    return fn.call(this, event, ...rest);
  };
}

/** Normaliza una lista de tools al record que espera v13+, con onChange garantizado. */
function toToolRecord(list) {
  const rec = {};
  let order = 0;
  for (const tool of list) {
    if (!tool?.name) continue;
    const isToggle = tool.toggle ?? false;
    rec[tool.name] = {
      name: tool.name,
      order: tool.order ?? order++,
      title: tool.title ?? tool.name,
      icon: tool.icon ?? "fas fa-circle",
      visible: tool.visible ?? true,
      button: tool.button ?? true,
      toggle: isToggle,
      active: tool.active ?? false,
      onChange: guardAction(tool.onChange, { isToggle })
    };
  }
  return rec;
}

/**
 * Inyecta la sección GGWP en el hook getSceneControlButtons.
 * @param {Record<string, object>|Array} controls
 * @param {ToolRegistry} toolRegistry
 * @param {import("./content-packs.mjs").ContentPackRegistry} packRegistry
 * @param {import("./suite.mjs").SuiteRegistry} suiteRegistry
 */
export function registerGGWPControls(controls, toolRegistry, packRegistry, suiteRegistry) {
  try {
    // Los satélites van primero; "Acerca de" cierra la lista, como en cualquier
    // menú donde la información va al final.
    const aboutTool = {
      name: "gg-wp-about",
      title: t("GGWP.controls.about", "Acerca de la suite"),
      icon: "fas fa-circle-info",
      order: 999,
      button: true,
      onChange: () => openAboutDialog(packRegistry, suiteRegistry)
    };

    // ANCLA DE CAPA.
    //
    // Foundry activa el `activeTool` al entrar a la sección, y si ese tool es
    // de acción (button: true) ejecuta su acción. Por eso "Acerca de" se abría
    // solo — y lo mismo le pasaría a cualquier satélite que quedara primero.
    //
    // La solución es que el activeTool NO sea de acción: este tool es el estado
    // neutro de la capa. Se ve como el laúd de la suite y no hace nada.
    const homeTool = {
      name: "gg-wp-home",
      title: t("GGWP.controls.title", "Crónicas Bárdicas"),
      icon: "ggwp-lute",
      order: -1,
      button: false, // ← clave: tool de modo, no de acción
      toggle: false,
      onChange: NOOP
    };

    const satellites = toolRegistry.all();
    const toolsRecord = toToolRecord([homeTool, ...satellites, aboutTool]);

    // La capa nunca queda vacía (crash en v14): "Acerca de" siempre está.
    const names = Object.keys(toolsRecord);
    if (!names.length) return;

    // activeTool: SIEMPRE un tool de modo, nunca uno de acción. El ancla es de
    // modo por construcción; el reduce queda como red por si algún día se
    // registra otro tool de modo con order menor.
    const modeTools = names.filter((n) => !toolsRecord[n].button);
    const candidatos = modeTools.length ? modeTools : names;
    const activeTool = candidatos.reduce((a, b) =>
      (toolsRecord[a].order <= toolsRecord[b].order ? a : b));

    const control = {
      name: MODULE_ID,
      title: t("GGWP.controls.title", "Crónicas Bárdicas"),
      icon: "ggwp-lute", // clase custom → máscara CSS con la silueta del laúd
      order: 90,
      visible: true,
      tools: toolsRecord,
      activeTool,
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
