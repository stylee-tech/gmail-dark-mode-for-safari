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

  function darkBackground(color) {
    if (!color || color[3] === 0 || luminance(color) < .18) return color || transparent;
    // Retain a little of the sender's tint and the original alpha, including
    // off-white cards that cannot be recognized by hard-coded CSS selectors.
    return surface.slice(0, 3).map((value, index) =>
      Math.round(value + (color[index] - 230) * .08)).concat(color[3]);
  }

  function readableText(color, background) {
    if (!color) color = [32, 33, 36, 1];
    if (color[3] === 0) return color;
    if (contrast(composite(color, background), background) >= 4.5) return color;
    const target = luminance(background) < .18 ? [238, 242, 247] : [20, 25, 34];
    for (let step = 1; step <= 10; step++) {
      const candidate = color.slice(0, 3).map((value, index) =>
        Math.round(value + (target[index] - value) * step / 10)).concat(1);
      if (contrast(candidate, background) >= 7) return candidate;
    }
    return target.concat(1);
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
