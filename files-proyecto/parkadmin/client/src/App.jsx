import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Inicio from './pages/Inicio.jsx';
import TusDatos from './pages/TusDatos.jsx';
import Administrar from './pages/Administrar.jsx';

// La barra se muestra igual en las 3 páginas
export default function App() {
  return (
    <BrowserRouter>
      <header className="barra">
        <h1>ParkAdmin</h1>
        <nav aria-label="Principal">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/tus-datos">Tus datos</NavLink>
          <NavLink to="/administrar">Administrar</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/tus-datos" element={<TusDatos />} />
          <Route path="/administrar" element={<Administrar />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
