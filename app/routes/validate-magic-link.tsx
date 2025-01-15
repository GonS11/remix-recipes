import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node';
import { useActionData } from '@remix-run/react';
import { z } from 'zod';
import { ErrorMessage, PrimaryButton, PrimaryInput } from '~/components/forms';
import { getMagicLinkPayload, invalidMagicLink } from '~/magic-links.server';
import { createUser, getUser } from '~/models/user.server';
import { commitSession, getSession } from '~/sessions';
import { classNames } from '~/utils/misc';
import validateForm from '~/utils/validation';

const magicLinkMaxAge = 1000 * 60 * 10; // 10 min (en milisegundos)

export const loader: LoaderFunction = async ({ request }) => {
  // 1. Recuperar el magic link
  const magicLinkPayload = getMagicLinkPayload(request);

  // 2. Validar tiempo de expiración
  const createdAt = new Date(magicLinkPayload.createdAt);
  const expiresAt = createdAt.getTime() + magicLinkMaxAge;

  if (Date.now() > expiresAt) {
    throw invalidMagicLink('The magic link has expired');
  }

  // 3. Validar que el nonce es correcto
  const cookieHeader = request.headers.get('cookie');
  const session = await getSession(cookieHeader);

  // 3.1. Verificar que se ha visitado en el mismo navegador
  if (session.get('nonce') !== magicLinkPayload.nonce) {
    throw invalidMagicLink('Invalid nonce');
  }

  // 3.2. Validación del nonce, eliminar después de usarlo (recomendación: usar flash en lugar de set directamente)
  const user = await getUser(magicLinkPayload.email);

  if (user) {
    // Si el usuario existe, redirigir con la cookie de sesión configurada
    session.set('userId', user.id);

    // Eliminar explícitamente el nonce
    session.unset('nonce');
    return redirect('/app', {
      headers: { 'Set-Cookie': await commitSession(session) },
    });
  }

  // 4. Si el usuario no existe, devolver una respuesta con una cookie limpia
  return new Response('User not found', {
    headers: { 'Set-Cookie': await commitSession(session) },
  });
};

const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be blank'),
  lastName: z.string().min(1, 'Last name cannot be blank'),
});

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  // Importante redirigir para evitar que se recargue y vuelva a llamar al loader, lo cual puede dar un error al verificar el magic link nuevamente.
  // Guardamos el nonce con flash, pero debemos hacer un set de nuevo y no usar flash después para evitar problemas.
  return validateForm(
    formData,
    signUpSchema,
    async ({ firstName, lastName }) => {
      const magicLinkPayload = getMagicLinkPayload(request);

      const user = await createUser(
        magicLinkPayload.email,
        firstName,
        lastName,
      );

      const cookie = request.headers.get('cookie');
      const session = await getSession(cookie);
      session.set('userId', user.id);

      // Eliminar explícitamente el nonce
      session.unset('nonce');

      return redirect('/app', {
        headers: { 'Set-Cookie': await commitSession(session) },
      });
    },
    (errors) =>
      new Response(
        JSON.stringify({
          errors,
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
  );
};

// SOLO SE RENDERIZA SI NO SE ENCUENTRA EL USUARIO (NO EXISTE), SI EXISTE TE REDIRIGE
export default function ValidateMagicLink() {
  const actionData = useActionData();

  return (
    <div className="text-center">
      <div className="mt-24">
        <h1 className="text-2xl my-8">You are almost done</h1>
        <h2>Type in your name below to complete the signup process.</h2>
        {/* Podríamos usar un Form de Remix, pero mantenemos las cualidades del navegador por conveniencia */}
        <form
          method="post"
          className={classNames(
            'flex flex-col px-8 mx-16 md:mx-auto',
            'border-2 border-gray-200 rounded-md p-8 mt-8 md:w-80',
          )}
        >
          <fieldset className="mb-8 flex flex-col">
            <div className="text-left mb-4">
              <label htmlFor="firstName">First Name</label>
              <PrimaryInput
                id="firstName"
                autoComplete="off"
                name="firstName"
                defaultValue={actionData?.firstName}
              />
              <ErrorMessage>{actionData?.errors?.firstName}</ErrorMessage>
            </div>
            <div className="text-left">
              <label htmlFor="lastName">Last Name</label>
              <PrimaryInput
                id="lastName"
                autoComplete="off"
                name="lastName"
                defaultValue={actionData?.lastName}
              />
              <ErrorMessage>{actionData?.errors?.lastName}</ErrorMessage>
            </div>
          </fieldset>
          <PrimaryButton className="w-36 mx-auto">Sign up</PrimaryButton>
        </form>
      </div>
    </div>
  );
}
