import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import {
  Form,
  isRouteErrorResponse,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useRouteError,
} from '@remix-run/react';
import React, { useState } from 'react';
import { z } from 'zod';
import {
  DeleteButton,
  ErrorMessage,
  Input,
  PrimaryButton,
} from '~/components/forms';
import { SaveIcon, TimeIcon, TrashIcon } from '~/components/icons';
import db from '~/db.server';
import { handleDelete } from '~/models/utils';
import { requireLoggedInUser } from '~/utils/auth.server';
import {
  classNames,
  useDebounceFunction,
  useServerLayoutEffect,
} from '~/utils/misc';
import validateForm from '~/utils/validation';

//==============================LOADER===========================================================
export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireLoggedInUser(request);
  // `params` es un objeto que Remix proporciona automáticamente a los loaders.
  // Contiene las partes dinámicas de la URL.
  // Por ejemplo, si la ruta es `/recipes/:recipeId` y accedemos a `/recipes/123`,
  // entonces `params.recipeId` será igual a "123".
  const recipe = await db.recipe.findUnique({
    where: { id: params.recipeId },
    include: {
      ingredients: {
        select: { id: true, amount: true, name: true },
        orderBy: {
          createAt: 'desc',
        },
      },
    }, // Accedemos a la ID de la receta desde los parámetros. params.recipeId TIENE QUE SER IGUAL AL DE LA RUTA DINAMICA $recipeId
  });

  if (recipe === null) {
    throw {
      message: 'A recipe with that id does not exist',
      status: 404,
    };
  }

  if (recipe.userId !== user.id) {
    throw {
      message: 'You are not authorized to view this recipe',
      status: 401,
    };
  }

  return {
    recipe,
    headers: {
      // Establece encabezados de control de caché:
      // 'Cache-Control' define cuánto tiempo se debe reutilizar la respuesta desde la caché antes de hacer una nueva solicitud.
      // 'max-age=10' significa que esta respuesta será válida en la caché durante 10 segundos.
      // Esto es importante para reducir la carga en el servidor cuando se usa prefetch,
      // ya que evita que Remix o el navegador hagan solicitudes repetitivas en poco tiempo.
      'Cache-Control': 'max-age=10',
    },
  };
}

interface ActionData {
  name?: string;
  totalTime?: string;
  instructions?: string;
  ingredientIds?: string[];
  ingredientAmounts?: string[];
  ingredientNames?: string[];
  newIngredientAmount?: string;
  newIngredientName?: string;
  errors?: {
    name?: string;
    totalTime?: string;
    instructions?: string;
    ingredientIds?: string[];
    ingredientAmounts?: { [key: number]: string };
    ingredientNames?: { [key: number]: string };
    newIngredientAmount?: string;
    newIngredientName?: string;
  };
}

// Como hay que hacer zodSchema por cada Fetcher y se repetirán muchas validaciones, se puede incluir en uno mayor con .and(saveNameSchema)
const saveNameSchema = z.object({
  name: z.string().min(1, 'Name cannot be blank'),
});

const saveTotalTimeSchema = z.object({
  totalTime: z.string().min(1, 'Total time cannot be blank'),
});

const saveInstructionsSchema = z.object({
  instructions: z.string().min(1, 'Instructions cannot be blank'),
});

const ingredientIdValidation = z.string().min(1, 'Ingredient ID is missing');
const ingredientAmountValidation = z.string().nullable();
const ingredientNameValidation = z.string().min(1, 'Name cannot be blank');

const saveIngredientAmountSchema = z.object({
  amount: ingredientAmountValidation,
  id: ingredientIdValidation,
});

const saveIngredientNameSchema = z.object({
  name: ingredientNameValidation,
  id: ingredientIdValidation,
});

