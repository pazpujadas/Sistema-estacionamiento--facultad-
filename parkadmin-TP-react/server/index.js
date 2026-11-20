import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'parkadmin-dev';
// XAMPP: usuario root sin contraseña
const db = mysql.createPool({ host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '', database: 'estacionamiento', dateStrings: true });
const MAX = { '2-10': 10, '10-100': 100, '100-1000': 1000, '+1000': 2000 };

const app = express();
app.use(cors(), express.json());

const bad = (m, s = 400) => Object.assign(new Error(m), { status: s });
const wrap = f => (req, res) => f(req, res).catch(e => {
  console.error(e);
  res.status(e.status || 500).json({ error: e.code === 'ER_DUP_ENTRY' ? 'Ese nombre de usuario ya existe' : e.message });
});
const auth = (req, res, next) => {
  try { req.u = jwt.verify((req.headers.authorization || '').slice(7), SECRET); next(); }
  catch { res.status(401).json({ error: 'Sesión inválida' }); }
};
const nextId = async (c, t, col) => (await c.query(`SELECT COALESCE(MAX(${col}),0)+1 n FROM ${t}`))[0][0].n;
async function tx(fn) {
  const c = await db.getConnection();
  try { await c.beginTransaction(); const r = await fn(c); await c.commit(); return r; }
  catch (e) { await c.rollback(); throw e; } finally { c.release(); }
}

// Crear cuenta: empresa + administrador + sus lugares
app.post('/api/registro', wrap(async (req, res) => {
  const { nombre, apellido, empresa, tamano, email, lugares, usuario, contrasena } = req.body;
  const n = parseInt(lugares);
  if (!nombre || !apellido || !empresa || !MAX[tamano] || !usuario || !contrasena || !(n > 0 && n <= 2000))
    throw bad('Completá todos los campos (lugares: de 1 a 2000)');
  const hash = await bcrypt.hash(contrasena, 10);
  await tx(async c => {
    const [r] = await c.query('INSERT INTO empresa (nombre,email,tamano,max_empleados,cantidad_lugares) VALUES (?,?,?,?,?)', [empresa, email, tamano, MAX[tamano], n]);
    await c.query("INSERT INTO empleado (id_empresa,usuario,contrasena,rol,nombre,apellido) VALUES (?,?,?,'administrador',?,?)", [r.insertId, usuario, hash, nombre, apellido]);
    const base = await nextId(c, 'luagres', 'id_lugar');
    const rows = Array.from({ length: n }, (_, i) => [base + i, i + 1, 1, 1]); // id, número, piso, estado libre
    await c.query('INSERT INTO luagres (id_lugar,numero_lugar,piso,id_estado) VALUES ?', [rows]);
    await c.query('INSERT INTO lugar_empresa (id_lugar,id_empresa) VALUES ?', [rows.map(x => [x[0], r.insertId])]);
  });
  res.json({ ok: true });
}));

app.post('/api/login', wrap(async (req, res) => {
  const [[u]] = await db.query('SELECT e.*, m.nombre AS empresa FROM empleado e JOIN empresa m ON m.id_empresa=e.id_empresa WHERE e.usuario=?', [req.body.usuario]);
  if (!u || !(await bcrypt.compare(req.body.contrasena || '', u.contrasena))) throw bad('Usuario o contraseña incorrectos', 401);
  res.json({ token: jwt.sign({ id: u.id_empleado, emp: u.id_empresa, rol: u.rol }, SECRET, { expiresIn: '12h' }),
    usuario: { nombre: u.nombre, apellido: u.apellido, rol: u.rol, empresa: u.empresa } });
}));

// Todo lo que necesita la pantalla de gestión
app.get('/api/panel', auth, wrap(async (req, res) => {
  const e = req.u.emp;
  const [[empresa]] = await db.query('SELECT nombre,tamano,max_empleados,cantidad_lugares FROM empresa WHERE id_empresa=?', [e]);
  const [lugares] = await db.query(`SELECT l.id_lugar, l.numero_lugar, l.id_estado, l.patente, v.marca, v.modelo, v.color,
      c.nombre, c.apellido, c.telefono, c.correo_electronico AS correo, t.num_ticket, t.diah_entrada
    FROM lugar_empresa le JOIN luagres l ON l.id_lugar=le.id_lugar
    LEFT JOIN vehiculo v ON v.patente=l.patente LEFT JOIN cliente c ON c.id_cliente=v.id_cliente
    LEFT JOIN ticket t ON t.id_lugar=l.id_lugar AND t.diah_salida IS NULL
    WHERE le.id_empresa=? ORDER BY l.numero_lugar`, [e]);
  const [empleados] = await db.query('SELECT id_empleado,usuario,rol,nombre,apellido FROM empleado WHERE id_empresa=?', [e]);
  const [tarifas] = await db.query('SELECT id_tarifa,descripcion,tipo_vehiculo,precio_hora FROM tarifa');
  const [actividad] = await db.query(`SELECT t.num_ticket, t.patente, t.diah_entrada, t.diah_salida, t.monto_total, l.numero_lugar,
      ei.nombre AS ingreso, ec.nombre AS cobro
    FROM ticket t JOIN lugar_empresa le ON le.id_lugar=t.id_lugar JOIN luagres l ON l.id_lugar=t.id_lugar
    JOIN empleado ei ON ei.id_empleado=t.id_empleado_ingreso LEFT JOIN empleado ec ON ec.id_empleado=t.id_empleado_cobro
    WHERE le.id_empresa=? ORDER BY t.num_ticket DESC LIMIT 15`, [e]);
  res.json({ empresa, lugares, empleados, tarifas, actividad });
}));

