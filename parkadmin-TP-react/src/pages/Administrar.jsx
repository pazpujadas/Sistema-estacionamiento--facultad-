import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../api.js';

export default function Administrar() {
  const nav = useNavigate();
  const [d, setD] = useState(null);
  const [modal, setModal] = useState(null); // { tipo: 'ingreso' | 'detalle' | 'ticket' | 'empleado', ... }
  const [err, setErr] = useState('');
  const user = JSON.parse(localStorage.getItem('usuario') || 'null');

  const cargar = () => api('/panel').then(setD).catch(e => (e.message === 'Sesión inválida' ? nav('/tus-datos') : setErr(e.message)));
  useEffect(() => { getToken() ? cargar() : nav('/tus-datos'); }, []);
  if (!d) return <p role="status">{err || 'Cargando…'}</p>;

  const cerrar = () => { setModal(null); setErr(''); };
  const enviar = (ruta, extra = {}) => async e => {
    e.preventDefault(); setErr('');
    try { await api(ruta, { ...Object.fromEntries(new FormData(e.target)), ...extra }); await cargar(); cerrar(); }
    catch (x) { setErr(x.message); }
  };
  const salida = async l => {
    try { const t = await api('/salida', { id_lugar: l.id_lugar }); await cargar(); setModal({ tipo: 'ticket', t }); }
    catch (x) { setErr(x.message); }
  };
  const E = err && <p className="error" role="alert">{err}</p>;
  const ocupados = d.lugares.filter(l => l.id_estado === 2).length;

  return (
    <>
      <h2>{d.empresa.nombre}</h2>
      {!modal && E}
      <div className="gestion">
        <section aria-labelledby="t-lugares">
          <h3 id="t-lugares">Lugares y disponibilidad</h3>
          <p>{ocupados} ocupados de {d.lugares.length}</p>
          <div className="lugares">
            {d.lugares.map(l => {
              const oc = l.id_estado === 2;
              return (
                <button key={l.id_lugar} className={'lugar ' + (oc ? 'ocupado' : 'libre')}
                  aria-label={`Lugar ${l.numero_lugar}, ${oc ? 'ocupado' : 'libre'}`}
                  onClick={() => setModal({ tipo: oc ? 'detalle' : 'ingreso', l })}>
                  <span className="num">{l.numero_lugar}</span>
                  <span className="estado"><i className="punto" />{oc ? 'Ocupado' : 'Libre'}</span>
                  {oc && <><small>{l.modelo}</small><small>{l.nombre} {l.apellido}</small></>}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="t-emp">
          <h3 id="t-emp">Empleados</h3>
          <p>{d.empleados.length} de {d.empresa.max_empleados}</p>
          <div className="personas">
            {Array.from({ length: d.empresa.max_empleados }, (_, i) => {
              const e = d.empleados[i];
              return e ? <div key={i} className="persona"><i />{e.nombre}<br />{e.rol}</div>
                       : <div key={i} className="persona vacia" aria-hidden="true"><i /></div>;
            })}
          </div>
          {user?.rol === 'administrador' && <p><button className="sec" onClick={() => setModal({ tipo: 'empleado' })}>Agregar empleado</button></p>}
          <h3>Actividad reciente</h3>
          {d.actividad.length === 0 ? <p>Todavía no hay movimientos.</p> : (
            <ul className="actividad">
              {d.actividad.map(a => (
                <li key={a.num_ticket}>Ticket {a.num_ticket}: {a.patente} en lugar {a.numero_lugar}. Ingresó: {a.ingreso}.{' '}
                  {a.diah_salida ? `Cobró: ${a.cobro} ($${a.monto_total}).` : 'Sigue estacionado.'}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {modal && (
        <div className="fondo-modal">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="t-modal">
            {modal.tipo === 'ingreso' && (
              <form onSubmit={enviar('/ingreso', { id_lugar: modal.l.id_lugar })}>
                <h3 id="t-modal">Registrar ingreso en el lugar {modal.l.numero_lugar}</h3>
                {['patente:Patente', 'marca:Marca', 'modelo:Modelo', 'color:Color', 'nombre:Nombre del cliente', 'apellido:Apellido del cliente', 'telefono:Teléfono', 'correo:Correo electrónico'].map(c => {
                  const [n, t] = c.split(':');
                  return <div key={n}><label htmlFor={'i-' + n}>{t}</label><input id={'i-' + n} name={n} required={['patente', 'nombre', 'apellido'].includes(n)} /></div>;
                })}
                <label htmlFor="i-tarifa">Tarifa</label>
                <select id="i-tarifa" name="id_tarifa">
                  {d.tarifas.map(t => <option key={t.id_tarifa} value={t.id_tarifa}>{t.descripcion} (${t.precio_hora} por hora)</option>)}
                </select>
                {E}
                <button type="submit">Registrar ingreso</button> <button type="button" className="sec" onClick={cerrar}>Cancelar</button>
              </form>
            )}
            {modal.tipo === 'detalle' && (
              <>
                <h3 id="t-modal">Lugar {modal.l.numero_lugar}: ocupado</h3>
                <dl>
                  <dt>Patente</dt><dd>{modal.l.patente}</dd>
                  <dt>Vehículo</dt><dd>{modal.l.marca} {modal.l.modelo}, {modal.l.color}</dd>
                  <dt>Cliente</dt><dd>{modal.l.nombre} {modal.l.apellido}</dd>
                  <dt>Teléfono</dt><dd>{modal.l.telefono}</dd>
                  <dt>Correo</dt><dd>{modal.l.correo}</dd>
                  <dt>Ingreso</dt><dd>{modal.l.diah_entrada}</dd>
                </dl>
                {E}
                <button onClick={() => salida(modal.l)}>Registrar salida y cobrar</button> <button className="sec" onClick={cerrar}>Cerrar</button>
              </>
            )}
            {modal.tipo === 'ticket' && (
              <>
                <div className="ticket">
                  <h3 id="t-modal">ParkAdmin: ticket {modal.t.num_ticket}</h3>
                  <dl>
                    <dt>Patente</dt><dd>{modal.t.patente}</dd>
                    <dt>Lugar</dt><dd>{modal.t.lugar}</dd>
                    <dt>Entrada</dt><dd>{modal.t.diah_entrada}</dd>
                    <dt>Salida</dt><dd>{modal.t.diah_salida}</dd>
                    <dt>Horas</dt><dd>{modal.t.horas} x ${modal.t.precio_hora}</dd>
                    <dt>Total</dt><dd><strong>${modal.t.monto_total}</strong></dd>
                  </dl>
                </div>
                <button onClick={() => window.print()}>Imprimir ticket</button> <button className="sec" onClick={cerrar}>Cerrar</button>
              </>
            )}
            {modal.tipo === 'empleado' && (
              <form onSubmit={enviar('/empleados')}>
                <h3 id="t-modal">Agregar empleado</h3>
                {['nombre:Nombre', 'apellido:Apellido', 'usuario:Nombre de usuario'].map(c => {
                  const [n, t] = c.split(':');
                  return <div key={n}><label htmlFor={'e-' + n}>{t}</label><input id={'e-' + n} name={n} required /></div>;
                })}
                <label htmlFor="e-pass">Contraseña</label><input id="e-pass" name="contrasena" type="password" required />
                <label htmlFor="e-rol">Rol</label>
                <select id="e-rol" name="rol"><option value="playero">Playero</option><option value="administrador">Administrador</option></select>
                {E}
                <button type="submit">Agregar empleado</button> <button type="button" className="sec" onClick={cerrar}>Cancelar</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
