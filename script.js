// Depende de api.js (apiFetch, esc, mediaUrl, isVideoSrc, limparSessao)

// ==================== SESSÃO ====================
var currentUser = null;
try { currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch (e) { currentUser = null; }
if (currentUser && !getToken()) { limparSessao(); currentUser = null; }

var gestaoRoles = ['admin', 'gremio', 'direcao', 'coordenacao'];
// Só controla o que aparece na tela. A permissão de verdade é conferida no servidor.
var isGestao = !!(currentUser && gestaoRoles.indexOf(currentUser.role) !== -1);

var PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="#d9d4c7"/>' +
  '<text x="50%" y="50%" font-family="Georgia,serif" font-size="42" fill="#6b665a" text-anchor="middle">LÉA NEWS</text></svg>');

// ==================== TEMA ====================
var html = document.documentElement;
var themeBtn = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'dark') {
  html.setAttribute('data-theme', 'dark');
  if (themeBtn) themeBtn.textContent = '☀️';
}
if (themeBtn) {
  themeBtn.addEventListener('click', function () {
    var isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeBtn.textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  });
}

// ==================== HEADER ====================
var userGreeting = document.getElementById('user-greeting');
var welcomeMsg = document.getElementById('welcome-msg');
var loginBtn = document.getElementById('login-btn');
var logoutBtn = document.getElementById('logout-btn');
var adminActions = document.getElementById('admin-actions');

if (currentUser) {
  var primeiroNome = (currentUser.name || '').split(' ')[0];
  if (userGreeting) {
    userGreeting.textContent = 'Olá, ' + primeiroNome + '!';
    userGreeting.classList.remove('hidden');
  }
  if (welcomeMsg) welcomeMsg.textContent = 'Olá, ' + primeiroNome + '!';
  if (loginBtn) loginBtn.classList.add('hidden');
  if (logoutBtn) logoutBtn.classList.remove('hidden');
}
if (loginBtn) loginBtn.addEventListener('click', function () { window.location.href = 'login.html'; });
if (logoutBtn) {
  logoutBtn.addEventListener('click', function () {
    limparSessao();
    window.location.reload();
  });
}
if (adminActions && isGestao) adminActions.classList.remove('hidden');

// ==================== NOTÍCIAS (vêm do banco) ====================
var newsCache = [];
var newsGrid = document.getElementById('news-grid');
var currentCategory = 'Todas';
var searchTerm = '';
var editingNewsId = null;

// Se a API avisar que a sessão expirou, recarrega a página já deslogada.
function tratarErro(err) {
  alert(err.message);
  if (err && err.sessaoExpirada) window.location.reload();
}

function findNews(id) {
  for (var i = 0; i < newsCache.length; i++) {
    if (newsCache[i].id === id) return newsCache[i];
  }
  return null;
}

function getItemImages(item) {
  var list = (item.images || []).map(mediaUrl).filter(Boolean);
  return list.length ? list : [PLACEHOLDER];
}

function loadNews() {
  return apiFetch('/api/noticias').then(function (list) {
    newsCache = list;
    renderNews();
    verificarNovasNoticias();
  }).catch(function (err) {
    if (newsGrid) {
      newsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#b00020;">' + esc(err.message) + '</p>';
    }
  });
}

