import {
  Form,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useNavigation,
  useRouteError,
  useSearchParams,
} from '@remix-run/react';
import {
  createShelf,
  deleteShelf,
  getAllShelves,
  getShelf,
  saveShelfName,
} from '~/models/pantry-shelf.server';
import { classNames, useIsHydrated, useServerLayoutEffect } from '~/utils/misc';
import { ActionFunction, LoaderFunctionArgs } from '@remix-run/node';
import { PlusIcon, SaveIcon, SearchIcon, TrashIcon } from '~/components/icons';
import { DeleteButton, ErrorMessage, PrimaryButton } from '~/components/forms';
import { z } from 'zod';
import validateForm from '~/utils/validation';
import React from 'react';
import {
  createShelfItem,
  deleteShelfItem,
  getShelfItem,
} from '~/models/pantry-item.server';
import { requireLoggedInUser } from '~/utils/auth.server';

//----------LOADER----------

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireLoggedInUser(request); //COMPRUEBA SI ESTA LOGUEADO Y DEVUELVE USER para el userId
  //En los loader se puede poner como variable ademas de request, params, que te permite sacar los parametros sacados e inmcluso acceder a los de una ruta hija (IMP)
  const url = new URL(request.url);
  const q = url.searchParams.get('q'); //q de la query del parametro de busqueda
  //Conexion con BD importada de db.server.ts
  //Recuperar todo de pantryshelf. findMany() devuelve una promesa (Ponerle await Y HACER ASYNC LA FUNCTION LOADER)
  //Al llamar a un modelo, el loader no sabe que lo obtenemos de prisma
  const shelves = await getAllShelves(user.id, q);
  //No se devuelve ni con json() ni con New Response JSON.stringify por incompatibilidad de tipados. Remix lo trnasforma a json automatico
  return { shelves };
}

//-------VALIDACIONES ZOD--------

const deleteShelfSchema = z.object({
  shelfId: z.string(),
});

const saveShelfNameSchema = z.object({
  shelfName: z.string().min(1, 'Shelf name cannot be blank'), //Para shelName, tiene que ser string y min de 1 caracter (no vacio)
  shelfId: z.string(),
});

const createShelfItemSchema = z.object({
  shelfId: z.string(),
  itemName: z.string().min(1, 'Item name cannot be blank'),
});

const deleteShelfItemSchema = z.object({
  itemId: z.string(),
});

//---------ACTION------

