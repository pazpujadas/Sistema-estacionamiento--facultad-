import { Link } from 'react-router-dom';

export default function Inicio() {
  return (
    <>
      <h2>Gestione agilmente su estacionamiento con ParkAdmin</h2>
      <p><Link className="btn" to="/tus-datos">Comenzar ahora</Link></p>
      <h3>Más información</h3>
      <p>ParkAdmin es un software creado para facilitar el día a día de quienes trabajan en estacionamientos, pasando de anotar en papel y calcular manualmente a tener un sistema de gestión en el que se ingresan los datos y automáticamente se obtiene la tarifa a pagar por parte del cliente y luego se imprime el ticket correspondiente.</p>
      <h3>Beneficios principales</h3>
      <ul>
        <li>Mayor seguridad al guardar datos</li>
        <li>Mayor rapidez a la hora de calcular tarifas</li>
        <li>Asignación automática de lugares</li>
        <li>No necesita instalar ningún software, puede utilizarlo en la web</li>
      </ul>
      <h3>¿Más dudas? Contactá a un/a asesor/a</h3>
      {/* Cambiá el mail por el real */}
      <a className="btn" href="mailto:asesores@parkadmin.com">Contactar a un/a asesor/a</a>
    </>
  );
}
