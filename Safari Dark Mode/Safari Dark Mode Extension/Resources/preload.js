(function () {
  const api = globalThis.browser || globalThis.chrome;
  const product = detectProduct();
  const background = "#0f1115";
  const foreground = "#eef2f7";
  const colorSchemeQuery = globalThis.matchMedia
    ? globalThis.matchMedia("(prefers-color-scheme: dark)")
    : null;
  const defaults = {
    gmail: true,
    sheets: true,
    googleSearch: true
  };
  const style = document.createElement("style");
  let siteEnabled = true;

  if (product) {
    document.documentElement.dataset.sdmProduct = product;
  }

  applyState();

  style.id = "sdm-preload";
  style.textContent = `
    html:not([data-sdm-disabled]),
    html:not([data-sdm-disabled]) body {
      background: ${background} !important;
      color: ${foreground} !important;
      color-scheme: dark !important;
    }
  `;

  if (document.head) {
    document.head.prepend(style);
  } else {
    document.documentElement.prepend(style);
  }

  if (api && product) {
    api.storage.local.get({ enabledBySite: defaults }, (items) => {
      const enabledBySite = items.enabledBySite || defaults;
      siteEnabled = enabledBySite[product] !== false;
      applyState();
    });
  }

  if (colorSchemeQuery) {
    const handleChange = () => applyState();

    if (colorSchemeQuery.addEventListener) {
      colorSchemeQuery.addEventListener("change", handleChange);
    } else if (colorSchemeQuery.addListener) {
      colorSchemeQuery.addListener(handleChange);
    }
  }

  function applyState() {
    const systemDark = !colorSchemeQuery || colorSchemeQuery.matches;
    const enabled = Boolean(product && siteEnabled && systemDark);

    document.documentElement.toggleAttribute("data-sdm-disabled", !enabled);
    document.documentElement.dataset.sdmEnabled = String(enabled);
    document.documentElement.dataset.sdmSiteEnabled = String(Boolean(siteEnabled));
    document.documentElement.dataset.sdmSystemDark = String(systemDark);
  }

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
})();
