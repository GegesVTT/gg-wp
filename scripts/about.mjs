/**
 * GGWP · about.mjs
 * Diálogo "Acerca de la suite". Usa DialogV2 (v13+) con fallback a Dialog.
 */

const MODULE_ID = "gg-wp";

/** Escapador mínimo para no depender de utilidades de Foundry que varían por versión. */
function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function t(key, fallback) {
  const s = game?.i18n?.localize?.(key);
  return (s && s !== key) ? s : fallback;
}

function buildContent(packRegistry) {
  const packs = packRegistry?.all?.() ?? [];

  const rows = packs.length
    ? packs.map((p) => {
        const cta = (p.tier === "premium" && p.purchaseUrl)
          ? ` · <a href="${esc(p.purchaseUrl)}" target="_blank" rel="noopener">${t("GGWP.about.buy", "Comprar")}</a>`
          : "";
        const langs = p.contentLanguages?.length ? ` <span class="ggwp-dim">(${esc(p.contentLanguages.join(", "))})</span>` : "";
        return `<li><b>${esc(p.name)}</b> — ${esc(p.tier)}${cta}${langs}</li>`;
      }).join("")
    : `<li><i>${t("GGWP.about.noPacks", "Todavía no hay content-packs registrados.")}</i></li>`;

  return `
    <section class="ggwp-about">
      <h2>Crónicas Bárdicas</h2>
      <p>${t("GGWP.about.tagline", "Suite de módulos GegesVTT para Foundry VTT.")}</p>
      <h3>${t("GGWP.about.packs", "Content-packs")}</h3>
      <ul>${rows}</ul>
    </section>`;
}

/**
 * Abre el diálogo Acerca de.
 * @param {import("./content-packs.mjs").ContentPackRegistry} packRegistry
 */
export async function openAboutDialog(packRegistry) {
  const content = buildContent(packRegistry);
  const title = "GGWP · Crónicas Bárdicas";
  const closeLabel = t("GGWP.about.close", "Cerrar");

  const DV2 = foundry?.applications?.api?.DialogV2;
  if (DV2) {
    return DV2.prompt({
      window: { title },
      content,
      ok: { label: closeLabel },
      rejectClose: false
    }).catch(() => {});
  }

  // Fallback (v13 temprano / compat)
  if (globalThis.Dialog) {
    return new globalThis.Dialog({
      title,
      content,
      buttons: { close: { label: closeLabel } },
      default: "close"
    }).render(true);
  }

  console.warn(`${MODULE_ID} | No hay Dialog disponible para el diálogo Acerca de.`);
}