const saveRecipeSchema = z
  .object({
    // Los tres últimos opcionales (Las nuevas no tienen estas listas) y para todos los ingredientes
    ingredientIds: z.array(ingredientIdValidation).optional(),
    ingredientAmounts: z.array(ingredientAmountValidation).optional(),
    ingredientNames: z.array(ingredientNameValidation).optional(),
  })
  .and(saveNameSchema)
  .and(saveTotalTimeSchema)
  .and(saveInstructionsSchema)
  .refine(
    // Esta validación es para saber si todos tienen el mismo tamaño y no se borra un ingrediente y se queda colgado, si eso ocurre salta error
    (data) =>
      data.ingredientIds?.length === data.ingredientAmounts?.length &&
      data.ingredientIds?.length === data.ingredientNames?.length,
    { message: 'Ingredient arrays must all be the same length' },
  );

const createIngredientSchema = z.object({
  newIngredientAmount: z.string().nullable(),
  newIngredientName: z.string().min(1, 'Name cannot be blank'),
});

//==============================ACTION===========================================================
export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireLoggedInUser(request);
  // Recuperar id de la receta de los params de la url
  const recipeId = String(params.recipeId);

  const recipe = await db.recipe.findUnique({ where: { id: recipeId } });

  if (recipe === null) {
    throw {
      message: 'A recipe with that id does not exist',
      status: 404,
    };
  }

  if (recipe.userId !== user.id) {
    throw {
      message: 'You are not authorized to make changes in this recipe',
      status: 401,
    };
  }

  const formData = await request.formData();

  // Como recuperar todos los nombres de cada ingrediente de una receta/En formData
  // console.log(formData.getAll('ingredientName'));

  const _action = formData.get('_action');

  // Para eliminar solo un ingrediente de una receta
  if (typeof _action === 'string' && _action.includes('deleteIngredient')) {
    const ingredientId = _action.split('.')[1]; // IMP el 1 para no tener un array sino un valor

    return handleDelete(() =>
      db.ingredient.delete({ where: { id: ingredientId } }),
    );
  }

  // Control de acciones de todo el cuestionario
  switch (_action) {
    case 'saveRecipe': {
      // Ahora buscando por index en las tres listas de ingredientes (TODAS IGUALES), saco el ingrediente correspondiente en cantidad y nombre
      return validateForm(
        formData,
        saveRecipeSchema,
        async ({
          // Está garantizado por FormData que el orden de los arrays es el mismo
          ingredientIds = [],
          ingredientAmounts = [],
          ingredientNames = [],
          ...data
        }) =>
          db.recipe.update({
            where: { id: recipeId },
            data: {
              ...data,
              ingredients: {
                updateMany: ingredientIds.map((id, index) => ({
                  where: { id },
                  data: {
                    amount: ingredientAmounts[index] as string,
                    name: ingredientNames[index] as string,
                  },
                })),
              },
            },
          }),
        (errors) => ({ errors, status: 400 }),
      );
    }
    case 'createIngredient': {
      return validateForm(
        formData,
        createIngredientSchema,
        ({ newIngredientAmount, newIngredientName }) =>
          db.ingredient.create({
            data: {
              recipeId,
              amount: String(newIngredientAmount),
              name: newIngredientName,
            },
          }),
        (errors) => ({ errors, status: 400 }),
      );
    }
    case 'deleteRecipe': {
      await handleDelete(() => db.recipe.delete({ where: { id: recipeId } }));

      return redirect('/app/recipes');
    }
    case 'saveName': {
      return validateForm(
        formData,
        saveNameSchema,
        (data) => db.recipe.update({ where: { id: recipeId }, data }),
        (errors) => ({ errors, status: 400 }),
      );
    }

    case 'saveTotalTime': {
      return validateForm(
        formData,
        saveTotalTimeSchema,
        (data) => db.recipe.update({ where: { id: recipeId }, data }),
        (errors) => ({ errors, status: 400 }),
      );
    }

    case 'saveInstructions': {
      return validateForm(
        formData,
        saveInstructionsSchema,
        (data) => db.recipe.update({ where: { id: recipeId }, data }),
        (errors) => ({ errors, status: 400 }),
      );
    }

    case 'saveIngredientAmount': {
      return validateForm(
        formData,
        saveIngredientAmountSchema,
        ({ id, amount }) =>
          db.ingredient.update({
            where: { id },
            data: { amount: String(amount) },
          }),
        (errors) => ({ errors, status: 400 }),
      );
    }

    case 'saveIngredientName': {
      return validateForm(
        formData,
        saveIngredientNameSchema,
        ({ id, name }) =>
          db.ingredient.update({
            where: { id },
            data: { name },
          }),
        (errors) => ({ errors, status: 400 }),
      );
    }
    default: {
      return null;
    }
  }
}

