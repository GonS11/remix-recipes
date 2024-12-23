import {
  Form,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from '@remix-run/react';
import {
  createShelf,
  deleteShelf,
  getAllShelves,
} from '~/models/pantry-shelf.server';
import { classNames } from '~/utils/misc';
import { ActionFunction, LoaderFunctionArgs } from '@remix-run/node';
import { PlusIcon, SearchIcon } from '~/components/icons';
import { DeleteButton, PrimaryButton } from '~/components/forms';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q'); //q de la query del parametro de busqueda
  //Conexion con BD importada de db.server.ts
  //Recuperar todo de pantryshelf. findMany() devuelve una promesa (Ponerle await Y HACER ASYNC LA FUNCTION LOADER)
  //Al llamar a un modelo, el loader no sabe que lo obtenemos de prisma
  const shelves = await getAllShelves(q);
  //No se devuelve ni con json() ni con New Response JSON.stringify por incompatibilidad de tipados. Remix lo trnasforma a json automatico
  return { shelves };
}

export const action: ActionFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  //Aqui diferenciar si los botones de Form crean, eliminan shelfs... Pq sino siempre crea (Diferenciarlos por el value dado y en name _action)
  const formData = await request.formData();
  switch (formData.get('_action')) {
    case 'createShelf': {
      return createShelf();
    }
    case 'deleteShelf': {
      const shelfId = formData.get('shelfId');

      //Control de tipado
      if (typeof shelfId !== 'string') {
        return new Response(
          JSON.stringify({ error: { shelfId: 'Shelf ID must be a string' } }),
        );
      }
      return deleteShelf(shelfId);
    }
    default: {
      return null;
    }
  }
};

function Pantry() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  //Para el Form
  const navigation = useNavigation();
  const isSearching = navigation.formData?.has('q'); //FormData es un objeto, necesitamos metodo has() con la clave del name del form
  const isCreatingShelf = navigation.formData?.get('_action') === 'createShelf';
  return (
    <div>
      <Form
        className={classNames(
          'flex border-2 border-gray-300 rounded-md',
          'focus-within:border-primary md:w-80',
          isSearching ? 'animate-pulse' : '',
        )}
      >
        <button className="px-2 mr-1">
          <SearchIcon />
        </button>
        <input
          defaultValue={searchParams.get('q') ?? ''}
          type="text"
          name="q"
          autoComplete="off"
          placeholder="Search Shelves..."
          className="w-full py-3 px-2 outline-none"
        />
      </Form>
      {/**reloadDocument desactiva la recarga parcial de remix y recarga la pagina por completo. Este Form seria como un form normal pero con js */}
      <Form method="post">
        <PrimaryButton
          name="_action"
          value="createShelf"
          className="mt-4 w-full md:w-fit"
        >
          <PlusIcon />
          <span className="pl-2">
            {isCreatingShelf ? 'Creating Shelf' : 'Create Shelf'}
          </span>
        </PrimaryButton>
      </Form>
      <ul
        className={classNames(
          'flex gap-8 overflow-x-auto mt-4 pb-6',
          'snap-x snap-mandatory md:snap-none',
        )}
      >
        {data.shelves.map((shelf) => {
          {
            /**Para pending UI */
          }
          const isDeletingShelf =
            navigation.formData?.get('_action') === 'deleteShelf' &&
            navigation.formData?.get('shelfId') === shelf.id;
          return (
            <li
              key={shelf.id}
              className={classNames(
                'border-2 border-primary rounded-md p-4 h-fit',
                'w-[calc(100vw-2rem)] flex-none snap-center',
                'md:w-96',
              )}
            >
              <h1 className="text-2xl font-extrabold mb-2">{shelf.name}</h1>
              <ul>
                {shelf.items.map((item) => (
                  <li key={item.id} className="py-2">
                    {item.name}
                  </li>
                ))}
              </ul>
              <Form method="post" className="pt-8">
                {/**Asi incluimos y mandamos el id del shelf para mandar pero no se ve */}
                <input type="hidden" name="shelfId" value={shelf.id} />
                <DeleteButton
                  className="w-full"
                  name="_action"
                  value="deleteShelf"
                  isLoading={isDeletingShelf}
                >
                  {isDeletingShelf ? 'Deleting Shelf' : 'Delete Shelf'}
                </DeleteButton>
              </Form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Pantry;
