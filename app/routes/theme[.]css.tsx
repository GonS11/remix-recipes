//Las Resource Route, son rutas sin componentes default que sirven para cargar archivos, componentes, cosas. Como JSON, XML, HTML...

import { LoaderFunctionArgs } from '@remix-run/node';
import { themeCookie } from '~/cookies';

//Ruta: theme[.]css.tsx Para que entienda que el resource es de tipo css con theme.css

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('cookie');
  const theme = await themeCookie.parse(cookieHeader);

  //console.log('Loaded theme:', theme);

  const data = `
  :root {
    --color-primary: ${theme ?? '#00743e'};
    --color-primary-light: ${lightenHexColor(theme, 1.5) ?? '#4c9d77'}
  }
  `;

  return new Response(data, {
    headers: { 'content-type': 'text/css' },
  });

  //Con el content-type dices como es el tipo que espera. Para el tipo mirar los MIME types (type/subtype)
  /* return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json',
    },
  }); */
}

function lightenHexColor(hex: string, factor: number): string {
  // Elimina el "#" si está presente
  hex = hex.replace(/^#/, '');

  // Convierte el color hexadecimal a RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Aclara los componentes RGB
  const lighten = (value: number) => Math.min(255, Math.round(value * factor));

  const newR = lighten(r);
  const newG = lighten(g);
  const newB = lighten(b);

  // Convierte de nuevo a hexadecimal
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
