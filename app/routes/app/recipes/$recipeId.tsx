import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import {
  Form,
  isRouteErrorResponse,
  redirect,
  useActionData,
  useLoaderData,
  useRouteError,
} from '@remix-run/react';
import React from 'react';
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
import { classNames } from '~/utils/misc';
import validateForm from '~/utils/validation';

// El loader es una función que se ejecuta en el servidor antes de que la página se renderice.
// Sirve para cargar datos necesarios para una ruta específica.
// En este caso, usamos el loader para obtener una receta desde la base de datos.
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
      message: 'You are not authorized to view in this recipe',
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

const saveRecipeSchema = z
  .object({
    name: z.string().min(1, 'Name cannot be blank'),
    totalTime: z.string().min(1, 'Total time cannot be blank'),
    instructions: z.string().min(1, 'Instructions cannot be blank'),
    //Los tres ultimos opcionales (Las nuevas no tienen estas listas) y para todos los ingrsientes
    ingredientIds: z
      .array(z.string().min(1, 'Ingredient ID is missing'))
      .optional(),
    ingredientAmounts: z.array(z.string().nullable()).optional(),
    ingredientNames: z
      .array(z.string().min(1, 'Name cannot be blank'))
      .optional(),
  })
  .refine(
    //Esta validacion es para saber si todos tienen el mismo tamaño y no se borra un ingrediente y se queda colgado, si eso courre salta error
    (data) =>
      data.ingredientIds?.length === data.ingredientAmounts?.length &&
      data.ingredientIds?.length === data.ingredientNames?.length,
    { message: 'Ingredient arrays must all be the same length' },
  );

const createIngredientSchema = z.object({
  newIngredientAmount: z.string().nullable(),
  newIngredientName: z.string().min(1, 'Name time cannot be blank'),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireLoggedInUser(request);
  //Recuperar id de la receta de los params de la url
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

  //Como recuperar todos los nombres de cada ingrediente de una receta/En formData
  //console.log(formData.getAll('ingredientName'));

  const _action = formData.get('_action');

  //Para eliminar solo un ingreidente de una receta
  if (typeof _action === 'string' && _action.includes('deleteIngredient')) {
    const ingredientId = _action.split('.')[1]; //IMP el 1 para no tener un array sino un valor

    return handleDelete(() =>
      db.ingredient.delete({ where: { id: ingredientId } }),
    );
  }

  //Control de acciones de todo el cuestionario
  switch (_action) {
    case 'saveRecipe': {
      //Ahora buscando por index en las tres listas de ingredientes (TODAS IGUALES), saco el ingrediente correspondiente en cantidad y nombre
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
    default: {
      return null;
    }
  }
}

export default function RecipeDetail() {
  const data = useLoaderData<typeof loader>();

  //Para errores
  const actionData = useActionData<ActionData>();

  //Para poder mostrar esta nested route (Su contenido), el padre debe tener un Outlet
  return (
    <Form method="post" reloadDocument>
      {/**Recipe title */}
      <div className="mb-2">
        {/**Se para una key no pq salgan muchos con un map sino pq sino remix no lo renderiza y no sale el valor adecudo y se queda sobreescrito sinc ambiar */}
        {/**Se pone !! delante de actionData?.errors?.name para hacerlo booleano */}
        <Input
          key={data.recipe?.id}
          type="text"
          placeholder="Recipe Name"
          autoComplete="off"
          className="text-2xl font-extrabold"
          name="name"
          defaultValue={data.recipe?.name}
          error={!!actionData?.errors?.name}
        />
        <ErrorMessage>{actionData?.errors?.name}</ErrorMessage>
      </div>

      {/**Total time */}
      <div className="flex">
        <TimeIcon />
        <div className="ml-2 flex-grow">
          {/**Aqui se añade la key por lo mismo */}
          <Input
            key={data.recipe?.id}
            placeholder="Time"
            type="text"
            autoComplete="off"
            name="totalTime"
            defaultValue={data.recipe?.totalTime}
            error={!!actionData?.errors?.totalTime}
          />
          <ErrorMessage>{actionData?.errors?.totalTime}</ErrorMessage>
        </div>
      </div>
      <div className="grid grid-cols-[30%_auto_min-content] my-4 gap-2">
        {/**Titulos grid 3 columnas */}
        <h2 className="font-bold text-sm pb-1">Amount</h2>
        <h2 className="font-bold text-sm pb-1">Name</h2>
        <div></div>
        {/**Contenido de cada columna: amount-name-trashIcon */}
        {/**React.Fragment es lo mismo que <></>, no es nada, solo engloba pero se le puede poner una key que es obligatorio para el map, asi no lo pones en cada div hijo y lo englobas todo */}
        {data.recipe?.ingredients.map((ingredient, index) => (
          <React.Fragment key={ingredient.id}>
            <input type="hidden" name="ingredientIds[]" value={ingredient.id} />
            <div>
              <Input
                type="text"
                autoComplete="off"
                name="ingredientAmounts[]"
                defaultValue={ingredient.amount ?? ''}
                error={!!actionData?.errors?.[`ingredientAmounts.${index}`]}
              />
              <ErrorMessage>
                {actionData?.errors?.[`ingredientAmounts.${index}`]}
              </ErrorMessage>
            </div>
            <div>
              <Input
                type="text"
                autoComplete="off"
                name="ingredientNames[]"
                defaultValue={ingredient.name}
                error={!!actionData?.errors?.[`ingredientNames.${index}`]}
              />
              <ErrorMessage>
                {actionData?.errors?.[`ingredientNames.${index}`]}
              </ErrorMessage>
            </div>

            {/**Este boton de para borrar un ingradiente y por eso le ponemos el ID con un punto despues para saber cual borrar pq envia todo el cuestionario al darle */}
            <button name="_action" value={`deleteIngredient.${ingredient.id}`}>
              <TrashIcon />
            </button>
          </React.Fragment>
        ))}

        {/**New Ingredient Info */}
        <div>
          <Input
            type="text"
            autoComplete="off"
            name="newIngredientAmount"
            className="border-b-gray-200"
            error={!!actionData?.errors?.newIngredientAmount}
          />
          <ErrorMessage>{actionData?.errors?.newIngredientAmount}</ErrorMessage>
        </div>
        <div>
          <Input
            type="text"
            autoComplete="off"
            name="newIngredientName"
            className="border-b-gray-200"
            error={!!actionData?.errors?.newIngredientName}
          />
          <ErrorMessage>{actionData?.errors?.newIngredientName}</ErrorMessage>
        </div>
        <button name="_action" value="createIngredient">
          <SaveIcon />
        </button>
      </div>
      {/**Textarea de instrucciones */}
      {/**Se pone bloxk pq sino el padding no hace caso y lo de la jey por lo mismo */}
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
        )}
      />
      <ErrorMessage>{actionData?.errors?.instructions}</ErrorMessage>
      <hr className="my-4" />
      <div className="flex justify-between">
        <DeleteButton name="_action" value="deleteRecipe">
          Delete this Recipe
        </DeleteButton>
        <PrimaryButton name="_action" value="saveRecipe">
          {/**Estas clases y el div solo para centrar Save */}
          <div className="flex flex-col justify-center h-full">Save</div>
        </PrimaryButton>
      </div>
    </Form>
  );
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
