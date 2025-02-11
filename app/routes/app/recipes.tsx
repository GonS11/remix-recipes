import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import {
  Form,
  NavLink,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigation,
} from '@remix-run/react';
import { PrimaryButton, SearchBar } from '~/components/forms';
import { PlusIcon } from '~/components/icons';
import {
  RecipeCard,
  RecipeDetailWrapper,
  RecipeListWrapper,
  RecipePageWrapper,
} from '~/components/recipes';
import db from '~/db.server';
import { requireLoggedInUser } from '~/utils/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireLoggedInUser(request);
  //Para que funcione la busqueda, necesitamos traquear la URL que tiene el parametro de busqueda q
  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  //Las ordenamos para que las nuevas recetas salgan primero (orderBy) y salgan por busqueda
  const recipes = await db.recipe.findMany({
    where: {
      userId: user.id,
      name: {
        contains: q ?? '',
      },
    },
    select: { name: true, totalTime: true, imageUrl: true, id: true },
    orderBy: {
      createAt: 'desc',
    },
  });

  return { recipes };
}

//Creamos un action para controlar la creacion del form de create new recipe
export async function action({ request }: ActionFunctionArgs) {
  //Solo crea recetas que le pertenecen
  const user = await requireLoggedInUser(request);

  const recipe = await db.recipe.create({
    data: {
      userId: user.id,
      name: 'New Recipe',
      totalTime: '0 min',
      imageUrl: 'https://via.placeholder.com/150?text=Remix+Recipes',
      instructions: '',
    },
  });

  const url = new URL(request.url); //Como le pasamos todo la url, tambien va el valor de busqueda (Solo se modifica el pathname)
  url.pathname = `/app/recipes/${recipe.id}`;
  //Creacion de ruta dinamica personalizada para cada recipe details (Se muestra en el Outlet, dos rutas a la vez). Tambien lo redirigimos con el valor de busqueda para que no se actualice al crear algo nuevo
  return redirect(url.toString());
}

export default function Recipes() {
  const data = useLoaderData<typeof loader>();
  //Usamos location para que se mantenga el valor de busqueda aunque clickes otra receta, asi no se recargan todos. Este hook de remix te da la localizacion actual o la URL, es un objeto {pathname, search}
  const location = useLocation();
  const navigation = useNavigation(); //Si queremos usar para isLoading saber que te dice si se ha cargado o buscado pero la siguiente pagina/ruta

  //Para el pending UI, usar navigation y quitar reloadDocument

  return (
    <RecipePageWrapper>
      {/**Lado izquierdo con las recetas */}
      <RecipeListWrapper>
        <SearchBar placeholder="Search Recipes..." />
        {/**Creamos boton para crear recetas */}
        <Form method="post" className="mt-4">
          <PrimaryButton className="w-full">
            <div className="flex w-full justify-center">
              <PlusIcon />
              <span className="ml-2">Create New Recipe</span>
            </div>
          </PrimaryButton>
        </Form>
        {/**Mostramos recetas */}
        <ul>
          {data?.recipes.map((recipe) => {
            // Para saber si la receta está en proceso de cargarse, comprobamos si la URL de navegación actual termina con el ID de la receta.
            const isLoading = navigation.location?.pathname.endsWith(recipe.id);

            return (
              <li className="my-4" key={recipe.id}>
                {/**
                 * Cada receta se convierte en un enlace que lleva a una ruta dinámica, construida usando el ID de la receta.
                 * Esto permite mostrar los detalles de cada receta en una página específica basada en su ID.
                 */}
                <NavLink
                  // Creamos el enlace con un objeto que define el pathname (ID de la receta) y mantenemos los parámetros de búsqueda actuales.
                  to={{ pathname: recipe.id, search: location.search }}
                  prefetch="intent" // Este atributo activa el prefetching de datos.
                  /**
                   * 🎯 Explicación de `prefetch="intent"`:
                   * - `prefetch="intent"` es una característica de Remix que optimiza el rendimiento.
                   * - Cuando el usuario muestra intención de interactuar con el enlace (por ejemplo, al pasar el ratón por encima o enfocar el enlace), Remix precarga los datos relacionados con la ruta del enlace.
                   * - Este comportamiento mejora la experiencia del usuario porque acelera el tiempo de carga cuando hacen clic en el enlace.
                   * - Este prefetching está integrado con los navegadores y evita que se carguen datos innecesarios si no hay intención del usuario.
                   */
                >
                  {({ isActive }) => (
                    /**
                     * Utilizamos una función de render para personalizar el contenido basado en si el enlace está activo o no.
                     * - `isActive` indica si la ruta actual coincide con la ruta del enlace.
                     */
                    <RecipeCard
                      name={recipe.name} // Nombre de la receta
                      totalTime={recipe.totalTime} // Tiempo total de preparación
                      imageUrl={recipe.imageUrl} // URL de la imagen de la receta
                      isActive={isActive} // Indica si esta tarjeta está activa
                      isLoading={isLoading} // Indica si la receta está en proceso de cargarse
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </RecipeListWrapper>
      {/**Lado derecho mostrar ruta con los detalles de las recetas */}
      <RecipeDetailWrapper>
        <Outlet />
      </RecipeDetailWrapper>
    </RecipePageWrapper>
  );
}