function renderFeatured() {
  var featuredSection = document.getElementById('featured-news');
  var listaEl = document.getElementById('destaques-lista');
  if (!featuredSection) return;
  if (currentCategory !== 'Todas' || searchTerm) {
    featuredSection.classList.add('hidden');
    return;
  }
  var destaques = newsCache.filter(function (n) { return n.destaque === true; });
  if (destaques.length === 0) {
    featuredSection.classList.add('hidden');
    return;
  }

  var principal = destaques[0];
  var capa = getItemImages(principal)[0];
  var featuredImg = document.getElementById('featured-img');
  if (featuredImg) {
    if (isVideoSrc(capa)) {
      featuredImg.style.display = 'none';
    } else {
      featuredImg.style.display = 'block';
      featuredImg.src = capa;
    }
  }
  function setText(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }
  setText('featured-category', principal.category);
  setText('featured-title', principal.title);
  setText('featured-description', principal.description);
  setText('featured-date', principal.date);
  setText('featured-views', '👁️ ' + principal.views);
  setText('featured-likes', '❤️ ' + principal.likes);

  var principalEl = document.getElementById('destaque-principal');
  if (principalEl) {
    principalEl.onclick = function (e) {
      if (e.target.closest && e.target.closest('.card-admin-btns')) return;
      openNewsModal(principal.id);
    };
  }

  var adminBtns = document.getElementById('featured-admin-btns');
  if (adminBtns) {
    if (isGestao) {
      adminBtns.classList.remove('hidden');
      document.getElementById('featured-edit-btn').onclick = function (e) {
        e.preventDefault(); e.stopPropagation(); openEditNews(principal.id);
      };
      document.getElementById('featured-delete-btn').onclick = function (e) {
        e.preventDefault(); e.stopPropagation(); deleteNews(principal.id);
      };
    } else {
      adminBtns.classList.add('hidden');
    }
  }

  if (listaEl) {
    listaEl.innerHTML = '';
    destaques.slice(1, 5).forEach(function (item) {
      var thumb = getItemImages(item)[0];
      var art = document.createElement('article');
      art.className = 'destaque-item';
      var imgHtml = isVideoSrc(thumb)
        ? '<div class="destaque-item-img video-ph">▶</div>'
        : '<img class="destaque-item-img" src="' + esc(thumb) + '" alt="">';
      var adminHtml = '';
      if (isGestao) {
        adminHtml = '<div class="card-admin-btns" style="margin-top:6px;">' +
          '<button type="button" class="btn-edit btn-dest-edit" data-id="' + item.id + '">Editar</button>' +
          '<button type="button" class="btn-delete btn-dest-del" data-id="' + item.id + '">Excluir</button></div>';
      }
      art.innerHTML = imgHtml +
        '<div class="destaque-item-text">' +
          '<span class="secao-label">' + esc(item.category) + '</span>' +
          '<h3>' + esc(item.title) + '</h3>' +
          '<p>' + esc(item.description) + '</p>' +
          '<div class="featured-meta"><span>' + esc(item.date) + '</span> <span>❤️ ' + item.likes + '</span></div>' +
          adminHtml +
        '</div>';
      art.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('.card-admin-btns')) return;
        openNewsModal(item.id);
      });
      listaEl.appendChild(art);
    });
    listaEl.querySelectorAll('.btn-dest-edit').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        openEditNews(parseInt(btn.getAttribute('data-id'), 10));
      });
    });
    listaEl.querySelectorAll('.btn-dest-del').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        deleteNews(parseInt(btn.getAttribute('data-id'), 10));
      });
    });
  }
  featuredSection.classList.remove('hidden');
}

