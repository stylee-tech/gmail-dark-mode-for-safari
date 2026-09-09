(function () {
  const api = globalThis.browser || globalThis.chrome;
  const registry = globalThis.__safariDarkModeRegistry;
  const label = document.getElementById("site-label");
  const toggle = document.getElementById("enabled-toggle");
  const appearanceStatus = document.getElementById("appearance-status");
  const unsupported = document.getElementById("unsupported");
  const appearance = globalThis.matchMedia("(prefers-color-scheme: dark)");
  let currentProduct = null;
  let savedEnabled = false;

  if (!api || !registry) {
    setUnavailable(false);
    return;
  }

  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const queryError = api.runtime.lastError;
    const tab = tabs && tabs[0];
    if (queryError || !tab || typeof tab.id === "undefined") {
      setUnavailable(false);
      return;
    }

    let urlProduct = null;
    try { urlProduct = registry.detectProduct(new URL(tab.url), { includeHelpers: false }); }
    catch (_error) { /* Safari may withhold the URL until access is granted. */ }

    api.tabs.sendMessage(tab.id, { type: "sdm:get-product" }, { frameId: 0 }, (response) => {
      const messageError = api.runtime.lastError;
      if (messageError || !response || !registry.products[response.product] || response.supported === false) {
        setUnavailable(Boolean(urlProduct));
        return;
      }

      currentProduct = response.product;
      label.textContent = registry.products[currentProduct].label;
      savedEnabled = response.siteEnabled !== false;
      toggle.checked = savedEnabled;
      toggle.disabled = false;
      renderStatus();
    });
  });

  toggle.addEventListener("change", () => {
    if (!currentProduct) return;
    const requestedEnabled = toggle.checked;
    toggle.disabled = true;
    appearanceStatus.textContent = "Saving preference…";

    registry.readEnabledBySite(api, (settings, readError) => {
      if (readError) { finishSave(readError); return; }
      settings[currentProduct] = requestedEnabled;
      registry.writeEnabledBySite(api, settings, finishSave);
    });

    function finishSave(error) {
      if (!error) savedEnabled = requestedEnabled;
      toggle.checked = savedEnabled;
      toggle.disabled = false;
      if (error) appearanceStatus.textContent = "Couldn’t save. Please try again.";
      else renderStatus();
    }
  });

  appearance.addEventListener("change", () => {
    if (currentProduct && !toggle.disabled) renderStatus();
  });

  function renderStatus() {
    appearanceStatus.textContent = !savedEnabled
      ? "Off for this website. Its original appearance is restored."
      : appearance.matches
        ? "Dark appearance is on for this website."
        : "Ready for dark mode. Turns on when your Mac uses Dark Appearance.";
  }

  function setUnavailable(isSupportedUrl) {
    currentProduct = null;
    label.textContent = isSupportedUrl ? "Page not connected" : "No supported page";
    toggle.checked = false;
    toggle.disabled = true;
    appearanceStatus.textContent = isSupportedUrl
      ? "Allow this website in Safari’s extension settings, then reload the page."
      : "Open a supported website. If you’re already there, allow access in Safari and reload.";
    unsupported.hidden = false;
  }
})();
