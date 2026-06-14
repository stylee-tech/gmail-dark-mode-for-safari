(function () {
  const api = globalThis.browser || globalThis.chrome;
  const label = document.getElementById("site-label");
  const toggle = document.getElementById("enabled-toggle");
  const appearanceStatus = document.getElementById("appearance-status");
  const unsupported = document.getElementById("unsupported");
  const defaults = {
    gmail: true,
    sheets: true,
    googleSearch: true
  };

  const labels = {
    gmail: "Gmail",
    sheets: "Google Sheets",
    googleSearch: "Google Search"
  };

  let currentProduct = null;

  if (!api) {
    setUnsupported();
    return;
  }

  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];

    if (!tab || typeof tab.id === "undefined") {
      setUnsupported();
      return;
    }

    api.tabs.sendMessage(tab.id, { type: "sdm:get-product" }, (response) => {
      if (api.runtime && api.runtime.lastError) {
        setUnsupported();
        return;
      }

      if (!response || !response.product) {
        setUnsupported();
        return;
      }

      currentProduct = response.product;
      label.textContent = labels[currentProduct] || "Supported page";
      toggle.checked = response.siteEnabled !== false;
      appearanceStatus.textContent = response.systemDark === false
        ? "Waiting for macOS Dark Appearance."
        : "Active while macOS Dark Appearance is on.";
    });
  });

  toggle.addEventListener("change", () => {
    if (!currentProduct) {
      return;
    }

    api.storage.local.get({ enabledBySite: defaults }, (items) => {
      const enabledBySite = Object.assign({}, defaults, items.enabledBySite);
      enabledBySite[currentProduct] = toggle.checked;
      api.storage.local.set({ enabledBySite });
    });
  });

  function setUnsupported() {
    currentProduct = null;
    label.textContent = "Unsupported page";
    toggle.checked = false;
    toggle.disabled = true;
    appearanceStatus.textContent = "";
    unsupported.hidden = false;
  }
})();
