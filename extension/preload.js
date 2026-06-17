(function () {
  const api = globalThis.browser || globalThis.chrome;
  const registry = globalThis.__safariDarkModeRegistry;
  const product = registry ? registry.detectProduct() : null;

  if (!api || !registry || !product) {
    return;
  }

  const styleManager = registry.createStyleManager(api, product);
  const colorSchemeQuery = globalThis.matchMedia
    ? globalThis.matchMedia("(prefers-color-scheme: dark)")
    : null;
  const preloadStyle = document.createElement("style");
  let siteEnabled = registry.products[product].defaultEnabled !== false;
  let settingsReady = false;

  document.documentElement.dataset.sdmPreload = "pending";
  document.documentElement.dataset.sdmProduct = product;
  document.documentElement.dataset.sdmHost = location.hostname;
  document.documentElement.dataset.sdmRenderers = registry.renderersFor(product).join(" ");

  preloadStyle.id = `${registry ? registry.namespace : "pavel-safari-dark-mode"}-preload`;
  preloadStyle.className = registry ? registry.namespace : "pavel-safari-dark-mode";
  preloadStyle.setAttribute("data-pavel-safari-dark-mode", "preload");
  preloadStyle.textContent = `
    html:not([data-sdm-disabled]),
    html:not([data-sdm-disabled]) body {
      background: #151922 !important;
      color: #eef2f7 !important;
      color-scheme: dark !important;
    }
  `;

  (document.head || document.documentElement).prepend(preloadStyle);
  applyState();

  registry.readEnabledBySite(api, (enabledBySite) => {
    siteEnabled = registry.isProductEnabled(enabledBySite, product);
    settingsReady = true;
    applyState();
  });

  if (colorSchemeQuery) {
    const handleChange = () => applyState();

    if (colorSchemeQuery.addEventListener) {
      colorSchemeQuery.addEventListener("change", handleChange);
    } else if (colorSchemeQuery.addListener) {
      colorSchemeQuery.addListener(handleChange);
    }
  }

  if (styleManager) {
    styleManager.observe();
  }

  function applyState() {
    const systemDark = !colorSchemeQuery || colorSchemeQuery.matches;
    const enabled = Boolean(siteEnabled && systemDark);

    document.documentElement.toggleAttribute("data-sdm-disabled", !enabled);
    document.documentElement.dataset.sdmEnabled = String(enabled);
    document.documentElement.dataset.sdmSiteEnabled = String(Boolean(siteEnabled));
    document.documentElement.dataset.sdmSystemDark = String(systemDark);
    document.documentElement.dataset.sdmPreload = settingsReady
      ? (enabled ? "enabled" : "disabled")
      : (enabled ? "pending-enabled" : "pending-disabled");

    styleManager.sync(enabled);
  }
})();
