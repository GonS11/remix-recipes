import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node';
import { useActionData } from '@remix-run/react';
import { z } from 'zod';
import { ErrorMessage, PrimaryButton, PrimaryInput } from '~/components/forms';
import { generateMagicLink } from '~/magic-links.server';
import getUser from '~/models/user.server';
import { commitSession, getSession } from '~/sessions';
import { classNames } from '~/utils/misc';
import validateForm from '~/utils/validation';
import { v4 as uuid } from 'uuid';

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
  const session = await getSession(cookieHeader);
  //Antes asi: const cookieValue = await sessionCookie.parse(cookieHeader);
  console.log('Session data:', session.data); // Log para depurar el valor de session data
  console.log('Session user ID:', session.get('userId')); //Atributos flsh, get, has, set, unset... (Pero ninguna le pasa la info a la session storage a menos que se use commitSession, no getSession)

  // Si no hay cookies, retornamos `null` (o podríamos redirigir si es necesario)
  return new Response(null);
};

// Acción para manejar el login
// Esta función recibe los datos del formulario, valida el email y configura una cookie con el ID del usuario.
export const action: ActionFunction = async ({ request }) => {
  //Usar session para almacenar userID
  const cookieHeader = request.headers.get('cookie');
  const session = await getSession(cookieHeader);

  // Obtenemos los datos enviados desde el formulario
  const formData = await request.formData();

  return validateForm(
    formData,
    loginSchema, // Validamos el formulario usando un esquema definido con Zod
    async ({ email }) => {
      //Usamos magic link: email + nonce (string aleatorio dificil/uuid de la BD [Universal Unique ID])
      const nonce = uuid();
      session.set('nonce', nonce); //Mejor que set, ya que se borra automaticamente luego. Pero da error flash

      const link = generateMagicLink(email, nonce);
      console.log(link);

      return new Response('Login successful', {
        headers: { 'Set-Cookie': await commitSession(session) },
      }); //Confirmacion
    },
    (errors) =>
      new Response(JSON.stringify({ errors, email: formData.get('email') }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
};

function Login() {
  const actionData = useActionData<ActionData>(); // Aplicamos el tipo ActionData aquí

  return (
    <div className="text-center mt-36">
      <h1 className="text-3xl mb-8">Remix Recipes</h1>
      <form method="post" className="mx-auto md:w-1/3">
        <div className="text-left pb-4">
          <PrimaryInput
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="off"
            defaultValue={actionData?.email}
          />
          <ErrorMessage>{actionData?.errors?.email}</ErrorMessage>
        </div>
        <PrimaryButton className="w-1/3 mx-auto">Log In</PrimaryButton>
      </form>
    </div>
  );
}

export default Login;
