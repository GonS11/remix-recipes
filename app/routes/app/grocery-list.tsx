import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { CheckCircleIcon } from '~/components/icons';
import db from '~/db.server';
import { requireLoggedInUser } from '~/utils/auth.server';
import validateForm from '~/utils/validation';

// Definimos el tipo para un ítem de la lista de compras
type GroceryListItem = {
  id: string;
  name: string;
  uses: Array<{
    id: string;
    amount: string | null;
    recipeName: string;
    multiplier: number;
  }>;
};

//Fx comparar ingredientes si hay o no
function isMatch(ingredientName: string, pantryItemName: string) {
  const lowerIngredientName = ingredientName.toLocaleLowerCase();
  const lowerPantryItemName = pantryItemName.toLocaleLowerCase();
  return lowerIngredientName === lowerPantryItemName;
}

//============================LOADER=======================================
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireLoggedInUser(request);

  // Obtener ingredientes del plan de comidas del usuario
  const ingredients = await db.ingredient.findMany({
    where: {
      recipe: {
        userId: user.id,
        mealPlanMultiplier: { not: null }, // Solo ingredientes con multiplicador definido
      },
    },
    include: {
      recipe: {
        select: {
          name: true,
          mealPlanMultiplier: true,
        },
      },
    },
  });

  // Obtener ítems de la despensa del usuario
  const pantryItems = await db.pantryItem.findMany({
    where: { userId: user.id },
  });

  // Filtrar ingredientes que no están en la despensa
  const missingIngredients = ingredients.filter(
    (ingredient) =>
      !pantryItems.find((pantryItem) =>
        isMatch(ingredient.name, pantryItem.name),
      ),
  );

  // Convertir ingredientes faltantes en el formato de GroceryListItem
  const groceryListItems = missingIngredients.reduce<{
    [key: string]: GroceryListItem; // Acumulador: clave = nombre del ingrediente, valor = GroceryListItem
  }>((groceryListItemMapSoFar, ingredient) => {
    if (ingredient.recipe.mealPlanMultiplier === null) {
      throw new Error('multiplier was unexpected null'); // Nunca debería ocurrir
    }

    const ingredientName = ingredient.name.toLocaleLowerCase(); // Normalizar nombre
    const existing = groceryListItemMapSoFar[ingredientName] ?? { uses: [] }; // Usos existentes o vacío

    return {
      ...groceryListItemMapSoFar, // Mantener entradas existentes
      [ingredientName]: {
        id: ingredient.id, // ID del ingrediente
        name: ingredientName, // Nombre normalizado
        uses: [
          ...existing.uses, // Usos existentes
          {
            id: ingredient.recipeId, // ID de la receta
            amount: ingredient.amount, // Cantidad del ingrediente
            recipeName: ingredient.recipe.name, // Nombre de la receta
            multiplier: ingredient.recipe.mealPlanMultiplier, // Multiplicador del plan
          },
        ],
      },
    };
  }, {}); // Inicializar acumulador como objeto vacío

  // Devolver lista de compras en formato esperado
  return { groceryList: Object.values(groceryListItems) };
}

function getGroceryTripShelName() {
  //Funcion para obtener una Shelf con la fecha de hoy
  const date = new Date().toLocaleDateString('en-us', {
    month: 'short',
    day: 'numeric',
  });

  return `Grocery Trip - ${date}`;
}

//=============ZOD SCHEMA==================
const checkOffItemSchema = z.object({
  name: z.string(),
});

//=================ACTION==========================
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireLoggedInUser(request);
  const formData = await request.formData();

  switch (formData.get('_action')) {
    case 'checkOffItem': {
      //Para eliminarlo de aqui solo hay que añadirlo a la pantry asi ya los tienes y no los muestra. En input hidden enviar el nombre del ingredient y asi añadirlo a la pantry
      //Lo que haremos es enviar estos a una pantry con la fecha de hoy
      return validateForm(
        formData,
        checkOffItemSchema,
        async ({ name }) => {
          const shelName = getGroceryTripShelName();

          // Validar si ya existe una estantería con el nombre de la fecha actual
          let shoppingTripShelf = await db.pantryShelf.findFirst({
            where: { userId: user.id, name: shelName },
          });

          if (!shoppingTripShelf) {
            // Si no existe, se crea una nueva estantería
            shoppingTripShelf = await db.pantryShelf.create({
              data: { userId: user.id, name: shelName }, // Usar shelName, no name
            });
          }

          // Crear el ítem en la despensa asociado a la estantería
          return db.pantryItem.create({
            data: {
              userId: user.id,
              name, // Nombre del ingrediente
              shelfId: shoppingTripShelf.id, // ID de la estantería creada o encontrada
            },
          });
        },
        (errors) => ({ errors, status: 400 }),
      );
    }
    default: {
      return null;
    }
  }
}

// ================COMPONENTE UNA LISTA DE INGREDIENTES QUE COMPRAR================
function GroceryListItem({ item }: { item: GroceryListItem }) {
  const DeleteMealPlanFetcher = useFetcher();

  // Si el fetcher está en estado de envío, no renderizamos el ítem
  return DeleteMealPlanFetcher.state !== 'idle' ? null : (
    <div className="flex shadow-md rounded-md p-4">
      <div className="flex-grow">
        <h1 className="text-sm font-bold mb-2 uppercase">{item.name}</h1>
        <ul>
          {item.uses.map((use) => (
            <li key={use.id} className="py-1">
              {use.amount} for {use.recipeName} (x{use.multiplier})
            </li>
          ))}
        </ul>
      </div>
      <DeleteMealPlanFetcher.Form
        method="post"
        className="flex flex-col justify-center"
      >
        <input type="hidden" name="name" value={item.name} />
        <button
          name="_action"
          value="checkOffItem"
          className="hover:text-primary"
        >
          <CheckCircleIcon />
        </button>
      </DeleteMealPlanFetcher.Form>
    </div>
  );
}

//=============COMPONENTE PRINCIPAL==============================
function GroceryList() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {data.groceryList.map((item) => (
        <GroceryListItem key={item.id} item={item} />
      ))}
    </div>
  );
}

export default GroceryList;
