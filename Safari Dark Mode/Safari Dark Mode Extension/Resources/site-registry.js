(function () {
  const namespace = "pavel-safari-dark-mode";
  const storageKey = "enabledBySite";
  const managedAttribute = "data-pavel-safari-dark-mode";
  const cssAppliedValue = "applied";
  const styleManagers = {};

  const styleCatalog = {
    base: {
      file: "base.css",
      marker: "--pavel-safari-dark-mode-base"
    },
    gmail: {
      file: "gmail.css",
      marker: "--pavel-safari-dark-mode-gmail"
    },
    sheets: {
      file: "sheets.css",
      marker: "--pavel-safari-dark-mode-sheets"
    },
    googleSearch: {
      file: "google-search.css",
      marker: "--pavel-safari-dark-mode-google-search"
    }
  };

  const products = {
    gmail: {
      label: "Gmail",
      defaultMode: "system",
      optimisticPreload: true,
      renderers: ["css"],
      styles: [styleCatalog.base, styleCatalog.gmail]
    },
    sheets: {
      label: "Google Sheets",
      defaultMode: "system",
      optimisticPreload: true,
      renderers: ["css"],
      styles: [styleCatalog.sheets]
    },
    googleSearch: {
      label: "Google Search",
      defaultMode: "system",
      optimisticPreload: true,
      renderers: ["css"],
      styles: [styleCatalog.base, styleCatalog.googleSearch]
    },
    googleHelper: {
      label: "Google account helpers",
      defaultMode: "system",
      inheritsFromFlow: true,
      requiresKnownParent: true,
      optimisticPreload: false,
      renderers: ["css"],
      styles: [styleCatalog.base, styleCatalog.gmail]
    }
  };

  function detectProduct(currentLocation, options) {
    const current = currentLocation || location;
    const includeHelpers = !options || options.includeHelpers !== false;

    if (current.protocol && current.protocol !== "https:") {
      return null;
    }

    if (current.hostname === "mail.google.com") {
      return "gmail";
    }

    if (current.hostname === "ogs.google.com") {
      return includeHelpers ? "googleHelper" : null;
    }

    if (
      current.hostname === "accounts.google.com" ||
      current.hostname === "myaccount.google.com"
    ) {
      return includeHelpers ? "googleHelper" : null;
    }

    if (
      current.hostname === "docs.google.com" &&
      current.pathname.startsWith("/spreadsheets/")
    ) {
      return "sheets";
    }

    if (
      (current.hostname === "google.com" || current.hostname === "www.google.com") &&
      (current.pathname === "/search" || current.pathname.startsWith("/search/"))
    ) {
      return "googleSearch";
    }

    return null;
  }

  function detectContext(currentLocation, options) {
    const product = detectProduct(currentLocation, options);
    const isTopLevel = isTopLevelWindow();

    return {
      product,
      parentProduct: product === "googleHelper" && !isTopLevel ? detectParentProduct() : null,
      isTopLevel
    };
  }

  function detectParentProduct() {
    const candidates = [];

    try {
      if (document.referrer) {
        candidates.push(document.referrer);
      }
    } catch (_error) {
      // Referrer can be unavailable in privacy-restricted frames.
    }

    try {
      if (location.ancestorOrigins) {
        for (let index = 0; index < location.ancestorOrigins.length; index += 1) {
          candidates.push(location.ancestorOrigins[index]);
        }
      }
    } catch (_error) {
      // Safari/WebKit may omit ancestorOrigins in some contexts.
    }

    for (const candidate of candidates) {
      const product = detectFlowProductFromUrl(candidate);

      if (product) {
        return product;
      }
    }

    return null;
  }

  function detectFlowProductFromUrl(value) {
    try {
      return detectProduct(new URL(value), { includeHelpers: false });
    } catch (_error) {
      return null;
    }
  }

  function isTopLevelWindow() {
    try {
      return globalThis.top === globalThis;
    } catch (_error) {
      return false;
    }
  }

  function defaults() {
    return Object.keys(products).reduce((result, key) => {
      result[key] = products[key].defaultMode;
      return result;
    }, {});
  }

  function labels() {
    return Object.keys(products).reduce((result, key) => {
      result[key] = products[key].label;
      return result;
    }, {});
  }

  function normalizeEnabledBySite(value) {
    const normalized = defaults();

    for (const key of Object.keys(normalized)) {
      const mode = value && value[key];
      // Keep the existing storage key and migrate boolean preferences on read.
      if (mode === false) normalized[key] = "off";
      else if (mode === true) normalized[key] = "system";
      else if (["system", "dark", "off"].includes(mode)) normalized[key] = mode;
    }

    return normalized;
  }

  // Safari and Chromium can expose callback or Promise completion. Resolve once
  // even when both are delivered, so an old read cannot reapply stale state.
  function storageOperation(api, operation, value, callback) {
    let finished = false;
    const finish = (result, error) => {
      if (finished) return;
      finished = true;
      callback(result, error || null);
    };
    try {
      const pending = api.storage.local[operation](value, result => {
        finish(result, api.runtime.lastError);
      });
      if (pending && typeof pending.then === "function") {
        pending.then(result => finish(result), error => finish(null, error));
      }
    } catch (error) {
      finish(null, error);
    }
  }

  function readEnabledBySite(api, callback) {
    storageOperation(api, "get", { [storageKey]: defaults() }, (items, error) => {
      callback(normalizeEnabledBySite(items && items[storageKey]), error);
    });
  }

  function writeEnabledBySite(api, enabledBySite, callback) {
    storageOperation(api, "set", { [storageKey]: normalizeEnabledBySite(enabledBySite) }, (_items, error) => {
      if (callback) callback(error);
    });
  }

  function modeFor(enabledBySite, product, context) {
    const normalized = normalizeEnabledBySite(enabledBySite);
    if (!Object.hasOwn(products, product) || normalized[product] === "off") return "off";
    if (products[product].inheritsFromFlow) {
      const parent = context && context.parentProduct;
      if (!parent || !Object.hasOwn(products, parent) || products[parent].inheritsFromFlow) return "off";
      return normalized[parent];
    }
    return normalized[product];
  }

  function isProductEnabled(enabledBySite, product, context, systemDark = true) {
    const mode = modeFor(enabledBySite, product, context);
    return mode === "dark" || (mode === "system" && systemDark);
  }

  function isOwnProductEnabled(enabledBySite, product) {
    return Object.hasOwn(products, product) && normalizeEnabledBySite(enabledBySite)[product] !== "off";
  }

  function shouldPreloadWithoutHint(product, context) {
    const productConfig = products[product];

    if (!productConfig || !productConfig.optimisticPreload) {
      return false;
    }

    if (productConfig.inheritsFromFlow && productConfig.requiresKnownParent) {
      return Boolean(context && context.parentProduct);
    }

    return true;
  }

  function stylesFor(product) {
    return products[product] ? products[product].styles.map((style) => Object.assign({}, style)) : [];
  }

  function renderersFor(product) {
    return products[product] ? products[product].renderers.slice() : [];
  }

  function createStyleManager(api, product) {
    if (styleManagers[product]) {
      return styleManagers[product];
    }

    let observer = null;
    let throttleTimer = 0;
    let auditTimers = [];
    let lastEnabled = false;
    let lastHead = null;

    function sync(enabled) {
      lastEnabled = Boolean(enabled);

      if (!lastEnabled) {
        remove();
        return;
      }

      const expectedStyles = stylesFor(product);
      const parent = document.head || document.documentElement;

      expectedStyles.forEach((style, index) => {
        const id = managedStyleId(index);
        let link = document.getElementById(id);

        if (!link) {
          link = document.createElement("link");
          link.id = id;
          link.rel = "stylesheet";
          link.className = namespace;
          link.setAttribute(managedAttribute, "link");
          parent.appendChild(link);
        } else if (link.parentNode !== parent && document.head) {
          parent.appendChild(link);
        }

        link.dataset.pavelSafariDarkModeFile = style.file;
        link.dataset.pavelSafariDarkModeMarker = style.marker;
        const href = api.runtime.getURL(style.file);
        if (link.href !== href) link.href = href;
      });

      pruneUnexpected(expectedStyles);
      restoreManagedStyleOrder(expectedStyles, parent);
      scheduleAudit();
    }

    function observe() {
      if (observer || !document.documentElement) {
        return;
      }

      observer = new MutationObserver(() => scheduleSync());
      observer.observe(document.documentElement, { childList: true });
      observeHead();
    }

    function scheduleSync() {
      if (throttleTimer) {
        return;
      }

      throttleTimer = window.setTimeout(() => {
        throttleTimer = 0;
        observeHead();

        if (lastEnabled) {
          sync(true);
        }
      }, 250);
    }

    function observeHead() {
      if (!observer || !document.head || document.head === lastHead) {
        return;
      }

      lastHead = document.head;
      observer.observe(document.head, { childList: true });
    }

    function scheduleAudit() {
      auditTimers.forEach((timer) => window.clearTimeout(timer));
      auditTimers = [80, 400].map((delay) => window.setTimeout(audit, delay));
    }

    function audit() {
      if (!lastEnabled) {
        return;
      }

      const computed = getComputedStyle(document.documentElement);

      stylesFor(product).forEach((style, index) => {
        const applied = computed.getPropertyValue(style.marker).trim() === cssAppliedValue;

        if (!applied) {
          injectFallback(style, index);
        }
      });
    }

    function injectFallback(style, index) {
      const id = fallbackStyleId(index);

      if (document.getElementById(id)) {
        return;
      }

      const fallback = document.createElement("style");
      const href = api.runtime.getURL(style.file);
      fallback.id = id;
      fallback.className = namespace;
      fallback.setAttribute(managedAttribute, "fallback");
      fallback.dataset.pavelSafariDarkModeFile = style.file;
      fallback.textContent = `@import url("${href}");`;
      (document.head || document.documentElement).appendChild(fallback);
      restoreManagedStyleOrder(stylesFor(product), document.head || document.documentElement);

      fetch(href)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Unable to load ${style.file}`);
          }

          return response.text();
        })
        .then((css) => {
          fallback.textContent = css;
        })
        .catch(() => {
          fallback.textContent = `@import url("${href}");`;
        });
    }

    function pruneUnexpected(expectedStyles) {
      const expectedFiles = expectedStyles.map((style) => style.file);

      document.querySelectorAll(managedStyleSelector()).forEach((element) => {
        if (!expectedFiles.includes(element.dataset.pavelSafariDarkModeFile)) {
          element.remove();
        }
      });
    }

    function restoreManagedStyleOrder(expectedStyles, parent) {
      if (!parent) {
        return;
      }

      const elements = expectedStyles.flatMap((_style, index) =>
        [managedStyleId(index), fallbackStyleId(index)]
          .map((id) => document.getElementById(id))
          .filter(Boolean)
      );
      // Moving an already ordered link still produces a mutation in WebKit.
      // Leave the DOM untouched once our styles are the final children.
      const tail = Array.from(parent.children).slice(-elements.length);
      if (elements.every((element, index) => tail[index] === element)) return;
      elements.forEach((element) => parent.appendChild(element));
    }

    function remove() {
      auditTimers.forEach((timer) => window.clearTimeout(timer));
      auditTimers = [];
      document.querySelectorAll(managedStyleSelector()).forEach((element) => element.remove());
    }

    function managedStyleSelector() {
      return `[${managedAttribute}="link"], [${managedAttribute}="fallback"]`;
    }

    function managedStyleId(index) {
      return `${namespace}-link-${index}`;
    }

    function fallbackStyleId(index) {
      return `${namespace}-fallback-${index}`;
    }

    const manager = {
      sync,
      observe,
      audit,
      remove
    };

    styleManagers[product] = manager;
    return manager;
  }

  globalThis.__safariDarkModeRegistry = {
    namespace,
    storageKey,
    products,
    detectProduct,
    detectContext,
    isTopLevelWindow,
    defaults,
    labels,
    normalizeEnabledBySite,
    readEnabledBySite,
    writeEnabledBySite,
    modeFor,
    isProductEnabled,
    isOwnProductEnabled,
    shouldPreloadWithoutHint,
    stylesFor,
    renderersFor,
    createStyleManager
  };
})();
