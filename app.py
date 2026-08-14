from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector


# Criação da aplicação Flask
app = Flask(_name_)

# Permite que o JavaScript do navegador consiga acessar o Flask
CORS(app)


# ================= CONEXÃO COM O BANCO =================

def conectar_banco():

    # Função responsável por abrir conexão com o MySQL
    return mysql.connector.connect(

        # Servidor do banco de dados
        host="localhost",

        # Usuário do MySQL
        user="root",

        # Senha do MySQL
        password="lea",

        # Nome do banco utilizado
        database="banco de dados"
    )


# ================= LOGIN DO GRÊMIO =================

@app.route('/login', methods=['POST'])
def login():

    # Recebe os dados enviados pelo JavaScript
    dados = request.get_json()

    # Pega o email enviado pelo usuário
    email_recebido = dados.get('email')

    # Pega a senha enviada pelo usuário
    senha_recebida = dados.get('senha')

    conexao = None
    cursor = None

    try:

        # Conecta ao banco de dados
        conexao = conectar_banco()

        # Cria um cursor que retorna os dados em formato de dicionário
        cursor = conexao.cursor(dictionary=True)

        # Procura um membro do grêmio com o mesmo email e senha
        cursor.execute(
            """
            SELECT id_gremio, email
            FROM gremio
            WHERE email = %s AND senha = %s
            """,
            (email_recebido, senha_recebida)
        )

        usuario_encontrado = cursor.fetchone()

        if usuario_encontrado:

            return jsonify({

                "sucesso": True,

                "mensagem": f"Bem-vindo, {usuario_encontrado['email']}!",

                "usuario_id": usuario_encontrado['id_gremio']

            }), 200

        else:

            return jsonify({

                "sucesso": False,

                "mensagem": "Email ou senha incorretos."

            }), 401

    except mysql.connector.Error as erro:

        print(f"Erro no banco: {erro}")

        return jsonify({

            "sucesso": False,

            "mensagem": "Erro interno no servidor."

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ================= CADASTRO DO GRÊMIO =================

@app.route('/cadastro', methods=['POST'])
def cadastro():

    # Recebe os dados enviados pelo formulário
    dados = request.get_json()

    # Separa email e senha recebidos
    email = dados.get('email')
    senha = dados.get('senha')

    # Verifica se os campos foram preenchidos
    if not email or not senha:

        return jsonify({

            "sucesso": False,

            "mensagem": "Email e senha são obrigatórios."

        }), 400

    conexao = None
    cursor = None

    try:

        # Abre conexão com o banco
        conexao = conectar_banco()

        # Cria cursor para executar comandos SQL
        cursor = conexao.cursor()

        # Insere um novo membro do grêmio
        cursor.execute(

            """
            INSERT INTO gremio (email, senha)
            VALUES (%s, %s)
            """,

            (email, senha)

        )

        # Confirma a alteração no banco
        conexao.commit()

        return jsonify({

            "sucesso": True,

            "mensagem": "Cadastro realizado com sucesso!"

        }), 201

    except mysql.connector.Error as erro:

        print(f"Erro no banco: {erro}")

        return jsonify({

            "sucesso": False,

            "mensagem": "Erro ao cadastrar usuário."

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ================= LOGIN DA GESTÃO =================

@app.route('/login_gestao', methods=['POST'])
def login_gestao():

    # Recebe os dados enviados pelo JavaScript
    dados = request.get_json()

    email_recebido = dados.get('email')
    senha_recebida = dados.get('senha')

    conexao = None
    cursor = None

    try:

        conexao = conectar_banco()

        cursor = conexao.cursor(dictionary=True)

        # Procura o gestor no banco
        cursor.execute(

            """
            SELECT id_gestor, email
            FROM gestão
            WHERE email = %s AND senha = %s
            """,

            (email_recebido, senha_recebida)

        )

        gestor_encontrado = cursor.fetchone()

        if gestor_encontrado:

            return jsonify({

                "sucesso": True,

                "mensagem": f"Bem-vindo, {gestor_encontrado['email']}!",

                "gestor_id": gestor_encontrado['id_gestor']

            }), 200

        else:

            return jsonify({

                "sucesso": False,

                "mensagem": "Email ou senha inválidos."

            }), 401

    except mysql.connector.Error as erro:

        print(f"Erro no banco: {erro}")

        return jsonify({

            "sucesso": False,

            "mensagem": "Erro interno no servidor."

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ================= INICIAR SERVIDOR =================

if _name_ == "_main_":

    # Inicia o servidor Flask na porta 5000
    app.run(
        host="localhost",
        port=5000,
        debug=True
    )