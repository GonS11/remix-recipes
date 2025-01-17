import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import db from '~/db.server';

// El loader es una función que se ejecuta en el servidor antes de que la página se renderice.
// Sirve para cargar datos necesarios para una ruta específica.
// En este caso, usamos el loader para obtener una receta desde la base de datos.
export async function loader({ params }: LoaderFunctionArgs) {
  // `params` es un objeto que Remix proporciona automáticamente a los loaders.
  // Contiene las partes dinámicas de la URL.
  // Por ejemplo, si la ruta es `/recipes/:recipeId` y accedemos a `/recipes/123`,
  // entonces `params.recipeId` será igual a "123".
  const recipe = await db.recipe.findUnique({
    where: { id: params.recipeId }, // Accedemos a la ID de la receta desde los parámetros.
  });

  // Devuelve una respuesta HTTP con los datos de la receta en formato JSON
  return new Response(JSON.stringify(recipe), {
    headers: {
      // Establece encabezados de control de caché:
      // 'Cache-Control' define cuánto tiempo se debe reutilizar la respuesta desde la caché antes de hacer una nueva solicitud.
      // 'max-age=10' significa que esta respuesta será válida en la caché durante 10 segundos.
      // Esto es importante para reducir la carga en el servidor cuando se usa prefetch,
      // ya que evita que Remix o el navegador hagan solicitudes repetitivas en poco tiempo.
      'Cache-Control': 'max-age=10',
    },
  });
}

export default function RecipeDetail() {
  const data = useLoaderData<typeof loader>();

  //Para poder mostrar esta nested route (Su contenido), el padre debe tener un Outlet
  return (
    <div>
      <h1>{data.recipe?.name}</h1>
    </div>
  );
}
