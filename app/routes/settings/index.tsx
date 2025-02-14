import { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/react';

//En el index de subruta solo redireccion por si intentan entrar directamente
export const loader: LoaderFunction = () => {
  return redirect('/settings/app');
};
