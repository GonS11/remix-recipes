import Cryptr from 'cryptr';

//Primero comprobar si existe
if (typeof process.env.MAGIC_LINK_SECRET !== 'string') {
  throw new Error('Missing env: MAGIC_LINK_SECRET');
}

//Pasar una secret key como las cookies (Meterlo en .env)
const cryptr = new Cryptr(process.env.MAGIC_LINK_SECRET);

type MagicLinkPayload = {
  email: string;
  nonce: string;
  createdAt: string;
};

export function generateMagicLink(email: string, nonce: string) {
  //Create magic link payload (1º Crear tipado que estamos en ts)
  const payload: MagicLinkPayload = {
    email,
    nonce,
    createdAt: new Date().toISOString(),
  };

  //Para encriptar el payload (Crear nueva instancia cryptr)
  const encryptedPayload = cryptr.encrypt(JSON.stringify(payload));

  //Validar origin URL 1º
  if (typeof process.env.ORIGIN !== 'string') {
    throw new Error('Missing env: ORIGIN');
  }

  //Ahora crear resto URL (En produccion cambiar que no sera localhost:3000, meterlo en .env), poner parametros
  const url = new URL(process.env.ORIGIN);
  url.pathname = '/validate-magic-link';
  url.searchParams.set('magic', encryptedPayload);

  return url.toString();
}
