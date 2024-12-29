import {
  Form,
  useFetcher,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from '@remix-run/react';
import {
  createShelf,
  deleteShelf,
  getAllShelves,
  saveShelfName,
} from '~/models/pantry-shelf.server';
import { classNames } from '~/utils/misc';
import { ActionFunction, LoaderFunctionArgs } from '@remix-run/node';
import { PlusIcon, SaveIcon, SearchIcon } from '~/components/icons';
import { DeleteButton, ErrorMessage, PrimaryButton } from '~/components/forms';
import { z } from 'zod';
import validateForm from '~/utils/validation';

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

const deleteShelfSchema = z.object({
  shelfId: z.string(),
});

const saveShelfNameSchema = z.object({
  shelfName: z.string().min(1, 'Shelf name cannot be blank'), //Para shelName, tiene que ser string y min de 1 caracter (no vacio)
  shelfId: z.string(),
});

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
      return validateForm(
        formData,
        deleteShelfSchema,
        (data) => deleteShelf(data.shelfId),
        (errors) => ({ errors, status: 400 }),
      );
    }
    case 'saveShelfName': {
      return validateForm(
        formData,
        saveShelfNameSchema,
        (data) => saveShelfName(data.shelfId, data.shelfName),
        (errors) => ({ errors, status: 400 }),
      );
    }
    default: {
      return null;
    }
  }
};

function Pantry() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const createShelfFetcher = useFetcher();

  //Para el Form
  const navigation = useNavigation();
  const isSearching = navigation.formData?.has('q'); //FormData es un objeto, necesitamos metodo has() con la clave del name del form
  //YA NO, que no navegamos al crear const isCreatingShelf = navigation.formData?.get('_action') === 'createShelf';
  const isCreatingShelf =
    createShelfFetcher.formData?.get('_action') === 'createShelf';

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
      <createShelfFetcher.Form method="post">
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
      </createShelfFetcher.Form>
      <ul
        className={classNames(
          'flex gap-8 overflow-x-auto mt-4 pb-6',
          'snap-x snap-mandatory md:snap-none',
        )}
      >
        {data.shelves.map((shelf) => (
          <Shelf key={shelf.id} shelf={shelf} />
        ))}
      </ul>
    </div>
  );
}

export default Pantry;

type ShelfProps = {
  shelf: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
    }[]; //IMP []
  };
};

function Shelf({ shelf }: ShelfProps) {
  const deleteShelfFetcher = useFetcher();
  const saveShelfNameFetcher = useFetcher();

  const isDeletingShelf =
    deleteShelfFetcher.formData?.get('_action') === 'deleteShelf' &&
    deleteShelfFetcher.formData?.get('shelfId') === shelf.id;

  //Se cambia el deleting shelf a optimistic
  return isDeletingShelf ? null : (
    <li
      key={shelf.id}
      className={classNames(
        'border-2 border-primary rounded-md p-4 h-fit',
        'w-[calc(100vw-2rem)] flex-none snap-center',
        'md:w-96',
      )}
    >
      {/**Se usa optimistic UI, definir mensaje de error */}
      <saveShelfNameFetcher.Form method="post" className="flex">
        <div className="w-full mb-2">
          <input
            type="text"
            className={classNames(
              'text-2xl font-extrabold mb-2 w-full outline-none',
              'border-b-2 border-b-background focus:border-b-primary',
              saveShelfNameFetcher.data?.errors?.shelfName
                ? 'border-b-red-600'
                : '',
            )}
            defaultValue={shelf.name}
            name="shelfName"
            placeholder="Shelf Name"
            autoComplete="off"
          />
          <ErrorMessage>
            {saveShelfNameFetcher.data?.errors?.shelfId}
          </ErrorMessage>
        </div>

        <button name="_action" value="saveShelfName" className="ml-4">
          <SaveIcon />
        </button>
        <input type="hidden" name="shelfId" value={shelf.id} />
        <ErrorMessage className="pl-2">
          {saveShelfNameFetcher.data?.errors?.shelfId}
        </ErrorMessage>
      </saveShelfNameFetcher.Form>

      <ul>
        {shelf.items.map((item) => (
          <li key={item.id} className="py-2">
            {item.name}
          </li>
        ))}
      </ul>
      {/**Al poner el hook al form, este fetcher aun renderiza y envia el formulario pero SIN navegacion, actualiza el estado local NO EL GLOBAL */}
      <deleteShelfFetcher.Form method="post" className="pt-8">
        {/**Asi incluimos y mandamos el id del shelf para mandar pero no se ve */}
        <input type="hidden" name="shelfId" value={shelf.id} />
        <ErrorMessage className="pb-2">
          {deleteShelfFetcher.data?.errors?.shelfId}
        </ErrorMessage>
        <DeleteButton className="w-full" name="_action" value="deleteShelf">
          Delete Shelf
        </DeleteButton>
      </deleteShelfFetcher.Form>
    </li>
  );
}
