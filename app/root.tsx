import {
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  useNavigation,
  useResolvedPath,
} from '@remix-run/react';
import type { LinksFunction, MetaFunction } from '@remix-run/node';

import './tailwind.css';
import {
  BookIcon,
  DiscoverIcon,
  HomeIcon,
  SettingIcon,
} from './components/icons';
import React from 'react';
import classNames from 'classnames';

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

//Es un tipo especial de componente se puede hacer en cada componente, permite que el componente meta de root los renderice
export const meta: MetaFunction = () => {
  return [
    { title: 'Remix Recipes' },
    { name: 'description', content: 'Welcome to Remix Recipes App!' },
  ];
};

//Aqui en layout, se pasa la funcion default app como hijo/children en layout
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        {/**Se refiere a los link:css, link:js... de html */}
        <Links />
      </head>
      <body className="md:flex md:h-screen">
        {children}
        {/**Sirve para emular una actividad del navegador para que el scroll se mantenga aunque viajes entre paginas. Navegor lo hace pero js no */}
        <ScrollRestoration />
        {/**Renderiza los link a todos los archivos de js que el navegador necesita para que se ejecuten*/}
        <Scripts />
      </body>
    </html>
  );
}

//La ffc App solo devuelve Outlet, solo renderiza las nest-routes indicadas. Como pertenece a root, se renderiza siempre y siempre esta, por lo que si añadimos rutas de navegacion todos lo tendran y su contenido se renderizara en Outlet
export default function App() {
  //useMatches: Agrupa todas las rutas que importan de la pagina y dice informacion sobre cada una (data/resultado del loader,id...). Te permite extraer esa data de cualquier ruta hija o padre en cualquier sitio y siempre tienes acceso a esa informacion
  const matches = useMatches();
  React.useEffect(() => {
    console.log(matches);
  }, [matches]);
  return (
    <>
      <nav className="bg-primary text-white">
        <ul className="flex md:flex-col">
          <AppNavLink to="/">
            <HomeIcon />
          </AppNavLink>
          <AppNavLink to="discover">
            <DiscoverIcon />
          </AppNavLink>
          <AppNavLink to="app">
            <BookIcon />
          </AppNavLink>
          <AppNavLink to="settings">
            <SettingIcon />
          </AppNavLink>
        </ul>
      </nav>
      <div className="p-4">
        <Outlet />
      </div>
    </>
  );
}

type AppNavLinkProps = {
  children: React.ReactNode;
  to: string;
};

//Se instala npm i classnames que ayuda con el renderizado condiconal de clases

function AppNavLink({ children, to }: AppNavLinkProps) {
  const path = useResolvedPath(to); //Saca la ruta absoluta a partir de la relativa de to
  const navigation = useNavigation();
  {
    /**Solo navega a un link a la vez y se puede usar para un propio pending UI */
  }

  {
    /**Con el pathname sacas la ruta absoluta y con to la relativa solo, tenemos que igualarlas, se usa el hook useResultPath */
  }
  const isLoading =
    navigation.state === 'loading' &&
    navigation.location.pathname === path.pathname;

  return (
    <li className="w-16">
      {/**NavLink es de remix y te permite aplicar estilos diferentes para decir en que link esta activo */}
      {/**reloadDocument viene por defecto por el navegador, para la pending UI (Informar al usuario que se realiza una accion o esta cargando). Le dice a Remix que en vez de hacer una transaccion en el lado del cliente, solo queremos recargar toda la pagina y al hacer eso el navegador al ver que se carga de nuevo sabe como tratarlo como pending UI (Sale el icono de recarga)
       * Otra opcion es CREAR UN CUSTOM PENDING UI con el hook use navigation
       */}
      <NavLink to={to}>
        {({ isActive }) => (
          <div
            className={classNames(
              'py-4 flex justify-center hover:bg-primary-light',
              isActive ? 'bg-primary-light' : '',
              isLoading ? 'animate-pulse bg-primary-light' : '',
            )}
          >
            {children}
          </div>
        )}
      </NavLink>
    </li>
  );
}
