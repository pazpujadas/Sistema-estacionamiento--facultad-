-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.4.32-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.21.0.7344
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para estacionamiento
CREATE DATABASE IF NOT EXISTS `estacionamiento` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `estacionamiento`;

-- Volcando estructura para tabla estacionamiento.cliente
CREATE TABLE IF NOT EXISTS `cliente` (
  `id_cliente` int(3) NOT NULL,
  `nombre` varchar(30) DEFAULT NULL,
  `apellido` varchar(30) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo_electronico` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla estacionamiento.cliente: ~2 rows (aproximadamente)
INSERT INTO `cliente` (`id_cliente`, `nombre`, `apellido`, `telefono`, `correo_electronico`) VALUES
	(1, 'juan', 'perez', '1132236556', 'juanperez45@gmail.com'),
	(2, 'pablo', 'cari', '113226256', 'pablocari58@gmail.com');

-- Volcando estructura para tabla estacionamiento.estado
CREATE TABLE IF NOT EXISTS `estado` (
  `id_estado` int(2) NOT NULL,
  `descripcion` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id_estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla estacionamiento.estado: ~2 rows (aproximadamente)
INSERT INTO `estado` (`id_estado`, `descripcion`) VALUES
	(1, 'disponible'),
	(2, 'ocupado');

-- Volcando estructura para tabla estacionamiento.tarifa
CREATE TABLE IF NOT EXISTS `tarifa` (
  `id_tarifa` int(2) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `tipo_vehiculo` varchar(20) DEFAULT NULL,
  `precio_hora` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_tarifa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla estacionamiento.tarifa: ~0 rows (aproximadamente)
INSERT INTO `tarifa` (`id_tarifa`, `descripcion`, `tipo_vehiculo`, `precio_hora`) VALUES
	(1, 'tarifa auto', 'auto', 7000.02);

-- Volcando estructura para tabla estacionamiento.vehiculo
CREATE TABLE IF NOT EXISTS `vehiculo` (
  `patente` varchar(10) NOT NULL,
  `marca` varchar(30) DEFAULT NULL,
  `modelo` varchar(30) DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `id_cliente` int(3) DEFAULT NULL,
  PRIMARY KEY (`patente`),
  KEY `id_cliente` (`id_cliente`),
  CONSTRAINT `vehiculo_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla estacionamiento.vehiculo: ~0 rows (aproximadamente)
INSERT INTO `vehiculo` (`patente`, `marca`, `modelo`, `color`, `id_cliente`) VALUES
	('AB125BJ', 'toyota', 'corolla', 'verde', 1);

-- Volcando estructura para tabla estacionamiento.luagres
CREATE TABLE IF NOT EXISTS `luagres` (
  `id_lugar` int(4) NOT NULL,
  `numero_lugar` int(4) DEFAULT NULL,
  `piso` int(1) DEFAULT NULL,
  `id_estado` int(2) DEFAULT NULL,
  `patente` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id_lugar`),
  KEY `id_estado` (`id_estado`),
  KEY `patente` (`patente`),
  CONSTRAINT `luagres_ibfk_1` FOREIGN KEY (`id_estado`) REFERENCES `estado` (`id_estado`),
  CONSTRAINT `luagres_ibfk_2` FOREIGN KEY (`patente`) REFERENCES `vehiculo` (`patente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando estructura para tabla estacionamiento.pagos
CREATE TABLE IF NOT EXISTS `pagos` (
  `id_pago` int(4) NOT NULL,
  `importe` decimal(10,2) DEFAULT NULL,
  `fecha_pago` date DEFAULT NULL,
  `id_cliente` int(3) DEFAULT NULL,
  `id_tarifa` int(2) DEFAULT NULL,
  PRIMARY KEY (`id_pago`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_tarifa` (`id_tarifa`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`),
  CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`id_tarifa`) REFERENCES `tarifa` (`id_tarifa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla estacionamiento.pagos: ~0 rows (aproximadamente)

-- Volcando estructura para tabla empresa
CREATE TABLE IF NOT EXISTS `empresa` (
  `id_empresa` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(60) NOT NULL,
  `email` VARCHAR(60),
  `tamano` VARCHAR(20) NOT NULL,
  `max_empleados` INT NOT NULL,
  `cantidad_lugares` INT NOT NULL
);

-- Volcando estructura para tabla empleado.empresa
CREATE TABLE IF NOT EXISTS `empleado` (
  `id_empleado` INT AUTO_INCREMENT PRIMARY KEY,
  `id_empresa` INT NOT NULL,
  `usuario` VARCHAR(30) NOT NULL UNIQUE,
  `contrasena` VARCHAR(100) NOT NULL,
  `rol` VARCHAR(50) NOT NULL DEFAULT 'playero',
  `nombre` VARCHAR(25),
  `apellido` VARCHAR(25),
  FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id_empresa`)
);

-- Volcando estructura para tabla lugares.empresa
CREATE TABLE IF NOT EXISTS `lugar_empresa` (
  `id_lugar` INT PRIMARY KEY,
  `id_empresa` INT NOT NULL,
  FOREIGN KEY (`id_lugar`) REFERENCES `luagres`(`id_lugar`),
  FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id_empresa`)
);

-- Volcando estructura para tabla ticket.empresa
CREATE TABLE IF NOT EXISTS `ticket` (
  `num_ticket` INT AUTO_INCREMENT PRIMARY KEY,
  `patente` VARCHAR(10) NOT NULL,
  `id_lugar` INT NOT NULL,
  `id_tarifa` INT NOT NULL,
  `id_empleado_ingreso` INT NOT NULL,
  `id_empleado_cobro` INT NULL,
  `diah_entrada` DATETIME NOT NULL,
  `diah_salida` DATETIME NULL,
  `monto_total` DECIMAL(10,2) NULL,
  FOREIGN KEY (`patente`) REFERENCES `vehiculo`(`patente`),
  FOREIGN KEY (`id_lugar`) REFERENCES `luagres`(`id_lugar`),
  FOREIGN KEY (`id_tarifa`) REFERENCES `tarifa`(`id_tarifa`),
  FOREIGN KEY (`id_empleado_ingreso`) REFERENCES `empleado`(`id_empleado`),
  FOREIGN KEY (`id_empleado_cobro`) REFERENCES `empleado`(`id_empleado`)
);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