export const action: ActionFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const user = await requireLoggedInUser(request); //COMPRUEBA SI ESTA LOGUEADO

  //Aqui diferenciar si los botones de Form crean, eliminan shelfs... Pq sino siempre crea (Diferenciarlos por el value dado y en name _action)
  const formData = await request.formData();

  switch (formData.get('_action')) {
    //Filtrar los casos de create shelf, item para que solo lo haga un usuario determinado y se asignen a el solo
    case 'createShelf': {
      //Control con user.id
      return createShelf(user.id);
    }
    case 'deleteShelf': {
      return validateForm(
        formData,
        deleteShelfSchema,
        async (data) => {
          //1º Comprobar el rresponsable de esa tabla
          const shelf = await getShelf(data.shelfId);

          //2º Mensaje (asegurar que shelf existe && accion de comprobacion)
          if (shelf !== null && shelf?.userId !== user.id) {
            throw new Response(
              JSON.stringify(
                'This shelf is not yours, so you cannot delete it',
              ),
              {
                status: 401, //Anathorize
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }

          //3º Realizar la accion
          return deleteShelf(data.shelfId);
        },
        (errors) => ({ errors, status: 400 }),
      );
    }
    case 'saveShelfName': {
      return validateForm(
        formData,
        saveShelfNameSchema,
        async (data) => {
          //1º Comprobar el rresponsable de esa tabla
          const shelf = await getShelf(data.shelfId);

          //2º Mensaje (asegurar que shelf existe && accion de comprobacion)
          if (shelf !== null && shelf?.userId !== user.id) {
            throw new Response(
              JSON.stringify(
                'This shelf is not yours, so you cannot change its name',
              ),
              {
                status: 401, //Anathorize
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }

          //3º Realizar la accion
          return saveShelfName(data.shelfId, data.shelfName);
        },
        (errors) => ({ errors, status: 400 }),
      );
    }
    case 'createShelfItem': {
      return validateForm(
        formData,
        createShelfItemSchema,
        //Control con user.id
        (data) => createShelfItem(user.id, data.shelfId, data.itemName),
        (errors) => ({ errors, status: 400 }),
      );
    }
    case 'deleteShelfItem': {
      return validateForm(
        formData,
        deleteShelfItemSchema,
        async (data) => {
          //1º Recuperamos el item por su id
          const item = await getShelfItem(data.itemId);

          //2º Control de usuario y propietario de item
          if (item !== null && item.id !== user.id) {
            throw new Response(
              JSON.stringify('This item is not yours, so you cannot delete it'),
              {
                status: 401, //Anathorize
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }

          //3º Accion
          return deleteShelfItem(data.itemId);
        },
        (errors) => ({ errors, status: 400 }),
      );
    }
    default: {
      return null;
    }
  }
};

//-------------PANTRY-------------------

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

//--------------SHELF-------------------------

//Definir LoaderData para obtener los valores de manera dinamica y no desglosarlo manualmente

type LoaderData = {
  shelves: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
    }[];
  }[];
};

/* Tipado MANUAL
type ShelfProps = {
  shelf: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
    }[]; //IMP []
  };
};*/

// TIPADO DINAMICO
type ShelfProps = {
  shelf: LoaderData['shelves'][number];
};

function Shelf({ shelf }: ShelfProps) {
  const deleteShelfFetcher = useFetcher();
  const saveShelfNameFetcher = useFetcher();
  const createShelfItemFetcher = useFetcher();

  const createItemFormRef = React.useRef<HTMLFormElement>(null);

  //shelf.items son los saveItems del loader
  const { renderedItems, addItem } = useOptimisticItems(
    shelf.items,
    createShelfItemFetcher.state,
  );

  const isHydrated = useIsHydrated();

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
        <div className="w-full mb-2 peer">
          <input
            type="text"
            required
            defaultValue={shelf.name}
            name="shelfName"
            placeholder="Shelf Name"
            autoComplete="off"
            className={classNames(
              'text-2xl font-extrabold mb-2 w-full outline-none',
              'border-b-2 border-b-background focus:border-b-primary',
              saveShelfNameFetcher.data?.errors?.shelfName
                ? 'border-b-red-600'
                : '',
            )}
            onChange={(event) =>
              //Validar si no esta vacio
              event.target.value !== '' &&
              saveShelfNameFetcher.submit(
                {
                  _action: 'saveShelfName',
                  shelfName: event.target.value,
                  shelfId: shelf.id,
                },
                { method: 'post' },
              )
            }
          />
          <ErrorMessage>
            {saveShelfNameFetcher.data?.errors?.shelfId}
          </ErrorMessage>
        </div>
        {/**Mostrar boton de nuevo nombre si no esta hidratado, si no activas js, tira de html y carga este button para poder insertar un nuevo nombre */}
        {isHydrated ? null : (
          <button
            name="_action"
            value="saveShelfName"
            className={classNames(
              'ml-4 opacity-0 hover:opacity-100 focus:opacity-100',
              'peer-focus-within:opacity-100',
              'transition-opacity duration-200',
            )}
          >
            <SaveIcon />
          </button>
        )}
        <input type="hidden" name="shelfId" value={shelf.id} />
        <ErrorMessage className="pl-2">
          {saveShelfNameFetcher.data?.errors?.shelfId}
        </ErrorMessage>
      </saveShelfNameFetcher.Form>

      <createShelfItemFetcher.Form
        method="post"
        className="flex py-2 peer"
        ref={createItemFormRef}
        onSubmit={(event) => {
          const target = event.target as HTMLFormElement; //Explicitamente le dices el tipo de target para acceder a elements
          const itemNameInput = target.elements.namedItem(
            'itemName',
          ) as HTMLInputElement; //Ayudar al tipado tambien

          addItem(itemNameInput.value);

          event.preventDefault(); //Evitar que se envie el formulario

          //Hacemos el submit de enviar nosotros
          createShelfItemFetcher.submit(
            {
              itemName: itemNameInput.value,
              shelfId: shelf.id,
              _action: 'createShelfItem',
            },
            { method: 'post' },
          );
          createItemFormRef.current?.reset(); //Resetea los inputs del form
        }}
      >
        <div className="w-full mb-2">
          <input
            type="text"
            required
            name="itemName"
            placeholder="New Item"
            autoComplete="off"
            className={classNames(
              'w-full outline-none',
              'border-b-2 border-b-background focus:border-b-primary',
              createShelfItemFetcher.data?.errors?.itemName
                ? 'border-b-red-600'
                : '',
            )}
          />
          <ErrorMessage>
            {createShelfItemFetcher.data?.errors?.shelfId}
          </ErrorMessage>
        </div>

        <button
          name="_action"
          value="createShelfItem"
          className={classNames(
            'ml-4 opacity-0 hover:opacity-100 focus:opacity-100',
            'peer-focus-within:opacity-100',
            'transition-opacity duration-200',
          )}
        >
          <SaveIcon />
        </button>
        <input type="hidden" name="shelfId" value={shelf.id} />
        <ErrorMessage className="pl-2">
          {createShelfItemFetcher.data?.errors?.shelfId}
        </ErrorMessage>
      </createShelfItemFetcher.Form>

      <ul>
        {/*Se comenta pq mejor renderizar d eun estado que se actuariza correctamente para renderedItems
        shelf.items.map((item) => (
          <ShelfItem key={item.id} shelfItem={item} />
        ))*/}
        {renderedItems.map((item) => (
          <ShelfItem key={item.id} shelfItem={item} />
        ))}
      </ul>
      {/**Al poner el hook al form, este fetcher aun renderiza y envia el formulario pero SIN navegacion, actualiza el estado local NO EL GLOBAL */}
      <deleteShelfFetcher.Form
        method="post"
        className="pt-8"
        onSubmit={(event) => {
          if (!confirm('Are you sure you want to delete this shelf?')) {
            event.preventDefault(); //Se evita que s eenvie si damos a no
          }
        }}
      >
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

//---------------SHELF ITEM----------------
/**Tipado MANUAL
 * 
 * type ShelfItemProps = {
  shelfItem: {
    id: string;
    name: string;
  };
};
 * 
 */

type ShelfItemProps = {
  //shelfItem: LoaderData['shelves'][number]['items'][number];
  shelfItem: RenderedItem; //Pq renderizamos de renderedItems no de shelf.items
};

//Se crea para poder usar el fetcher para eliminar item que dentro del codigo "visual" no se ponen hooks
//Crear form para eliminar
function ShelfItem({ shelfItem }: ShelfItemProps) {
  const deleteShelfItemFetcher = useFetcher();
  const isDeletingItem = !!deleteShelfItemFetcher.formData; //Los !! convierten el formData en boolean. Sera true si la validacion se esta llevando a cabo

  return isDeletingItem ? null : (
    <li className="py-2">
      <deleteShelfItemFetcher.Form method="post" className="flex">
        <p className="w-full">{shelfItem.name}</p>
        {/**Si es optimista se deshabilita */}
        {shelfItem.isOptimistic ? null : (
          <button name="_action" value="deleteShelfItem">
            <TrashIcon />
          </button>
        )}
        <input type="hidden" name="itemId" value={shelfItem.id} />
        <ErrorMessage className="pl-2">
          {deleteShelfItemFetcher.data?.errors?.itemId}
        </ErrorMessage>
      </deleteShelfItemFetcher.Form>
    </li>
  );
}

//--------------OPTIMISTIC ITEMS----------
type RenderedItem = {
  id: string; //Tenemos que crear un id temporal siempre que creemos un item optimista
  name: string;
  isOptimistic?: boolean; //Sirve para deshabilitar el boton de eliminar item, ya que si es optimista y aun no se ha renderizado no funciona y es inutil hasta que no se renderize del todo
};

function useOptimisticItems(
  savedItems: Array<RenderedItem>,
  createShelfItemState: 'idle' | 'submitting' | 'loading',
) {
  const [optimisticItems, setOptimisticItems] = React.useState<
    Array<RenderedItem>
  >([]);

  const renderedItems = [...optimisticItems, ...savedItems];

  //Ordenar alfabeticamente renderedItems
  renderedItems.sort((a, b) => {
    if (a.name === b.name) return 0;
    //Si devuelve -1 se ordena como menor
    return a.name < b.name ? -1 : 1;
  });

  //useLayoutEffect es como useEffect pero se ejecuta antes de que react incluya los cambios en la UI
  //Sirve para eliminar los items optimistas cuando se renderizan los del servidor
  useServerLayoutEffect(() => {
    if (createShelfItemState === 'idle') {
      //Prevenir un bug que elimina item si se borra a la vez que se crea otro, que se controle segun el estado de actualizacion/renderizado este
      setOptimisticItems([]);
    }
  }, [createShelfItemState]);

  const addItem = (name: string) => {
    setOptimisticItems((prevItems) => [
      ...prevItems,
      { id: createItemId(), name, isOptimistic: true },
    ]);
  };

  return { renderedItems, addItem };
}

function createItemId() {
  //Crea un id aleatorio para optimisticUI Item
  return `${Math.round(Math.random() * 1_000_000)}`;
}

//Se crea este control de errores pq el de root es muy generico y que te viaje a una pagina completamente diferente es una mierda
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="bg-red-600 text-white rounded-md p-4">
        <h1 className="mb-2">
          {error.status} - {error.statusText}
        </h1>
        <p>{error.data.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-red-600 text-white rounded-md p-4">
      <h1 className="mb-2">An unexpected error occurred</h1>
    </div>
  );
}
