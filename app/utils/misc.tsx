import { useMatches } from '@remix-run/react';
import React, { useEffect, useLayoutEffect, useMemo } from 'react';

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

let hasHydrated = false; //Empieza false para que no piense que sta hidratado aun

export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = React.useState(hasHydrated);

  React.useEffect(() => {
    hasHydrated = true; //Con esto permites que si ya se ha hidratado antes se hidrate al momento
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

//Para saber si esta en servidor o no ejecutandose para usar layoutEffect (solo cliente) o no
export function isRunningOnServer() {
  return typeof window === 'undefined'; //Sabemos que es el servidor pq window es el cliente/navegador
}

export const useServerLayoutEffect = isRunningOnServer()
  ? useEffect
  : useLayoutEffect;
