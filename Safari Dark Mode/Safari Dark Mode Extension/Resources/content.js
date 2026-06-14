(function () {
  const api = globalThis.browser || globalThis.chrome;
  const product = detectProduct();
  const colorSchemeQuery = globalThis.matchMedia
    ? globalThis.matchMedia("(prefers-color-scheme: dark)")
    : null;

  if (!api || !product) {
    return;
  }

  const defaults = {
    gmail: true,
    sheets: true,
    googleSearch: true
  };

  document.documentElement.dataset.sdmProduct = product;
  let enabledBySiteState = defaults;

  function detectProduct() {
    if (location.hostname === "mail.google.com") {
      return "gmail";
    }

    if (
      location.hostname === "docs.google.com" &&
      location.pathname.startsWith("/spreadsheets/")
    ) {
      return "sheets";
    }

    if (
      (location.hostname === "google.com" || location.hostname === "www.google.com") &&
      location.pathname.startsWith("/search")
    ) {
      return "googleSearch";
    }

    return null;
  }

  function readSettings(callback) {
    api.storage.local.get({ enabledBySite: defaults }, (items) => {
      callback(items.enabledBySite || defaults);
    });
  }

  function applyEnabled(enabledBySite) {
    enabledBySiteState = Object.assign({}, defaults, enabledBySite);
    const siteEnabled = enabledBySiteState[product] !== false;
    const systemDark = isSystemDark();
    const enabled = siteEnabled && systemDark;

    document.documentElement.toggleAttribute("data-sdm-disabled", !enabled);
    document.documentElement.dataset.sdmEnabled = String(enabled);
    document.documentElement.dataset.sdmSiteEnabled = String(siteEnabled);
    document.documentElement.dataset.sdmSystemDark = String(systemDark);
  }

  readSettings(applyEnabled);

  if (api.storage.onChanged) {
    api.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes.enabledBySite) {
        return;
      }

      applyEnabled(changes.enabledBySite.newValue || defaults);
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

      readSettings((enabledBySite) => {
        const siteEnabled = enabledBySite[product] !== false;
        const systemDark = isSystemDark();

        sendResponse({
          product,
          enabled: siteEnabled && systemDark,
          siteEnabled,
          systemDark
        });
      });

      return true;
    });
  }

  function isSystemDark() {
    return !colorSchemeQuery || colorSchemeQuery.matches;
  }
})();
