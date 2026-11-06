// ==================== LOGIN (público lê; login só curtir/comentar) ====================
var currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
var gestaoRoles = ['admin', 'gremio', 'direcao', 'coordenacao'];
var isGestao = false;
if (currentUser) {
  if (gestaoRoles.indexOf(currentUser.role) !== -1 || currentUser.username === 'admin') {
    isGestao = true;
  }
}

(function initUsers() {
  var users = JSON.parse(localStorage.getItem('users') || '[]');
  function has(field, val) {
    return users.some(function (u) { return u[field] === val; });
  }
  // Garante admin com senha forte (atualiza se já existia com senha antiga)
  var adminIdx = -1;
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === 'admin') { adminIdx = i; break; }
  }
  if (adminIdx === -1) {
    users.push({ name: 'Administrador', username: 'admin', password: 'admin123', role: 'admin', tipo: 'gestao' });
  } else {
    users[adminIdx].password = 'admin123';
    users[adminIdx].role = 'admin';
    users[adminIdx].tipo = 'gestao';
  }
  if (!has('ra', '202600123')) {
    users.push({ name: 'João Silva', ra: '202600123', password: '123456', role: 'aluno', tipo: 'aluno', username: '202600123' });
  }
  if (!has('cpf', '12345678901')) {
    users.push({ name: 'Maria Silva', cpf: '12345678901', password: '123456', role: 'aluno', tipo: 'responsavel', username: '12345678901' });
  }
  localStorage.setItem('users', JSON.stringify(users));
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
    userGreeting.textContent = 'Olá, ' + (currentUser.name || '').split(' ')[0] + '!';
    userGreeting.classList.remove('hidden');
  }
  if (welcomeMsg) welcomeMsg.textContent = 'Olá, ' + (currentUser.name || '').split(' ')[0] + '!';
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
if (adminActions && isGestao) adminActions.classList.remove('hidden');

// ==================== NOTÍCIAS ====================
function getNews() {
  return JSON.parse(localStorage.getItem('news') || '[]');
}
function saveNews(news) {
  localStorage.setItem('news', JSON.stringify(news));
}
function getItemImages(item) {
  var list = [];
  if (item.images && item.images.length) {
    for (var i = 0; i < item.images.length; i++) {
      if (item.images[i] && list.indexOf(item.images[i]) === -1) list.push(item.images[i]);
    }
  }
  if (item.image && list.indexOf(item.image) === -1) {
    list.unshift(item.image);
  }
  if (list.length === 0) {
    list = ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'];
  }
  return list;
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
        title: 'No último apito, o 3º B leva a taça e o pátio vira festa',
        category: 'Esporte',
        description: 'Depois de um 2 a 1 apertado, a turma encerrou o Interclasse com a maior torcida da década.',
        content: 'O ginásio não cabia mais gente no segundo tempo. Faixas improvisadas e um gol nos acréscimos que ainda vai ecoar no refeitório.\n\nA capitã do 3º B resumiu: “A gente treinou no intervalo. Literalmente.”',
        images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'],
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        date: '06/10/2026',
        views: 156,
        likes: 24,
        likedBy: [],
        comments: [],
        destaque: true
      },
      {
        id: 2,
        title: 'Laboratório novo abre às quintas — e a fila já começou',
        category: 'Tecnologia',
        description: 'Depois de oito meses fechado, o lab 2 ganhou bancada nova e kit de robótica.',
        content: 'Quem não limpa a vidraria não entra na semana seguinte. As aulas extras de quinta já têm lista de espera.',
        images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'],
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        date: '05/10/2026',
        views: 98,
        likes: 12,
        likedBy: [],
        comments: [],
        destaque: false
      },
      {
        id: 3,
        title: '“Esperando o Intervalo” esgota as duas sessões',
        category: 'Eventos',
        description: 'O grupo de teatro estreou comédia sobre a fila do pão de queijo.',
        content: 'Ingressos esgotados. Terceira sessão marcada. O colégio ri de si mesmo — desde que o apito atrase dez minutos.',
        images: ['https://images.unsplash.com/photo-1503095396549-807759245b35?w=800'],
        image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
        date: '04/10/2026',
        views: 201,
        likes: 45,
        likedBy: [],
        comments: [],
        destaque: true
      },
      {
        id: 4,
        title: 'Aviso: reunião de pais e mestres no dia 15',
        category: 'Avisos',
        description: 'Reunião marcada para o dia 15 de outubro às 19h no auditório.',
        content: 'A reunião de pais e mestres do 2º semestre será no dia 15, às 19h. Comparecimento importante.',
        images: ['https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800'],
        image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800',
        date: '03/10/2026',
        views: 320,
        likes: 8,
        likedBy: [],
        comments: [],
        destaque: false
      }
    ];
    saveNews(news);
  }
}
initDemoNews();

