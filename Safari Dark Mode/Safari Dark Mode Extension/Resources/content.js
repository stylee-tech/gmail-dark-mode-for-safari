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

  document.documentElement.dataset.sdmProduct = product;
  if (context.parentProduct) {
    document.documentElement.dataset.sdmParentProduct = context.parentProduct;
  }
  document.documentElement.dataset.sdmHost = location.hostname;
  document.documentElement.dataset.sdmRenderers = registry.renderersFor(product).join(" ");
  styleManager.observe();
  registry.readEnabledBySite(api, applyEnabled);

  if (api.storage.onChanged) {
    api.storage.onChanged.addListener((changes, areaName) => {
      const storageChange = changes[registry.storageKey];

      if (areaName !== "local" || !storageChange) {
        return;
      }

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
        const siteEnabled = registry.isProductEnabled(enabledBySite, product, context);
        const systemDark = isSystemDark();

        sendResponse({
          product,
          renderers: registry.renderersFor(product),
          enabled: siteEnabled && systemDark,
          siteEnabled,
          systemDark
        });
      });

      return true;
    });
  }

  function applyEnabled(enabledBySite) {
    enabledBySiteState = registry.normalizeEnabledBySite(enabledBySite);
    const siteEnabled = registry.isProductEnabled(enabledBySiteState, product, context);
    const systemDark = isSystemDark();
    const enabled = siteEnabled && systemDark;

    registry.writePreloadHint(
      product,
      registry.isProductEnabled(enabledBySiteState, product, context),
      context
    );
    document.documentElement.toggleAttribute("data-sdm-disabled", !enabled);
    document.documentElement.dataset.sdmEnabled = String(enabled);
    document.documentElement.dataset.sdmSiteEnabled = String(siteEnabled);
    document.documentElement.dataset.sdmSystemDark = String(systemDark);
    document.documentElement.dataset.sdmPreload = enabled ? "enabled" : "disabled";
    styleManager.sync(enabled);
  }

  function isSystemDark() {
    return !colorSchemeQuery || colorSchemeQuery.matches;
  }
})();
