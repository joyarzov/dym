CREATE DATABASE IF NOT EXISTS dym_taller CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dym_taller;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    rol ENUM('admin','superusuario') DEFAULT 'admin',
    activo TINYINT(1) DEFAULT 1,
    ultimo_acceso DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(12) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(150),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(12) UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    nombre_contacto VARCHAR(150),
    telefono VARCHAR(20),
    email VARCHAR(150),
    direccion TEXT,
    rubro VARCHAR(100),
    activo TINYINT(1) DEFAULT 1,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    patente VARCHAR(10) NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio INT,
    color VARCHAR(30),
    fecha_ingreso DATE NOT NULL,
    fecha_estimada_entrega DATE,
    fecha_entrega_real DATE,
    estado ENUM('recibido','presupuesto','aprobado','desabolladura','pintura','control_calidad','listo','entregado') DEFAULT 'recibido',
    tiene_seguro TINYINT(1) DEFAULT 0,
    aseguradora VARCHAR(150),
    numero_poliza VARCHAR(50),
    numero_siniestro VARCHAR(50),
    nombre_ajustador VARCHAR(150),
    telefono_ajustador VARCHAR(20),
    presupuesto_estimado DECIMAL(12,0) DEFAULT 0,
    requiere_anticipo TINYINT(1) DEFAULT 0,
    porcentaje_anticipo DECIMAL(5,2) DEFAULT 50.00,
    monto_anticipo DECIMAL(12,0) DEFAULT 0,
    anticipo_pagado TINYINT(1) DEFAULT 0,
    diagnostico TEXT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS vehiculo_fotos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT NOT NULL,
    ruta_foto VARCHAR(500) NOT NULL,
    descripcion VARCHAR(200),
    tipo ENUM('ingreso','proceso','entrega') DEFAULT 'ingreso',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS piezas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT NOT NULL,
    proveedor_id INT,
    nombre_pieza VARCHAR(200) NOT NULL,
    tipo_trabajo ENUM('reparacion','reemplazo','pintura','desabolladura') NOT NULL,
    descripcion TEXT,
    cantidad INT DEFAULT 1,
    costo_unitario DECIMAL(12,0) DEFAULT 0,
    costo_total DECIMAL(12,0) DEFAULT 0,
    estado ENUM('pendiente','en_proceso','completada') DEFAULT 'pendiente',
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT NOT NULL,
    monto DECIMAL(12,0) NOT NULL,
    metodo_pago ENUM('transferencia','tarjeta_debito','tarjeta_credito') NOT NULL,
    tipo ENUM('anticipo','abono','pago_final') NOT NULL,
    referencia VARCHAR(100),
    notas TEXT,
    fecha_pago DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mano_obra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT NOT NULL,
    descripcion VARCHAR(250) NOT NULL,
    valor DECIMAL(12,0) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS configuracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor VARCHAR(500),
    descripcion VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS accesos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    username VARCHAR(50),
    nombre VARCHAR(150),
    ip VARCHAR(64),
    user_agent VARCHAR(300),
    exito TINYINT(1) DEFAULT 1,
    motivo VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estado_historial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT NOT NULL,
    estado ENUM('recibido','presupuesto','aprobado','desabolladura','pintura','control_calidad','listo','entregado') NOT NULL,
    usuario VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cotizaciones_enviadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT NOT NULL,
    patente VARCHAR(10),
    cliente_nombre VARCHAR(150),
    destinatario VARCHAR(200) NOT NULL,
    asunto VARCHAR(250),
    cuerpo TEXT,
    total DECIMAL(12,0) DEFAULT 0,
    enviado_por VARCHAR(150),
    estado ENUM('enviado','error') DEFAULT 'enviado',
    error_detalle VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

-- Migración para bases de datos ya existentes (no-op en instalación nueva)
ALTER TABLE usuarios MODIFY COLUMN rol ENUM('admin','superusuario') NOT NULL DEFAULT 'admin';

INSERT IGNORE INTO usuarios (username, password, nombre_completo, email, rol)
VALUES ('admin', '$2b$12$4GyExnbA5G8G.F6EKFYNXOgYA2CJfYy/paAyLQHjRC/7lU0RVJsRK', 'Administrador DyM', 'admin@dym.cl', 'admin');

-- Superusuario: puede crear y administrar usuarios
INSERT IGNORE INTO usuarios (username, password, nombre_completo, email, rol)
VALUES ('joyarzo', '$2b$12$F5V7xSU2.u5ITQDylLmzRuDxxQA8Ox7tQP1PwX1vliUtECFcnlf2O', 'José Oyarzo', 'jose.oyarzo.vera@gmail.com', 'superusuario');

INSERT IGNORE INTO configuracion (clave, valor, descripcion) VALUES
('semaforo_verde_min', '8', 'Dias minimos para semaforo verde'),
('semaforo_amarillo_min', '4', 'Dias minimos para semaforo amarillo'),
('semaforo_naranja_min', '1', 'Dias minimos para semaforo naranja'),
('semaforo_activo', '1', 'Semaforo activo'),
('empresa_nombre', 'DyM Taller', 'Nombre empresa'),
('monto_requiere_anticipo', '1300000', 'Monto minimo que requiere anticipo'),
('porcentaje_anticipo', '50', 'Porcentaje de anticipo');
