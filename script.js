// ==================== VERIFICAÇÃO DE LOGIN ====================
var currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

if (!currentUser) {
  window.location.href = 'index.html';
}

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
var logoutBtn = document.getElementById('logout-btn');
var adminActions = document.getElementById('admin-actions');

if (userGreeting && currentUser) {
  userGreeting.textContent = 'Olá, ' + currentUser.name.split(' ')[0] + '!';
}

if (welcomeMsg && currentUser) {
  welcomeMsg.textContent = 'Olá, ' + currentUser.name.split(' ')[0] + '!';
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', function () {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  });
}

// Mostra botões de gestão para admin, grêmio, direção e coordenação
var gestaoRoles = ['admin', 'gremio', 'direcao', 'coordenacao'];
if (adminActions && currentUser && gestaoRoles.indexOf(currentUser.role) !== -1) {
  adminActions.classList.remove('hidden');
}

// ==================== NOTÍCIAS ====================
function getNews() {
  return JSON.parse(localStorage.getItem('news') || '[]');
}

function saveNews(news) {
  localStorage.setItem('news', JSON.stringify(news));
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
        content: 'A tradicional Feira de Ciências da E.E. Prof. Lea de Freitas Monteiro promete ser a maior já realizada. Serão mais de 80 projetos de alunos do Ensino Fundamental e Médio.',
        image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
        date: '05/08/2026',
        views: 156,
        likes: 24,
        comments: []
      },
      {
        id: 2,
        title: 'Time de basquete conquista o campeonato regional',
        category: 'Esporte',
        description: 'Vitória emocionante por 78 a 72 na final.',
        content: 'O time de basquete da nossa escola conquistou o campeonato regional após uma final emocionante. Com uma virada no último quarto, a equipe venceu por 78 a 72.',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
        date: '03/08/2026',
        views: 314,
        likes: 89,
        comments: []
      },
      {
        id: 3,
        title: 'Novos laboratórios de informática são inaugurados',
        category: 'Tecnologia',
        description: 'Escola recebe 40 computadores novos e rede de alta velocidade.',
        content: 'Foram inaugurados dois novos laboratórios de informática com 40 máquinas de última geração e internet de alta velocidade.',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        date: '01/08/2026',
        views: 201,
        likes: 45,
        comments: []
      },
      {
        id: 4,
        title: 'Aviso importante: reunião de pais e mestres',
        category: 'Avisos',
        description: 'Reunião marcada para o dia 15 de agosto às 19h.',
        content: 'A reunião de pais e mestres do 2º semestre será realizada no dia 15 de agosto, às 19h, no auditório da escola.',
        image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800',
        date: '30/07/2026',
        views: 478,
        likes: 12,
        comments: []
      }
    ];
    saveNews(news);
  }
}
initDemoNews();

// ==================== RENDERIZAR NOTÍCIAS ====================
var newsGrid = document.getElementById('news-grid');
var currentCategory = 'Todas';
var searchTerm = '';

function renderNews() {
  if (!newsGrid) return;

  var news = getNews();

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
    newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Nenhuma notícia encontrada.</p>';
    return;
  }

  news.forEach(function (item) {
    var card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML =
      '<img src="' + (item.image || 'https://images.unsplash.com/photo-1504711434719-3d6d0c4c0c0c?w=800') + '" alt="' + item.title + '">' +
      '<div class="news-card-body">' +
        '<span class="badge">' + item.category + '</span>' +
        '<h3>' + item.title + '</h3>' +
        '<p>' + item.description + '</p>' +
        '<div class="card-footer">' +
          '<span>👁️ ' + item.views + '</span>' +
          '<span>❤️ ' + item.likes + '</span>' +
        '</div>' +
      '</div>';
    card.addEventListener('click', function () {
      openNewsModal(item.id);
    });
    newsGrid.appendChild(card);
  });
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

// ==================== MODAL NOTÍCIA ====================
var newsModal = document.getElementById('news-modal');
var currentNewsId = null;

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

  var modalImage = document.getElementById('modal-image');
  var modalCategory = document.getElementById('modal-category');
  var modalTitle = document.getElementById('modal-title');
  var modalDate = document.getElementById('modal-date');
  var modalViews = document.getElementById('modal-views');
  var modalLikes = document.getElementById('modal-likes');
  var modalContent = document.getElementById('modal-content');
  var commentsList = document.getElementById('comments-list');

  if (modalImage) modalImage.src = item.image || '';
  if (modalCategory) modalCategory.textContent = item.category;
  if (modalTitle) modalTitle.textContent = item.title;
  if (modalDate) modalDate.textContent = item.date;
  if (modalViews) modalViews.textContent = '👁️ ' + item.views;
  if (modalLikes) modalLikes.textContent = '❤️ ' + item.likes;
  if (modalContent) modalContent.textContent = item.content;

  if (commentsList) {
    commentsList.innerHTML = '';
    var comments = item.comments || [];
    for (var c = 0; c < comments.length; c++) {
      var div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = '<strong>' + comments[c].author + '</strong>' + comments[c].text;
      commentsList.appendChild(div);
    }
  }

  newsModal.classList.remove('hidden');
}

