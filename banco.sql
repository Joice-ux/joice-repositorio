-- LEA NEWS - Banco completo (MariaDB / MySQL)
CREATE DATABASE IF NOT EXISTS leanews CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE leanews;

DROP TABLE IF EXISTS comentarios;
DROP TABLE IF EXISTS curtidas;
DROP TABLE IF EXISTS noticia_midias;
DROP TABLE IF EXISTS noticias;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  tipo ENUM('aluno', 'responsavel', 'professor', 'gestao') NOT NULL,
  ra VARCHAR(30) NULL UNIQUE,
  cpf VARCHAR(11) NULL UNIQUE,
  username VARCHAR(50) NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  role ENUM('aluno', 'professor', 'gremio', 'direcao', 'coordenacao', 'admin') DEFAULT 'aluno',
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE noticias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  categoria ENUM('Tecnologia', 'Esporte', 'Eventos', 'Avisos') NOT NULL,
  descricao TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  data_publicacao DATE NOT NULL,
  visualizacoes INT DEFAULT 0,
  curtidas INT DEFAULT 0,
  destaque TINYINT(1) DEFAULT 0,
  autor_id INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE noticia_midias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  noticia_id INT NOT NULL,
  caminho VARCHAR(500) NOT NULL,
  tipo ENUM('imagem', 'video') DEFAULT 'imagem',
  ordem INT DEFAULT 1,
  FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE
);

CREATE TABLE curtidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  noticia_id INT NOT NULL,
  usuario_id INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_curtida (noticia_id, usuario_id),
  FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  noticia_id INT NOT NULL,
  usuario_id INT NOT NULL,
  texto TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

INSERT INTO usuarios (nome, tipo, username, senha, role) VALUES
('Administrador', 'gestao', 'admin', 'admin123', 'admin');

INSERT INTO usuarios (nome, tipo, ra, senha, role) VALUES
('João Silva', 'aluno', '202600123', '123456', 'aluno');

INSERT INTO usuarios (nome, tipo, cpf, senha, role) VALUES
('Maria Silva', 'responsavel', '12345678901', '123456', 'aluno');

INSERT INTO usuarios (nome, tipo, username, senha, role) VALUES
('Prof. Carlos', '