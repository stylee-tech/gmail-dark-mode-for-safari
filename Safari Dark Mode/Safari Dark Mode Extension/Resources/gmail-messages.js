// Gmail message documents need paired foreground/background conversion. Chrome
// selectors deliberately exclude .a3s so they cannot override this treatment.
(function () {
  const surface = [33, 41, 54, 1];
  const transparent = [0, 0, 0, 0];
  const attribute = 'data-sdm-message-colors';
  let enabled = false;
  let timer = 0;
  let observer;

  function parse(value) {
    const parts = value.match(/^rgba?\(([^)]+)\)$/);
    if (!parts) return null;
    const numbers = parts[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return numbers.length >= 3 ? [...numbers.slice(0, 3), numbers[3] ?? 1] : null;
  }

  function luminance(color) {
    const channels = color.slice(0, 3).map(value => {
      value /= 255;
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    });
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  }

  function composite(color, background) {
    return color.slice(0, 3).map((value, index) =>
      value * color[3] + background[index] * (1 - color[3])).concat(1);
  }

  function contrast(a, b) {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + .05) / (values[1] + .05);
  }

  // Like Chromium Auto Dark Mode, change perceptual lightness independently
  // of chroma. Standard CIE Lab (D65) conversion keeps blue links blue rather
  // than mixing every dark foreground with gray. This runs on message colors
  // only; photographs and the page's painting pipeline are never transformed.
  function lab(color) {
    const rgb = color.slice(0, 3).map(n => {
      n /= 255;
      return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
    });
    const xyz = [
      (.4124564 * rgb[0] + .3575761 * rgb[1] + .1804375 * rgb[2]) / .95047,
      .2126729 * rgb[0] + .7151522 * rgb[1] + .072175 * rgb[2],
      (.0193339 * rgb[0] + .119192 * rgb[1] + .9503041 * rgb[2]) / 1.08883
    ].map(n => n > 216 / 24389 ? Math.cbrt(n) : n * 841 / 108 + 4 / 29);
    return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
  }

  function withLightness(color, lightness) {
    const [, a, b] = lab(color);
    const y = (lightness + 16) / 116;
    const xyz = [y + a / 500, y, y - b / 200]
      .map(n => n > 6 / 29 ? n ** 3 : (n - 4 / 29) * 108 / 841)
      .map((n, i) => n * [.95047, 1, 1.08883][i]);
    return [
      3.2404542 * xyz[0] - 1.5371385 * xyz[1] - .4985314 * xyz[2],
      -.969266 * xyz[0] + 1.8760108 * xyz[1] + .041556 * xyz[2],
      .0556434 * xyz[0] - .2040259 * xyz[1] + 1.0572252 * xyz[2]
    ].map(n => Math.round(255 * Math.max(0, Math.min(1,
      n <= .0031308 ? 12.92 * n : 1.055 * n ** (1 / 2.4) - .055))))
      .concat(color[3]);
  }

  function darkBackground(color) {
    if (!color || color[3] === 0 || luminance(color) < .18) return color || transparent;
    // Keep the sender's tint and distinctions between white/off-white cards.
    return withLightness(color, Math.max(12, Math.min(28, 110 - lab(color)[0])));
  }

  function readableText(color, background) {
    if (!color) color = [32, 33, 36, 1];
    if (color[3] === 0) return color;
    if (contrast(composite(color, background), background) >= 4.5) return color;
    const dark = luminance(background) < .18;
    const initial = dark ? Math.min(95, Math.max(70, 110 - lab(color)[0])) : 15;
    for (let step = 0; step <= 10; step++) {
      const lightness = initial + ((dark ? 100 : 0) - initial) * step / 10;
      const candidate = withLightness(color, lightness);
      if (contrast(composite(candidate, background), background) >= 7) return candidate;
    }
    // Very translucent author text may not reach readable contrast at any
    // lightness. Only then replace its alpha, keeping readable text untouched.
    return (dark ? [238, 242, 247] : [20, 25, 34]).concat(1);
  }

  function css(color) {
    return `rgba(${color.join(', ')})`;
  }

  function paint(message) {
    if (message.closest('[contenteditable="true"], [role="textbox"]')) return;
    message.setAttribute('data-sdm-measuring', '');
    try {
      const elements = [message, ...message.querySelectorAll('*')].filter(element =>
        !element.closest('svg, canvas, picture, [contenteditable="true"], [role="textbox"]') &&
        !['IMG', 'VIDEO', 'STYLE', 'SCRIPT'].includes(element.tagName));
      // Read every original style before writing any overrides. Measuring also
      // disables our previous pass, so updates never transform transformed colors.
      const samples = elements.map(element => {
        const style = getComputedStyle(element);
        return { element, background: parse(style.backgroundColor), color: parse(style.color),
          image: style.backgroundImage, border: parse(style.borderTopColor) };
      });
      const backgrounds = new Map();
      for (const sample of samples) {
        const { element } = sample;
        const parent = backgrounds.get(element.parentElement) || surface;
        const background = element === message ? surface : darkBackground(sample.background);
        const effective = composite(background, parent);
        backgrounds.set(element, effective);
        element.style.setProperty('--sdm-message-bg', css(background));
        element.style.setProperty('--sdm-message-fg', css(readableText(sample.color, effective)));
        element.style.setProperty('--sdm-message-border', css(darkBackground(sample.border)));
        // Gradients are colors, not photographs; keep their stops dark too.
        const image = sample.image.includes('gradient(') && !sample.image.includes('url(')
          ? sample.image.replace(/rgba?\([^)]+\)/g, value => css(darkBackground(parse(value))))
          : sample.image;
        element.style.setProperty('--sdm-message-image', image);
        element.setAttribute(attribute, '');
      }
    } finally {
      message.removeAttribute('data-sdm-measuring');
    }
  }

  function observe() {
    observer.observe(document.documentElement, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ['style', 'class', 'bgcolor', 'color']
    });
  }

  function refresh() {
    timer = 0;
    if (!enabled) return;
    // Disconnect while writing our own CSS variables to avoid a mutation loop.
    observer.disconnect();
    try { document.querySelectorAll('.a3s').forEach(paint); }
    finally { if (enabled) observe(); }
  }

  function schedule(records) {
    if (timer || !enabled) return;
    const relevant = records.some(record =>
      record.target.nodeType === 1 && record.target.closest('.a3s') ||
      [...(record.addedNodes || [])].some(node => node.nodeType === 1 &&
        (node.matches('.a3s, style, link[rel="stylesheet"]') || node.querySelector('.a3s'))));
    if (relevant) timer = setTimeout(refresh, 60);
  }

  globalThis.__safariDarkModeMessages = {
    sync(value) {
      if (enabled === value) return;
      enabled = value;
      if (!observer) observer = new MutationObserver(schedule);
      if (enabled) refresh();
      else {
        observer.disconnect();
        clearTimeout(timer);
        timer = 0;
        // Overrides are gated by data-sdm-disabled. Leave sender styles intact.
      }
    }
  };
})();