//==============================COMPONENTE PRINCIPAL====================================================

export default function RecipeDetail() {
  const data = useLoaderData<typeof loader>();

  // Para errores
  const actionData = useActionData<ActionData>();

  // Uso de Fetcher para los forms sin navegación, usar las Funciones como saveName para enviarlos Fetcher según se escriba. Añadir el onChange a cada Form correspondiente. Ahora arreglar el error también para que controle el fetcher + actionData (Save Button)
  const saveNameFetcher = useFetcher();
  const saveTotalTimeFetcher = useFetcher();
  const saveInstructionsFetcher = useFetcher();
  const createIngredientFetcher = useFetcher();

  const debouncedTime = 1000;

  /*   Ahora usaria esto para mapear en vez de los ingradientes para la lista de ingredientes pero es demasiado optimistic UI
const { renderedIngredients, addIngredient } = useOptimisticIngredients(
    data.recipe.ingredients,
    createIngredientFetcher.state,
  ); */

  //Creamos un estado para guardar valores y asi usarlos en el boton para su fetcher de new ingredient
  const [createIngredientForm, setCreateIngredientForm] = useState({
    amount: '',
    name: '',
  });

  //Usaremos el customHook debounce
  const saveName = useDebounceFunction(
    (name: string) =>
      saveNameFetcher.submit(
        {
          _action: 'saveName',
          name,
        },
        { method: 'post' },
      ),
    debouncedTime,
  );

  const saveTotalTime = useDebounceFunction(
    (totalTime: string) =>
      saveTotalTimeFetcher.submit(
        {
          _action: 'saveTotalTime',
          totalTime,
        },
        { method: 'post' },
      ),
    debouncedTime,
  );

  const saveInstructions = useDebounceFunction(
    (instructions: string) =>
      saveInstructionsFetcher.submit(
        {
          _action: 'saveInstructions',
          instructions,
        },
        { method: 'post' },
      ),
    debouncedTime,
  );

  const createIngredient = () => {
    createIngredientFetcher.submit(
      {
        _action: 'createIngredient',
        newIngredientAmount: createIngredientForm.amount,
        newIngredientName: createIngredientForm.name,
      },
      { method: 'post' },
    );
    setCreateIngredientForm({ amount: '', name: '' });
  };

  // Para poder mostrar esta nested route (Su contenido), el padre debe tener un Outlet
  return (
    <Form method="post" reloadDocument>
      {/** Recipe title */}
      <div className="mb-2">
        {/** Se para una key no pq salgan muchos con un map sino pq sino remix no lo renderiza y no sale el valor adecuado y se queda sobreescrito sin cambiar */}
        {/** Se pone !! delante de actionData?.errors?.name para hacerlo booleano */}
        <Input
          key={data.recipe?.id}
          type="text"
          placeholder="Recipe Name"
          autoComplete="off"
          className="text-2xl font-extrabold"
          name="name"
          defaultValue={data.recipe?.name}
          error={
            !!(saveNameFetcher?.data?.errors?.name || actionData?.errors?.name)
          }
          onChange={(e) => saveName(e.target.value)}
        />
        <ErrorMessage>
          {saveNameFetcher?.data?.errors?.name || actionData?.errors?.name}
        </ErrorMessage>
      </div>

      {/** Total time */}
      <div className="flex">
        <TimeIcon />
        <div className="ml-2 flex-grow">
          {/** Aquí se añade la key por lo mismo */}
          <Input
            key={data.recipe?.id}
            placeholder="Time"
            type="text"
            autoComplete="off"
            name="totalTime"
            defaultValue={data.recipe?.totalTime}
            error={
              !!(
                saveTotalTimeFetcher?.data?.errors?.totalTime ||
                actionData?.errors?.totalTime
              )
            }
            onChange={(e) => saveTotalTime(e.target.value)}
          />
          <ErrorMessage>
            {saveTotalTimeFetcher?.data?.errors?.totalTime ||
              actionData?.errors?.totalTime}
          </ErrorMessage>
        </div>
      </div>

      <div className="grid grid-cols-[30%_auto_min-content] my-4 gap-2">
        {/** Títulos grid 3 columnas */}
        <h2 className="font-bold text-sm pb-1">Amount</h2>
        <h2 className="font-bold text-sm pb-1">Name</h2>
        <div></div>
        {/** Contenido de cada columna: amount-name-trashIcon */}
        {/** React.Fragment es lo mismo que <></>, no es nada, solo engloba pero se le puede poner una key que es obligatorio para el map, así no lo pones en cada div hijo y lo englobas todo */}
        {data.recipe?.ingredients.map((ingredient, index) => (
          <IngredientRow
            key={ingredient.id}
            id={ingredient.id}
            amount={ingredient.amount}
            amountError={actionData?.errors?.[`ingredientAmounts.${index}`]}
            name={ingredient.name}
            nameError={actionData?.errors?.[`ingredientNames.${index}`]}
          />
        ))}

        {/** New Ingredient Info */}
        <div>
          <Input
            type="text"
            autoComplete="off"
            name="newIngredientAmount"
            className="border-b-gray-200"
            error={
              !!(
                createIngredientFetcher.data?.errors?.newIngredientAmoun ??
                actionData?.errors?.newIngredientAmount
              )
            }
            value={createIngredientForm.amount}
            onChange={(e) =>
              setCreateIngredientForm((values) => ({
                ...values,
                amount: e.target.value,
              }))
            }
          />
          <ErrorMessage>
            {createIngredientFetcher.data?.errors?.newIngredientAmoun ??
              actionData?.errors?.newIngredientAmount}
          </ErrorMessage>
        </div>
        <div>
          <Input
            type="text"
            autoComplete="off"
            name="newIngredientName"
            className="border-b-gray-200"
            error={
              !!(
                createIngredientFetcher.data?.errors?.newIngredientName ??
                actionData?.errors?.newIngredientName
              )
            }
            value={createIngredientForm.name}
            onChange={(e) =>
              setCreateIngredientForm((values) => ({
                ...values,
                name: e.target.value,
              }))
            }
          />
          <ErrorMessage>
            {createIngredientFetcher.data?.errors?.newIngredientName ??
              actionData?.errors?.newIngredientName}
          </ErrorMessage>
        </div>
        <button
          name="_action"
          value="createIngredient"
          onClick={(e) => {
            e.preventDefault();
            createIngredient();
          }}
        >
          <SaveIcon />
        </button>
      </div>
      {/** Textarea de instrucciones */}
      {/** Se pone block pq sino el padding no hace caso y lo de la key por lo mismo */}
      <label
        htmlFor="instructions"
        className="block font-bold text-sm pb-2 w-fit"
      >
        Instructions
      </label>
      <textarea
        key={data.recipe?.id}
        id="instructions"
        name="instructions"
        placeholder="Instructions go here"
        defaultValue={data.recipe?.instructions}
        className={classNames(
          'w-full h-56 rounded-md outline-none',
          'focus:border-2 focus:p-3 focus:border-primary duration-300',
          saveInstructionsFetcher?.data?.errors?.instructions ||
            actionData?.errors?.instructions
            ? 'border-2 border-red-500 p-3'
            : '',
        )}
        onChange={(e) => saveInstructions(e.target.value)}
      />
      <ErrorMessage>
        {saveInstructionsFetcher?.data?.errors?.instructions ||
          actionData?.errors?.instructions}
      </ErrorMessage>
      <hr className="my-4" />
      <div className="flex justify-between">
        <DeleteButton name="_action" value="deleteRecipe">
          Delete this Recipe
        </DeleteButton>
        <PrimaryButton name="_action" value="saveRecipe">
          {/** Estas clases y el div solo para centrar Save */}
          <div className="flex flex-col justify-center h-full">Save</div>
        </PrimaryButton>
      </div>
    </Form>
  );
}

