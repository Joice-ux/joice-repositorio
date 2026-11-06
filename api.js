// ==================== API (compartilhado por todas as páginas) ====================
// - Aberto pelo Flask (porta 5000) ou hospedado num domínio de verdade: usa o mesmo endereço.
// - Aberto como arquivo ou por outro servidor local (Live Server, etc.): aponta para o Flask local.
// - Para forçar outro endereço, defina window.LEA_API_BASE antes de carregar este arquivo.
var API_BASE = (function () {
  if (typeof window.LEA_API_BASE === 'string') return window.LEA_API_BASE;
  var host = location.hostname;
  var local = (location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '');
  if (!local || location.port === '5000') return '';
  return 'http://127.0.0.1:5000';
})();

function getToken() {
  return localStorage.getItem('token');
}

function salvarSessao(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function limparSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}

function apiFetch(path, opts) {
  opts = opts || {};
  opts.headers = opts.headers || {};
  var token = getToken();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  return fetch(API_BASE + path, opts).then(function (resp) {
    return resp.json().catch(function () { return {}; }).then(function (data) {
      if (!resp.ok) {
        if (resp.status === 401 && token) {
          limparSessao();
          var e = new Error('Sua sessão expirou. Entre novamente.');
          e.sessaoExpirada = true;
          throw e;
        }
        throw new Error(data.erro || ('Erro ' + resp.status));
      }
      return data;
    });
  }, function () {
    throw new Error('Não consegui falar com o servidor. O app.py está rodando?');
  });
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function mediaUrl(p) {
  if (!p) return '';
  if (/^(https?:|data:|blob:)/.test(p)) return p;
  return API_BASE + p;
}

function isVideoSrc(src) {
  if (!src) return false;
  return src.indexOf('data:video') === 0 || /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(src);
}
