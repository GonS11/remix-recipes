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

export function useDebounceFunction<T extends Array<unknown>>(
  fn: (...args: T) => unknown, // La función que queremos "debouncear" (retrasar su ejecución).
  time: number, // El tiempo en milisegundos que queremos esperar antes de ejecutar la función.
) {
  // `timeoutId` es una referencia mutable que almacena el ID del timeout actual.
  // Usamos `useRef` para mantener este valor entre renders sin causar un nuevo renderizado.
  const timeoutId = React.useRef<number>();

  // `debouncedFn` es la función que retrasa la ejecución de `fn`.
  const debouncedFn = (...args: T) => {
    // Limpiamos el timeout anterior si existe.
    // Esto evita que la función se ejecute si se llama nuevamente antes de que termine el tiempo de espera.
    window.clearTimeout(timeoutId.current);

    // Establecemos un nuevo timeout que ejecutará `fn` después de `time` milisegundos.
    // `window.setTimeout` devuelve un ID numérico que almacenamos en `timeoutId.current`.
    timeoutId.current = window.setTimeout(() => fn(...args), time);
  };

  // Retornamos la función "debounceada" para que pueda ser utilizada.
  return debouncedFn;
}
