import db from '~/db.server';
import { requireLoggedInUser } from './auth.server';

//Abstraemos el control de autorizacion para ver si puede hacer acciones sobre la receta o no. Es server.ts, pq se usa en el action
export async function canChangeRecipe(request: Request, recipeId: string) {
  const user = await requireLoggedInUser(request);

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
}
