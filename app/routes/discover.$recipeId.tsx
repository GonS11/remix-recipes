import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  DiscoverRecipeDetails,
  DiscoverRecipeHeader,
} from '~/components/discover';
import db from '~/db.server';

//Igual que la ruta dinamica de recipes pero no esta nested
export async function loader({ params }: LoaderFunctionArgs) {
  //Para mostrar la receta (Esta es la ruta de la receta clickada), sacamos su id (Se para por la url al hacer click) y lo buscamos

  //Se pasan los ingredientes tambien pq los necesita el DiscoverRecipeDetails
  const recipe = await db.recipe.findUnique({
    where: { id: params.recipeId },
    include: {
      ingredients: {
        select: {
          id: true,
          name: true,
          amount: true,
        },
      },
    },
  });

  if (recipe === null) {
    throw {
      message: `A recipe with id ${params.id} does not exist.`,
      status: 400,
    };
  }

  return { recipe };
}

function DiscoverRecipe() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="md:h-[calc(100vh-1rem)] m-[-1rem] overflow-auto">
      <DiscoverRecipeHeader recipe={data.recipe} />
      <DiscoverRecipeDetails recipe={data.recipe} />
    </div>
  );
}

export default DiscoverRecipe;
