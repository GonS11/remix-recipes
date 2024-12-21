import { useMatches } from '@remix-run/react';
import { useMemo } from 'react';

/**No se donde se usa */
export function classNames(...names: Array<string | undefined>) {
  const className = names.reduce(
    (acc, name) => (name ? `${acc} ${name}` : acc),
    '',
  );

  return className || '';
}

//Esta funcion accedera a matches y la data de la ruta que queramos por id y asi poder usar en cualquier sitio
//El id es la ruta desde la carpeta routes. Ej: routes/settings/profile
export function useMatchesData(id: string) {
  const matches = useMatches();
  //useMemo, para que el valor de route no se calculo de nuevo solo cuando cambie un valor, que la ruta se quede fija a menos que cambie matches o id
  const route = useMemo(
    () => matches.find((match) => match.id === id),
    [matches, id],
  );

  return route?.data;
}