function renderNews() {
  if (!newsGrid) return;
  var news = newsCache.slice();
  if (currentCategory === 'Todas') {
    // Os destaques aparecem na faixa de cima, exceto durante uma busca
    // (a faixa some na busca, então eles precisam aparecer na lista).
    if (!searchTerm) news = news.filter(function (n) { return n.destaque !== true; });
  } else {
    news = news.filter(function (n) { return n.category === currentCategory; });
  }
  if (searchTerm) {
    var term = searchTerm.toLowerCase();
    news = news.filter(function (n) {
      return n.title.toLowerCase().indexOf(term) !== -1 ||
        n.description.toLowerCase().indexOf(term) !== -1 ||
        n.category.toLowerCase().indexOf(term) !== -1;
    });
  }
  newsGrid.innerHTML = '';
  if (news.length === 0) {
    newsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);">Nenhuma notícia encontrada.</p>';
    renderFeatured();
    return;
  }
  news.forEach(function (item) {
    var card = document.createElement('div');
    card.className = 'news-card';
    var capa = getItemImages(item)[0];
    var adminBtns = '';
    if (isGestao) {
      adminBtns = '<div class="card-admin-btns">' +
        '<button type="button" class="btn-edit" data-id="' + item.id + '">Editar</button>' +
        '<button type="button" class="btn-delete" data-id="' + item.id + '">Excluir</button></div>';
    }
    var mediaHtml = isVideoSrc(capa)
      ? '<video src="' + esc(capa) + '" muted class="card-cover"></video>'
      : '<img src="' + esc(capa) + '" alt="" class="card-cover">';
    card.innerHTML = mediaHtml +
      '<div class="news-card-body">' +
        '<span class="badge">' + esc(item.category) + '</span>' +
        '<h3>' + esc(item.title) + '</h3>' +
        '<p>' + esc(item.description) + '</p>' +
        '<div class="card-footer"><span>👁️ ' + item.views + '</span><span>❤️ ' + item.likes + '</span></div>' +
        adminBtns +
      '</div>';
    card.addEventListener('click', function (e) {
      if (e.target.classList.contains('btn-edit') || e.target.classList.contains('btn-delete')) return;
      openNewsModal(item.id);
    });
    newsGrid.appendChild(card);
  });
  newsGrid.querySelectorAll('.btn-edit').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      openEditNews(parseInt(this.getAttribute('data-id'), 10));
    });
  });
  newsGrid.querySelectorAll('.btn-delete').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteNews(parseInt(this.getAttribute('data-id'), 10));
    });
  });
  renderFeatured();
}

document.querySelectorAll('.cat-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.cat-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentCategory = btn.getAttribute('data-cat') || 'Todas';
    renderNews();
  });
});

var searchBtn = document.getElementById('search-btn');
var searchInput = document.getElementById('search-input');
if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', function () {
    searchTerm = searchInput.value.trim();
    renderNews();
  });
  searchInput.addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
      searchTerm = searchInput.value.trim();
      renderNews();
    }
  });
}

// ==================== MODAL DA NOTÍCIA ====================
var newsModal = document.getElementById('news-modal');
var currentNewsId = null;
var currentPhotoIndex = 0;
var currentPhotos = [];

function openNewsModal(id) {
  var item = findNews(id);
  if (!item || !newsModal) return;
  currentNewsId = id;
  item.views++;
  apiFetch('/api/noticias/' + id + '/view', { method: 'POST' }).catch(function () {});

  document.getElementById('modal-category').textContent = item.category;
  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-date').textContent = item.date;
  document.getElementById('modal-views').textContent = '👁️ ' + item.views;
  document.getElementById('modal-likes').textContent = '❤️ ' + item.likes;
  document.getElementById('modal-content').textContent = item.content;

  currentPhotos = getItemImages(item);
  currentPhotoIndex = 0;
  mostrarFotoAtual();
  renderComments(item);

  var commentArea = document.getElementById('comment-area');
  var loginToComment = document.getElementById('login-to-comment');
  if (currentUser) {
    if (commentArea) commentArea.classList.remove('hidden');
    if (loginToComment) loginToComment.classList.add('hidden');
  } else {
    if (commentArea) commentArea.classList.add('hidden');
    if (loginToComment) loginToComment.classList.remove('hidden');
  }

  var likeBtnEl = document.getElementById('like-btn');
  if (likeBtnEl) likeBtnEl.textContent = item.liked ? '💔 Descurtir' : '❤️ Curtir';
  newsModal.classList.remove('hidden');
  renderNews();
}

