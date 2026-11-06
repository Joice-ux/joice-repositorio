-- Rode no HeidiSQL (conectado como root): cole tudo e aperte F9.
-- Cria um usuário "admin" com senha normal (mysql_native_password), que o Python consegue usar,
-- com acesso ao seu banco lea_news_bd. NÃO cria banco novo nem mexe nas suas tabelas.
CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('admin123');
CREATE USER IF NOT EXISTS 'admin'@'127.0.0.1' IDENTIFIED VIA mysql_native_password USING PASSWORD('admin123');
GRANT ALL PRIVILEGES ON lea_news_bd.* TO 'admin'@'localhost';
GRANT ALL PRIVILEGES ON lea_news_bd.* TO 'admin'@'127.0.0.1';
FLUSH PRIVILEGES;
