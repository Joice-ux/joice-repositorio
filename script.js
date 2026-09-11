// ==================== VERIFICACAO DE LOGIN ====================
var currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

var gestaoRoles = ['admin', 'gremio', 'direcao', 'coordenacao'];
var isGestao = false;
if (currentUser) {
  if (gestaoRoles.indexOf(currentUser.role) !== -1 || currentUser.username === 'admin') {
    isGestao = true;
  }
}

(function initAdmin() {
  var users = JSON.parse(localStorage.getItem('users') || '[]');
  var temAdmin = users.find(function (u) { return u.username === 'admin'; });
  if (!temAdmin) {
    users.push({
      name: 'Administrador',
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });
    localStorage.setItem('users', JSON.stringify(users));
  }
})();

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
  if (userGreeting) {
    userGreeting.textContent = 'Olá, ' + currentUser.name.split(' ')[0] + '!';
    userGreeting.classList.remove('hidden');
  }
  if (welcomeMsg) {
    welcomeMsg.textContent = 'Olá, ' + currentUser.name.split(' ')[0] + '!';
  }
  if (loginBtn) loginBtn.classList.add('hidden');
  if (logoutBtn) logoutBtn.classList.remove('hidden');
} else {
  if (userGreeting) userGreeting.classList.add('hidden');
  if (loginBtn) loginBtn.classList.remove('hidden');
  if (logoutBtn) logoutBtn.classList.add('hidden');
}

if (loginBtn) {
  loginBtn.addEventListener('click', function () {
    window.location.href = 'login.html';
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', function () {
    localStorage.removeItem('currentUser');
    window.location.reload();
  });
}

if (adminActions && isGestao) {
  adminActions.classList.remove('hidden');
}

// ==================== NOTICIAS ====================
function getNews() {
  return JSON.parse(localStorage.getItem('news') || '[]');
}

function saveNews(news) {
  localStorage.setItem('news', JSON.stringify(news));
}

function getItemImages(item) {
  if (item.images && item.images.length) return item.images;
  if (item.image) return [item.image];
  return ['https://images.unsplash.com/photo-1504711434719-3d6d0c4c0c0c?w=800'];
}

function isVideoSrc(src) {
  if (!src) return false;
  return src.indexOf('data:video') === 0 || src.indexOf('video/') !== -1;
}

function initDemoNews() {
  var news = getNews();
  if (news.length === 0) {
    news = [
      {
        id: 1,
        title: 'Feira de Ciências 2026 será a maior da história da escola',
        category: 'Eventos',
        description: 'Mais de 80 projetos serão apresentados no próximo mês.',
        content: 'A tradicional Feira de Ciências da E.E. Prof. Lea de Freitas Monteiro promete ser a maior já realizada.',
        images: ['https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800'],
        image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
        date: '05/08/2026',
        views: 156,
        likes: 24,
        likedBy: [],
        comments: [],
        destaque: false
      },
      {
        id: 2,
        title: 'Time de basquete conquista o campeonato regional',
        category: 'Esporte',
        description: 'Vitória emocionante por 78 a 72 na final.',
        content: 'O time de basquete da nossa escola conquistou o campeonato regional após uma final emocionante.',
        images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'],
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
        date: '03/08/2026',
        views: 314,
        likes: 89,
        likedBy: [],
        comments: [],
        destaque: false
      },
      {
        id: 3,
        title: 'Novos laboratórios de informática são inaugurados',
        category: 'Tecnologia',
        description: 'Escola recebe 40 computadores novos e rede de alta velocidade.',
        content: 'Foram inaugurados dois novos laboratórios de informática com 40 máquinas de última geração.',
        images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'],
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        date: '01/08/2026',
        views: 201,
        likes: 45,
        likedBy: [],
        comments: [],
        destaque: false
      },
      {
        id: 4,
        title: 'Aviso importante: reunião de pais e mestres',
        category: 'Avisos',
        description: 'Reunião marcada para o dia 15 de agosto às 19h.',
        content: 'A reunião de pais e mestres do 2º semestre será realizada no dia 15 de agosto, às 19h.',
        images: ['https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800'],
        image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800',
        date: '30/07/2026',
        views: 478,
        likes: 12,
        likedBy: [],
        comments: [],
        destaque: false
      }
    ];
    saveNews(news);
  }
}
initDemoNews();

