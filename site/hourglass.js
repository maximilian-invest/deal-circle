// Hourglass mark + wordmark lockup as plain DOM helpers. Reusable
// across the website and CI book without needing React/Babel.

window.DCMark = function (size, color) {
  size = size || 200;
  color = color || '#C8CDD3';
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.style.display = 'block';
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('fill', color);
  // top triangle, base up, point at center
  const top = document.createElementNS(ns, 'polygon');
  top.setAttribute('points', '36,28 164,28 100,94');
  // bottom triangle, base down, point at center, with small gap
  const bot = document.createElementNS(ns, 'polygon');
  bot.setAttribute('points', '100,106 164,172 36,172');
  // pinch accent
  const pinch = document.createElementNS(ns, 'rect');
  pinch.setAttribute('x', '92'); pinch.setAttribute('y', '98');
  pinch.setAttribute('width', '16'); pinch.setAttribute('height', '4');
  g.append(top, bot, pinch);
  svg.append(g);
  return svg;
};

// Inline-SVG string version (for innerHTML / templating)
window.DCMarkSVG = function (size, color) {
  size = size || 200;
  color = color || '#C8CDD3';
  return (
    '<svg viewBox="0 0 200 200" width="' + size + '" height="' + size +
    '" style="display:block" xmlns="http://www.w3.org/2000/svg">' +
      '<g fill="' + color + '">' +
        '<polygon points="36,28 164,28 100,94"/>' +
        '<polygon points="100,106 164,172 36,172"/>' +
        '<rect x="92" y="98" width="16" height="4"/>' +
      '</g>' +
    '</svg>'
  );
};
