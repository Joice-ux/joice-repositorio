# -*- coding: utf-8 -*-
"""LEA NEWS - API adaptada ao banco HeidiSQL: `lea news bd`"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import re
from datetime import date

app = Flask(__name__)
app.secret_key = 'lea_news_chave_secreta_2026'
CORS(app, resources={r"/*": {"origins": "*"}})

GESTAO = ['admin', 'gremio', 'direcao', 'coordenacao']

def conectar_banco():

    # Função responsável por abrir conexão com o MySQL
    return mysql.connector.connect(

        # Servidor do banco de dados
        host ="localhost",

        # Usuário do MySQL
        user="root",

        # Senha do MySQL
        password="lea",

        # Nome do banco utilizado
        databa="banco de dados"
    )

# === AJUSTE AQUI se usuário/senha do MySQL forem outros ===
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'lea',           # coloque a senha do root se tiver
    'database': 'lea_news_bd' # nome EXATO do HeidiSQL
}


def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def so_numeros(v):
    return re.sub(r'\D', '', str(v or ''))


def user_public(u):
    if not u:
        return None
    return {
        'id': u.get('id'),
        'name': u.get('nome') or u.get('name') or 'Usuario',
        'username': u.get('username') or u.get('usuario') or u.get('ra') or u.get('cpf'),
        'role': u.get('role') or u.get('perfil') or u.get('tipo') or 'aluno',
        'tipo': u.get('tipo') or 'aluno',
        'ra': u.get('ra'),
        'cpf': u.get('cpf')
    }


def colunas_tabela(cur, tabela):
    cur.execute('SHOW COLUMNS FROM `%s`' % tabela)
    return [r[0] if not isinstance(r, dict) else r.get('Field') for r in cur.fetchall()]


@app.route('/teste-banco')
def teste_banco():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SHOW TABLES')
        tabelas = [r[0] for r in cur.fetchall()]
        info = []
        for t in tabelas:
            cur.execute('SELECT COUNT(*) FROM `%s`' % t)
            n = cur.fetchone()[0]
            info.append('%s=%s' % (t, n))
        cur.close()
        conn.close()
        return 'Banco OK (`lea news bd`). Tabelas: ' + ' | '.join(info)
    except Error as e:
        return 'Erro: %s' % e


@app.route('/api/estrutura')
def estrutura():
    """Mostra colunas das tabelas principais (útil para ajustar o código)."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        out = {}
        for t in ['noticias', 'usuarios', 'noticia_imagens', 'comentarios', 'curtidas']:
            try:
                cur.execute('SHOW COLUMNS FROM `%s`' % t)
                out[t] = [r[0] for r in cur.fetchall()]
            except Error as e:
                out[t] = str(e)
        cur.close()
        conn.close()
        return jsonify(out)
    except Error as e:
        return jsonify({'erro': str(e)}), 500


def pick(row, *names, default=None):
    if not row:
        return default
    for n in names:
        if n in row and row[n] is not None:
            return row[n]
    return default


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identificador = (data.get('identificador') or data.get('username') or '').strip()
    senha = data.get('senha') or data.get('password') or ''
    if not identificador or not senha:
        return jsonify({'erro': 'Preencha identificador e senha.'}), 400

    id_num = so_numeros(identificador)
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    user = None
    try:
        # tenta colunas comuns
        for sql, params in [
            ('SELECT * FROM usuarios WHERE cpf=%s AND senha=%s LIMIT 1', (id_num, senha)),
            ('SELECT * FROM usuarios WHERE ra=%s AND senha=%s LIMIT 1', (identificador, senha)),
            ('SELECT * FROM usuarios WHERE username=%s AND senha=%s LIMIT 1', (identificador, senha)),
            ('SELECT * FROM usuarios WHERE usuario=%s AND senha=%s LIMIT 1', (identificador, senha)),
            ('SELECT * FROM usuarios WHERE email=%s AND senha=%s LIMIT 1', (identificador, senha)),
        ]:
            if user:
                break
            if id_num and len(id_num) != 11 and 'cpf' in sql:
                continue
            try:
                cur.execute(sql, params)
                user = cur.fetchone()
            except Error:
                continue
    finally:
        cur.close()
        conn.close()

    if not user:
        return jsonify({'erro': 'Usuário ou senha incorretos.'}), 401
    return jsonify({'ok': True, 'user': user_public(user)})


@app.route('/api/login-gestao', methods=['POST'])
def login_gestao():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    senha = data.get('senha') or data.get('password') or ''
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    user = None
    try:
        for sql in [
            'SELECT * FROM usuarios WHERE username=%s AND senha=%s LIMIT 1',
            'SELECT * FROM usuarios WHERE usuario=%s AND senha=%s LIMIT 1',
        ]:
            try:
                cur.execute(sql, (username, senha))
                user = cur.fetchone()
                if user:
                    break
            except Error:
                continue
    finally:
        cur.close()
        conn.close()

    if not user:
        return jsonify({'erro': 'Sem permissão / usuário inválido.'}), 401
    role = (user.get('role') or user.get('perfil') or user.get('tipo') or '').lower()
    if role and role not in GESTAO and role not in ('gestao', 'administrador'):
        # ainda permite se username for admin
        if (user.get('username') or user.get('usuario') or '') != 'admin':
            return jsonify({'erro': 'Sem permissão para a Área Restrita.'}), 401
    return jsonify({'ok': True, 'user': user_public(user)})