function mostrarFotoAtual() {
  var container = document.getElementById('modal-gallery-container');
  var counter = document.getElementById('photo-counter');
  var prevBtn = document.getElementById('prev-photo');
  var nextBtn = document.getElementById('next-photo');
  var thumbs = document.getElementById('photo-thumbs');
  if (!container || currentPhotos.length === 0) return;
  var oldMedia = container.querySelector('#modal-current-photo, #modal-current-video');
  if (oldMedia) oldMedia.remove();
  var src = currentPhotos[currentPhotoIndex];
  var media;
  if (isVideoSrc(src)) {
    media = document.createElement('video');
    media.id = 'modal-current-video';
    media.src = src;
    media.controls = true;
  } else {
    media = document.createElement('img');
    media.id = 'modal-current-photo';
    media.src = src;
    media.alt = '';
  }
  media.style.maxHeight = '420px';
  media.style.maxWidth = '100%';
  media.style.display = 'block';
  media.style.margin = '0 auto';
  media.style.objectFit = 'contain';
  if (counter) container.insertBefore(media, counter);
  else container.appendChild(media);
  if (counter) counter.textContent = (currentPhotoIndex + 1) + ' / ' + currentPhotos.length;
  if (prevBtn && nextBtn) {
    var show = currentPhotos.length > 1 ? 'flex' : 'none';
    prevBtn.style.display = show;
    nextBtn.style.display = show;
  }
  if (thumbs) {
    thumbs.innerHTML = '';
    if (currentPhotos.length > 1) {
      thumbs.classList.remove('hidden');
      currentPhotos.forEach(function (thumbSrc, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'photo-thumb' + (idx === currentPhotoIndex ? ' active' : '');
        if (isVideoSrc(thumbSrc)) {
          btn.innerHTML = '<span class="thumb-video">▶</span>';
        } else {
          var im = document.createElement('img');
          im.src = thumbSrc;
          im.alt = 'Foto ' + (idx + 1);
          btn.appendChild(im);
        }
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          currentPhotoIndex = idx;
          mostrarFotoAtual();
        });
        thumbs.appendChild(btn);
      });
    } else {
      thumbs.classList.add('hidden');
    }
  }
}

document.addEventListener('click', function (e) {
  if (e.target && e.target.id === 'prev-photo') {
    if (!currentPhotos.length) return;
    currentPhotoIndex = (currentPhotoIndex - 1 + currentPhotos.length) % currentPhotos.length;
    mostrarFotoAtual();
  }
  if (e.target && e.target.id === 'next-photo') {
    if (!currentPhotos.length) return;
    currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotos.length;
    mostrarFotoAtual();
  }
});

