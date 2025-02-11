import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import React from 'react';
import { z } from 'zod';
import {
  DeleteButton,
  ErrorMessage,
  Input,
  PrimaryButton,
} from '~/components/forms';
import { TimeIcon, TrashIcon } from '~/components/icons';
import db from '~/db.server';
import { classNames } from '~/utils/misc';
import validateForm from '~/utils/validation';

// El loader es una función que se ejecuta en el servidor antes de que la página se renderice.
// Sirve para cargar datos necesarios para una ruta específica.
// En este caso, usamos el loader para obtener una receta desde la base de datos.
export async function loader({ params }: LoaderFunctionArgs) {
  // `params` es un objeto que Remix proporciona automáticamente a los loaders.
  // Contiene las partes dinámicas de la URL.
  // Por ejemplo, si la ruta es `/recipes/:recipeId` y accedemos a `/recipes/123`,
  // entonces `params.recipeId` será igual a "123".
  const recipe = await db.recipe.findUnique({
    where: { id: params.recipeId },
    include: {
      ingredients: {
        select: { id: true, amount: true, name: true },
      },
    }, // Accedemos a la ID de la receta desde los parámetros. params.recipeId TIENE QUE SER IGUAL AL DE LA RUTA DINAMICA $recipeId
  });

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

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();

  //Recuperar id de la receta de los params de la url
  const recipeId = params.recipeId;

  //Como recuperar todos los nombres de cada ingrediente de una receta/En formData
  //console.log(formData.getAll('ingredientName'));

  switch (formData.get('_action')) {
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
    case '': {
      return;
    }
    default: {
      return null;
    }
  }
}

export default function RecipeDetail() {
  const data = useLoaderData<typeof loader>();

  //Para poder mostrar esta nested route (Su contenido), el padre debe tener un Outlet
  return (
    <Form method="post" reloadDocument>
      {/**Recipe title */}
      <div className="mb-2">
        {/**Se para una key no pq salgan muchos con un map sino pq sino remix no lo renderiza y no sale el valor adecudo y se queda sobreescrito sinc ambiar */}
        <Input
          key={data.recipe?.id}
          type="text"
          placeholder="Recipe Name"
          autoComplete="off"
          className="text-2xl font-extrabold"
          name="name"
          defaultValue={data.recipe?.name}
        />
        <ErrorMessage></ErrorMessage>
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
          />
          <ErrorMessage></ErrorMessage>
        </div>
      </div>
      <div className="grid grid-cols-[30%_auto_min-content] my-4 gap-2">
        {/**Titulos grid 3 columnas */}
        <h2 className="font-bold text-sm pb-1">Amount</h2>
        <h2 className="font-bold text-sm pb-1">Name</h2>
        <div></div>
        {/**Contenido de cada columna: amount-name-trashIcon */}
        {/**React.Fragment es lo mismo que <></>, no es nada, solo engloba pero se le puede poner una key que es obligatorio para el map, asi no lo pones en cada div hijo y lo englobas todo */}
        {data.recipe?.ingredients.map((ingredient) => (
          <React.Fragment key={ingredient.id}>
            <input type="hidden" name="ingredientIds[]" value={ingredient.id} />
            <div>
              <Input
                type="text"
                autoComplete="off"
                name="ingredientAmounts[]"
                defaultValue={ingredient.amount ?? ''}
              />
              <ErrorMessage></ErrorMessage>
            </div>
            <div>
              <Input
                type="text"
                autoComplete="off"
                name="ingredientNames[]"
                defaultValue={ingredient.name}
              />
              <ErrorMessage></ErrorMessage>
            </div>
            <button>
              <TrashIcon />
            </button>
          </React.Fragment>
        ))}
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
      <ErrorMessage></ErrorMessage>
      <hr className="my-4" />
      <div className="flex justify-between">
        <DeleteButton>Delete this Recipe</DeleteButton>
        <PrimaryButton name="_action" value="saveRecipe">
          {/**Estas clases y el div solo para centrar Save */}
          <div className="flex flex-col justify-center h-full">Save</div>
        </PrimaryButton>
      </div>
    </Form>
  );
}
