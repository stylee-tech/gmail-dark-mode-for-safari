(function () {
  const api = globalThis.browser || globalThis.chrome;
  const registry = globalThis.__safariDarkModeRegistry;
  const context = registry ? registry.detectContext() : null;
  const product = context ? context.product : null;

  if (!api || !registry || !product) {
    return;
  }

  const styleManager = registry.createStyleManager(api, product);
  const colorSchemeQuery = globalThis.matchMedia
    ? globalThis.matchMedia("(prefers-color-scheme: dark)")
    : null;
  const preloadStyle = document.createElement("style");
  const hintedSiteEnabled = registry.readPreloadHint(product);
  const hasPreloadHint = hintedSiteEnabled !== null;
  const canOptimisticallyPreload = registry.shouldPreloadWithoutHint(product);
  let siteEnabled = hasPreloadHint ? hintedSiteEnabled : canOptimisticallyPreload;
  let settingsReady = false;
  const initialSystemDark = !colorSchemeQuery || colorSchemeQuery.matches;
  const initialSiteStateKnown = hasPreloadHint || canOptimisticallyPreload;
  const initialEnabled = Boolean(initialSiteStateKnown && siteEnabled && initialSystemDark);

  document.documentElement.toggleAttribute("data-sdm-disabled", !initialEnabled);
  document.documentElement.dataset.sdmEnabled = String(initialEnabled);
  document.documentElement.dataset.sdmSiteEnabled = initialSiteStateKnown
    ? String(Boolean(siteEnabled))
    : "pending";
  document.documentElement.dataset.sdmSystemDark = String(initialSystemDark);
  document.documentElement.dataset.sdmPreload = hasPreloadHint
    ? (initialEnabled ? "hint-enabled" : "hint-disabled")
    : (canOptimisticallyPreload ? "optimistic-enabled" : "pending-disabled");
  document.documentElement.dataset.sdmProduct = product;
  if (context.parentProduct) {
    document.documentElement.dataset.sdmParentProduct = context.parentProduct;
  }
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
    siteEnabled = registry.isProductEnabled(enabledBySite, product, context);
    settingsReady = true;
    registry.writePreloadHint(product, registry.isOwnProductEnabled(enabledBySite, product));
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
    const siteStateKnown = settingsReady || hasPreloadHint || canOptimisticallyPreload;
    const enabled = Boolean(siteStateKnown && siteEnabled && systemDark);

    document.documentElement.toggleAttribute("data-sdm-disabled", !enabled);
    document.documentElement.dataset.sdmEnabled = String(enabled);
    document.documentElement.dataset.sdmSiteEnabled = siteStateKnown
      ? String(Boolean(siteEnabled))
      : "pending";
    document.documentElement.dataset.sdmSystemDark = String(systemDark);
    document.documentElement.dataset.sdmPreload = settingsReady
      ? (enabled ? "enabled" : "disabled")
      : (hasPreloadHint
        ? (enabled ? "hint-enabled" : "hint-disabled")
        : (canOptimisticallyPreload ? "optimistic-enabled" : "pending-disabled"));

    styleManager.sync(enabled);
  }
})();