// ==================== VARIÁVEIS ====================
var newsGrid = document.getElementById('news-grid');
var currentCategory = 'Todas';
var searchTerm = '';
var editingNewsId = null;

// ==================== DESTAQUE MANUAL ====================
function renderFeatured() {
  var featuredSection = document.getElementById('featured-news');
  if (!featuredSection) return;

  if (currentCategory !== 'Todas') {
    featuredSection.classList.add('hidden');
    return;
  }

  var news = getNews();
  var destaque = null;
  for (var i = 0; i < news.length; i++) {
    if (news[i].destaque === true) {
      destaque = news[i];
      break;
    }
  }

  if (!destaque) {
    featuredSection.classList.add('hidden');
    return;
  }

  var capa = getItemImages(destaque)[0];
  var featuredImg = document.getElementById('featured-img');

  if (featuredImg) {
    if (isVideoSrc(capa)) {
      featuredImg.style.display = 'none';
    } else {
      featuredImg.style.display = 'block';
      featuredImg.src = capa;
    }
  }

  var catEl = document.getElementById('featured-category');
  var titleEl = document.getElementById('featured-title');
  var descEl = document.getElementById('featured-description');
  var dateEl = document.getElementById('featured-date');
  var viewsEl = document.getElementById('featured-views');
  var likesEl = document.getElementById('featured-likes');

  if (catEl) catEl.textContent = destaque.category;
  if (titleEl) titleEl.textContent = destaque.title;
  if (descEl) descEl.textContent = destaque.description;
  if (dateEl) dateEl.textContent = destaque.date;
  if (viewsEl) viewsEl.textContent = '👁️ ' + destaque.views;
  if (likesEl) likesEl.textContent = '❤️ ' + destaque.likes;

  var readBtn = document.getElementById('featured-read-btn');
  if (readBtn) {
    readBtn.onclick = function () {
      openNewsModal(destaque.id);
    };
  }

  // Botões Editar / Excluir no destaque
  var adminBtns = document.getElementById('featured-admin-btns');
  var editBtn = document.getElementById('featured-edit-btn');
  var deleteBtn = document.getElementById('featured-delete-btn');

  if (adminBtns && editBtn && deleteBtn) {
    if (isGestao) {
      adminBtns.classList.remove('hidden');
      editBtn.onclick = function (e) {
        e.stopPropagation();
        openEditNews(destaque.id);
      };
      deleteBtn.onclick = function (e) {
        e.stopPropagation();
        deleteNews(destaque.id);
      };
    } else {
      adminBtns.classList.add('hidden');
    }
  }

  featuredSection.classList.remove('hidden');
}

// ==================== RENDERIZAR ====================
function renderNews() {
  if (!newsGrid) return;

  var news = getNews();

  if (currentCategory === 'Todas') {
    news = news.filter(function (n) {
      return n.destaque !== true;
    });
  }

  if (currentCategory !== 'Todas') {
    news = news.filter(function (n) {
      return n.category === currentCategory;
    });
  }

  if (searchTerm) {
    var term = searchTerm.toLowerCase();
    news = news.filter(function (n) {
      return (
        n.title.toLowerCase().indexOf(term) !== -1 ||
        n.description.toLowerCase().indexOf(term) !== -1 ||
        n.category.toLowerCase().indexOf(term) !== -1
      );
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
      adminBtns =
        '<div class="card-admin-btns">' +
          '<button type="button" class="btn-edit" data-id="' + item.id + '">Editar</button>' +
          '<button type="button" class="btn-delete" data-id="' + item.id + '">Excluir</button>' +
        '</div>';
    }

    var mediaHtml = '';
    if (isVideoSrc(capa)) {
      mediaHtml = '<video src="' + capa + '" muted style="width:100%;height:180px;object-fit:cover;"></video>';
    } else {
      mediaHtml = '<img src="' + capa + '" alt="">';
    }

    card.innerHTML =
      mediaHtml +
      '<div class="news-card-body">' +
        '<span class="badge">' + item.category + '</span>' +
        '<h3>' + item.title + '</h3>' +
        '<p>' + item.description + '</p>' +
        '<div class="card-footer">' +
          '<span>👁️ ' + item.views + '</span>' +
          '<span>❤️ ' + item.likes + '</span>' +
        '</div>' +
        adminBtns +
      '</div>';

    card.addEventListener('click', function (e) {
      if (e.target.classList.contains('btn-edit') || e.target.classList.contains('btn-delete')) return;
      openNewsModal(item.id);
    });

    newsGrid.appendChild(card);
  });

  document.querySelectorAll('.btn-edit').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      openEditNews(parseInt(this.getAttribute('data-id'), 10));
    });
  });

  document.querySelectorAll('.btn-delete').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteNews(parseInt(this.getAttribute('data-id'), 10));
    });
  });

  renderFeatured();
}