type IngredientRowProps = {
  id: string;
  amount: string | null;
  amountError?: string;
  name: string;
  nameError?: string;
};

// Se crea una función para la parte de toda la lista de ingredientes y con cambio de variables de ingredient.id por id... etc. Para crear componente con props

//======================================================
function IngredientRow({
  id,
  amount,
  amountError,
  name,
  nameError,
}: IngredientRowProps) {
  // Hacemos los fetches para amount y name
  const saveAmountFetcher = useFetcher();
  const saveNameFetcher = useFetcher();

  const debouncedTime = 1000;

  const saveAmount = useDebounceFunction(
    (amount: string) =>
      saveAmountFetcher.submit(
        {
          _action: 'saveIngredientAmount',
          amount,
          id,
        },
        { method: 'post' },
      ),
    debouncedTime,
  );

  const saveName = useDebounceFunction(
    (name: string) =>
      saveNameFetcher.submit(
        {
          _action: 'saveIngredientName',
          name,
          id,
        },
        { method: 'post' },
      ),
    debouncedTime,
  );

  return (
    <React.Fragment>
      <input type="hidden" name="ingredientIds[]" value={id} />
      <div>
        <Input
          type="text"
          autoComplete="off"
          name="ingredientAmounts[]"
          defaultValue={amount ?? ''}
          error={!!(saveAmountFetcher?.data?.errors?.amount || amountError)}
          onChange={(e) => saveAmount(e.target.value)}
        />
        <ErrorMessage>
          {saveAmountFetcher?.data?.errors?.amount || amountError}
        </ErrorMessage>
      </div>
      <div>
        <Input
          type="text"
          autoComplete="off"
          name="ingredientNames[]"
          defaultValue={name}
          error={!!(saveNameFetcher?.data?.errors?.name || nameError)}
          onChange={(e) => saveName(e.target.value)}
        />
        <ErrorMessage>
          {saveNameFetcher?.data?.errors?.name || nameError}
        </ErrorMessage>
      </div>

      {/** Este botón es para borrar un ingrediente y por eso le ponemos el ID con un punto después para saber cuál borrar pq envía todo el cuestionario al darle */}
      <button name="_action" value={`deleteIngredient.${id}`}>
        <TrashIcon />
      </button>
    </React.Fragment>
  );
}

