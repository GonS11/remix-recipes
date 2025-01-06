import { ActionFunction, LoaderFunction } from '@remix-run/node';
import { useActionData } from '@remix-run/react';
import { z } from 'zod';
import { ErrorMessage, PrimaryButton } from '~/components/forms';
import { userIdCookie } from '~/cookies';
import getUser from '~/models/user.server';
import { classNames } from '~/utils/misc';
import validateForm from '~/utils/validation';

// Definimos un tipo para los datos de la acción (ESTO SOLUCIONA EL PROBLEMA DE ERRORS)
interface ActionData {
  email?: string; // El email es opcional en caso de que no se haya enviado o validado
  errors?: {
    email?: string; // El mensaje de error para el email también es opcional
  };
}

const loginSchema = z.object({
  email: z.string().email(), // Valida el email
});

//Para saber quién ha hecho login (loader function)
// Esta función verifica si hay cookies en el request y las parsea.
export const loader: LoaderFunction = async ({ request }) => {
  // Rescatamos el header de cookies del request.
  const cookieHeader = request.headers.get('cookie');
  console.log('Request Cookie Header:', cookieHeader); // Log para depurar el header completo de cookies

  // Parseamos la cookie específica `remix-recipes__userId`
  const cookieValue = await userIdCookie.parse(cookieHeader);
  console.log('Parsed Cookie Value:', cookieValue); // Log para depurar el valor parseado de la cookie

  // Si no hay cookies, retornamos `null` (o podríamos redirigir si es necesario)
  return null;
};

// Acción para manejar el login
// Esta función recibe los datos del formulario, valida el email y configura una cookie con el ID del usuario.
export const action: ActionFunction = async ({ request }) => {
  // Obtenemos los datos enviados desde el formulario
  const formData = await request.formData();

  return validateForm(
    formData,
    loginSchema, // Validamos el formulario usando un esquema definido con Zod
    async ({ email }) => {
      // Buscamos al usuario en la base de datos usando su email
      const user = await getUser(email);

      // Si no existe el usuario, devolvemos un error con status 401
      if (!user) {
        return {
          errors: { email: 'User with this email does not exist' },
          status: 401,
        };
      }

      // Serializamos el ID del usuario para almacenarlo en una cookie segura
      const serializedCookie = await userIdCookie.serialize(user.id);
      console.log('Set-Cookie Header:', serializedCookie); // Log para depurar el valor de la cookie serializada

      // Configuramos la respuesta con el encabezado `Set-Cookie`
      return {
        user, // Incluimos los datos del usuario si todo está bien
        headers: {
          'Set-Cookie': serializedCookie,
        },
      };
    },
    // Si hay errores de validación, los manejamos aquí
    (errors) => ({
      errors, // Devolvemos los errores específicos
      email: formData.get('email'), // Mantenemos el email ingresado en el caso de error
      status: 400,
    }),
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
