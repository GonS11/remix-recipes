import { ActionFunction, redirect } from '@remix-run/node';
import { commitSession, getSession } from '~/sessions';
import { getUser } from '~/models/user.server';

export const action: ActionFunction = async ({ request }) => {
  const formData = new URLSearchParams(await request.text());

  // Aquí asumimos que pasamos el correo directamente en el formData para simular el login.
  const email = formData.get('email');
  if (!email) {
    return new Response('Email is required', { status: 400 });
  }

  // Verificamos si el usuario existe, normalmente obtendrás los usuarios desde la base de datos.
  const user = await getUser(email);

  if (user) {
    const cookie = request.headers.get('cookie');
    const session = await getSession(cookie);
    session.set('userId', user.id);

    return redirect('/app', {
      headers: { 'Set-Cookie': await commitSession(session) },
    });
  }

  return new Response('User not found', { status: 404 });
};

export default function FakeLogin() {
  return (
    <div className="text-center">
      <h1>Fake Login</h1>
      <form method="post">
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="user@example.com"
            required
          />
        </div>
        <button type="submit">Login as Fake User</button>
      </form>
    </div>
  );
}
