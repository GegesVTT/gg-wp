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

/**
 * @param {import("./content-packs.mjs").ContentPackRegistry} packRegistry
 * @param {import("./suite.mjs").SuiteRegistry} suiteRegistry
 */
function buildContent(packRegistry, suiteRegistry) {
  const packs = packRegistry?.all?.() ?? [];

  // Membresía por REGISTRO EXPLÍCITO. Antes se barría por prefijo "gg-", lo que
  // metía themes de tarjeta y módulos ajenos en la lista de la suite.
  const mods = suiteRegistry?.active?.() ?? [];
  const modRows = mods.length
    ? mods.map((m) => `<li><b>${esc(m.title)}</b>${m.version ? ` <span class="ggwp-dim">v${esc(m.version)}</span>` : ""}</li>`).join("")
    : `<li><i>${t("GGWP.about.noModules", "No hay módulos de la suite activos.")}</i></li>`;

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
      <h3>${t("GGWP.about.modules", "Módulos de la suite")}</h3>
      <ul>${modRows}</ul>
      <h3>${t("GGWP.about.packs", "Content-packs")}</h3>
      <ul>${rows}</ul>
    </section>`;
}

/**
 * Abre el diálogo Acerca de.
 * @param {import("./content-packs.mjs").ContentPackRegistry} packRegistry
 * @param {import("./suite.mjs").SuiteRegistry} [suiteRegistry]
 */
export async function openAboutDialog(packRegistry, suiteRegistry) {
  const content = buildContent(packRegistry, suiteRegistry);
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
