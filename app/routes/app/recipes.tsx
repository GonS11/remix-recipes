import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import {
  Form,
  Link,
  NavLink,
  Outlet,
  redirect,
  useFetchers,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
} from '@remix-run/react';
import { DeleteButton, PrimaryButton, SearchBar } from '~/components/forms';
import { CalendarIcon, PlusIcon } from '~/components/icons';
import {
  RecipeCard,
  RecipeDetailWrapper,
  RecipeListWrapper,
  RecipePageWrapper,
} from '~/components/recipes';
import db from '~/db.server';
import { requireLoggedInUser } from '~/utils/auth.server';
import { classNames, useBuildSearchParams } from '~/utils/misc';

//==============================LOADER===========================================================
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireLoggedInUser(request);
  //Para que funcione la busqueda, necesitamos traquear la URL que tiene el parametro de busqueda q
  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  //Para link + CalendarIcon
  //Si filter es === 'mealPlanOnly', queremos filtrar las recetas que tienen mealPlanMultiplier como NO NULL (Añadir condicional en db fx en where). {not:null} o nada {}
  const filter = url.searchParams.get('filter');

  //Las ordenamos para que las nuevas recetas salgan primero (orderBy) y salgan por busqueda
  const recipes = await db.recipe.findMany({
    where: {
      userId: user.id,
      name: {
        contains: q ?? '',
      },
      mealPlanMultiplier: filter === 'mealPlanOnly' ? { not: null } : {},
    },
    select: {
      name: true,
      totalTime: true,
      imageUrl: true,
      id: true,
      mealPlanMultiplier: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return { recipes };
}

//==============================ACTION===========================================================
//Creamos un action para controlar la creacion del form de create new recipe
export async function action({ request }: ActionFunctionArgs) {
  //Solo crea recetas que le pertenecen
  const user = await requireLoggedInUser(request);
  const formData = await request.formData();

  switch (formData.get('_action')) {
    case 'createRecipe': {
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
    case 'clearMealPlan': {
      await db.recipe.updateMany({
        where: {
          userId: user.id,
        },
        data: {
          mealPlanMultiplier: null,
        },
      });

      //Redireccopm y se actualiza todo
      return redirect('/app/recipes');
    }
    default: {
      return null;
    }
  }
}

//==============================COMPONENTE PRINCIPAL====================================================
export default function Recipes() {
  const data = useLoaderData<typeof loader>();
  //Usamos location para que se mantenga el valor de busqueda aunque clickes otra receta, asi no se recargan todos. Este hook de remix te da la localizacion actual o la URL, es un objeto {pathname, search}
  const location = useLocation();
  const navigation = useNavigation(); //Si queremos usar para isLoading saber que te dice si se ha cargado o buscado pero la siguiente pagina/ruta

  //Para el pending UI, usar navigation y quitar reloadDocument

  //useFetchers devuelve todos los fetcher que estan activos
  const fetchers = useFetchers();

  //-----------Filtrar por mealPlan (filter) + SearchBar (q)--------------
  const [searchParams] = useSearchParams();
  const mealPlanOnlyFilterOn = searchParams.get('filter') === 'mealPlanOnly';
  const buildSearchParams = useBuildSearchParams(); //Nuestro hook para filter + busqueda/SearchBar (q) en la URL a la vez

  //Ahora tenemos que hacerlo para que coexistan al reves, al buscar se actualiza, queremos que coexista con filter -> Añadir hidden input en SeachBar

  return (
    <RecipePageWrapper>
      {/**=========Listado RecipeCards===========*/}
      <RecipeListWrapper>
        <div className="flex gap-4">
          {/**IMP flex-grow */}
          <SearchBar placeholder="Search Recipes..." className="flex-grow" />
          {/**Como no paso info puedo usar un Link y no un Form, al poner como to ?filter, se recarga y lo añade a la URL. Queremos que se pueda seguir buscar aun, creamos un hook en misc */}
          {/**Se redirige y estila segun si de ha clickado o no */}
          <Link
            to={buildSearchParams(
              'filter',
              mealPlanOnlyFilterOn ? '' : 'mealPlanOnly',
            )}
            className={classNames(
              //Centrado vertical de Icon + Border
              'flex flex-col justify-center border-2 border-primary rounded-md px-2',
              mealPlanOnlyFilterOn ? 'text-white bg-primary' : 'text-primary',
            )}
          >
            <CalendarIcon />
          </Link>
        </div>

        {/**-----------Boton Crear Recetas + Eliminar Meal Plan----------*/}
        <Form method="post" className="mt-4">
          {/**Si se da al boton de mealPlan te deja eliminar todo el plan sino se renderiza el boton normal de crear receta */}
          {mealPlanOnlyFilterOn ? (
            <DeleteButton
              name="_action"
              value="clearMealPlan"
              className="w-full"
            >
              Clear Plan
            </DeleteButton>
          ) : (
            <PrimaryButton
              name="_action"
              value="createRecipe"
              className="w-full"
            >
              <div className="flex w-full justify-center">
                <PlusIcon />
                <span className="ml-2">Create New Recipe</span>
              </div>
            </PrimaryButton>
          )}
        </Form>

        {/**--------Listado de RecipeCards---------- */}
        <ul>
          {data?.recipes.map((recipe) => {
            // Para saber si la receta está en proceso de cargarse, comprobamos si la URL de navegación actual termina con el ID de la receta.
            const isLoading = navigation.location?.pathname.endsWith(recipe.id);

            //Almacenamos fetchers resultados
            const optimisticData = new Map();

            //Para cada recipeCard sacamos los fetcher
            for (const fetcher of fetchers) {
              if (fetcher.formAction?.includes(recipe.id)) {
                if (fetcher.formData?.get('_action') === 'saveName') {
                  optimisticData.set('name', fetcher.formData?.get('name'));
                }

                if (fetcher.formData?.get('_action') === 'saveTotalTime') {
                  optimisticData.set(
                    'totalTime',
                    fetcher.formData?.get('totalTime'),
                  );
                }
              }
            }
            return (
              <li className="my-4" key={recipe.id}>
                {/**
                 * Cada receta se convierte en un enlace que lleva a una ruta dinámica, construida usando el ID de la receta.
                 * Esto permite mostrar los detalles de cada receta en una página específica basada en su ID.
                 */}
                <NavLink
                  to={{ pathname: recipe.id, search: location.search }} // Ruta dinámica con búsqueda actual
                  prefetch="intent" // Precarga datos cuando el usuario interactúa con el enlace (hover/focus)
                >
                  {({ isActive }) => (
                    /** Renderiza la tarjeta de la receta, mostrando datos optimistas si están disponibles. */
                    <RecipeCard
                      name={optimisticData.get('name') ?? recipe.name} // Nombre optimista o real
                      totalTime={
                        optimisticData.get('totalTime') ?? recipe.totalTime
                      } // Tiempo optimista o real
                      mealPlanMultiplier={recipe.mealPlanMultiplier} // Multiplicador del plan de comidas
                      imageUrl={recipe.imageUrl} // URL de la imagen
                      isActive={isActive} // Indica si la tarjeta está activa (ruta actual coincide)
                      isLoading={isLoading} // Indica si la receta está cargando
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </RecipeListWrapper>

      {/**===============Lado derecho con ruta hija de ingredientes====================*/}
      <RecipeDetailWrapper>
        <Outlet />
      </RecipeDetailWrapper>
    </RecipePageWrapper>
  );
}