function fecharModais() {
  document.querySelectorAll('.modal').forEach(function (m) { m.classList.add('hidden'); });
}
document.querySelectorAll('.close-modal').forEach(function (btn) { btn.addEventListener('click', fecharModais); });
document.querySelectorAll('.btn-cancelar').forEach(function (btn) { btn.addEventListener('click', fecharModais); });
document.querySelectorAll('.modal').forEach(function (modal) {
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

// ---------- curtir ----------
var likeBtn = document.getElementById('like-btn');
if (likeBtn) {
  likeBtn.addEventListener('click', function () {
    if (!currentNewsId) return;
    if (!currentUser) {
      alert('Faça login com RA ou CPF para curtir!');
      window.location.href = 'login.html';
      return;
    }
    apiFetch('/api/noticias/' + currentNewsId + '/curtir', { method: 'POST' }).then(function (r) {
      var item = findNews(currentNewsId);
      if (!item) return;
      item.liked = r.liked;
      item.likes = r.likes;
      likeBtn.textContent = r.liked ? '💔 Descurtir' : '❤️ Curtir';
      document.getElementById('modal-likes').textContent = '❤️ ' + r.likes;
      renderNews();
    }).catch(tratarErro);
  });
}

// ---------- comentários ----------
function renderComments(item) {
  var commentsList = document.getElementById('comments-list');
  if (!commentsList) return;
  commentsList.innerHTML = '';
  (item.comments || []).forEach(function (c) {
    var div = document.createElement('div');
    div.className = 'comment';
    div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:10px;';
    var texto = document.createElement('div');
    var autor = document.createElement('strong');
    autor.textContent = c.author;
    texto.appendChild(autor);
    texto.appendChild(document.createTextNode(' ' + c.text));
    div.appendChild(texto);
    var podeExcluir = isGestao || (currentUser && c.userId === currentUser.id);
    if (podeExcluir) {
      var btnExcluir = document.createElement('button');
      btnExcluir.type = 'button';
      btnExcluir.textContent = 'Excluir';
      btnExcluir.className = 'btn btn-outline';
      btnExcluir.style.cssText = 'padding:4px 10px;font-size:12px;';
      btnExcluir.addEventListener('click', function () { excluirComentario(c.id); });
      div.appendChild(btnExcluir);
    }
    commentsList.appendChild(div);
  });
}

function excluirComentario(cid) {
  if (!confirm('Excluir este comentário?')) return;
  apiFetch('/api/comentarios/' + cid, { method: 'DELETE' }).then(function () {
    var item = findNews(currentNewsId);
    if (!item) return;
    item.comments = item.comments.filter(function (c) { return c.id !== cid; });
    renderComments(item);
  }).catch(tratarErro);
}

var addCommentBtn = document.getElementById('add-comment-btn');
var commentInput = document.getElementById('comment-input');
if (addCommentBtn && commentInput) {
  addCommentBtn.addEventListener('click', function () {
    if (!currentUser) { alert('Faça login para comentar!'); return; }
    var text = commentInput.value.trim();
    if (!text || !currentNewsId) return;
    addCommentBtn.disabled = true;
    apiFetch('/api/noticias/' + currentNewsId + '/comentarios', { method: 'POST', body: { text: text } })
      .then(function (r) {
        var item = findNews(currentNewsId);
        if (item) { item.comments.push(r.comment); renderComments(item); }
        commentInput.value = '';
      })
      .catch(tratarErro)
      .then(function () { addCommentBtn.disabled = false; });
  });
}

// ==================== MÍDIA (fotos e vídeos) ====================
// Cada item: { file: File|null, url: caminho no servidor|null, preview: string para mostrar }
var selectedMedia = [];
var choosePhotosBtn = document.getElementById('choose-photos-btn');
var newsImageInput = document.getElementById('news-image');
var imagePreview = document.getElementById('image-preview');

function mediaIsVideo(m) {
  return m.file ? m.file.type.indexOf('video') === 0 : isVideoSrc(m.url);
}

function atualizarPreview() {
  if (!imagePreview) return;
  imagePreview.innerHTML = '';
  selectedMedia.forEach(function (m, index) {
    var wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    var el = document.createElement(mediaIsVideo(m) ? 'video' : 'img');
    el.src = m.preview;
    el.style.cssText = 'width:90px;height:90px;object-fit:cover;border-radius:8px;';
    if (el.tagName === 'VIDEO') el.muted = true;
    wrapper.appendChild(el);
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.style.cssText = 'position:absolute;top:-6px;right:-6px;background:#e74c3c;color:white;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;';
    removeBtn.onclick = function () {
      selectedMedia.splice(index, 1);
      atualizarPreview();
      atualizarTextoBotao();
    };
    wrapper.appendChild(removeBtn);
    imagePreview.appendChild(wrapper);
  });
}

function atualizarTextoBotao() {
  if (!choosePhotosBtn) return;
  choosePhotosBtn.textContent = selectedMedia.length === 0
    ? '📷🎬 Escolher Fotos ou Vídeos'
    : '📷🎬 ' + selectedMedia.length + ' arquivo(s) — adicionar mais';
}

if (choosePhotosBtn && newsImageInput) {
  choosePhotosBtn.addEventListener('click', function () { newsImageInput.click(); });
  newsImageInput.addEventListener('change', function () {
    Array.prototype.forEach.call(this.files || [], function (f) {
      selectedMedia.push({ file: f, url: null, preview: URL.createObjectURL(f) });
    });
    newsImageInput.value = '';
    atualizarPreview();
    atualizarTextoBotao();
  });
}

// Envia os arquivos novos ao servidor e devolve a lista final de caminhos, na ordem escolhida.
function enviarMidias() {
  var novos = selectedMedia.filter(function (m) { return m.file; });
  if (novos.length === 0) {
    return Promise.resolve(selectedMedia.map(function (m) { return m.url; }));
  }
  var fd = new FormData();
  novos.forEach(function (m) { fd.append('files', m.file); });
  return apiFetch('/api/upload', { method: 'POST', body: fd }).then(function (r) {
    var urls = r.urls.slice();
    return selectedMedia.map(function (m) { return m.file ? urls.shift() : m.url; });
  });
}

// ==================== PUBLICAR / EDITAR ====================
var editModal = document.getElementById('edit-modal');
var newsForm = document.getElementById('news-form');
var newNewsBtn = document.getElementById('new-news-btn');

if (newNewsBtn && editModal && newsForm) {
  newNewsBtn.addEventListener('click', function () {
    editingNewsId = null;
    document.getElementById('edit-modal-title').textContent = 'Nova Notícia';
    newsForm.reset();
    selectedMedia = [];
    atualizarPreview();
    atualizarTextoBotao();
    document.getElementById('news-destaque').checked = false;
    editModal.classList.remove('hidden');
  });
}

function openEditNews(id) {
  var item = findNews(id);
  if (!item || !editModal) return;
  editingNewsId = id;
  document.getElementById('edit-modal-title').textContent = 'Editar Notícia';
  document.getElementById('news-title').value = item.title;
  document.getElementById('news-category').value = item.category;
  document.getElementById('news-description').value = item.description;
  document.getElementById('news-content').value = item.content;
  document.getElementById('news-destaque').checked = item.destaque === true;
  selectedMedia = (item.images || []).map(function (u) {
    return { file: null, url: u, preview: mediaUrl(u) };
  });
  atualizarPreview();
  atualizarTextoBotao();
  editModal.classList.remove('hidden');
}

function deleteNews(id) {
  if (!confirm('Excluir esta notícia?')) return;
  apiFetch('/api/noticias/' + id, { method: 'DELETE' })
    .then(function () { return loadNews(); })
    .then(function () { alert('Notícia excluída!'); })
    .catch(tratarErro);
}

if (newsForm && editModal) {
  newsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var payload = {
      title: document.getElementById('news-title').value.trim(),
      category: document.getElementById('news-category').value,
      description: document.getElementById('news-description').value.trim(),
      content: document.getElementById('news-content').value.trim(),
      destaque: document.getElementById('news-destaque').checked
    };
    if (!payload.title || !payload.description || !payload.content) {
      alert('Preencha os campos obrigatórios!');
      return;
    }
    var submitBtn = newsForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';
    var editando = editingNewsId;

    enviarMidias().then(function (urls) {
      payload.images = urls;
      if (editando) {
        return apiFetch('/api/noticias/' + editando, { method: 'PUT', body: payload });
      }
      return apiFetch('/api/noticias', { method: 'POST', body: payload });
    }).then(function (r) {
      editModal.classList.add('hidden');
      editingNewsId = null;
      selectedMedia = [];
      atualizarPreview();
      atualizarTextoBotao();
      // marca como "já vista" ANTES de recarregar, para o aviso automático
      // de novas notícias não disparar uma segunda notificação para quem publicou
      if (!editando) localStorage.setItem('lea_last_seen_id', String(r.id));
      return loadNews().then(function () {
        if (editando) {
          alert('Notícia atualizada!');
        } else {
          addNotification('Nova notícia', payload.title, r.id);
          alert('Notícia publicada!');
        }
      });
    }).catch(tratarErro).then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Salvar';
    });
  });
}

