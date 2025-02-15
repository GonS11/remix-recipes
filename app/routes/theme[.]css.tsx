//Las Resource Route, son rutas sin componentes default que sirven para cargar archivos, componentes, cosas. Como JSON, XML, HTML...

import { LoaderFunctionArgs } from '@remix-run/node';
import { themeCookie } from '~/cookies';

//Ruta: theme[.]css.tsx Para que entienda que el resource es de tipo css con theme.css

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('cookie');
  const theme = (await themeCookie.parse(cookieHeader)) ?? '#00743e'; // Valor predeterminado

  const data = `
  :root {
    --color-primary: ${theme};
    --color-primary-light: ${lightenHexColor(theme, 1.5)};
    --color-primary-light2: ${lightenHexColor(theme, 1.5, 0.4)};
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

export function lightenHexColor(
  color: string,
  factor: number,
  alpha?: number,
): string {
  if (!/^#([0-9A-Fa-f]{6})$/.test(color)) {
    throw new Error('Invalid hex color format. Use #RRGGBB.');
  }

  // Extraer los valores RGB
  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Función para aclarar los valores RGB
  const lighten = (value: number) => Math.min(255, Math.round(value * factor));

  const newR = lighten(r);
  const newG = lighten(g);
  const newB = lighten(b);

  // Convertir de nuevo a formato hexadecimal
  const toHex = (value: number) => value.toString(16).padStart(2, '0');

  // Si se proporciona alpha, devolver en formato rgba
  if (alpha !== undefined) {
    return `rgba(${newR}, ${newG}, ${newB}, ${alpha})`;
  }

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
