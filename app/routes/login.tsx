import { ActionFunction } from '@remix-run/node';
import { useActionData } from '@remix-run/react';
import { z } from 'zod';
import { ErrorMessage, PrimaryButton } from '~/components/forms';
import { classNames } from '~/utils/misc';
import validateForm from '~/utils/validation';

// Definimos un tipo para los datos de la acción
interface ActionData {
  email?: string; // El email es opcional en caso de que no se haya enviado o validado
  errors?: {
    email?: string; // El mensaje de error para el email también es opcional
  };
}

const loginSchema = z.object({
  email: z.string().email(), // Valida el email
});

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  return validateForm(
    formData,
    loginSchema,
    ({ email }) => {},
    (errors) => ({ errors, email: formData.get('email'), status: 400 }),
  );
};

function Login() {
  const actionData = useActionData<ActionData>(); // Aplicamos el tipo ActionData aquí

  return (
    <div className="text-center mt-3">
      <h1 className="text-3xl mb-8">Remix Recipes</h1>
      <form method="post" className="mx-auto md:w-1/3">
        <div className="text-left pb-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="off"
            defaultValue={actionData?.email}
            className={classNames(
              'w-full outline-none border-2 border-grey-200',
              'focus:border-primary rounded-md p-2',
            )}
          />
          <ErrorMessage>{actionData?.errors?.email}</ErrorMessage>
        </div>
        <PrimaryButton className="w-1/3 mx-auto">Log In</PrimaryButton>
      </form>
    </div>
  );
}

export default Login;
