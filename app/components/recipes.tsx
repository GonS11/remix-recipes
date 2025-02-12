import { useParams } from '@remix-run/react';
import { TimeIcon } from './icons';
import classNames from 'classnames';
import React from 'react';

type RecipePageWrapperProps = {
  children: React.ReactNode;
};

export function RecipePageWrapper({ children }: RecipePageWrapperProps) {
  return <div className="lg:flex h-full">{children}</div>;
}

type RecipeListWrapperProps = {
  children: React.ReactNode;
};

export function RecipeListWrapper({ children }: RecipeListWrapperProps) {
  const params = useParams();
  return (
    <div
      className={classNames(
        'lg:block lg:w-1/3 lg:pr-4 overflow-auto',
        params.id ? 'hidden' : '',
      )}
    >
      {children}
      <br />
    </div>
  );
}

type RecipeDetailWrapperProps = {
  children: React.ReactNode;
};

export function RecipeDetailWrapper({ children }: RecipeDetailWrapperProps) {
  return <div className="lg:w-2/3 overflow-auto pr-4 pl-4">{children}</div>;
}

function useDelayedBool(value: boolean | undefined, delay: number) {
  // Hook para retrasar el cambio de un valor booleano.
  // Devuelve un valor booleano que cambia a `true` después de un retraso específico cuando `value` es `true`.
  // Si `value` se establece en `false` antes de que expire el retraso, el valor retornado se restablece inmediatamente a `false`.

  // Estado que almacenará el valor retrasado.
  const [delayed, setDelayed] = React.useState(false);

  // Referencia mutable para almacenar el ID del temporizador.
  const timeoutId = React.useRef<number>();

  // useEffect para manejar cambios en `value`.
  React.useEffect(() => {
    if (value) {
      // Si `value` es verdadero, configura un temporizador.
      timeoutId.current = window.setTimeout(() => {
        setDelayed(true); // Cambia el estado a `true` después del retraso.
      }, delay);
    } else {
      // Si `value` es falso, limpia el temporizador y establece el estado en `false`.
      window.clearTimeout(timeoutId.current);
      setDelayed(false);
    }

    // Limpieza del efecto: Si el componente se desmonta, se limpia el temporizador.
    return () => {
      window.clearTimeout(timeoutId.current);
    };
  }, [value, delay]); // Ejecuta el efecto cada vez que `value` o `delay` cambien.

  return delayed; // Devuelve el estado booleano retrasado.
}

type RecipeCardProps = {
  name: string;
  totalTime: string;
  mealPlanMultiplier: number | null;
  imageUrl?: string;
  isActive?: boolean;
  isLoading?: boolean;
};

export function RecipeCard({
  name,
  totalTime,
  mealPlanMultiplier,
  imageUrl,
  isActive,
  isLoading,
}: RecipeCardProps) {
  // Estado retrasado para manejar la carga con un retardo de 500 ms.
  // Esto evita parpadeos si el estado de carga es breve.
  const delayedLoading = useDelayedBool(isLoading, 500);

  return (
    <div
      className={classNames(
        // Clases base del contenedor
        'group flex shadow-md rounded-md border-2',
        // Cambios de estilo al pasar el mouse
        'hover:text-primary hover:border-primary',
        // Estilos para el estado activo
        isActive ? 'border-primary text-primary' : 'border-white',
        // Estilos para el estado de carga
        isLoading ? 'border-gray-500 text-gray-500' : '',
      )}
    >
      {/* Imagen de la receta */}
      <div className="w-14 h-14 rounded-full overflow-hidden my-4 ml-3">
        <img
          src={imageUrl}
          className="object-cover h-full w-full"
          alt={`Imagen de ${name}`} // Texto alternativo para accesibilidad
        />
      </div>

      {/* Contenedor del texto */}
      <div className="p-4 flex-grow">
        {/* Nombre de la receta con indicador de carga si es necesario */}
        <h3 className="font-semibold mb-1 text-left">
          {name}
          {mealPlanMultiplier !== null ? (
            <>&nbsp;(x{mealPlanMultiplier})</>
          ) : null}
          {delayedLoading ? '...' : ''}{' '}
          {/* Añade puntos suspensivos al cargar */}
        </h3>

        {/* Tiempo total de preparación */}
        <div
          className={classNames(
            'flex font-light',
            'group-hover:text-primary-light', // Cambio de color al pasar el mouse
            isActive ? 'text-primary-light' : 'text-gray-500', // Estilos dinámicos
          )}
        >
          <TimeIcon /> {/* Icono de tiempo */}
          <p className="ml-1">{totalTime}</p>
        </div>
      </div>
    </div>
  );
}

type IngredientsWrapperProps = {
  children: React.ReactNode;
};
export function IngredientsWrapper({ children }: IngredientsWrapperProps) {
  return (
    <div className="grid grid-cols-[30%_auto_min-content] my-4 gap-2">
      {children}
    </div>
  );
}
