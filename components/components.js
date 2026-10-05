/**
 * components.js — Shared component loader for Meu Planetinha
 *
 * Fetches nav.html and footer.html fragments, injects them into
 * [data-component] placeholder elements, rewrites links, detects
 * active page, and sets up the mobile menu.
 *
 * IMPORTANT: The <script> tag loading this file must NOT have
 * defer, async, or type="module" attributes.
 * document.currentScript is captured synchronously at parse time.
 *
 * Usage in HTML:
 *   <div data-component="nav"></div>
 *   <div data-component="footer"></div>
 *   <script src="components/components.js"></script>
 *   (or ../components/components.js from depth-1 pages)
 */

// === 1. BASE PATH DETECTION ===
// Capture script URL at parse time (before DOMContentLoaded)
var SCRIPT_URL = document.currentScript
  ? document.currentScript.src
  : '';

if (!SCRIPT_URL) {
  console.warn('[components.js] document.currentScript is null — ensure <script> tag has no defer/async/type="module"');
}

// Strip 'components/components.js' to get the site base URL
var BASE_URL = SCRIPT_URL.substring(
  0,
  SCRIPT_URL.lastIndexOf('components/')
);

// === 2. COMPONENT FETCHER ===
function loadComponent(name) {
  var url = BASE_URL + 'components/' + name + '.html';
  return fetch(url).then(function(response) {
    if (!response.ok) return null;
    return response.text();
  }).catch(function() {
    // Silent failure per design decision — no error banner
    return null;
  });
}

// === 3. LINK REWRITING ===
function rewriteLinks(container) {
  var links = container.querySelectorAll('[data-href]');
  links.forEach(function(link) {
    var dataHref = link.getAttribute('data-href');
    // Skip external and special protocol links
    if (/^(https?:|mailto:|tel:)/.test(dataHref)) {
      link.setAttribute('href', dataHref);
    } else {
      link.setAttribute('href', BASE_URL + dataHref);
    }
  });

  // Resolve asset paths (e.g. the logo SVG) relative to the site root so
  // injected fragments render correctly from any page depth.
  var assets = container.querySelectorAll('[data-src]');
  assets.forEach(function(el) {
    var dataSrc = el.getAttribute('data-src');
    if (/^(https?:|data:)/.test(dataSrc)) {
      el.setAttribute('src', dataSrc);
    } else {
      el.setAttribute('src', BASE_URL + dataSrc);
    }
  });
}

// === 4. ACTIVE PAGE DETECTION ===
function markActivePage(navElement) {
  var currentPath = normalizePath(location.pathname);
  var links = navElement.querySelectorAll('.nav-links a, .nav-overlay-links a');

  links.forEach(function(link) {
    var linkPath = normalizePath(new URL(link.href, location.origin).pathname);
    if (linkPath === currentPath) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

function normalizePath(pathname) {
  // Strip trailing slash
  var p = pathname.replace(/\/+$/, '');
  // Treat /index.html as the directory
  p = p.replace(/\/index\.html$/, '');
  // If empty after stripping, it's the root
  if (!p) p = '/';
  return p.toLowerCase();
}

// === 5. MOBILE MENU ===
function setupMobileMenu(navElement) {
  var hamburger = navElement.querySelector('.nav-hamburger');
  var overlay = navElement.querySelector('.nav-overlay');
  var closeBtn = navElement.querySelector('.nav-overlay-close');

  if (!hamburger || !overlay) return;

  function openMenu() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Focus the close button for accessibility
    if (closeBtn) closeBtn.focus();
  }

  function closeMenu() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    // Return focus to hamburger
    hamburger.focus();
  }

  hamburger.addEventListener('click', function() {
    var isOpen = overlay.classList.contains('is-open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  // Close on Escape key
  overlay.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  // Close when clicking overlay background (not the links/buttons)
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      closeMenu();
    }
  });
}

// === 6. INIT ===
document.addEventListener('DOMContentLoaded', function() {
  var placeholders = document.querySelectorAll('[data-component]');
  var loadPromises = [];
  var placeholderArray = Array.prototype.slice.call(placeholders);

  // Fetch all components in parallel for speed
  var fetchResults = placeholderArray.map(function(el) {
    var name = el.getAttribute('data-component');
    return loadComponent(name).then(function(html) {
      return { el: el, name: name, html: html };
    });
  });

  // Promise.allSettled — all components are attempted even if one fetch fails
  var settled = Promise.allSettled
    ? Promise.allSettled(fetchResults)
    : Promise.all(fetchResults.map(function(p) {
        return p.then(function(v) { return { status: 'fulfilled', value: v }; },
                      function(e) { return { status: 'rejected',  reason: e }; });
      }));

  settled.then(function(outcomes) {
    outcomes.forEach(function(outcome) {
      var result = outcome.status === 'fulfilled' ? outcome.value : null;
      if (!result) return;

      var el = result.el;
      var name = result.name;
      var html = result.html;

      if (html) {
        el.innerHTML = html;
        rewriteLinks(el);

        // Post-injection setup
        if (name === 'nav') {
          markActivePage(el);
          setupMobileMenu(el);
        }
      } else if (name === 'nav') {
        // Fallback: inject minimal inline nav when fetch fails
        el.innerHTML =
          '<nav class="site-nav" aria-label="Navegação principal">' +
          '<div class="nav-container">' +
          '<a class="nav-logo" href="' + BASE_URL + 'index.html">' +
          '<img class="nav-logo-icon" src="' + BASE_URL + 'midia/planetinha-mark.svg" alt="" width="30" height="30">' +
          '<span class="nav-logo-text">Meu Planetinha</span></a>' +
          '<div class="nav-links">' +
          '<a href="' + BASE_URL + 'index.html">Início</a>' +
          '<a href="' + BASE_URL + 'explorar/explorar.html">Explorar Jogos</a>' +
          '<a href="' + BASE_URL + 'sobre_nos/sobre_nos.html">Sobre Nós</a>' +
          '</div></div></nav>';
      } else if (name === 'footer') {
        // Fallback: inject minimal inline footer when fetch fails
        el.innerHTML =
          '<footer class="site-footer" aria-label="Rodapé">' +
          '<div class="footer-container">' +
          '<p class="footer-copy">© Meu Planetinha</p>' +
          '</div></footer>';
      }
    });
  });
});
