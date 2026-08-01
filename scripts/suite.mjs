/**
 * GGWP · suite.mjs
 * Registro EXPLÍCITO de los módulos de la suite Crónicas Bárdicas.
 *
 * Por qué existe: antes el diálogo "Acerca de" listaba cualquier módulo activo
 * cuyo id empezara con "gg-". Eso barría de más — themes de tarjeta, content-packs
 * y módulos de terceros con el mismo prefijo aparecían como si fueran parte de la
 * suite. La membresía ahora es opt-in: un módulo pertenece a la suite si se
 * registra, y solo entonces.
 *
 *   Hooks.once("gg-wp.ready", (api) => api.registerModule("gg-nameforge"));
 */

const MODULE_ID = "gg-wp";

export class SuiteRegistry {
  #ids = new Set();

  /**
   * Declara que un módulo forma parte de la suite.
   * El título y la versión se leen de Foundry, así nunca quedan desfasados
   * respecto del module.json real.
   *
   * @param {string|{id:string, title?:string, order?:number}} entry
   * @returns {boolean}
   */
  register(entry) {
    const id = typeof entry === "string" ? entry : entry?.id;
    if (!id || typeof id !== "string") {
      console.warn(`${MODULE_ID} | registerModule: falta un "id" válido`, entry);
      return false;
    }
    this.#ids.add(id);
    return true;
  }

  /** Ids registrados, sin filtrar por estado de instalación. */
  ids() {
    return [...this.#ids];
  }

  /**
   * Módulos registrados que además están instalados y activos, con su título y
   * versión reales. gg-wp nunca se lista a sí mismo: es la base, no un satélite.
   */
  active() {
    const out = [];
    for (const id of this.#ids) {
      if (id === MODULE_ID) continue;
      const m = game?.modules?.get?.(id);
      if (!m?.active) continue;
      out.push({ id, title: m.title ?? id, version: m.version ?? "" });
    }
    return out.sort((a, b) => a.title.localeCompare(b.title));
  }
}
