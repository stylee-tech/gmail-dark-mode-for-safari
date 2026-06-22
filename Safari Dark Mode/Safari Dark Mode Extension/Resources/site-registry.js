(function () {
  const namespace = "pavel-safari-dark-mode";
  const storageKey = "enabledBySite";
  const preloadHintPrefix = `${namespace}:preload-site-enabled:`;
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
      defaultEnabled: true,
      optimisticPreload: true,
      renderers: ["css"],
      styles: [styleCatalog.base, styleCatalog.gmail]
    },
    sheets: {
      label: "Google Sheets",
      defaultEnabled: true,
      optimisticPreload: true,
      renderers: ["css"],
      styles: [styleCatalog.sheets]
    },
    googleSearch: {
      label: "Google Search",
      defaultEnabled: true,
      optimisticPreload: true,
      renderers: ["css"],
      styles: [styleCatalog.base, styleCatalog.googleSearch]
    },
    googleHelper: {
      label: "Google account helpers",
      defaultEnabled: true,
      inheritsFromFlow: true,
      requiresKnownParent: true,
      optimisticPreload: true,
      renderers: ["css"],
      styles: [styleCatalog.base, styleCatalog.gmail]
    }
  };

  function detectProduct(currentLocation, options) {
    const current = currentLocation || location;
    const includeHelpers = !options || options.includeHelpers !== false;

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
      current.pathname.startsWith("/search")
    ) {
      return "googleSearch";
    }

    return null;
  }

  function detectContext(currentLocation, options) {
    const product = detectProduct(currentLocation, options);

    return {
      product,
      parentProduct: product === "googleHelper" ? detectParentProduct() : null,
      isTopLevel: isTopLevelWindow()
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
      result[key] = products[key].defaultEnabled;
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
    return Object.assign({}, defaults(), value || {});
  }

  function readEnabledBySite(api, callback) {
    api.storage.local.get({ [storageKey]: defaults() }, (items) => {
      callback(normalizeEnabledBySite(items[storageKey]));
    });
  }

  function writeEnabledBySite(api, enabledBySite, callback) {
    api.storage.local.set({ [storageKey]: normalizeEnabledBySite(enabledBySite) }, callback);
  }

  function isProductEnabled(enabledBySite, product, context) {
    const normalized = normalizeEnabledBySite(enabledBySite);

    if (!product || normalized[product] === false) {
      return false;
    }

    const productConfig = products[product];

    if (productConfig && productConfig.inheritsFromFlow) {
      if (!context || !context.parentProduct) {
        return !productConfig.requiresKnownParent;
      }

      if (normalized[context.parentProduct] === false) {
        return false;
      }
    }

    return true;
  }

  function isOwnProductEnabled(enabledBySite, product) {
    return Boolean(product && normalizeEnabledBySite(enabledBySite)[product] !== false);
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

  function preloadHintProduct(product, context) {
    const productConfig = products[product];

    if (productConfig && productConfig.inheritsFromFlow && context && context.parentProduct) {
      return `${product}:${context.parentProduct}`;
    }

    return product;
  }

  function preloadHintKey(product, context) {
    return `${preloadHintPrefix}${preloadHintProduct(product, context)}`;
  }

  function readPreloadHint(product, context) {
    try {
      const value = globalThis.localStorage
        ? globalThis.localStorage.getItem(preloadHintKey(product, context))
        : null;

      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }
    } catch (_error) {
      return null;
    }

    return null;
  }

  function writePreloadHint(product, enabled, context) {
    try {
      if (!globalThis.localStorage) {
        return;
      }

      globalThis.localStorage.setItem(preloadHintKey(product, context), enabled ? "true" : "false");
    } catch (_error) {
      // Storage can be unavailable in some embedded/privacy contexts.
    }
  }

  function stylesFor(product) {
    return products[product] ? products[product].styles.map((style) => Object.assign({}, style)) : [];
  }

  function renderersFor(product) {
    return products[product] ? products[product].renderers.slice() : [];
  }

  function shaderFor(product) {
    return products[product] && products[product].shader
      ? Object.assign({}, products[product].shader, {
        targets: products[product].shader.targets.slice()
      })
      : null;
  }

  function createStyleManager(api, product) {
    if (styleManagers[product]) {
      return styleManagers[product];
    }

    let observer = null;
    let throttleTimer = 0;
    let shaderTimer = 0;
    let lastEnabled = false;
    let lastHead = null;
    let lastBody = null;
    let resizeListenerAttached = false;

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
        link.href = api.runtime.getURL(style.file);
      });

      pruneUnexpected(expectedStyles);
      syncRenderers();
      scheduleAudit();
    }

    function observe() {
      if (observer || !document.documentElement) {
        return;
      }

      observer = new MutationObserver(() => scheduleSync());
      observer.observe(document.documentElement, { childList: true });
      observeHead();
      observeBody();
    }

    function scheduleSync() {
      if (throttleTimer) {
        return;
      }

      throttleTimer = window.setTimeout(() => {
        throttleTimer = 0;
        observeHead();
        observeBody();

        if (lastEnabled) {
          sync(true);
          scheduleShaderPosition();
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

    function observeBody() {
      if (
        !observer ||
        !document.body ||
        document.body === lastBody ||
        !renderersFor(product).includes("shader")
      ) {
        return;
      }

      lastBody = document.body;
      observer.observe(document.body, { childList: true, subtree: true });
    }

    function scheduleAudit() {
      window.setTimeout(audit, 80);
      window.setTimeout(audit, 400);
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

      auditShader();
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

    function remove() {
      document.querySelectorAll(managedStyleSelector()).forEach((element) => element.remove());
      removeShader();
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

    function syncRenderers() {
      if (renderersFor(product).includes("shader")) {
        ensureShader();
      } else {
        removeShader();
      }
    }

    function ensureShader() {
      const shaderConfig = shaderFor(product);

      if (!shaderConfig) {
        removeShader();
        return;
      }

      let shader = document.getElementById(shaderId());

      if (!shader) {
        shader = document.createElement("div");
        shader.id = shaderId();
        shader.className = namespace;
        shader.setAttribute(managedAttribute, "shader");
        shader.setAttribute("aria-hidden", "true");
        document.documentElement.appendChild(shader);
      }

      shader.dataset.pavelSafariDarkModeRenderer = "shader";
      shader.style.position = "fixed";
      shader.style.pointerEvents = "none";
      shader.style.zIndex = String(shaderConfig.zIndex || 3);
      shader.style.background = shaderConfig.background;
      shader.style.opacity = String(shaderConfig.opacity);
      shader.style.mixBlendMode = shaderConfig.mixBlendMode;
      shader.style.backdropFilter = shaderConfig.backdropFilter;
      shader.style.webkitBackdropFilter = shaderConfig.backdropFilter;
      shader.style.contain = "strict";

      attachShaderPositionListeners();
      positionShader();
    }

    function attachShaderPositionListeners() {
      if (resizeListenerAttached) {
        return;
      }

      resizeListenerAttached = true;
      window.addEventListener("resize", scheduleShaderPosition, { passive: true });
      window.addEventListener("scroll", scheduleShaderPosition, { passive: true });
    }

    function scheduleShaderPosition() {
      if (!lastEnabled || !renderersFor(product).includes("shader") || shaderTimer) {
        return;
      }

      shaderTimer = window.setTimeout(() => {
        shaderTimer = 0;
        positionShader();
      }, 80);
    }

    function positionShader() {
      const shader = document.getElementById(shaderId());
      const target = findShaderTarget();

      if (!shader) {
        return;
      }

      if (!target) {
        shader.hidden = true;
        shader.style.left = "0";
        shader.style.top = "0";
        shader.style.width = "0";
        shader.style.height = "0";
        return;
      }

      const rect = target.getBoundingClientRect();
      const width = Math.max(0, Math.min(rect.width, window.innerWidth - Math.max(0, rect.left)));
      const height = Math.max(0, Math.min(rect.height, window.innerHeight - Math.max(0, rect.top)));

      shader.style.left = `${Math.max(0, rect.left)}px`;
      shader.style.top = `${Math.max(0, rect.top)}px`;
      shader.style.width = `${width}px`;
      shader.style.height = `${height}px`;
      shader.hidden = width < 16 || height < 16;
    }

    function findShaderTarget() {
      const shaderConfig = shaderFor(product);

      if (!shaderConfig) {
        return null;
      }

      for (const selector of shaderConfig.targets) {
        const target = document.querySelector(selector);

        if (target) {
          return target;
        }
      }

      return null;
    }

    function auditShader() {
      if (!renderersFor(product).includes("shader")) {
        return;
      }

      const shader = document.getElementById(shaderId());

      if (!shader) {
        ensureShader();
        return;
      }

      const rect = shader.getBoundingClientRect();

      if (rect.width < 16 || rect.height < 16) {
        positionShader();
      }
    }

    function removeShader() {
      const shader = document.getElementById(shaderId());

      if (shader) {
        shader.remove();
      }
    }

    function shaderId() {
      return `${namespace}-shader`;
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
    isProductEnabled,
    isOwnProductEnabled,
    shouldPreloadWithoutHint,
    readPreloadHint,
    writePreloadHint,
    stylesFor,
    renderersFor,
    shaderFor,
    createStyleManager
  };
})();
