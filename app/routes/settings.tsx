import { Link, Outlet } from '@remix-run/react';

function Settings() {
  return (
    <div>
      <h1>Settings</h1>
      <p>This is the Settings app</p>
      <nav>
        {/**Etiqueta  que hace client side routing que hace que la pagina no se refresque al hacer click en el link. Esta son nest routes de settings, ahora es con settings.app no carpeta settings con app*/}
        <Link to="app">App</Link>
        <Link to="profile">Profile</Link>
      </nav>
      {/**Outlet es una etiqueta de remix que permite decir donde desplegar la nest-route clickada */}
      <Outlet />
    </div>
  );
}

export default Settings;
