import { LoaderFunction } from '@remix-run/node';
import { useLoaderData, useRouteError } from '@remix-run/react';

export const loader: LoaderFunction = () => {
  return new Response(JSON.stringify({ message: 'Yo!' }), {
    status: 418,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

function Profile() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>Profile Settings</h1>
      <p>This is the App app</p>
      <p>Message: {data.message}</p>
    </div>
  );
}

export default Profile;

//Si ocurre un error remix dispara esto
export function ErrorBoundary() {
  //Este hook sirve para errores!!!. Hay que tiparlo que sino ts se queja
  const error = useRouteError();

  //Condicional para solo renderizarlo si es un error de instance, sino un mensaje generico
  if (error instanceof Error) {
    return (
      <>
        <div className="bg-red-300 border-2 border-red-600 rounded-md p-4">
          <h1>Something went worng!</h1>
          <p>{error.message}</p>
        </div>
      </>
    );
  }

  return <div>An unexpected error occurred.</div>;
}
