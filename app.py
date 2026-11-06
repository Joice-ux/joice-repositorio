# -*- coding: utf-8 -*-
"""LEA NEWS - API (Flask + MariaDB/MySQL)

Como rodar:
    pip install flask flask-cors mysql-connector-python
    python app.py
    -> abra http://127.0.0.1:5000

Configuração do banco: variáveis de ambiente LEA_DB_HOST, LEA_DB_USER,
LEA_DB_PASSWORD, LEA_DB_NAME (ou edite os valores padrão abaixo).
"""
import os
import re
import sys
import json
import time
import uuid
import secrets
from contextlib import contextmanager
from datetime import date
from functools import wraps

import mysql.connector
from mysql.connector import Error
from mysql.connector.errors import IntegrityError
from flask import Flask, request, jsonify, send_from_directory, abort, g
from flask_cors import CORS
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

def carregar_chave_secreta():
    """Chave que assina os tokens de login. Vem da variável LEA_SECRET_KEY ou, se não houver,
    é gerada uma vez e guardada em .secret_key (assim os logins sobrevivem a reiniciar o app,
    e a chave nunca é um valor público igual para todo mundo)."""
    chave = os.environ.get('LEA_SECRET_KEY')
    if chave:
        return chave
    caminho = os.path.join(BASE_DIR, '.secret_key')
    if os.path.exists(caminho):
        with open(caminho, encoding='utf-8') as f:
            chave = f.read().strip()
        if chave:
            return chave
    chave = secrets.token_hex(32)
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(chave)
    return chave


app = Flask(__name__, static_folder=None)
app.secret_key = carregar_chave_secreta()
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200 MB por requisição
CORS(app, resources={r"/api/*": {"origins": "*"}})

serializer = URLSafeTimedSerializer(app.secret_key)
TOKEN_MAX_AGE = 60 * 60 * 12  # 12 horas