renderNews();

// ==================== CATEGORIAS ====================
document.querySelectorAll('.cat-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.cat-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    currentCategory = btn.getAttribute('data-cat') || 'Todas';
    renderNews();
  });
});

// ==================== BUSCA ====================
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

// ==================== MODAL NOTICIA ====================
var newsModal = document.getElementById('news-modal');
var currentNewsId = null;
var currentPhotoIndex = 0;
var currentPhotos = [];

function openNewsModal(id) {
  var news = getNews();
  var item = null;
  for (var i = 0; i < news.length; i++) {
    if (news[i].id === id) {
      item = news[i];
      break;
    }
  }
  if (!item || !newsModal) return;

  currentNewsId = id;
  item.views++;
  saveNews(news);

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
  if (likeBtnEl) {
    if (currentUser && item.likedBy && item.likedBy.indexOf(currentUser.username) !== -1) {
      likeBtnEl.textContent = '💔 Descurtir';
    } else {
      likeBtnEl.textContent = '❤️ Curtir';
    }
  }

  newsModal.classList.remove('hidden');
  renderNews();
}

function mostrarFotoAtual() {
  var container = document.getElementById('modal-gallery-container');
  var counter = document.getElementById('photo-counter');
  var prevBtn = document.getElementById('prev-photo');
  var nextBtn = document.getElementById('next-photo');

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
    media.style.maxHeight = '420px';
    media.style.maxWidth = '100%';
    media.style.display = 'block';
    media.style.margin = '0 auto';
  } else {
    media = document.createElement('img');
    media.id = 'modal-current-photo';
    media.src = src;
    media.alt = '';
    media.style.maxHeight = '420px';
    media.style.maxWidth = '100%';
    media.style.objectFit = 'contain';
    media.style.display = 'block';
    media.style.margin = '0 auto';
  }

  var counterEl = document.getElementById('photo-counter');
  if (counterEl) {
    container.insertBefore(media, counterEl);
  } else {
    container.appendChild(media);
  }

  if (counter) {
    counter.textContent = (currentPhotoIndex + 1) + ' / ' + currentPhotos.length;
  }

  if (prevBtn && nextBtn) {
    if (currentPhotos.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
  }
}

document.addEventListener('click', function (e) {
  if (e.target && e.target.id === 'prev-photo') {
    if (currentPhotos.length === 0) return;
    currentPhotoIndex--;
    if (currentPhotoIndex < 0) currentPhotoIndex = currentPhotos.length - 1;
    mostrarFotoAtual();
  }

  if (e.target && e.target.id === 'next-photo') {
    if (currentPhotos.length === 0) return;
    currentPhotoIndex++;
    if (currentPhotoIndex >= currentPhotos.length) currentPhotoIndex = 0;
    mostrarFotoAtual();
  }
});

document.querySelectorAll('.close-modal').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.modal').forEach(function (m) {
      m.classList.add('hidden');
    });
  });
});