// ==================== USUÁRIOS (gestão) ====================
var usersModal = document.getElementById('users-modal');
var manageUsersBtn = document.getElementById('manage-users-btn');
var addUserForm = document.getElementById('add-user-form');

function atualizarCamposUsuario() {
  var roleEl = document.getElementById('new-user-role');
  if (!roleEl) return;
  var role = roleEl.value;
  var fieldRa = document.getElementById('field-ra');
  var fieldCpf = document.getElementById('field-cpf');
  var fieldUser = document.getElementById('field-username');
  var hint = document.getElementById('user-form-hint');
  [fieldRa, fieldCpf, fieldUser].forEach(function (f) { if (f) f.classList.add('hidden'); });
  ['new-user-ra', 'new-user-cpf', 'new-user-username'].forEach(function (id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  if (role === 'aluno') {
    fieldRa.classList.remove('hidden');
    hint.textContent = 'Aluno: nome + RA + senha';
  } else if (role === 'responsavel') {
    fieldCpf.classList.remove('hidden');
    hint.textContent = 'Responsável: nome + CPF + senha';
  } else {
    fieldUser.classList.remove('hidden');
    hint.textContent = 'Professor/gestão: nome + usuário + senha';
  }
}

if (manageUsersBtn && usersModal) {
  manageUsersBtn.addEventListener('click', function () {
    renderUsers();
    atualizarCamposUsuario();
    usersModal.classList.remove('hidden');
  });
}

var roleSelect = document.getElementById('new-user-role');
if (roleSelect) {
  roleSelect.addEventListener('change', atualizarCamposUsuario);
  atualizarCamposUsuario();
}

function renderUsers() {
  var list = document.getElementById('users-list');
  if (!list) return;
  list.innerHTML = '<small>Carregando...</small>';
  apiFetch('/api/usuarios').then(function (users) {
    list.innerHTML = '';
    users.forEach(function (user) {
      var div = document.createElement('div');
      div.className = 'user-item';
      var info = esc(user.nome) + '<br><small>';
      if (user.ra) info += 'RA ' + esc(user.ra) + ' · ';
      if (user.cpf) info += 'CPF ' + esc(user.cpf) + ' · ';
      if (user.username) info += '@' + esc(user.username) + ' · ';
      info += esc(user.tipo === 'gestao' ? user.role : user.tipo) + '</small>';
      var btnHtml = '';
      if (user.username !== 'admin' && user.id !== currentUser.id) {
        btnHtml = '<button type="button" class="btn btn-outline btn-delete-user" data-id="' + user.id + '">Excluir</button>';
      }
      div.innerHTML = '<div>' + info + '</div>' + btnHtml;
      list.appendChild(div);
    });
    list.querySelectorAll('.btn-delete-user').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Excluir este usuário?')) return;
        apiFetch('/api/usuarios/' + btn.getAttribute('data-id'), { method: 'DELETE' })
          .then(renderUsers)
          .catch(tratarErro);
      });
    });
  }).catch(function (err) {
    list.innerHTML = '<small style="color:#b00020;">' + esc(err.message) + '</small>';
  });
}