// Fechar modais
document.querySelectorAll('.close-modal').forEach(function (btn) {
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
    var news = getNews();
    var item = null;
    for (var i = 0; i < news.length; i++) {
      if (news[i].id === currentNewsId) {
        item = news[i];
        break;
      }
    }
    if (item) {
      item.likes++;
      saveNews(news);
      var modalLikes = document.getElementById('modal-likes');
      if (modalLikes) modalLikes.textContent = '❤️ ' + item.likes;
      renderNews();
    }
  });
}

// Comentar
var addCommentBtn = document.getElementById('add-comment-btn');
var commentInput = document.getElementById('comment-input');

if (addCommentBtn && commentInput) {
  addCommentBtn.addEventListener('click', function () {
    var text = commentInput.value.trim();
    if (!text || !currentNewsId || !currentUser) return;

    var news = getNews();
    var item = null;
    for (var i = 0; i < news.length; i++) {
      if (news[i].id === currentNewsId) {
        item = news[i];
        break;
      }
    }
    if (item) {
      if (!item.comments) item.comments = [];
      item.comments.push({
        author: currentUser.name,
        text: text
      });
      saveNews(news);

      var commentsList = document.getElementById('comments-list');
      if (commentsList) {
        var div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = '<strong>' + currentUser.name + '</strong>' + text;
        commentsList.appendChild(div);
      }
      commentInput.value = '';
    }
  });
}

// ==================== NOVA NOTÍCIA ====================
var editModal = document.getElementById('edit-modal');
var newsForm = document.getElementById('news-form');
var newNewsBtn = document.getElementById('new-news-btn');

if (newNewsBtn && editModal && newsForm) {
  newNewsBtn.addEventListener('click', function () {
    var titleEl = document.getElementById('edit-modal-title');
    if (titleEl) titleEl.textContent = 'Nova Notícia';
    newsForm.reset();
    editModal.classList.remove('hidden');
  });
}

if (newsForm && editModal) {
  newsForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var titleInput = document.getElementById('news-title');
    var categoryInput = document.getElementById('news-category');
    var descriptionInput = document.getElementById('news-description');
    var contentInput = document.getElementById('news-content');
    var imageInput = document.getElementById('news-image');

    if (!titleInput || !categoryInput || !descriptionInput || !contentInput) return;

    var news = getNews();
    var newItem = {
      id: Date.now(),
      title: titleInput.value.trim(),
      category: categoryInput.value,
      description: descriptionInput.value.trim(),
      content: contentInput.value.trim(),
      image: (imageInput && imageInput.value.trim()) ? imageInput.value.trim() : 'https://images.unsplash.com/photo-1504711434719-3d6d0c4c0c0c?w=800',
      date: new Date().toLocaleDateString('pt-BR'),
      views: 0,
      likes: 0,
      comments: []
    };

    news.unshift(newItem);
    saveNews(news);
    renderNews();
    editModal.classList.add('hidden');
    alert('Notícia publicada com sucesso!');
  });
}

// ==================== GERENCIAR USUÁRIOS ====================
var usersModal = document.getElementById('users-modal');
var manageUsersBtn = document.getElementById('manage-users-btn');

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
      btnHtml = '<button class="btn btn-outline btn-delete-user" data-username="' + user.username + '">Excluir</button>';
    btnHtml = '<button class="btn btn-outline btn-delete-user" data-username="' + user.username + '">Editar</button>';
  }
    div.innerHTML =
      '<div><strong>' + user.name + '</strong><br><small>@' + user.username + ' • ' + user.role + '</small></div>' +
      btnHtml
    list.appendChild(div)
  
  });

  list.querySelectorAll('.btn-delete-user').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var username = btn.getAttribute('data-username');
      if (username) deleteUser(username);
    });
  });
};

function deleteUser(username) {
  if (!confirm('Tem certeza que deseja excluir o usuário @' + username + '?')) return;
  var users = getUsers();
  users = users.filter(function (u) {
    return u.username !== username;
  });
  saveUsers(users);
  renderUsers();
}