document.querySelectorAll('.btn-cancelar').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.modal').forEach(function (m) {
      m.classList.add('hidden');
    });
  });
});

document.querySelectorAll('.modal').forEach(function (modal) {
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

// Curtir
var likeBtn = document.getElementById('like-btn');
if (likeBtn) {
  likeBtn.addEventListener('click', function () {
    if (!currentNewsId) return;

    if (!currentUser) {
      alert('Faça login para curtir!');
      return;
    }

    var news = getNews();
    for (var i = 0; i < news.length; i++) {
      if (news[i].id === currentNewsId) {
        if (!news[i].likedBy) news[i].likedBy = [];

        var username = currentUser.username;
        var jaCurtiu = news[i].likedBy.indexOf(username) !== -1;

        if (jaCurtiu) {
          news[i].likedBy = news[i].likedBy.filter(function (u) {
            return u !== username;
          });
          news[i].likes = Math.max(0, news[i].likes - 1);
          likeBtn.textContent = '❤️ Curtir';
        } else {
          news[i].likedBy.push(username);
          news[i].likes++;
          likeBtn.textContent = '💔 Descurtir';
        }

        saveNews(news);
        document.getElementById('modal-likes').textContent = '❤️ ' + news[i].likes;
        renderNews();
        break;
      }
    }
  });
}

// ==================== COMENTÁRIOS ====================
function renderComments(item) {
  var commentsList = document.getElementById('comments-list');
  if (!commentsList) return;

  commentsList.innerHTML = '';
  var comments = item.comments || [];

  for (var c = 0; c < comments.length; c++) {
    var div = document.createElement('div');
    div.className = 'comment';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.gap = '10px';
    div.style.marginBottom = '8px';

    var texto = document.createElement('div');
    texto.innerHTML = '<strong>' + comments[c].author + '</strong> ' + comments[c].text;
    div.appendChild(texto);

    var podeExcluir = isGestao || (currentUser && comments[c].author === currentUser.name);

    if (podeExcluir) {
      var btnExcluir = document.createElement('button');
      btnExcluir.type = 'button';
      btnExcluir.textContent = 'Excluir';
      btnExcluir.className = 'btn btn-outline';
      btnExcluir.style.padding = '4px 10px';
      btnExcluir.style.fontSize = '12px';
      btnExcluir.style.color = '#e74c3c';
      btnExcluir.style.borderColor = '#e74c3c';
      btnExcluir.setAttribute('data-index', c);

      btnExcluir.addEventListener('click', function () {
        var index = parseInt(this.getAttribute('data-index'), 10);
        excluirComentario(index);
      });

      div.appendChild(btnExcluir);
    }

    commentsList.appendChild(div);
  }
}

function excluirComentario(index) {
  if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

  var news = getNews();
  for (var i = 0; i < news.length; i++) {
    if (news[i].id === currentNewsId) {
      if (!news[i].comments) news[i].comments = [];
      news[i].comments.splice(index, 1);
      saveNews(news);
      renderComments(news[i]);
      alert('Comentário excluído!');
      break;
    }
  }
}

var addCommentBtn = document.getElementById('add-comment-btn');
var commentInput = document.getElementById('comment-input');
if (addCommentBtn && commentInput) {
  addCommentBtn.addEventListener('click', function () {
    var text = commentInput.value.trim();
    if (!text || !currentNewsId || !currentUser) return;

    var news = getNews();
    for (var i = 0; i < news.length; i++) {
      if (news[i].id === currentNewsId) {
        if (!news[i].comments) news[i].comments = [];
        news[i].comments.push({ author: currentUser.name, text: text });
        saveNews(news);
        renderComments(news[i]);
        commentInput.value = '';
        break;
      }
    }
  });
}

// ==================== MIDIA ====================
var selectedImages = [];
var choosePhotosBtn = document.getElementById('choose-photos-btn');
var newsImageInput = document.getElementById('news-image');
var imagePreview = document.getElementById('image-preview');

function atualizarPreview() {
  if (!imagePreview) return;
  imagePreview.innerHTML = '';

  selectedImages.forEach(function (src, index) {
    var wrapper = document.createElement('div');
    wrapper.style.position = 'relative';

    if (isVideoSrc(src)) {
      var video = document.createElement('video');
      video.src = src;
      video.style.width = '90px';
      video.style.height = '90px';
      video.style.objectFit = 'cover';
      video.style.borderRadius = '8px';
      video.muted = true;
      wrapper.appendChild(video);
    } else {
      var img = document.createElement('img');
      img.src = src;
      img.style.width = '90px';
      img.style.height = '90px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      wrapper.appendChild(img);
    }

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.style.position = 'absolute';
    removeBtn.style.top = '-6px';
    removeBtn.style.right = '-6px';
    removeBtn.style.background = '#e74c3c';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '50%';
    removeBtn.style.width = '22px';
    removeBtn.style.height = '22px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.fontSize = '14px';
    removeBtn.onclick = function () {
      selectedImages.splice(index, 1);
      atualizarPreview();
      atualizarTextoBotao();
    };

    wrapper.appendChild(removeBtn);
    imagePreview.appendChild(wrapper);
  });
}

function atualizarTextoBotao() {
  if (!choosePhotosBtn) return;
  if (selectedImages.length === 0) {
    choosePhotosBtn.textContent = '📷🎬 Escolher Fotos ou Vídeos';
  } else {
    choosePhotosBtn.textContent = '📷🎬 ' + selectedImages.length + (selectedImages.length === 1 ? ' arquivo' : ' arquivos') + ' (clique para adicionar mais)';
  }
}

if (choosePhotosBtn && newsImageInput) {
  choosePhotosBtn.addEventListener('click', function () {
    newsImageInput.click();
  });

  newsImageInput.addEventListener('change', function () {
    var files = this.files;
    if (!files || files.length === 0) return;

    var carregadas = 0;
    var total = files.length;

    for (var i = 0; i < files.length; i++) {
      var reader = new FileReader();
      reader.onload = function (e) {
        selectedImages.push(e.target.result);
        carregadas++;

        if (carregadas === total) {
          atualizarPreview();
          atualizarTextoBotao();
          newsImageInput.value = '';
        }
      };
      reader.readAsDataURL(files[i]);
    }
  });
}

// ==================== NOVA / EDITAR NOTÍCIA ====================
var editModal = document.getElementById('edit-modal');
var newsForm = document.getElementById('news-form');
var newNewsBtn = document.getElementById('new-news-btn');

if (newNewsBtn && editModal && newsForm) {
  newNewsBtn.addEventListener('click', function () {
    editingNewsId = null;
    document.getElementById('edit-modal-title').textContent = 'Nova Notícia';
    newsForm.reset();
    selectedImages = [];
    atualizarPreview();
    atualizarTextoBotao();
    var destaqueCheck = document.getElementById('news-destaque');
    if (destaqueCheck) destaqueCheck.checked = false;
    editModal.classList.remove('hidden');
  });
}

function openEditNews(id) {
  var news = getNews();
  var item = null;
  for (var i = 0; i < news.length; i++) {
    if (news[i].id === id) {
      item = news[i];
      break;
    }
  }
  if (!item || !editModal || !newsForm) return;

  editingNewsId = id;
  document.getElementById('edit-modal-title').textContent = 'Editar Notícia';

  document.getElementById('news-title').value = item.title;
  document.getElementById('news-category').value = item.category;
  document.getElementById('news-description').value = item.description;
  document.getElementById('news-content').value = item.content;

  var destaqueCheck = document.getElementById('news-destaque');
  if (destaqueCheck) {
    destaqueCheck.checked = item.destaque === true;
  }

  selectedImages = getItemImages(item).slice();
  atualizarPreview();
  atualizarTextoBotao();

  editModal.classList.remove('hidden');
}

function deleteNews(id) {
  if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;
  var news = getNews().filter(function (n) {
    return n.id !== id;
  });
  saveNews(news);
  renderNews();
  alert('Notícia excluída!');
}

if (newsForm && editModal) {
  newsForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var title = document.getElementById('news-title').value.trim();
    var category = document.getElementById('news-category').value;
    var description = document.getElementById('news-description').value.trim();
    var content = document.getElementById('news-content').value.trim();
    var destaqueCheck = document.getElementById('news-destaque');
    var isDestaque = destaqueCheck ? destaqueCheck.checked : false;

    if (!title || !description || !content) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    var images = selectedImages.length > 0 ? selectedImages : ['https://images.unsplash.com/photo-1504711434719-3d6d0c4c0c0c?w=800'];

    var news = getNews();

    if (editingNewsId) {
      for (var i = 0; i < news.length; i++) {
        if (news[i].id === editingNewsId) {
          news[i].title = title;
          news[i].category = category;
          news[i].description = description;
          news[i].content = content;
          news[i].images = images;
          news[i].image = images[0];
          news[i].destaque = isDestaque;
          break;
        }
      }

      if (isDestaque) {
        for (var j = 0; j < news.length; j++) {
          if (news[j].id !== editingNewsId) {
            news[j].destaque = false;
          }
        }
      }

      saveNews(news);
      renderNews();
      editModal.classList.add('hidden');
      editingNewsId = null;
      alert('Notícia atualizada!');
    } else {
      if (isDestaque) {
        for (var k = 0; k < news.length; k++) {
          news[k].destaque = false;
        }
      }

      news.unshift({
        id: Date.now(),
        title: title,
        category: category,
        description: description,
        content: content,
        images: images,
        image: images[0],
        date: new Date().toLocaleDateString('pt-BR'),
        views: 0,
        likes: 0,
        likedBy: [],
        comments: [],
        destaque: isDestaque
      });

      saveNews(news);
      renderNews();
      editModal.classList.add('hidden');
      alert('Notícia publicada com sucesso!');
    }

    selectedImages = [];
    atualizarPreview();
    atualizarTextoBotao();
  });
}

