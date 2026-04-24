<?php
$servidor = "db";
$usuario = "root";
$password = "root123";
$basedatos = "verde_vida";

// 1. Conexión inicial
$conex = mysqli_connect($servidor, $usuario, $password, $basedatos);

if (!$conex) {
    die("❌ Error de conexión: " . mysqli_connect_error());
}

// 2. Script para crear la tabla de usuarios automáticamente si no existe
$tabla_usuarios = "CREATE TABLE IF NOT EXISTS usuarios (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    contraseña VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'jardinero',
    fecha_contratacion DATE,
    hora DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// Ejecutar la creación
mysqli_query($conex, $tabla_usuarios);

// 3. Crear tabla de especies (opcional por ahora, pero útil)
$tabla_especies = "CREATE TABLE IF NOT EXISTS especies (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    nombre_comun VARCHAR(100) NOT NULL,
    nombre_cientifico VARCHAR(100),
    familia VARCHAR(100),
    origen VARCHAR(100),
    tipo_planta VARCHAR(50),
    descripcion TEXT,
    dificultad_cultivo VARCHAR(50),
    hora DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

mysqli_query($conex, $tabla_especies);

mysqli_set_charset($conex, "utf8");
?>