// ==================== NOTÍCIAS AUTOMÁTICAS (ao entrar no site) ====================
var MAX_DESTAQUES = 5; // 1 principal + até 4 laterais

function hojeISO() {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

function getAutoNewsTemplates() {
  var dataFmt = new Date().toLocaleDateString('pt-BR');
  var dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  var diaSemana = dias[new Date().getDay()];
  return [
    {
      title: 'Bom dia, Léa News — edição de ' + dataFmt,
      category: 'Avisos',
      description: 'Abertura automática do jornal escolar nesta ' + diaSemana + '.',
      content: 'Esta é uma notícia gerada automaticamente ao acessar o Léa News.\n\nAcompanhe os avisos da E.E. Prof. Lea de Freitas Monteiro, curta e comente com RA ou CPF, e confira os destaques da semana.\n\nBoa leitura!',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'
    },
    {
      title: 'Lembrete automático: fique por dentro da escola',
      category: 'Avisos',
      description: 'Dica do sistema: use as categorias e a busca para achar matérias rápido.',
      content: 'Notícia automática do Léa News.\n\n• Leia sem login\n• Curtir e comentar: entre com RA (aluno) ou CPF (responsável)\n• Gestão: Área Restrita para publicar\n\nAtualizado em ' + dataFmt + '.',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'
    },
    {
      title: 'Agenda escolar — atualização do dia',
      category: 'Eventos',
      description: 'Resumo automático para a comunidade nesta ' + diaSemana + '.',
      content: 'O Léa News publicou este aviso de forma automática ao detectar um novo acesso no dia ' + dataFmt + '.\n\nConfira Esporte, Tecnologia, Eventos e Avisos nas abas do jornal.',
      image: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=800'
    },
    {
      title: 'Tecnologia na escola: acompanhe pelo jornal digital',
      category: 'Tecnologia',
      description: 'Mensagem automática sobre o uso do Léa News no dia a dia.',
      content: 'Gerado automaticamente em ' + dataFmt + '.\n\nO jornal digital centraliza informações que antes ficavam só no mural. Acesse pelo celular ou computador.',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'
    },
    {
      title: 'Esporte e convivência — fique ligado nos resultados',
      category: 'Esporte',
      description: 'Aviso automático para quem acompanha as competições da escola.',
      content: 'Publicação automática do sistema Léa News (' + dataFmt + ').\n\nResultados de jogos e conquistas podem ser publicados pela gestão na Área Restrita.',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'
    }
  ];
}

/** Se houver mais de MAX_DESTAQUES, as mais antigas deixam de ser destaque (viram normais). */
function enforceMaxDestaques(news, keepId) {
  var destacadas = [];
  for (var i = 0; i < news.length; i++) {
    if (news[i].destaque === true) destacadas.push(news[i]);
  }
  if (destacadas.length <= MAX_DESTAQUES) return news;

  // Ordena: mais recentes primeiro (id maior = mais novo, em geral)
  destacadas.sort(function (a, b) {
    if (keepId && a.id === keepId) return -1;
    if (keepId && b.id === keepId) return 1;
    return (b.id || 0) - (a.id || 0);
  });

  var manterIds = {};
  for (var k = 0; k < MAX_DESTAQUES && k < destacadas.length; k++) {
    manterIds[destacadas[k].id] = true;
  }

  for (var j = 0; j < news.length; j++) {
    if (news[j].destaque === true && !manterIds[news[j].id]) {
      news[j].destaque = false; // volta a ser notícia normal
    }
  }
  return news;
}

function initAutomaticNews() {
  var hoje = hojeISO();
  var ultima = localStorage.getItem('lea_auto_news_date');
  if (ultima === hoje) return;

  var news = getNews();
  var jaTem = news.some(function (n) {
    return n.auto === true && n.autoDate === hoje;
  });
  if (jaTem) {
    localStorage.setItem('lea_auto_news_date', hoje);
    return;
  }

  var templates = getAutoNewsTemplates();
  var t = templates[new Date().getDay() % templates.length];
  var item = {
    id: Date.now(),
    title: t.title,
    category: t.category,
    description: t.description,
    content: t.content,
    images: [t.image],
    image: t.image,
    date: new Date().toLocaleDateString('pt-BR'),
    views: 0,
    likes: 0,
    likedBy: [],
    comments: [],
    destaque: false,
    auto: true,
    autoDate: hoje
  };
  news.unshift(item);
  saveNews(news);
  localStorage.setItem('lea_auto_news_date', hoje);
  try {
    if (typeof addNotification === 'function') {
      addNotification('Notícia automática', item.title, item.id);
    } else {
      localStorage.setItem('lea_pending_auto_notif', JSON.stringify({ title: item.title, id: item.id }));
    }
  } catch (e) {}
}
initAutomaticNews();

var newsGrid = document.getElementById('news-grid');
var currentCategory = 'Todas';
var searchTerm = '';
var editingNewsId = null;

function renderFeatured() {
  var featuredSection = document.getElementById('featured-news');
  var listaEl = document.getElementById('destaques-lista');
  if (!featuredSection) return;
  if (currentCategory !== 'Todas' || searchTerm) {
    featuredSection.classList.add('hidden');
    return;
  }
  var news = getNews();
  var destaques = news.filter(function (n) { return n.destaque === true; });
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
  var cat = document.getElementById('featured-category');
  var title = document.getElementById('featured-title');
  var desc = document.getElementById('featured-description');
  var date = document.getElementById('featured-date');
  var views = document.getElementById('featured-views');
  var likes = document.getElementById('featured-likes');
  if (cat) cat.textContent = principal.category;
  if (title) title.textContent = principal.title;
  if (desc) desc.textContent = principal.description;
  if (date) date.textContent = principal.date;
  if (views) views.textContent = '👁️ ' + principal.views;
  if (likes) likes.textContent = '❤️ ' + principal.likes;

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
      var editBtn = document.getElementById('featured-edit-btn');
      var delBtn = document.getElementById('featured-delete-btn');
      if (editBtn) {
        editBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          openEditNews(principal.id);
        };
      }
      if (delBtn) {
        delBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          deleteNews(principal.id);
        };
      }
    } else {
      adminBtns.classList.add('hidden');
    }
  }

  if (listaEl) {
    listaEl.innerHTML = '';
    var laterais = destaques.slice(1, 5);
    laterais.forEach(function (item) {
      var thumb = getItemImages(item)[0];
      var art = document.createElement('article');
      art.className = 'destaque-item';
      var imgHtml = isVideoSrc(thumb)
        ? '<div class="destaque-item-img video-ph">▶</div>'
        : '<img class="destaque-item-img" src="' + thumb + '" alt="">';
      var adminHtml = '';
      if (isGestao) {
        adminHtml = '<div class="card-admin-btns" style="margin-top:6px;">' +
          '<button type="button" class="btn-edit btn-dest-edit" data-id="' + item.id + '">Editar</button>' +
          '<button type="button" class="btn-delete btn-dest-del" data-id="' + item.id + '">Excluir</button></div>';
      }
      art.innerHTML =
        imgHtml +
        '<div class="destaque-item-text">' +
          '<span class="secao-label">' + item.category + '</span>' +
          '<h3>' + item.title + '</h3>' +
          '<p>' + item.description + '</p>' +
          '<div class="featured-meta"><span>' + item.date + '</span> <span>❤️ ' + item.likes + '</span></div>' +
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
        e.preventDefault();
        e.stopPropagation();
        openEditNews(parseInt(btn.getAttribute('data-id'), 10));
      });
    });
    listaEl.querySelectorAll('.btn-dest-del').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        deleteNews(parseInt(btn.getAttribute('data-id'), 10));
      });
    });
  }

  featuredSection.classList.remove('hidden');
}