@app.route('/api/noticias', methods=['GET'])
def listar_noticias():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute('SELECT * FROM noticias ORDER BY id DESC')
        rows = cur.fetchall()
    except Error as e:
        cur.close()
        conn.close()
        return jsonify({'erro': str(e)}), 500

    result = []
    for r in rows:
        nid = r.get('id')
        # imagens
        midias = []
        try:
            cur.execute(
                'SELECT caminho_imagem FROM noticia_imagens WHERE noticia_id=%s ORDER BY ordem, id',
                (nid,)
            )
            midias = [x['caminho_imagem'] for x in cur.fetchall() if x.get('caminho_imagem')]
        except Error:
            try:
                cur.execute(
                    'SELECT caminho FROM noticia_imagens WHERE noticia_id=%s ORDER BY id',
                    (nid,)
                )
                midias = [x.get('caminho') for x in cur.fetchall()]
            except Error:
                midias = []

        titulo = pick(r, 'titulo', 'title', default='')
        categoria = pick(r, 'categoria', 'category', default='Avisos')
        descricao = pick(r, 'descricao', 'description', default='')
        conteudo = pick(r, 'conteudo', 'content', 'texto', default='')
        data = pick(r, 'data_publicacao', 'data', 'created_at', default='')
        if hasattr(data, 'strftime'):
            data = data.strftime('%d/%m/%Y')
        views = pick(r, 'visualizacoes', 'views', default=0) or 0
        likes = pick(r, 'curtidas', 'likes', default=0) or 0
        destaque = bool(pick(r, 'destaque', 'featured', default=0))

        comments = []
        try:
            cur.execute(
                'SELECT * FROM comentarios WHERE noticia_id=%s ORDER BY id',
                (nid,)
            )
            for c in cur.fetchall():
                comments.append({
                    'author': pick(c, 'autor', 'nome', 'usuario', default='Anon'),
                    'text': pick(c, 'texto', 'comentario', 'text', default='')
                })
        except Error:
            pass

        result.append({
            'id': nid,
            'title': titulo,
            'category': categoria,
            'description': descricao,
            'content': conteudo,
            'images': midias,
            'image': midias[0] if midias else '',
            'date': data or '',
            'views': views,
            'likes': likes,
            'likedBy': [],
            'comments': comments,
            'destaque': destaque
        })
    cur.close()
    conn.close()
    return jsonify(result)


@app.route('/api/noticias', methods=['POST'])
def criar_noticia():
    data = request.get_json() or {}
    titulo = (data.get('titulo') or data.get('title') or '').strip()
    categoria = data.get('categoria') or data.get('category') or 'Avisos'
    descricao = (data.get('descricao') or data.get('description') or '').strip()
    conteudo = (data.get('conteudo') or data.get('content') or '').strip()
    destaque = 1 if data.get('destaque') else 0
    images = data.get('images') or []
    if data.get('image') and data.get('image') not in images:
        images = [data['image']] + list(images)

    if not titulo or not descricao or not conteudo:
        return jsonify({'erro': 'Preencha título, descrição e conteúdo.'}), 400

    conn = get_connection()
    cur = conn.cursor()
    try:
        # descobre colunas existentes
        cur.execute('SHOW COLUMNS FROM noticias')
        cols = [r[0] for r in cur.fetchall()]

        fields = []
        values = []
        mapping = [
            (('titulo', 'title'), titulo),
            (('categoria', 'category'), categoria),
            (('descricao', 'description'), descricao),
            (('conteudo', 'content', 'texto'), conteudo),
            (('data_publicacao', 'data'), date.today()),
            (('destaque',), destaque),
            (('visualizacoes', 'views'), 0),
            (('curtidas', 'likes'), 0),
        ]
        for names, val in mapping:
            for n in names:
                if n in cols:
                    fields.append(n)
                    values.append(val)
                    break

        placeholders = ','.join(['%s'] * len(fields))
        sql = 'INSERT INTO noticias (%s) VALUES (%s)' % (','.join(fields), placeholders)
        cur.execute(sql, values)
        nid = cur.lastrowid

        # imagens
        cur.execute('SHOW COLUMNS FROM noticia_imagens')
        img_cols = [r[0] for r in cur.fetchall()]
        caminho_col = 'caminho_imagem' if 'caminho_imagem' in img_cols else (
            'caminho' if 'caminho' in img_cols else None
        )
        if caminho_col:
            for i, src in enumerate(images):
                if not src:
                    continue
                if 'ordem' in img_cols:
                    cur.execute(
                        'INSERT INTO noticia_imagens (noticia_id, %s, ordem) VALUES (%%s,%%s,%%s)' % caminho_col,
                        (nid, src, i + 1)
                    )
                else:
                    cur.execute(
                        'INSERT INTO noticia_imagens (noticia_id, %s) VALUES (%%s,%%s)' % caminho_col,
                        (nid, src)
                    )

        # limite de 5 destaques
        if destaque and 'destaque' in cols:
            cur.execute('SELECT id FROM noticias WHERE destaque=1 ORDER BY id DESC')
            ids = [r[0] for r in cur.fetchall()]
            for old_id in ids[5:]:
                cur.execute('UPDATE noticias SET destaque=0 WHERE id=%s', (old_id,))

        conn.commit()
        return jsonify({'ok': True, 'id': nid})
    except Error as e:
        conn.rollback()
        return jsonify({'erro': str(e)}), 400
    finally:
        cur.close()
        conn.close()


