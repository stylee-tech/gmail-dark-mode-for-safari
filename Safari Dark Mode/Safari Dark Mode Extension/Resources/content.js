(function () {
  const api = globalThis.browser || globalThis.chrome;
  const registry = globalThis.__safariDarkModeRegistry;
  const context = registry ? registry.detectContext() : null;
  const product = context ? context.product : null;
  const colorSchemeQuery = globalThis.matchMedia
    ? globalThis.matchMedia("(prefers-color-scheme: dark)")
    : null;

  if (!api || !registry || !product) {
    return;
  }

  const styleManager = registry.createStyleManager(api, product);
  let enabledBySiteState = registry.defaults();
  let storageRevision = 0;

  document.documentElement.dataset.sdmProduct = product;
  if (context.parentProduct) {
    document.documentElement.dataset.sdmParentProduct = context.parentProduct;
  }
  document.documentElement.dataset.sdmHost = location.hostname;
  document.documentElement.dataset.sdmRenderers = registry.renderersFor(product).join(" ");
  styleManager.observe();
  const initialRevision = storageRevision;
  registry.readEnabledBySite(api, (settings) => {
    if (storageRevision === initialRevision) applyEnabled(settings);
  });

  if (api.storage.onChanged) {
    api.storage.onChanged.addListener((changes, areaName) => {
      const storageChange = changes[registry.storageKey];

      if (areaName !== "local" || !storageChange) {
        return;
      }

      storageRevision += 1;
      applyEnabled(storageChange.newValue || registry.defaults());
    });
  }

  if (colorSchemeQuery) {
    const handleSystemAppearanceChange = () => applyEnabled(enabledBySiteState);

    if (colorSchemeQuery.addEventListener) {
      colorSchemeQuery.addEventListener("change", handleSystemAppearanceChange);
    } else if (colorSchemeQuery.addListener) {
      colorSchemeQuery.addListener(handleSystemAppearanceChange);
    }
  }

  if (api.runtime.onMessage) {
    api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || message.type !== "sdm:get-product") {
        return undefined;
      }

      if (!registry.isTopLevelWindow()) {
        return undefined;
      }

      registry.readEnabledBySite(api, (enabledBySite) => {
        const mode = registry.modeFor(enabledBySite, product, context);
        const siteEnabled = mode !== "off";
        const systemDark = isSystemDark();

        if (
          registry.products[product] &&
          registry.products[product].requiresKnownParent &&
          !context.parentProduct
        ) {
          sendResponse({ supported: false });
          return;
        }

        sendResponse({
          product,
          renderers: registry.renderersFor(product),
          enabled: registry.isProductEnabled(enabledBySite, product, context, systemDark),
          mode,
          siteEnabled,
          systemDark
        });
      });

      return true;
    });
  }

  function applyEnabled(enabledBySite) {
    enabledBySiteState = registry.normalizeEnabledBySite(enabledBySite);
    const mode = registry.modeFor(enabledBySiteState, product, context);
    const siteEnabled = mode !== "off";
    const systemDark = isSystemDark();
    const enabled = registry.isProductEnabled(enabledBySiteState, product, context, systemDark);

    document.documentElement.toggleAttribute("data-sdm-disabled", !enabled);
    document.documentElement.dataset.sdmEnabled = String(enabled);
    document.documentElement.dataset.sdmMode = mode;
    document.documentElement.dataset.sdmSiteEnabled = String(siteEnabled);
    document.documentElement.dataset.sdmSystemDark = String(systemDark);
    document.documentElement.dataset.sdmPreload = enabled ? "enabled" : "disabled";
    styleManager.sync(enabled);
    if (product === "gmail") globalThis.__safariDarkModeMessages?.sync(enabled);
  }

  function isSystemDark() {
    return !colorSchemeQuery || colorSchemeQuery.matches;
  }
})();
