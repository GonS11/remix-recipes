import {
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
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
          <AppNavLink to="app">
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
  return (
    <li className="w-16">
      {/**NavLink es de remix y te permite aplicar estilos diferentes para decir en que link esta activo */}
      <NavLink to={to}>
        {({ isActive }) => (
          <div
            className={classNames(
              'py-4 flex justify-center hover:bg-primary-light',
              {
                'bg-primary-light': isActive,
              },
            )}
          >
            {children}
          </div>
        )}
      </NavLink>
    </li>
  );
}
