import { redirect } from '@remix-run/node';
import { getUserById } from '~/models/user.server';
import { getSession } from '~/sessions';

//Se encarga de la autorizacion
export async function getCurrentUSer(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const session = await getSession(cookieHeader);

  const userId = session.get('userId');

  if (typeof userId !== 'string') {
    return null; //Si sabemos que no es string 100% sabemos que no es valido, no ha recuperado nada
  }

  return getUserById(userId);
}

export async function requireLoggedOutUser(request: Request) {
  const user = await getCurrentUSer(request);

  if (user !== null) {
    //Significa que esta logueado y por tanto les redirigimos
    throw redirect('/app');
  }
}

export async function requireLoggedInUser(request: Request) {
  const user = await getCurrentUSer(request);

  if (user === null) {
    //Significa que NO esta logueado y por tanto les redirigimos
    throw redirect('/login');
  }

  return user;
}