GESTAO = ['admin', 'gremio', 'direcao', 'coordenacao']
CATEGORIAS = ['Tecnologia', 'Esporte', 'Eventos', 'Avisos']
MAX_DESTAQUES = 5
EXT_UPLOAD = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov', 'ogg'}
EXT_ESTATICOS = {'html', 'css', 'js', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'}

# ------------------------------------------------------------------ BANCO
def carregar_config_banco():
    """Lê db_config.json (mesma pasta do app.py). Variáveis LEA_DB_* têm prioridade sobre o arquivo."""
    cfg = {'host': 'localhost', 'port': 3306, 'user': 'root', 'password': '', 'database': 'lea_news_bd'}
    caminho = os.path.join(BASE_DIR, 'db_config.json')
    if os.path.exists(caminho):
        try:
            with open(caminho, encoding='utf-8') as f:
                cfg.update(json.load(f))
        except (OSError, ValueError) as e:
            print('Aviso: não consegui ler db_config.json (%s). Usando valores padrão.' % e)
    for chave, env in (('host', 'LEA_DB_HOST'), ('port', 'LEA_DB_PORT'), ('user', 'LEA_DB_USER'),
                       ('password', 'LEA_DB_PASSWORD'), ('database', 'LEA_DB_NAME')):
        if os.environ.get(env) is not None:
            cfg[chave] = os.environ[env]
    cfg['port'] = int(cfg['port'])
    return cfg


_cfg = carregar_config_banco()
DB_CONFIG = {
    'host': _cfg['host'],
    'port': _cfg['port'],
    'user': _cfg['user'],
    'password': _cfg['password'],
    'database': _cfg['database'],
    'charset': 'utf8mb4',
    # collation fixa evita erro "unknown collation" com MariaDB 11.4+ (uca1400)
    'collation': 'utf8mb4_unicode_ci',
}


@contextmanager
def db():
    conn = mysql.connector.connect(**DB_CONFIG)
    cur = conn.cursor(dictionary=True)
    try:
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


@app.errorhandler(IntegrityError)
def erro_integridade(e):
    if e.errno == 1062:
        return jsonify({'erro': 'Já existe um cadastro com esse RA, CPF ou usuário.'}), 409
    return jsonify({'erro': 'Dados inválidos para o banco.'}), 400


@app.errorhandler(Error)
def erro_banco(e):
    print('ERRO BANCO:', e)
    return jsonify({'erro': 'Erro ao acessar o banco de dados. Veja o terminal do app.py.'}), 500


# ------------------------------------------------------------------ AUTH
def so_numeros(v):
    return re.sub(r'\D', '', str(v or ''))


def user_public(u):
    return {
        'id': u['id'],
        'name': u['nome'],
        'username': u.get('username') or u.get('email'),
        'role': u['role'],
        'tipo': 'gestao' if u['role'] in GESTAO else 'aluno',
    }


def gerar_token(user):
    return serializer.dumps({'id': user['id']})


def usuario_atual():
    h = request.headers.get('Authorization', '')
    if not h.startswith('Bearer '):
        return None
    try:
        data = serializer.loads(h[7:], max_age=TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None
    with db() as cur:
        cur.execute('SELECT * FROM usuarios WHERE id=%s', (data['id'],))
        return cur.fetchone()


def exige_login(f):
    @wraps(f)
    def wrapper(*a, **kw):
        g.user = usuario_atual()
        if not g.user:
            return jsonify({'erro': 'Faça login para continuar.'}), 401
        return f(*a, **kw)
    return wrapper


def exige_gestao(f):
    @wraps(f)
    def wrapper(*a, **kw):
        g.user = usuario_atual()
        if not g.user:
            return jsonify({'erro': 'Faça login para continuar.'}), 401
        if g.user['role'] not in GESTAO:
            return jsonify({'erro': 'Sem permissão.'}), 403
        return f(*a, **kw)
    return wrapper


def senha_confere(cur, user, senha, tabela='usuarios', pk='id'):
    """Aceita hash; se a senha estiver em texto puro (inserida à mão no HeidiSQL),
    aceita uma vez e já converte para hash."""
    guardada = user['senha'] or ''
    if guardada.startswith(('scrypt:', 'pbkdf2:')):
        return check_password_hash(guardada, senha)
    if guardada == senha:
        cur.execute('UPDATE `%s` SET senha=%%s WHERE `%s`=%%s' % (tabela, pk),
                    (generate_password_hash(senha), user[pk]))
        return True
    return False


# Tabelas de quem entra pelo login da gestão: (tabela, coluna do id, role dentro do app).
TABELAS_GESTAO = [('gestao', 'id_gestao', 'admin'), ('gremio', 'id_gremio', 'gremio')]


def espelhar(cur, email, role):
    """O app trabalha com a tabela `usuarios` (token, autor das notícias, comentários, curtidas),
    então cada pessoa de `gestao`/`gremio` ganha uma linha espelho lá, com o mesmo e-mail como username.
    A senha do espelho é aleatória: o login de verdade é sempre feito pela tabela de origem."""
    cur.execute('SELECT * FROM usuarios WHERE username=%s OR email=%s', (email, email))
    u = cur.fetchone()
    if u:
        # o nome já pertence a outro tipo de usuário (ex.: um aluno): não deixa assumir
        return u if u['role'] == role else None
    cur.execute(
        'INSERT INTO usuarios (nome, username, email, senha, role) VALUES (%s,%s,%s,%s,%s)',
        (email, email, email, generate_password_hash(secrets.token_hex(16)), role))
    cur.execute('SELECT * FROM usuarios WHERE id=%s', (cur.lastrowid,))
    return cur.fetchone()


def autenticar(identificador, senha, so_gestao=False):
    ident = (identificador or '').strip()
    if not ident or not senha:
        return None
    with db() as cur:
        if so_gestao:
            # login da gestão: tabelas `gestao` e `gremio`, por e-mail + senha
            for tabela, pk, role in TABELAS_GESTAO:
                cur.execute('SELECT * FROM `%s` WHERE email=%%s' % tabela, (ident,))
                for m in cur.fetchall():
                    if senha_confere(cur, m, senha, tabela, pk):
                        return espelhar(cur, m['email'], role)
            return None
        # login normal: alunos (tabela `usuarios`), por usuário/e-mail (CPF pode vir com pontos)
        cur.execute(
            "SELECT * FROM usuarios WHERE role='aluno' AND (username IN (%s,%s) OR email=%s)",
            (ident, so_numeros(ident), ident))
        for u in cur.fetchall():
            if senha_confere(cur, u, senha):
                return u
    return None


# Freio simples contra adivinhação de senha: 8 erros em 5 minutos bloqueiam aquele IP por um tempo.
_falhas = {}
MAX_FALHAS = 8
JANELA_FALHAS = 5 * 60


def bloqueado(ip):
    agora = time.time()
    tentativas = [t for t in _falhas.get(ip, []) if agora - t < JANELA_FALHAS]
    _falhas[ip] = tentativas
    return len(tentativas) >= MAX_FALHAS


def registrar_falha(ip):
    _falhas.setdefault(ip, []).append(time.time())


RESP_BLOQUEIO = ({'erro': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'}, 429)


@app.route('/api/login', methods=['POST'])
def login():
    ip = request.remote_addr
    if bloqueado(ip):
        return jsonify(RESP_BLOQUEIO[0]), RESP_BLOQUEIO[1]
    d = request.get_json(silent=True) or {}
    u = autenticar(d.get('identificador') or d.get('username'), d.get('senha') or d.get('password'))
    if not u:
        registrar_falha(ip)
        return jsonify({'erro': 'RA/CPF ou senha incorretos. Fale com a secretaria.'}), 401
    return jsonify({'ok': True, 'token': gerar_token(u), 'user': user_public(u)})


@app.route('/api/login-gestao', methods=['POST'])
def login_gestao():
    ip = request.remote_addr
    if bloqueado(ip):
        return jsonify(RESP_BLOQUEIO[0]), RESP_BLOQUEIO[1]
    d = request.get_json(silent=True) or {}
    u = autenticar(d.get('username'), d.get('senha') or d.get('password'), so_gestao=True)
    if not u:
        registrar_falha(ip)
        return jsonify({'erro': 'Usuário ou senha incorretos, ou sem permissão.'}), 401
    return jsonify({'ok': True, 'token': gerar_token(u), 'user': user_public(u)})


# ------------------------------------------------------------------ UPLOAD
@app.route('/api/upload', methods=['POST'])
@exige_gestao
def upload():
    arquivos = request.files.getlist('files')
    if not arquivos:
        return jsonify({'erro': 'Nenhum arquivo enviado.'}), 400
    for f in arquivos:
        nome_orig = f.filename or ''
        ext = nome_orig.rsplit('.', 1)[-1].lower() if '.' in nome_orig else ''
        if ext not in EXT_UPLOAD:
            return jsonify({'erro': 'Tipo de arquivo não permitido: ' + (f.filename or '(sem nome)')}), 400
    urls = []
    for f in arquivos:
        ext = f.filename.rsplit('.', 1)[-1].lower()
        nome = uuid.uuid4().hex + '.' + ext
        f.save(os.path.join(UPLOAD_DIR, nome))
        urls.append('/uploads/' + nome)
    return jsonify({'ok': True, 'urls': urls})


def apagar_arquivos(caminhos):
    """Remove da pasta uploads/ os arquivos que não são mais usados por nenhuma notícia."""
    for c in caminhos:
        if not isinstance(c, str) or not c.startswith('/uploads/'):
            continue
        nome = os.path.basename(c)
        if not nome or nome != c[len('/uploads/'):]:
            continue
        try:
            os.remove(os.path.join(UPLOAD_DIR, nome))
        except OSError:
            pass


def arquivos_em_uso(cur, candidatos):
    if not candidatos:
        return set()
    cur.execute('SELECT caminho_imagem FROM noticia_imagens WHERE caminho_imagem IN (%s)'
                % ','.join(['%s'] * len(candidatos)), list(candidatos))
    return {r['caminho_imagem'] for r in cur.fetchall()}


@app.route('/uploads/<path:nome>')
def servir_upload(nome):
    return send_from_directory(UPLOAD_DIR, nome)


# ------------------------------------------------------------------ NOTÍCIAS
def validar_noticia(d):
    titulo = (d.get('title') or '').strip()
    descricao = (d.get('description') or '').strip()
    conteudo = (d.get('content') or '').strip()
    categoria = d.get('category')
    if not titulo or not descricao or not conteudo:
        return None, 'Preencha título, descrição e conteúdo.'
    if categoria not in CATEGORIAS:
        return None, 'Categoria inválida.'
    imagens = [i for i in (d.get('images') or [])
               if isinstance(i, str) and (i.startswith('/uploads/') or i.startswith('http'))][:20]
    return {
        'titulo': titulo, 'descricao': descricao, 'conteudo': conteudo,
        'categoria': categoria, 'destaque': 1 if d.get('destaque') else 0,
        'imagens': imagens,
    }, None


def gravar_imagens(cur, nid, imagens):
    cur.execute('DELETE FROM noticia_imagens WHERE noticia_id=%s', (nid,))
    for i, caminho in enumerate(imagens, start=1):
        cur.execute(
            'INSERT INTO noticia_imagens (noticia_id, caminho_imagem, ordem) VALUES (%s,%s,%s)',
            (nid, caminho, i))


def limitar_destaques(cur, manter_id):
    cur.execute('SELECT id FROM noticias WHERE destaque=1 ORDER BY (id=%s) DESC, id DESC', (manter_id,))
    ids = [r['id'] for r in cur.fetchall()][MAX_DESTAQUES:]
    if ids:
        cur.execute('UPDATE noticias SET destaque=0 WHERE id IN (%s)' % ','.join(['%s'] * len(ids)), ids)


@app.route('/api/noticias', methods=['GET'])
def listar_noticias():
    user = usuario_atual()
    with db() as cur:
        cur.execute("""SELECT n.*, (SELECT COUNT(*) FROM curtidas c WHERE c.noticia_id=n.id) AS total_curtidas
                       FROM noticias n ORDER BY n.id DESC""")
        noticias = cur.fetchall()

        imagens = {}
        cur.execute('SELECT noticia_id, caminho_imagem FROM noticia_imagens ORDER BY noticia_id, ordem, id')
        for r in cur.fetchall():
            imagens.setdefault(r['noticia_id'], []).append(r['caminho_imagem'])

        comentarios = {}
        cur.execute("""SELECT c.id, c.noticia_id, c.usuario_id, c.texto, u.nome
                       FROM comentarios c JOIN usuarios u ON u.id=c.usuario_id ORDER BY c.id""")
        for r in cur.fetchall():
            comentarios.setdefault(r['noticia_id'], []).append(
                {'id': r['id'], 'userId': r['usuario_id'], 'author': r['nome'], 'text': r['texto']})

        curtidas = set()
        if user:
            cur.execute('SELECT noticia_id FROM curtidas WHERE usuario_id=%s', (user['id'],))
            curtidas = {r['noticia_id'] for r in cur.fetchall()}

    out = []
    for n in noticias:
        out.append({
            'id': n['id'],
            'title': n['titulo'],
            'category': n['categoria'],
            'description': n['descricao'],
            'content': n['conteudo'],
            'images': imagens.get(n['id'], []),
            'date': n['data_publicacao'].strftime('%d/%m/%Y') if n['data_publicacao'] else '',
            'views': n['visualizacoes'] or 0,
            'likes': n['total_curtidas'] or 0,
            'liked': n['id'] in curtidas,
            'comments': comentarios.get(n['id'], []),
            'destaque': bool(n['destaque']),
        })
    return jsonify(out)


@app.route('/api/noticias', methods=['POST'])
@exige_gestao
def criar_noticia():
    n, erro = validar_noticia(request.get_json(silent=True) or {})
    if erro:
        return jsonify({'erro': erro}), 400
    with db() as cur:
        cur.execute(
            """INSERT INTO noticias (titulo, categoria, descricao, conteudo, data_publicacao, destaque, autor_id)
               VALUES (%s,%s,%s,%s,%s,%s,%s)""",
            (n['titulo'], n['categoria'], n['descricao'], n['conteudo'], date.today(), n['destaque'], g.user['id']))
        nid = cur.lastrowid
        gravar_imagens(cur, nid, n['imagens'])
        if n['destaque']:
            limitar_destaques(cur, nid)
    return jsonify({'ok': True, 'id': nid})


@app.route('/api/noticias/<int:nid>', methods=['PUT'])
@exige_gestao
def atualizar_noticia(nid):
    n, erro = validar_noticia(request.get_json(silent=True) or {})
    if erro:
        return jsonify({'erro': erro}), 400
    with db() as cur:
        cur.execute('SELECT id FROM noticias WHERE id=%s', (nid,))
        if not cur.fetchone():
            return jsonify({'erro': 'Notícia não encontrada.'}), 404
        cur.execute('SELECT caminho_imagem FROM noticia_imagens WHERE noticia_id=%s', (nid,))
        antigas = {r['caminho_imagem'] for r in cur.fetchall()}
        cur.execute(
            """UPDATE noticias SET titulo=%s, categoria=%s, descricao=%s, conteudo=%s, destaque=%s
               WHERE id=%s""",
            (n['titulo'], n['categoria'], n['descricao'], n['conteudo'], n['destaque'], nid))
        gravar_imagens(cur, nid, n['imagens'])
        if n['destaque']:
            limitar_destaques(cur, nid)
        removidas = antigas - set(n['imagens'])
        removidas -= arquivos_em_uso(cur, removidas)
    apagar_arquivos(removidas)
    return jsonify({'ok': True})


@app.route('/api/noticias/<int:nid>', methods=['DELETE'])
@exige_gestao
def excluir_noticia(nid):
    with db() as cur:  # imagens, comentários e curtidas saem junto (ON DELETE CASCADE)
        cur.execute('SELECT caminho_imagem FROM noticia_imagens WHERE noticia_id=%s', (nid,))
        arquivos = {r['caminho_imagem'] for r in cur.fetchall()}
        cur.execute('DELETE FROM noticias WHERE id=%s', (nid,))
        arquivos -= arquivos_em_uso(cur, arquivos)
    apagar_arquivos(arquivos)
    return jsonify({'ok': True})


@app.route('/api/noticias/<int:nid>/view', methods=['POST'])
def view_noticia(nid):
    with db() as cur:
        cur.execute('UPDATE noticias SET visualizacoes = visualizacoes + 1 WHERE id=%s', (nid,))
    return jsonify({'ok': True})


# ------------------------------------------------------------------ CURTIR / COMENTAR
@app.route('/api/noticias/<int:nid>/curtir', methods=['POST'])
@exige_login
def curtir(nid):
    with db() as cur:
        cur.execute('SELECT id FROM noticias WHERE id=%s', (nid,))
        if not cur.fetchone():
            return jsonify({'erro': 'Notícia não encontrada.'}), 404
        cur.execute('SELECT id FROM curtidas WHERE noticia_id=%s AND usuario_id=%s', (nid, g.user['id']))
        ja = cur.fetchone()
        if ja:
            cur.execute('DELETE FROM curtidas WHERE id=%s', (ja['id'],))
        else:
            cur.execute('INSERT INTO curtidas (noticia_id, usuario_id) VALUES (%s,%s)', (nid, g.user['id']))
        cur.execute('SELECT COUNT(*) AS n FROM curtidas WHERE noticia_id=%s', (nid,))
        total = cur.fetchone()['n']
    return jsonify({'ok': True, 'liked': not ja, 'likes': total})


@app.route('/api/noticias/<int:nid>/comentarios', methods=['POST'])
@exige_login
def comentar(nid):
    texto = ((request.get_json(silent=True) or {}).get('text') or '').strip()
    if not texto:
        return jsonify({'erro': 'Escreva um comentário.'}), 400
    if len(texto) > 1000:
        return jsonify({'erro': 'Comentário muito longo (máx. 1000 caracteres).'}), 400
    with db() as cur:
        cur.execute('SELECT id FROM noticias WHERE id=%s', (nid,))
        if not cur.fetchone():
            return jsonify({'erro': 'Notícia não encontrada.'}), 404
        cur.execute('INSERT INTO comentarios (noticia_id, usuario_id, texto) VALUES (%s,%s,%s)',
                    (nid, g.user['id'], texto))
        cid = cur.lastrowid
    return jsonify({'ok': True, 'comment': {'id': cid, 'userId': g.user['id'],
                                            'author': g.user['nome'], 'text': texto}})


@app.route('/api/comentarios/<int:cid>', methods=['DELETE'])
@exige_login
def excluir_comentario(cid):
    with db() as cur:
        cur.execute('SELECT usuario_id FROM comentarios WHERE id=%s', (cid,))
        c = cur.fetchone()
        if not c:
            return jsonify({'erro': 'Comentário não encontrado.'}), 404
        if c['usuario_id'] != g.user['id'] and g.user['role'] not in GESTAO:
            return jsonify({'erro': 'Sem permissão.'}), 403
        cur.execute('DELETE FROM comentarios WHERE id=%s', (cid,))
    return jsonify({'ok': True})


# ------------------------------------------------------------------ USUÁRIOS (gestão)
@app.route('/api/usuarios', methods=['GET'])
@exige_gestao
def listar_usuarios():
    with db() as cur:
        cur.execute('SELECT id, nome, username, email, role FROM usuarios ORDER BY id')
        lista = cur.fetchall()
    for u in lista:
        u['tipo'] = 'gestao' if u['role'] in GESTAO else 'aluno'
    return jsonify(lista)


@app.route('/api/usuarios', methods=['POST'])
@exige_gestao
def criar_usuario():
    d = request.get_json(silent=True) or {}
    nome = (d.get('name') or '').strip()
    tipo_form = d.get('role')                      # valor do <select> do formulário
    senha = d.get('password') or ''
    ra = (d.get('ra') or '').strip()
    cpf = so_numeros(d.get('cpf'))
    username = (d.get('username') or d.get('email') or '').strip()
    hash_senha = generate_password_hash(senha)

    if not nome or len(senha) < 4:
        return jsonify({'erro': 'Informe o nome e uma senha (mín. 4 caracteres).'}), 400

    if tipo_form == 'aluno':
        if not (ra or username):
            return jsonify({'erro': 'Aluno precisa de RA (ou usuário).'}), 400
        with db() as cur:  # o RA/usuário vira o "username" de login do aluno
            cur.execute(
                "INSERT INTO usuarios (nome, username, email, senha, role) VALUES (%s,%s,%s,%s,'aluno')",
                (nome, ra or username, username or ra, hash_senha))
    elif tipo_form == 'responsavel':
        if len(cpf) != 11:
            return jsonify({'erro': 'Responsável precisa de CPF com 11 dígitos.'}), 400
        with db() as cur:  # o CPF (só números) vira o "username" de login
            cur.execute(
                "INSERT INTO usuarios (nome, username, email, senha, role) VALUES (%s,%s,%s,%s,'aluno')",
                (nome, cpf, cpf, hash_senha))
    elif tipo_form in ('gremio', 'admin'):
        if not username:
            return jsonify({'erro': 'Informe o e-mail/usuário de acesso.'}), 400
        if tipo_form == 'admin' and g.user['role'] != 'admin':
            return jsonify({'erro': 'Só um admin pode criar outro admin.'}), 403
        tabela = 'gremio' if tipo_form == 'gremio' else 'gestao'
        with db() as cur:  # quem entra pelo login da gestão fica na sua tabela...
            cur.execute('INSERT INTO `%s` (email, senha) VALUES (%%s,%%s)' % tabela, (username, hash_senha))
            u = espelhar(cur, username, tipo_form)  # ...e ganha o espelho em `usuarios`
            if u:
                cur.execute('UPDATE usuarios SET nome=%s WHERE id=%s', (nome, u['id']))
    elif tipo_form in ('professor', 'direcao', 'coordenacao'):
        return jsonify({'erro': 'As tabelas gestao e gremio só têm e-mail e senha, então por enquanto '
                                'só dá para cadastrar aluno, responsável, grêmio e admin.'}), 400
    else:
        return jsonify({'erro': 'Tipo de usuário inválido.'}), 400
    return jsonify({'ok': True})


@app.route('/api/usuarios/<int:uid>', methods=['DELETE'])
@exige_gestao
def excluir_usuario(uid):
    if uid == g.user['id']:
        return jsonify({'erro': 'Você não pode excluir a si mesmo.'}), 400
    with db() as cur:
        cur.execute('SELECT username, email, role FROM usuarios WHERE id=%s', (uid,))
        u = cur.fetchone()
        if not u:
            return jsonify({'erro': 'Usuário não encontrado.'}), 404
        if u['username'] == 'admin':
            return jsonify({'erro': 'O admin principal não pode ser excluído.'}), 400
        if u['role'] == 'admin' and g.user['role'] != 'admin':
            return jsonify({'erro': 'Só um admin pode excluir outro admin.'}), 403
        for tabela, pk, role in TABELAS_GESTAO:  # tira também da tabela de origem, senão o login volta
            if u['role'] == role:
                cur.execute('DELETE FROM `%s` WHERE email=%%s' % tabela, (u['email'] or u['username'],))
        cur.execute('DELETE FROM usuarios WHERE id=%s', (uid,))
    return jsonify({'ok': True})


# ------------------------------------------------------------------ SITE (HTML/CSS/JS) + TESTE
@app.route('/')
def home():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/<path:nome>')
def estaticos(nome):
    ext = nome.rsplit('.', 1)[-1].lower() if '.' in nome else ''
    if '/' in nome or ext not in EXT_ESTATICOS:
        abort(404)
    return send_from_directory(BASE_DIR, nome)


@app.route('/teste-banco')
def teste_banco():
    if request.remote_addr not in ('127.0.0.1', '::1'):
        abort(404)  # página de diagnóstico: só no computador onde o app roda
    try:
        info = []
        with db() as cur:
            for t in ['usuarios', 'gestao', 'gremio', 'noticias', 'noticia_imagens', 'comentarios', 'curtidas']:
                cur.execute('SELECT COUNT(*) AS n FROM `%s`' % t)
                info.append('%s=%s' % (t, cur.fetchone()['n']))
        return 'Banco OK (%s). Registros: %s' % (DB_CONFIG['database'], ' | '.join(info))
    except Error as e:
        return 'Erro: %s (%s)' % (explicar_erro_banco(e), e), 500


# ------------------------------------------------------------------ USUÁRIOS PADRÃO
# Alunos de exemplo (tabela `usuarios`). O admin fica na tabela `gestao` (veja garantir_admin).
USUARIOS_PADRAO = [
    dict(nome='João Silva', username='202600123', senha='123456'),
    dict(nome='Maria Silva', username='12345678901', senha='123456'),
]


def criar_usuarios_padrao():
    with db() as cur:
        for u in USUARIOS_PADRAO:
            cur.execute('SELECT id FROM usuarios WHERE username=%s', (u['username'],))
            if cur.fetchone():
                continue
            cur.execute(
                "INSERT INTO usuarios (nome, username, email, senha, role) VALUES (%s,%s,%s,%s,'aluno')",
                (u['nome'], u['username'], u['username'], generate_password_hash(u['senha'])))
            print('Aluno padrão criado: %s (senha inicial: %s) -> troque depois do primeiro acesso!'
                  % (u['nome'], u['senha']))


def explicar_erro_banco(e):
    n = getattr(e, 'errno', None)
    if 'auth_gssapi' in str(e) or 'plugin' in str(e).lower():
        return ('Esse usuário do MariaDB usa autenticação do Windows (GSSAPI), que o Python não suporta. '
                'Rode o arquivo criar_usuario_banco.sql no HeidiSQL e use o usuário "admin" no db_config.json.')
    if n == 1045:
        return ('Usuário ou senha do MySQL/MariaDB incorretos. Abra o arquivo db_config.json e coloque '
                'o MESMO usuário e senha que você usa para entrar no HeidiSQL.')
    if n in (2003, 2002):
        return ('O servidor MySQL/MariaDB não está respondendo. Confira se ele está ligado '
                '(o HeidiSQL conecta?) e se host/porta no db_config.json estão iguais aos do HeidiSQL.')
    if n == 1049:
        return 'O banco "%s" não existe (o app tenta criar sozinho; o usuário precisa ter permissão).' % DB_CONFIG['database']
    return 'Erro do banco: %s' % e


def garantir_estrutura():
    """Cria o banco e as tabelas que faltam (sem apagar nada), lendo o banco.sql."""
    cfg = dict(DB_CONFIG)
    nome_banco = cfg.pop('database')
    conn = mysql.connector.connect(**cfg)
    try:
        cur = conn.cursor()
        cur.execute('CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
                    % nome_banco.replace('`', ''))
        cur.execute('USE `%s`' % nome_banco.replace('`', ''))
        with open(os.path.join(BASE_DIR, 'banco.sql'), encoding='utf-8') as f:
            sql = re.sub(r'--[^\n]*', '', f.read())
        for comando in sql.split(';'):
            c = comando.strip()
            if not c.upper().startswith('CREATE TABLE'):
                continue  # ignora DROP/USE/SET/CREATE DATABASE: nada é apagado aqui
            cur.execute(re.sub(r'^CREATE TABLE\s+', 'CREATE TABLE IF NOT EXISTS ', c, flags=re.I))
        # a senha guardada como hash tem ~160 caracteres: garante que a coluna comporta
        for t in ('usuarios', 'gestao', 'gremio'):
            try:
                cur.execute('ALTER TABLE `%s` MODIFY senha VARCHAR(255) NOT NULL' % t)
            except Error as e:
                print('Aviso: não consegui ajustar a coluna senha de %s: %s' % (t, e))
        conn.commit()
    finally:
        conn.close()


def garantir_admin(resetar_senha=False):
    """Garante que existe o admin na tabela `gestao` (e-mail 'admin'). Com resetar_senha, volta para admin123.
    Depois cria o espelho em `usuarios` de todo mundo de gestao/gremio, para aparecerem na lista de usuários."""
    with db() as cur:
        cur.execute("SELECT id_gestao FROM gestao WHERE email='admin'")
        u = cur.fetchone()
        if not u:
            cur.execute('INSERT INTO gestao (email, senha) VALUES (%s,%s)',
                        ('admin', generate_password_hash('admin123')))
            print('Usuário admin criado (senha: admin123).')
        elif resetar_senha:
            cur.execute("UPDATE gestao SET senha=%s WHERE email='admin'", (generate_password_hash('admin123'),))
            print('Senha do admin redefinida para: admin123')
        for tabela, pk, role in TABELAS_GESTAO:
            cur.execute('SELECT email FROM `%s`' % tabela)
            for m in cur.fetchall():
                espelhar(cur, m['email'], role)


if __name__ == '__main__':
    try:
        garantir_estrutura()
        criar_usuarios_padrao()
        garantir_admin(resetar_senha='--reset-admin' in sys.argv)
    except Error as e:
        print('\n*** NÃO CONSEGUI CONECTAR/USAR O BANCO ***')
        print(explicar_erro_banco(e))
        print('Detalhe técnico:', e)
        print('Configuração usada: host=%s porta=%s usuário=%s banco=%s\n'
              % (DB_CONFIG['host'], DB_CONFIG['port'], DB_CONFIG['user'], DB_CONFIG['database']))
    print('LEA NEWS rodando em http://127.0.0.1:5000  (teste: /teste-banco)')
    # LEA_DEBUG=1 liga o modo de desenvolvimento (recarrega sozinho ao salvar). Deixe desligado em produção.
    app.run(debug=os.environ.get('LEA_DEBUG') == '1', port=5000)
