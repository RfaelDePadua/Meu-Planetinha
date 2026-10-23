/**
 * sw.js — deixa o Meu Planetinha funcionar sem internet.
 *
 * - Páginas, scripts e estilos: rede primeiro (o site publicado sempre chega
 *   atualizado); sem rede, ou com a rede travada por mais de 4 s, usa a cópia
 *   guardada.
 * - Áudios das falas (nomes únicos por texto, nunca mudam): cópia guardada
 *   primeiro, inclusive para pedidos de trecho (Range), que o Safari exige.
 * - Fontes do Google e ícones do portal (jsdelivr): cópia guardada primeiro,
 *   atualizada em segundo plano.
 *
 * O botão "Preparar para usar sem internet" (jogos/comum/jogo-base.js) baixa
 * todos os arquivos de um jogo para este mesmo cache.
 */
var CACHE = 'meu-planetinha-v1';
var ESPERA_REDE = 4000;

self.addEventListener('install', function () { self.skipWaiting(); });
// Ao trocar o nome do cache (nova versão), apaga os antigos do projeto.
// O nome também aparece em jogos/comum/jogo-base.js (CACHE): os dois precisam ser iguais.
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.filter(function (n) { return /^meu-planetinha-/.test(n) && n !== CACHE; })
      .map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var mesmaOrigem = url.origin === self.location.origin;
  if (mesmaOrigem && /\.mp3$/i.test(url.pathname)) { e.respondWith(audio(req)); return; }
  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/.test(url.hostname)) {
    e.respondWith(guardadoPrimeiro(req));
    return;
  }
  if (mesmaOrigem) e.respondWith(redePrimeiro(req));
});

// Também acha "pasta/index.html" guardado como "pasta/" (o Netlify redireciona
// um para o outro) e ignora parâmetros como ?game=… ou ?v=3.
function guardado(req) {
  var url = new URL(req.url);
  var alternativa = /\/index\.html$/.test(url.pathname) ? url.href.replace(/index\.html(\?.*)?$/, '') :
    (/\/$/.test(url.pathname) ? url.origin + url.pathname + 'index.html' : null);
  return caches.match(req).then(function (r) {
    return r || caches.match(req, { ignoreSearch: true });
  }).then(function (r) {
    return r || (alternativa ? caches.match(alternativa, { ignoreSearch: true }) : undefined);
  });
}

function guardar(req, resp) {
  if (resp && resp.ok && resp.status === 200 && (resp.type === 'basic' || resp.type === 'cors' || resp.type === 'opaque')) {
    var copia = resp.clone();
    caches.open(CACHE).then(function (c) { return c.put(req, copia); }).catch(function () { /* cota cheia */ });
  }
  return resp;
}

function redePrimeiro(req) {
  return new Promise(function (resolve) {
    var pronto = false;
    function entregar(r) { if (!pronto && r) { pronto = true; resolve(r); } }
    // Rede lenta (Wi-Fi da escola): depois de alguns segundos, serve a cópia se houver.
    var relogio = setTimeout(function () { guardado(req).then(entregar); }, ESPERA_REDE);
    fetch(req).then(function (resp) {
      clearTimeout(relogio);
      entregar(guardar(req, resp));
    }).catch(function () {
      clearTimeout(relogio);
      guardado(req).then(function (r) { entregar(r || Response.error()); });
    });
  });
}

function guardadoPrimeiro(req) {
  var daRede = fetch(req).then(function (resp) { return guardar(req, resp); });
  return caches.match(req).then(function (r) {
    if (r) { daRede.catch(function () { /* sem rede: fica a cópia */ }); return r; }
    return daRede;
  });
}

// Áudio: o elemento <audio> costuma pedir trechos (Range). A cópia guardada é o
// arquivo inteiro; aqui ela é recortada no trecho pedido (resposta 206).
function audio(req) {
  return caches.match(req.url).then(function (inteiro) {
    if (!inteiro) {
      return fetch(req).then(function (resp) {
        if (!req.headers.get('range')) guardar(req.url, resp);
        return resp;
      });
    }
    var faixa = req.headers.get('range');
    if (!faixa) return inteiro;
    return inteiro.blob().then(function (blob) {
      var m = /bytes=(\d*)-(\d*)/.exec(faixa) || [];
      var tamanho = blob.size;
      var inicio = m[1] ? Number(m[1]) : (m[2] ? Math.max(0, tamanho - Number(m[2])) : 0);
      var fim = m[1] && m[2] ? Math.min(Number(m[2]), tamanho - 1) : tamanho - 1;
      if (inicio >= tamanho) {
        return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + tamanho } });
      }
      return new Response(blob.slice(inicio, fim + 1), {
        status: 206,
        statusText: 'Partial Content',
        headers: {
          'Content-Type': inteiro.headers.get('Content-Type') || 'audio/mpeg',
          'Content-Range': 'bytes ' + inicio + '-' + fim + '/' + tamanho,
          'Content-Length': String(fim - inicio + 1),
          'Accept-Ranges': 'bytes'
        }
      });
    });
  });
}
