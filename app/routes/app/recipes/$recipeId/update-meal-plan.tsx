import { Form, Link, redirect, useActionData } from '@remix-run/react';
import ReactModal from 'react-modal';
import {
  DeleteButton,
  ErrorMessage,
  IconInput,
  PrimaryButton,
} from '~/components/forms';
import { XIcon } from '~/components/icons';
import { useRecipeContext } from '../$recipeId';
import { ActionFunctionArgs } from '@remix-run/node';
import { canChangeRecipe } from '~/utils/abilities.server';
import db from '~/db.server';
import { z } from 'zod';
import validateForm from '~/utils/validation';

// ReactModal: Pantalla que se superpone a todo
//==============================ZOD VALIDATION====================================================
const updateMealPlanSchema = z.object({
  // Como es número pero se parsea a string, hay que transformarlo
  mealPlanMultiplier: z.preprocess(
    (value) => parseInt(String(value)),
    z.number().min(1, 'Multiplier must be at least 1'),
  ),
});

//==============================ACTION===========================================================
export async function action({ request, params }: ActionFunctionArgs) {
  // Control de usuario con autorización (en función abilities.server.ts)
  const recipeId = String(params.recipeId);
  await canChangeRecipe(request, recipeId);

  // Switch de acciones
  const formData = await request.formData();
  const _action = formData.get('_action');

  switch (_action) {
    case 'updateMealPlan': {
      return validateForm(
        formData,
        updateMealPlanSchema,
        async ({ mealPlanMultiplier }) => {
          await db.recipe.update({
            where: { id: recipeId },
            data: { mealPlanMultiplier },
          });

          // Cerramos el modal
          return redirect('..');
        },
        (errors) => ({ errors, status: 400 }),
      );
    }

    case 'removeMealPlan': {
      await db.recipe.update({
        where: { id: recipeId },
        data: { mealPlanMultiplier: null },
      });

      // Cerramos el modal
      return redirect('..');
    }

    default: {
      return null;
    }
  }
}

// Tipado para actionData
interface ActionData {
  errors?: {
    mealPlanMultiplier?: string;
  };
}

//==============================COMPONENTE PRINCIPAL====================================================
function UpdateMealPlan() {
  // Obtenemos datos del padre con este customHook
  const { recipeName, mealPlanMultiplier } = useRecipeContext();
  const actionData = useActionData<ActionData>();

  // Configura ReactModal solo en el cliente
  if (typeof window !== 'undefined') {
    ReactModal.setAppElement('body');
  }

  return (
    <ReactModal isOpen className="md:h-fit lg:w-1/2 md:mx-auto md:mt-24">
      {/** Este div es del modal que vemos en la pantalla */}
      <div className="p-4 rounded-md bg-white shadow-md">
        {/** Modal Header */}
        <div className="flex justify-between mb-8">
          <h1 className="text-lg font-bold">Update Meal Plan</h1>
          {/** Icono/Link de cierre de ventana modal */}
          <Link to=".." replace>
            <XIcon />
          </Link>
        </div>
        {/** Este form es el que permite actualizar el meal plan */}
        <Form method="post" reloadDocument>
          <h2 className="mb-2">{recipeName}</h2>
          <IconInput
            icon={<XIcon />}
            defaultValue={mealPlanMultiplier ?? 1}
            type="number"
            autoComplete="off"
            name="mealPlanMultiplier"
          />
          <ErrorMessage>{actionData?.errors?.mealPlanMultiplier}</ErrorMessage>
          {/** Botones de acciones del meal plan */}
          <div className="flex justify-end gap-4 mt-8">
            {/** Si el multiplier es null, no hace falta eliminarlo */}
            {mealPlanMultiplier !== null ? (
              <DeleteButton name="_action" value="removeMealPlan">
                Remove from Meal Plan
              </DeleteButton>
            ) : null}
            <PrimaryButton name="_action" value="updateMealPlan">
              Save
            </PrimaryButton>
          </div>
        </Form>
      </div>
    </ReactModal>
  );
}

export default UpdateMealPlan;
