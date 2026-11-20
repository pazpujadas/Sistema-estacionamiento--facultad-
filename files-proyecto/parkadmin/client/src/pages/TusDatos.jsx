import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';

const TAMANOS = ['2-10', '10-100', '100-1000', '+1000'];

export default function TusDatos() {
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('usuario') || 'null'));

  const entrar = async (usuario, contrasena) => {
    const r = await api('/login', { usuario, contrasena });
    localStorage.setItem('token', r.token);
    localStorage.setItem('usuario', JSON.stringify(r.usuario));
    nav('/administrar');
  };
  const submit = fn => async e => {
    e.preventDefault(); setErr('');
    try { await fn(Object.fromEntries(new FormData(e.target))); } catch (x) { setErr(x.message); }
  };
  const salir = () => { localStorage.clear(); setUser(null); };

  if (user) return (
    <section className="tarjeta">
      <h2>Tus datos</h2>
      <dl><dt>Nombre</dt><dd>{user.nombre} {user.apellido}</dd><dt>Empresa</dt><dd>{user.empresa}</dd><dt>Rol</dt><dd>{user.rol}</dd></dl>
      <p><Link className="btn" to="/administrar">Ir a administrar</Link> <button className="sec" onClick={salir}>Cerrar sesión</button></p>
    </section>
  );

  return (
    <>
      <h2>Creá o iniciá sesión en tu cuenta</h2>
      {err && <p className="error" role="alert">{err}</p>}
      <div className="dos">
        <section className="tarjeta">
          <h3>Iniciá sesión</h3>
          <form onSubmit={submit(d => entrar(d.usuario, d.contrasena))}>
            <label htmlFor="l-usuario">Nombre de usuario</label>
            <input id="l-usuario" name="usuario" placeholder="Tu nombre de usuario" required />
            <label htmlFor="l-pass">Contraseña</label>
            <input id="l-pass" name="contrasena" type="password" placeholder="Contraseña" required />
            <button type="submit">Ingresar</button>
          </form>
        </section>
        <section className="tarjeta">
          <h3>Creá tu cuenta</h3>
          <form onSubmit={submit(async d => { await api('/registro', d); await entrar(d.usuario, d.contrasena); })}>
            <label htmlFor="r-nombre">Nombre</label>
            <input id="r-nombre" name="nombre" placeholder="Tu nombre" required />
            <label htmlFor="r-apellido">Apellido</label>
            <input id="r-apellido" name="apellido" placeholder="Tu apellido" required />
            <label htmlFor="r-empresa">Nombre de la empresa</label>
            <input id="r-empresa" name="empresa" placeholder="El nombre de tu empresa" required />
            <fieldset>
              <legend>Seleccioná el tamaño de la empresa</legend>
              {TAMANOS.map((t, i) => (
                <label key={t}><input type="radio" name="tamano" value={t} required={i === 0} /> {t} empleados</label>
              ))}
            </fieldset>
            <label htmlFor="r-email">Email corporativo</label>
            <input id="r-email" name="email" type="email" placeholder="Mail corporativo" required />
            <label htmlFor="r-lugares">Cantidad de lugares</label>
            <input id="r-lugares" name="lugares" type="number" min="1" max="2000" placeholder="Cantidad de lugares" required />
            <label htmlFor="r-usuario">Nombre de usuario</label>
            <input id="r-usuario" name="usuario" placeholder="Elegí tu nombre de usuario" required />
            <label htmlFor="r-pass">Contraseña</label>
            <input id="r-pass" name="contrasena" type="password" placeholder="Creá una contraseña" required />
            <button type="submit">Registrarse</button>
          </form>
        </section>
      </div>
    </>
  );
}
