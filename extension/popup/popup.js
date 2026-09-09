(function () {
  const api = globalThis.browser || globalThis.chrome;
  const registry = globalThis.__safariDarkModeRegistry;
  const label = document.getElementById("site-label");
  const selector = document.getElementById("appearance-mode");
  const choices = selector.querySelectorAll("input[name=appearance]");
  const appearanceStatus = document.getElementById("appearance-status");
  const unsupported = document.getElementById("unsupported");
  const appearance = globalThis.matchMedia("(prefers-color-scheme: dark)");
  let currentProduct = null;
  let savedMode = "system";

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
      savedMode = registry.normalizeEnabledBySite({ [currentProduct]: response.mode ?? response.siteEnabled })[currentProduct];
      selectMode(savedMode);
      selector.disabled = false;
      renderStatus();
    });
  });

  selector.addEventListener("change", (event) => {
    if (!currentProduct || selector.disabled || !event.target.checked) return;
    const requestedMode = event.target.value;
    if (!["dark", "off", "system"].includes(requestedMode)) return;
    selector.disabled = true;
    appearanceStatus.textContent = "Saving preference…";

    registry.readEnabledBySite(api, (settings, readError) => {
      if (readError) { finishSave(readError); return; }
      settings[currentProduct] = requestedMode;
      registry.writeEnabledBySite(api, settings, finishSave);
    });

    function finishSave(error) {
      if (!error) savedMode = requestedMode;
      selectMode(savedMode);
      selector.disabled = false;
      if (error) appearanceStatus.textContent = "Couldn’t save. Please try again.";
      else renderStatus();
    }
  });

  appearance.addEventListener("change", () => {
    if (currentProduct && !selector.disabled) renderStatus();
  });

  function selectMode(mode) {
    for (const choice of choices) choice.checked = choice.value === mode;
  }

  function renderStatus() {
    appearanceStatus.textContent = savedMode === "off"
      ? "Using this website’s default appearance."
      : savedMode === "dark"
        ? "Dark appearance stays on, regardless of your device setting."
        : appearance.matches
          ? "Following your device: dark appearance is on."
          : "Following your device: original appearance is shown.";
  }

  function setUnavailable(isSupportedUrl) {
    currentProduct = null;
    label.textContent = isSupportedUrl ? "Page not connected" : "No supported page";
    selectMode("system");
    selector.disabled = true;
    appearanceStatus.textContent = isSupportedUrl
      ? "Allow this website in Safari’s extension settings, then reload the page."
      : "Open a supported website. If you’re already there, allow access in Safari and reload.";
    unsupported.hidden = false;
  }
})();
