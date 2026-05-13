// Deal Circle Salzburg — Brand Mark Helper.
// Liefert das D-Flamme-C-Mark als <img>-Element bzw. inline-fähigen
// HTML-String. Wird über topbar/intro/footer per JS injiziert und für
// das favicon referenziert. Hourglass-Geometry (zwei Dreiecke) ist
// abgelöst.

(function () {
  var LOGO_PATH = './brand/logo-mark.svg';

  window.DCMark = function (size) {
    size = size || 220;
    var img = document.createElement('img');
    img.src = LOGO_PATH;
    img.alt = 'Deal Circle Salzburg';
    img.className = 'dc-mark-img';
    img.style.display = 'block';
    img.style.height = size + 'px';
    img.style.width = 'auto';
    return img;
  };

  window.DCMarkSVG = function (size) {
    size = size || 220;
    return (
      '<img src="' + LOGO_PATH + '" alt="Deal Circle Salzburg" ' +
        'class="dc-mark-img" ' +
        'style="display:block;height:' + size + 'px;width:auto" />'
    );
  };
})();