function renderNews() {
  if (!newsGrid) return;
  var news = getNews();
  if (currentCategory === 'Todas') {
    news = news.filter(function (n) { return n.destaque !== true; });
  }
  if (currentCategory !== 'Todas') {
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
      ? '<video src="' + capa + '" muted class="card-cover"></video>'
      : '<img src="' + capa + '" alt="" class="card-cover">';
    card.innerHTML = mediaHtml +
      '<div class="news-card-body">' +
        '<span class="badge">' + item.category + '</span>' +
        '<h3>' + item.title + '</h3>' +
        '<p>' + item.description + '</p>' +
        '<div class="card-footer"><span>👁️ ' + item.views + '</span><span>❤️ ' + item.likes + '</span></div>' +
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

// ==================== MODAL ====================
var newsModal = document.getElementById('news-modal');
var currentNewsId = null;
var currentPhotoIndex = 0;
var currentPhotos = [];

function openNewsModal(id) {
  var news = getNews();
  var item = null;
  for (var i = 0; i < news.length; i++) {
    if (news[i].id === id) { item = news[i]; break; }
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
  var counterEl = document.getElementById('photo-counter');
  if (counterEl) container.insertBefore(media, counterEl);
  else container.appendChild(media);
  if (counter) counter.textContent = (currentPhotoIndex + 1) + ' / ' + currentPhotos.length;
  if (prevBtn && nextBtn) {
    var show = currentPhotos.length > 1 ? 'flex' : 'none';
    prevBtn.style.display = show;
    nextBtn.style.display = show;
  }
  // Miniaturas embaixo da foto da postagem
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

document.querySelectorAll('.close-modal').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.modal').forEach(function (m) { m.classList.add('hidden'); });
  });
});
document.querySelectorAll('.btn-cancelar').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.modal').forEach(function (m) { m.classList.add('hidden'); });
  });
});
document.querySelectorAll('.modal').forEach(function (modal) {
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

var likeBtn = document.getElementById('like-btn');
if (likeBtn) {
  likeBtn.addEventListener('click', function () {
    if (!currentNewsId) return;
    if (!currentUser) {
      alert('Faça login com RA ou CPF para curtir!');
      window.location.href = 'login.html';
      return;
    }
    var news = getNews();
    for (var i = 0; i < news.length; i++) {
      if (news[i].id === currentNewsId) {
        if (!news[i].likedBy) news[i].likedBy = [];
        var username = currentUser.username;
        var ja = news[i].likedBy.indexOf(username) !== -1;
        if (ja) {
          news[i].likedBy = news[i].likedBy.filter(function (u) { return u !== username; });
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
      btnExcluir.setAttribute('data-index', c);
      btnExcluir.addEventListener('click', function () {
        excluirComentario(parseInt(this.getAttribute('data-index'), 10));
      });
      div.appendChild(btnExcluir);
    }
    commentsList.appendChild(div);
  }
}

function excluirComentario(index) {
  if (!confirm('Excluir este comentário?')) return;
  var news = getNews();
  for (var i = 0; i < news.length; i++) {
    if (news[i].id === currentNewsId) {
      if (!news[i].comments) news[i].comments = [];
      news[i].comments.splice(index, 1);
      saveNews(news);
      renderComments(news[i]);
      break;
    }
  }
}

var addCommentBtn = document.getElementById('add-comment-btn');
var commentInput = document.getElementById('comment-input');
if (addCommentBtn && commentInput) {
  addCommentBtn.addEventListener('click', function () {
    if (!currentUser) {
      alert('Faça login para comentar!');
      return;
    }
    var text = commentInput.value.trim();
    if (!text || !currentNewsId) return;
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

// ==================== MÍDIA ====================
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
      video.style.cssText = 'width:90px;height:90px;object-fit:cover;border-radius:8px;';
      video.muted = true;
      wrapper.appendChild(video);
    } else {
      var img = document.createElement('img');
      img.src = src;
      img.style.cssText = 'width:90px;height:90px;object-fit:cover;border-radius:8px;';
      wrapper.appendChild(img);
    }
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.style.cssText = 'position:absolute;top:-6px;right:-6px;background:#e74c3c;color:white;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;';
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
  if (selectedImages.length === 0) choosePhotosBtn.textContent = '📷🎬 Escolher Fotos ou Vídeos';
  else choosePhotosBtn.textContent = '📷🎬 ' + selectedImages.length + ' arquivo(s) — adicionar mais';
}

if (choosePhotosBtn && newsImageInput) {
  choosePhotosBtn.addEventListener('click', function () { newsImageInput.click(); });
  newsImageInput.addEventListener('change', function () {
    var files = this.files;
    if (!files || !files.length) return;
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

// ==================== PUBLICAR / EDITAR ====================
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
    var d = document.getElementById('news-destaque');
    if (d) d.checked = false;
    editModal.classList.remove('hidden');
  });
}

function openEditNews(id) {
  var news = getNews();
  var item = null;
  for (var i = 0; i < news.length; i++) {
    if (news[i].id === id) { item = news[i]; break; }
  }
  if (!item || !editModal) return;
  editingNewsId = id;
  document.getElementById('edit-modal-title').textContent = 'Editar Notícia';
  document.getElementById('news-title').value = item.title;
  document.getElementById('news-category').value = item.category;
  document.getElementById('news-description').value = item.description;
  document.getElementById('news-content').value = item.content;
  var d = document.getElementById('news-destaque');
  if (d) d.checked = item.destaque === true;
  selectedImages = getItemImages(item).slice();
  atualizarPreview();
  atualizarTextoBotao();
  editModal.classList.remove('hidden');
}

function deleteNews(id) {
  if (!confirm('Excluir esta notícia?')) return;
  saveNews(getNews().filter(function (n) { return n.id !== id; }));
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
    var isDestaque = document.getElementById('news-destaque').checked;
    if (!title || !description || !content) {
      alert('Preencha os campos obrigatórios!');
      return;
    }
    var images = selectedImages.length
      ? selectedImages
      : ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'];
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
      if (isDestaque) news = enforceMaxDestaques(news, editingNewsId);
      saveNews(news);
      renderNews();
      editModal.classList.add('hidden');
      editingNewsId = null;
      alert('Notícia atualizada!');
    } else {
      var novoId = Date.now();
      news.unshift({
        id: novoId,
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
      if (isDestaque) news = enforceMaxDestaques(news, novoId);
      saveNews(news);
      renderNews();
      editModal.classList.add('hidden');
      addNotification('Nova notícia', title, news[0].id);
      alert('Notícia publicada!');
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

function atualizarCamposUsuario() {
  var roleEl = document.getElementById('new-user-role');
  if (!roleEl) return;
  var role = roleEl.value;
  var fieldRa = document.getElementById('field-ra');
  var fieldCpf = document.getElementById('field-cpf');
  var fieldUser = document.getElementById('field-username');
  var hint = document.getElementById('user-form-hint');
  var raInput = document.getElementById('new-user-ra');
  var cpfInput = document.getElementById('new-user-cpf');
  var userInput = document.getElementById('new-user-username');

  if (fieldRa) fieldRa.classList.add('hidden');
  if (fieldCpf) fieldCpf.classList.add('hidden');
  if (fieldUser) fieldUser.classList.add('hidden');
  if (raInput) raInput.value = '';
  if (cpfInput) cpfInput.value = '';
  if (userInput) userInput.value = '';

  if (role === 'aluno') {
    if (fieldRa) fieldRa.classList.remove('hidden');
    if (hint) hint.textContent = 'Aluno: nome + RA + senha';
  } else if (role === 'responsavel') {
    if (fieldCpf) fieldCpf.classList.remove('hidden');
    if (hint) hint.textContent = 'Responsável: nome + CPF + senha';
  } else {
    if (fieldUser) fieldUser.classList.remove('hidden');
    if (hint) hint.textContent = 'Professor/gestão: nome + usuário + senha';
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
    var info = user.name + '<br><small>';
    if (user.ra) info += 'RA ' + user.ra + ' · ';
    if (user.cpf) info += 'CPF ' + user.cpf + ' · ';
    if (user.username) info += '@' + user.username + ' · ';
    info += (user.tipo || user.role) + '</small>';
    var btnHtml = '';
    if (user.username !== 'admin') {
      btnHtml = '<button type="button" class="btn btn-outline btn-delete-user" data-key="' +
        (user.username || user.ra || user.cpf) + '">Excluir</button>';
    }
    div.innerHTML = '<div>' + info + '</div>' + btnHtml;
    list.appendChild(div);
  });
  list.querySelectorAll('.btn-delete-user').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-key');
      if (!confirm('Excluir este usuário?')) return;
      saveUsers(getUsers().filter(function (u) {
        return u.username !== key && u.ra !== key && u.cpf !== key;
      }));
      renderUsers();
    });
  });
}

if (addUserForm) {
  addUserForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('new-user-name').value.trim();
    var role = document.getElementById('new-user-role').value;
    var ra = document.getElementById('new-user-ra').value.trim() || null;
    var cpf = (document.getElementById('new-user-cpf').value || '').replace(/\D/g, '') || null;
    var username = document.getElementById('new-user-username').value.trim() || null;
    var password = document.getElementById('new-user-password').value;

    if (!name || !password) {
      alert('Nome e senha obrigatórios!');
      return;
    }
    if (role === 'aluno' && !ra) {
      alert('Aluno precisa de RA!');
      return;
    }
    if (role === 'responsavel' && (!cpf || cpf.length !== 11)) {
      alert('Responsável precisa de CPF com 11 dígitos!');
      return;
    }
    if ((role === 'professor' || role === 'admin' || role === 'gremio' || role === 'direcao') && !username) {
      alert('Informe o usuário!');
      return;
    }

    var users = getUsers();
    var mapRole = role === 'responsavel' ? 'aluno' : role;
    users.push({
      name: name,
      username: username || ra || cpf,
      password: password,
      role: mapRole,
      tipo: role,
      ra: ra,
      cpf: cpf
    });
    saveUsers(users);
    renderUsers();
    addUserForm.reset();
    atualizarCamposUsuario();
    alert('Usuário cadastrado!');
  });
}


// ==================== NOTIFICAÇÕES (sino + navegador) ====================
function getNotifications() {
  return JSON.parse(localStorage.getItem('lea_notifications') || '[]');
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
    div.innerHTML = '<strong>' + item.titulo + '</strong>' + item.texto +
      '<br><span>' + item.data + '</span>';
    div.addEventListener('click', function () {
      item.lida = true;
      var all = getNotifications().map(function (x) {
        if (x.id === item.id) x.lida = true;
        return x;
      });
      saveNotifications(all);
      renderNotificationUI();
      if (item.newsId) openNewsModal(item.newsId);
      var panel = document.getElementById('notif-panel');
      if (panel) panel.classList.add('hidden');
    });
    listEl.appendChild(div);
  });
}

function showBrowserNotification(titulo, corpo) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(titulo, {
      body: corpo,
      icon: undefined,
      tag: 'lea-news'
    });
  } catch (e) {}
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
  try {
    var pending = localStorage.getItem('lea_pending_auto_notif');
    if (pending) {
      var p = JSON.parse(pending);
      localStorage.removeItem('lea_pending_auto_notif');
      addNotification('Notícia automática', p.title, p.id);
    }
  } catch (e) {}
})();