// ==================== USUÁRIOS ====================
var usersModal = document.getElementById('users-modal');
var manageUsersBtn = document.getElementById('manage-users-btn');
var addUserForm = document.getElementById('add-user-form');

if (manageUsersBtn && usersModal) {
  manageUsersBtn.addEventListener('click', function () {
    renderUsers();
    usersModal.classList.remove('hidden');
  });
}

function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function renderUsers() {
  var list = document.getElementById('users-list');
  if (!list) return;
  var users = getUsers();
  list.innerHTML = '';
  
  users.forEach(function (user) {
    var div = document.createElement('div');
    div.className = 'user-item';
    var btnHtml = '';
    if (user.username !== 'admin') {
      btnHtml = '<button type="button" class="btn btn-outline btn-delete-user" data-username="' + user.username + '">Excluir</button>';
    }
    div.innerHTML =
      '<div><strong>' + user.name + '</strong><br><small>@' + user.username + ' - ' + user.role + '</small></div>' +
      btnHtml;
    list.appendChild(div);
  });

  list.querySelectorAll('.btn-delete-user').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var username = btn.getAttribute('data-username');
      if (username && confirm('Excluir @' + username + '?')) {
        saveUsers(getUsers().filter(function (u) { return u.username !== username; }));
        renderUsers();
      }
    });
  });
}

if (addUserForm) {
  addUserForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = document.getElementById('new-user-name').value.trim();
    var username = document.getElementById('new-user-username').value.trim();
    var password = document.getElementById('new-user-password').value;
    var role = document.getElementById('new-user-role').value;

    if (!name || !username || !password) {
      alert('Preencha todos os campos!');
      return;
    }

    var users = getUsers();
    var existe = users.find(function (u) {
      return u.username === username;
    });

    if (existe) {
      alert('Este nome de usuário já existe!');
      return;
    }

    users.push({
      name: name,
      username: username,
      password: password,
      role: role
    });

    saveUsers(users);
    renderUsers();
    
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-username').value = '';
    document.getElementById('new-user-password').value = '';
    
    alert('Usuário cadastrado com sucesso!');
  });
}