if (addUserForm) {
  addUserForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var body = {
      name: document.getElementById('new-user-name').value.trim(),
      role: document.getElementById('new-user-role').value,
      ra: document.getElementById('new-user-ra').value.trim(),
      cpf: document.getElementById('new-user-cpf').value.replace(/\D/g, ''),
      username: document.getElementById('new-user-username').value.trim(),
      password: document.getElementById('new-user-password').value
    };
    apiFetch('/api/usuarios', { method: 'POST', body: body }).then(function () {
      addUserForm.reset();
      atualizarCamposUsuario();
      renderUsers();
      alert('Usuário cadastrado!');
    }).catch(tratarErro);
  });
}

// ==================== NOTIFICAÇÕES (sino + navegador) ====================
function getNotifications() {
  try { return JSON.parse(localStorage.getItem('lea_notifications') || '[]'); } catch (e) { return []; }
}
function saveNotifications(list) {
  localStorage.setItem('lea_notifications', JSON.stringify(list));
}

function addNotification(titulo, texto, newsId) {
  var list = getNotifications();
  list.unshift({
    id: Date.now(),
    titulo: titulo,
    texto: texto,
    newsId: newsId || null,
    lida: false,
    data: new Date().toLocaleString('pt-BR')
  });
  if (list.length > 30) list = list.slice(0, 30);
  saveNotifications(list);
  renderNotificationUI();
  showBrowserNotification(titulo, texto);
}

