// Only establish first-paint state here. content.js owns storage and appearance changes.
(function () {
  const registry = globalThis.__safariDarkModeRegistry;
  if (!registry) return;

  const context = registry.detectContext();
  const product = context.product;
  if (!product) return;

  const systemDark = !globalThis.matchMedia ||
    globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
  const siteEnabled = registry.shouldPreloadWithoutHint(product, context);
  const enabled = siteEnabled && systemDark;
  const root = document.documentElement;

  root.toggleAttribute("data-sdm-disabled", !enabled);
  root.dataset.sdmEnabled = String(enabled);
  root.dataset.sdmSiteEnabled = siteEnabled ? "true" : "pending";
  root.dataset.sdmSystemDark = String(systemDark);
  root.dataset.sdmPreload = enabled ? "optimistic-enabled" : "pending-disabled";
  root.dataset.sdmProduct = product;
  if (context.parentProduct) root.dataset.sdmParentProduct = context.parentProduct;
  root.dataset.sdmHost = location.hostname;
  root.dataset.sdmRenderers = registry.renderersFor(product).join(" ");
})();
