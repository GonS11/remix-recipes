import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import type { LinksFunction, MetaFunction } from '@remix-run/node';

import './tailwind.css';

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
      <body>
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
      <nav>
        <Link to="/">Home</Link>
        <Link to="discover">Discover</Link>
        <Link to="app">App</Link>
        <Link to="settings">Settings</Link>
      </nav>
      <Outlet />
    </>
  );
}
