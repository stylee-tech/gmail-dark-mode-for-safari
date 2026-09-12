(function () {
  const api = globalThis.browser || globalThis.chrome;
  const registry = globalThis.__safariDarkModeRegistry;
  const label = document.getElementById("site-label");
  const selector = document.getElementById("appearance-mode");
  const choices = selector.querySelectorAll("input[name=appearance]");
  const appearanceStatus = document.getElementById("appearance-status");
  const unsupported = document.getElementById("unsupported");
  const retry = document.getElementById("retry-connection");
  const appearance = globalThis.matchMedia("(prefers-color-scheme: dark)");
  let currentProduct = null;
  let savedMode = "system";

  if (!api || !registry) {
    setUnavailable(false);
    return;
  }

  retry.addEventListener("click", connect);
  connect();

  function connect() {
    let finished = false;
    let urlProduct = null;
    currentProduct = null;
    selector.disabled = true;
    retry.hidden = true;
    unsupported.hidden = true;
    label.textContent = "Checking this page…";
    appearanceStatus.textContent = "Connecting to this page…";
    const timeout = setTimeout(() => fail(true), 4000);

    function fail(timedOut = false) {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      setUnavailable(Boolean(urlProduct));
      retry.hidden = false;
      if (timedOut) {
        label.textContent = "Connection timed out";
        appearanceStatus.textContent = "Try again. If this persists, reload the page or reopen Safari’s extension settings.";
      }
    }

    try {
      api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const queryError = api.runtime.lastError;
        if (finished) return;
        const tab = tabs && tabs[0];
        if (queryError || !tab || typeof tab.id === "undefined") { fail(); return; }
        try { urlProduct = registry.detectProduct(new URL(tab.url), { includeHelpers: false }); }
        catch (_error) { /* Safari may withhold the URL until access is granted. */ }
        try {
          api.tabs.sendMessage(tab.id, { type: "sdm:get-product" }, { frameId: 0 }, (response) => {
            const messageError = api.runtime.lastError;
            if (finished) return;
            if (messageError || !response || !registry.products[response.product] || response.supported === false) {
              fail();
              return;
            }
            finished = true;
            clearTimeout(timeout);
            currentProduct = response.product;
            label.textContent = registry.products[currentProduct].label;
            savedMode = registry.normalizeEnabledBySite({ [currentProduct]: response.mode ?? response.siteEnabled })[currentProduct];
            selectMode(savedMode);
            selector.disabled = false;
            renderStatus();
          });
        } catch (_error) { fail(); }
      });
    } catch (_error) { fail(); }
  }

  selector.addEventListener("change", (event) => {
    if (!currentProduct || selector.disabled || !event.target.checked) return;
    const requestedMode = event.target.value;
    if (!["dark", "off", "system"].includes(requestedMode)) return;
    const focusedChoice = Array.from(choices).includes(document.activeElement) ? document.activeElement : null;
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
      if (focusedChoice && document.activeElement === document.body) focusedChoice.focus();
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
      ? "Reload this page and retry. If it still won’t connect, check website access in Safari’s extension settings."
      : "Open a supported website. If you’re already there, allow access in Safari and reload.";
    unsupported.hidden = false;
  }
})();
