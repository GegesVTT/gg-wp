/**
 * GGWP · brand.mjs
 * Fuente única de los tokens de marca de la suite Crónicas Bárdicas.
 * Se ofrece a los satélites (api.brand) y se inyecta como custom props --ggwp-*.
 * OJO: es OFERTA, no imposición. Cada satélite mantiene su propio fallback y
 * debe seguir funcionando standalone aunque gg-wp no esté instalado.
 */

export const BRAND = Object.freeze({
  // Chrome de UI (kit ggse-ui)
  roble: "#19120D", // roble negro
  ambar: "#E0A23C", // ámbar de UI (ggse-ui)

  // Marca canónica (logo SVG TukiRecurso_9.svg)
  oro:   "#e3ad4b", // oro canónico de marca
  vino:  "#8A2F3F", // vino
  teal:  "#00252C", // verde noche del splash / grimorio oscuro
  papel: "#FBF7EE", // papel de carta clara

  // Tipografías — solo OFL
  fontTitle: "'Uncial Antiqua', serif",     // títulos de UI
  fontBody:  "'Cormorant Garamond', serif", // cuerpo de UI

  // Nombre público (decisión de marca final)
  suiteName: "Crónicas Bárdicas"
});

/**
 * Inyecta los tokens como custom properties en el elemento raíz.
 * @param {HTMLElement} [root=document.documentElement]
 */
export function applyBrandTokens(root = document?.documentElement) {
  if (!root?.style) return;
  const map = {
    "--ggwp-roble": BRAND.roble,
    "--ggwp-ambar": BRAND.ambar,
    "--ggwp-oro":   BRAND.oro,
    "--ggwp-vino":  BRAND.vino,
    "--ggwp-teal":  BRAND.teal,
    "--ggwp-papel": BRAND.papel,
    "--ggwp-font-title": BRAND.fontTitle,
    "--ggwp-font-body":  BRAND.fontBody
  };
  for (const [k, v] of Object.entries(map)) root.style.setProperty(k, v);
}