app.post('/api/ingreso', auth, wrap(async (req, res) => {
  const b = req.body, pat = (b.patente || '').trim().toUpperCase();
  if (!pat || !b.nombre || !b.apellido) throw bad('Patente, nombre y apellido son obligatorios');
  const num = await tx(async c => {
    const [[l]] = await c.query('SELECT l.id_estado FROM luagres l JOIN lugar_empresa le ON le.id_lugar=l.id_lugar WHERE l.id_lugar=? AND le.id_empresa=? FOR UPDATE', [b.id_lugar, req.u.emp]);
    if (!l || l.id_estado !== 1) throw bad('El lugar no está disponible');
    const [[dentro]] = await c.query('SELECT 1 x FROM luagres WHERE patente=?', [pat]);
    if (dentro) throw bad('Ese vehículo ya está estacionado');
    const [[v]] = await c.query('SELECT 1 x FROM vehiculo WHERE patente=?', [pat]);
    if (!v) {
      const idc = await nextId(c, 'cliente', 'id_cliente');
      await c.query('INSERT INTO cliente VALUES (?,?,?,?,?)', [idc, b.nombre, b.apellido, b.telefono, b.correo]);
      await c.query('INSERT INTO vehiculo VALUES (?,?,?,?,?)', [pat, b.marca, b.modelo, b.color, idc]);
    }
    await c.query('UPDATE luagres SET id_estado=2, patente=? WHERE id_lugar=?', [pat, b.id_lugar]);
    const [r] = await c.query('INSERT INTO ticket (patente,id_lugar,id_tarifa,id_empleado_ingreso,diah_entrada) VALUES (?,?,?,?,NOW())', [pat, b.id_lugar, b.id_tarifa, req.u.id]);
    return r.insertId;
  });
  res.json({ num_ticket: num });
}));

// Salida: la fracción de hora se cobra como hora completa (mínimo 1 hora)
app.post('/api/salida', auth, wrap(async (req, res) => {
  const out = await tx(async c => {
    const [[t]] = await c.query(`SELECT t.*, f.precio_hora, v.id_cliente, l.numero_lugar,
        GREATEST(1, CEIL(TIMESTAMPDIFF(MINUTE, t.diah_entrada, NOW())/60)) AS horas
      FROM ticket t JOIN lugar_empresa le ON le.id_lugar=t.id_lugar JOIN luagres l ON l.id_lugar=t.id_lugar
      JOIN tarifa f ON f.id_tarifa=t.id_tarifa JOIN vehiculo v ON v.patente=t.patente
      WHERE t.id_lugar=? AND le.id_empresa=? AND t.diah_salida IS NULL FOR UPDATE`, [req.body.id_lugar, req.u.emp]);
    if (!t) throw bad('No hay un ticket abierto en ese lugar');
    const horas = Number(t.horas), monto = Math.round(horas * Number(t.precio_hora) * 100) / 100;
    await c.query('UPDATE ticket SET diah_salida=NOW(), monto_total=?, id_empleado_cobro=? WHERE num_ticket=?', [monto, req.u.id, t.num_ticket]);
    await c.query('INSERT INTO pagos VALUES (?,?,CURDATE(),?,?)', [await nextId(c, 'pagos', 'id_pago'), monto, t.id_cliente, t.id_tarifa]);
    await c.query('UPDATE luagres SET id_estado=1, patente=NULL WHERE id_lugar=?', [t.id_lugar]);
    const [[s]] = await c.query('SELECT diah_salida FROM ticket WHERE num_ticket=?', [t.num_ticket]);
    return { num_ticket: t.num_ticket, patente: t.patente, lugar: t.numero_lugar, diah_entrada: t.diah_entrada,
      diah_salida: s.diah_salida, horas, precio_hora: t.precio_hora, monto_total: monto };
  });
  res.json(out);
}));

app.post('/api/empleados', auth, wrap(async (req, res) => {
  if (req.u.rol !== 'administrador') throw bad('Solo el administrador puede agregar empleados', 403);
  const { usuario, contrasena, nombre, apellido, rol } = req.body;
  if (!usuario || !contrasena || !nombre || !apellido) throw bad('Completá todos los campos');
  const [[{ n }]] = await db.query('SELECT COUNT(*) n FROM empleado WHERE id_empresa=?', [req.u.emp]);
  const [[m]] = await db.query('SELECT max_empleados FROM empresa WHERE id_empresa=?', [req.u.emp]);
  if (n >= m.max_empleados) throw bad('Llegaste al máximo de empleados de tu empresa');
  await db.query('INSERT INTO empleado (id_empresa,usuario,contrasena,rol,nombre,apellido) VALUES (?,?,?,?,?,?)',
    [req.u.emp, usuario, await bcrypt.hash(contrasena, 10), rol === 'administrador' ? rol : 'playero', nombre, apellido]);
  res.json({ ok: true });
}));

app.listen(3001, () => console.log('ParkAdmin API en http://localhost:3001'));