// Avisa (uma vez) sobre notícias publicadas por outras pessoas desde a última visita.
function verificarNovasNoticias() {
  if (!newsCache.length) return;
  var maxId = Math.max.apply(null, newsCache.map(function (n) { return n.id; }));
  var vistoStr = localStorage.getItem('lea_last_seen_id');
  if (vistoStr !== null) {
    var visto = parseInt(vistoStr, 10);
    var novas = newsCache.filter(function (n) { return n.id > visto; });
    if (novas.length) {
      var ultima = novas[0];
      addNotification('Nova notícia', ultima.title, ultima.id);
    }
  }
  localStorage.setItem('lea_last_seen_id', String(maxId));
}

function unreadCount() {
  return getNotifications().filter(function (n) { return !n.lida; }).length;
}

function renderNotificationUI() {
  var badge = document.getElementById('notif-badge');
  var listEl = document.getElementById('notif-list');
  if (!listEl) return;
  var list = getNotifications();
  var n = unreadCount();
  if (badge) {
    if (n > 0) {
      badge.textContent = n > 9 ? '9+' : String(n);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  if (list.length === 0) {
    listEl.innerHTML = '<div class="notif-empty">Nenhuma notificação ainda.</div>';
    return;
  }
  listEl.innerHTML = '';
  list.forEach(function (item) {
    var div = document.createElement('div');
    div.className = 'notif-item' + (item.lida ? '' : ' unread');
    div.innerHTML = '<strong>' + esc(item.titulo) + '</strong>' + esc(item.texto) +
      '<br><span>' + esc(item.data) + '</span>';
    div.addEventListener('click', function () {
      var all = getNotifications().map(function (x) {
        if (x.id === item.id) x.lida = true;
        return x;
      });
      saveNotifications(all);
      renderNotificationUI();
      if (item.newsId && findNews(item.newsId)) openNewsModal(item.newsId);
      var panel = document.getElementById('notif-panel');
      if (panel) panel.classList.add('hidden');
    });
    listEl.appendChild(div);
  });
}

function showBrowserNotification(titulo, corpo) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try { new Notification(titulo, { body: corpo, tag: 'lea-news' }); } catch (e) {}
}

function requestBrowserPermission() {
  if (!('Notification' in window)) {
    alert('Seu navegador não suporta notificações.');
    return;
  }
  Notification.requestPermission().then(function (perm) {
    if (perm === 'granted') {
      alert('Alertas do navegador ativados!');
      showBrowserNotification('Léa News', 'Você receberá avisos de novas notícias.');
    } else {
      alert('Permissão negada. Você ainda vê o sino no site.');
    }
  });
}

(function initNotifUI() {
  var btn = document.getElementById('notif-btn');
  var panel = document.getElementById('notif-panel');
  var clearBtn = document.getElementById('notif-clear');
  var enableBtn = document.getElementById('notif-enable-browser');
  if (btn && panel) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('hidden');
      renderNotificationUI();
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      saveNotifications([]);
      renderNotificationUI();
    });
  }
  if (enableBtn) {
    enableBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      requestBrowserPermission();
    });
  }
  document.addEventListener('click', function (e) {
    if (!panel || panel.classList.contains('hidden')) return;
    var wrap = document.querySelector('.notif-wrap');
    if (wrap && !wrap.contains(e.target)) panel.classList.add('hidden');
  });
  renderNotificationUI();
})();

// ==================== INICIAR ====================
if (newsGrid) newsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Carregando notícias...</p>';
loadNews();
