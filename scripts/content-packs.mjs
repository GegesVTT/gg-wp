/**
 * GGWP · content-packs.mjs
 * Registro central del contrato de content-packs de la suite.
 * Los satélites llaman api.registerContentPack({...}) tras el hook "gg-wp.ready".
 */

const MODULE_ID = "gg-wp";
const VALID_TIERS = new Set(["free", "premium"]);

/**
 * @typedef {Object} ContentPack
 * @property {string}   id                Identificador único del pack (requerido).
 * @property {string}   [moduleId]        Módulo que lo provee (ej. "gg-nameforge").
 * @property {string}   [name]            Nombre visible. Default = id.
 * @property {"free"|"premium"} [tier]    Nivel. Inválido → "free".
 * @property {string}   [purchaseUrl]     URL de compra (CTA en packs premium).
 * @property {string[]} [contentLanguages] Idiomas del contenido, ej. ["es","en"].
 */

export class ContentPackRegistry {
  #packs = new Map();

  /**
   * @param {ContentPack} pack
   * @returns {boolean} true si quedó registrado.
   */
  register(pack) {
    if (!pack?.id || typeof pack.id !== "string") {
      console.warn(`${MODULE_ID} | registerContentPack: falta "id" válido`, pack);
      return false;
    }

    const tier = VALID_TIERS.has(pack.tier) ? pack.tier : "free";
    if (!VALID_TIERS.has(pack.tier)) {
      console.warn(
        `${MODULE_ID} | registerContentPack "${pack.id}": tier inválido "${pack.tier}", se asume "free".`
      );
    }

    if (this.#packs.has(pack.id)) {
      console.warn(`${MODULE_ID} | registerContentPack: "${pack.id}" ya registrado; se sobreescribe.`);
    }

    const entry = Object.freeze({
      id: pack.id,
      moduleId: pack.moduleId ?? null,
      name: pack.name ?? pack.id,
      tier,
      purchaseUrl: pack.purchaseUrl ?? null,
      contentLanguages: Array.isArray(pack.contentLanguages) ? [...pack.contentLanguages] : []
    });

    this.#packs.set(pack.id, entry);
    return true;
  }

  /** @param {string} id @returns {ContentPack|null} */
  get(id) {
    return this.#packs.get(id) ?? null;
  }

  /** @returns {ContentPack[]} copia del registro. */
  all() {
    return [...this.#packs.values()];
  }
}
