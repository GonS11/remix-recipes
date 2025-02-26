import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  useResolvedPath,
  useRouteError,
} from '@remix-run/react';
import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';

import './tailwind.css';
import {
  BookIcon,
  DiscoverIcon,
  LoginIcon,
  LogoutIcon,
  SettingIcon,
  SocialMediaIcon,
} from './components/icons';
import React from 'react';
import classNames from 'classnames';
import { getCurrentUSer } from './utils/auth.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: '/theme.css' },
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
      <body className="md:flex md:h-screen bg-background">
        {children}
        {/**Sirve para emular una actividad del navegador para que el scroll se mantenga aunque viajes entre paginas. Navegor lo hace pero js no */}
        <ScrollRestoration />
        {/**Renderiza los link a todos los archivos de js que el navegador necesita para que se ejecuten*/}
        <Scripts />
      </body>
    </html>
  );
}

//Se crea este loader para mostrar app solo si esta logueado
export const loader: LoaderFunction = async ({ request }) => {
  const user = await getCurrentUSer(request);

  //Solo se devuelv eun boolean y no todo el usuario asi no descarga todo (Se filtra con este boolean en el servidor)
  return { isLoggedIn: user !== null };
};

//La ffc App solo devuelve Outlet, solo renderiza las nest-routes indicadas. Como pertenece a root, se renderiza siempre y siempre esta, por lo que si añadimos rutas de navegacion todos lo tendran y su contenido se renderizara en Outlet
export default function App() {
  //useMatches: Agrupa todas las rutas que importan de la pagina y dice informacion sobre cada una (data/resultado del loader,id...). Te permite extraer esa data de cualquier ruta hija o padre en cualquier sitio y siempre tienes acceso a esa informacion
  /* const matches = useMatches();
  React.useEffect(() => {
    console.log(matches);
  }, [matches]); */

  const data = useLoaderData<typeof loader>(); //PONER EL TIPO

  return (
    <>
      <nav
        className={classNames(
          'bg-primary text-white md:w-16',
          'flex justify-between md:flex-col', //Para que en mobile este login a la dereche nav y desktop este abajo
        )}
      >
        <ul className="flex md:flex-col">
          {/* <AppNavLink to="/">
            <HomeIcon />
          </AppNavLink> */}
          <AppNavLink to="discover">
            <DiscoverIcon />
          </AppNavLink>
          {data.isLoggedIn ? (
            <>
              <AppNavLink to="app/recipes">
                <BookIcon />
              </AppNavLink>

              <AppNavLink to="social/feed">
                <SocialMediaIcon />
              </AppNavLink>
            </>
          ) : null}

          <AppNavLink to="settings/app">
            <SettingIcon />
          </AppNavLink>
        </ul>
        <ul>
          {data.isLoggedIn ? (
            <AppNavLink to="/logout">
              <LogoutIcon />
            </AppNavLink>
          ) : (
            <AppNavLink to="/login">
              <LoginIcon />
            </AppNavLink>
          )}
        </ul>
      </nav>
      <div className="p-4 w-full md:w-[calc(100%-4rem)]">
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
    navigation.location.pathname === path.pathname &&
    navigation.formData === null; //null es para diferenciar si se crea shelf que no pulse

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

//Al crearse en root sirve de control para todo
export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>Whooops!</title>
      </head>
      <body>
        <div className="p-4">
          {isRouteErrorResponse(error) ? (
            <>
              <h1 className="text-2xl pb-3">
                {/**400 - Not Found */}
                {error.status}-{error.statusText}
              </h1>
              <p>You are seeing this page because an error occurred.</p>
              {/**Los error.data.message son los de las funciones de validateForm */}
              <p className="my-4 font-bold">{error.data.message}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl pb-3">Whoops!</h1>
              <p>
                You are seeing this page because an unexpected error occurred.
              </p>
              {error instanceof Error ? (
                <p className="my-4 font-bold">{error.message}</p>
              ) : null}
            </>
          )}
          <Link to="/" className="text-primary">
            Take me home
          </Link>
        </div>
      </body>
    </html>
  );
}