//--------------OPTIMISTIC ITEMS----------
type RenderedIngredient = {
  id: string; //Tenemos que crear un id temporal siempre que creemos un Ingredient optimista
  name: string;
  amount: string | null;
  isOptimistic?: boolean; //Sirve para deshabilitar el boton de eliminar Ingredient, ya que si es optimista y aun no se ha renderizado no funciona y es inutil hasta que no se renderize del todo
};

function useOptimisticIngredients(
  savedIngredients: Array<RenderedIngredient>,
  createShelfIngredientState: 'idle' | 'submitting' | 'loading',
) {
  const [optimisticIngredients, setOptimisticIngredients] = React.useState<
    Array<RenderedIngredient>
  >([]);

  const renderedIngredients = [...savedIngredients, ...optimisticIngredients];

  //useLayoutEffect es como useEffect pero se ejecuta antes de que react incluya los cambios en la UI
  //Sirve para eliminar los Ingredients optimistas cuando se renderizan los del servidor
  useServerLayoutEffect(() => {
    if (createShelfIngredientState === 'idle') {
      //Prevenir un bug que elimina Ingredient si se borra a la vez que se crea otro, que se controle segun el estado de actualizacion/renderizado este
      setOptimisticIngredients([]);
    }
  }, [createShelfIngredientState]);

  const addIngredient = (amount: string | null, name: string) => {
    setOptimisticIngredients((ingredients) => [
      ...ingredients,
      { id: createIngredientId(), name, amount, isOptimistic: true },
    ]);
  };

  return { renderedIngredients, addIngredient };
}

function createIngredientId() {
  //Crea un id aleatorio para optimisticUI Item
  return `${Math.round(Math.random() * 1_000_000)}`;
}

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
