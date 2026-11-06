-- LEA NEWS - Banco completo (MariaDB / MySQL)
-- Execute este arquivo inteiro no HeidiSQL (Arquivo > Executar arquivo SQL).
-- ATENÇÃO: apaga e recria as tabelas. Os usuários padrão (admin, aluno, responsável)
-- são criados pelo app.py na primeira vez que ele inicia (com senha criptografada).

CREATE DATABASE IF NOT EXISTS leanews CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE leanews;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS comentarios;
DROP TABLE IF EXISTS curtidas;
DROP TABLE IF EXISTS noticia_midias;
DROP TABLE IF EXISTS noticia_imagens;
DROP TABLE IF EXISTS noticias;
DROP TABLE IF EXISTS gremio;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  tipo ENUM('aluno', 'responsavel', 'professor', 'gestao') NOT NULL,
  ra VARCHAR(30) NULL UNIQUE,
  cpf VARCHAR(11) NULL UNIQUE,
  username VARCHAR(50) NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,          -- guarda o HASH da senha, nunca a senha pura
  role ENUM('aluno', 'professor', 'gremio', 'direcao', 'coordenacao', 'admin') NOT NULL DEFAULT 'aluno',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE noticias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  categoria ENUM('Tecnologia', 'Esporte', 'Eventos', 'Avisos') NOT NULL,
  descricao TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  data_publicacao DATE NOT NULL,
  visualizacoes INT NOT NULL DEFAULT 0,
  destaque TINYINT(1) NOT NULL DEFAULT 0,
  autor_id INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Guarda só o CAMINHO do arquivo (ex.: /uploads/abc123.jpg); o arquivo fica na pasta uploads/
CREATE TABLE noticia_imagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  noticia_id INT NOT NULL,
  caminho_imagem VARCHAR(500) NOT NULL,
  ordem INT NOT NULL DEFAULT 1,
  FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE curtidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  noticia_id INT NOT NULL,
  usuario_id INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_curtida (noticia_id, usuario_id),
  FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  noticia_id INT NOT NULL,
  usuario_id INT NOT NULL,
  texto TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Membros do grêmio: entram na Área de Gestão (login-gestao.html) com username + senha.
-- Pode inserir à mão no HeidiSQL (senha em texto puro é convertida em hash no primeiro login).
CREATE TABLE gremio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  cargo VARCHAR(80) NULL,               -- ex.: Presidente, Secretário
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
