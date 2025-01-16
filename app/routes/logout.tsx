import { LoaderFunction } from '@remix-run/node';
import { destroySession, getSession } from '~/sessions';

//Solo hace falta eliminar el id de user de la session (Se puede hacer en un loader)
export const loader: LoaderFunction = async ({ request }) => {
  const cookieHeader = request.headers.get('cookie');
  const session = await getSession(cookieHeader);

  //En nuestro caso eliminamos todo pq esta solo el id
  return new Response(JSON.stringify({ ok: 'ok' }), {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  });
};

export default function Logout() {
  return (
    <div className="text-center">
      <div className="mt-24">
        <h1 className="text-2xl">You&apos;re good to go!</h1>
        <p>Logout successful</p>
        <a href="/" className="text-primary">
          Take me home
        </a>
      </div>
    </div>
  );
}
