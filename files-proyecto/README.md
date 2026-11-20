# ParkAdmin

Sistema web para administrar estacionamientos: ver qué lugares están libres u ocupados, por qué cliente y vehículo, calcular la tarifa, imprimir el ticket y registrar qué hizo cada empleado.

**Tecnologías:** React (Vite), Node.js + Express, MySQL.

## Cómo correrlo en tu computadora

**Necesitás:** [Node.js](https://nodejs.org) 18 o superior y [XAMPP](https://www.apachefriends.org) (o cualquier MySQL/MariaDB).

1. **Prender MySQL.** En XAMPP, botón *Start* en la fila de MySQL.
2. **Crear la base.** Importá el archivo `database/estacionamiento.sql`:
   - con phpMyAdmin (`http://localhost/phpmyadmin`): pestaña *Importar*, elegir el archivo y *Importar*; o
   - con DBeaver: abrir el archivo y ejecutarlo completo (Alt + X).
   El archivo crea la base `estacionamiento` con todas las tablas.
3. **Instalar.** En una terminal, dentro de esta carpeta: `npm install` (instala también `server` y `client`).
4. **Iniciar.** `npm start` (levanta la API en el puerto 3001 y la web en el 5173).
5. **Abrir** `http://localhost:5173`.

## Primer uso

1. Entrá a **Tus datos** y completá *Creá tu cuenta* (empresa, tamaño, cantidad de lugares, usuario y contraseña).
2. Se abre **Administrar**: tocá un lugar libre para registrar un ingreso, y uno ocupado para ver los datos y cobrar.
3. Con el usuario administrador podés agregar empleados desde *Agregar empleado*.

## Si algo falla

- **`ECONNREFUSED` o "Access denied" en la terminal:** MySQL está apagado, o tiene usuario/contraseña distintos. Por defecto se usa `root` sin contraseña (XAMPP). Para cambiarlo, iniciá con las variables `DB_USER`, `DB_PASS` y `DB_HOST`; por ejemplo, en Mac/Linux: `DB_PASS=tuclave npm start`.
- **"Unknown database 'estacionamiento'":** falta el paso 2.
- **La web no carga:** revisá que `npm start` siga corriendo y entrá exactamente a la dirección que muestra la terminal.
- **Puertos ocupados:** la API usa el 3001 y la web el 5173.

## Estructura

- `database/estacionamiento.sql`: base de datos completa.
- `server/`: API (Node + Express + mysql2).
- `client/`: interfaz (React + Vite). Las páginas están en `client/src/pages/`.