@app.route('/api/noticias/<int:nid>', methods=['PUT'])
def atualizar_noticia(nid):
    data = request.get_json() or {}
    titulo = (data.get('titulo') or data.get('title') or '').strip()
    categoria = data.get('categoria') or data.get('category') or 'Avisos'
    descricao = (data.get('descricao') or data.get('description') or '').strip()
    conteudo = (data.get('conteudo') or data.get('content') or '').strip()
    destaque = 1 if data.get('destaque') else 0
    images = data.get('images') or []

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute('SHOW COLUMNS FROM noticias')
        cols = [r[0] for r in cur.fetchall()]
        sets = []
        vals = []
        for names, val in [
            (('titulo', 'title'), titulo),
            (('categoria', 'category'), categoria),
            (('descricao', 'description'), descricao),
            (('conteudo', 'content', 'texto'), conteudo),
            (('destaque',), destaque),
        ]:
            for n in names:
                if n in cols:
                    sets.append('%s=%%s' % n)
                    vals.append(val)
                    break
        vals.append(nid)
        cur.execute('UPDATE noticias SET %s WHERE id=%%s' % ','.join(sets), vals)

        cur.execute('DELETE FROM noticia_imagens WHERE noticia_id=%s', (nid,))
        cur.execute('SHOW COLUMNS FROM noticia_imagens')
        img_cols = [r[0] for r in cur.fetchall()]
        caminho_col = 'caminho_imagem' if 'caminho_imagem' in img_cols else 'caminho'
        if caminho_col in img_cols:
            for i, src in enumerate(images):
                if not src:
                    continue
                if 'ordem' in img_cols:
                    cur.execute(
                        'INSERT INTO noticia_imagens (noticia_id, %s, ordem) VALUES (%%s,%%s,%%s)' % caminho_col,
                        (nid, src, i + 1)
                    )
                else:
                    cur.execute(
                        'INSERT INTO noticia_imagens (noticia_id, %s) VALUES (%%s,%%s)' % caminho_col,
                        (nid, src)
                    )
        conn.commit()
        return jsonify({'ok': True})
    except Error as e:
        conn.rollback()
        return jsonify({'erro': str(e)}), 400
    finally:
        cur.close()
        conn.close()


@app.route('/api/noticias/<int:nid>', methods=['DELETE'])
def excluir_noticia(nid):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute('DELETE FROM noticia_imagens WHERE noticia_id=%s', (nid,))
        try:
            cur.execute('DELETE FROM comentarios WHERE noticia_id=%s', (nid,))
        except Error:
            pass
        try:
            cur.execute('DELETE FROM curtidas WHERE noticia_id=%s', (nid,))
        except Error:
            pass
        cur.execute('DELETE FROM noticias WHERE id=%s', (nid,))
        conn.commit()
        return jsonify({'ok': True})
    except Error as e:
        return jsonify({'erro': str(e)}), 400
    finally:
        cur.close()
        conn.close()


@app.route('/api/noticias/<int:nid>/view', methods=['POST'])
def view_noticia(nid):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute('SHOW COLUMNS FROM noticias')
        cols = [r[0] for r in cur.fetchall()]
        if 'visualizacoes' in cols:
            cur.execute('UPDATE noticias SET visualizacoes = visualizacoes + 1 WHERE id=%s', (nid,))
        elif 'views' in cols:
            cur.execute('UPDATE noticias SET views = views + 1 WHERE id=%s', (nid,))
        conn.commit()
    except Error:
        pass
    finally:
        cur.close()
        conn.close()
    return jsonify({'ok': True})


if __name__ == '__main__':
    print('API LEA NEWS -> banco: lea news bd')
    print('Teste: http://127.0.0.1:5000/teste-banco')
    print('Estrutura: http://127.0.0.1:5000/api/estrutura')
    app.run(debug=True, port=5000)