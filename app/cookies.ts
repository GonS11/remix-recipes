import { createCookie } from '@remix-run/node';

//Como el secret de la cookie puede ser string o null, comprobar que no es null para que ts no se queje de tipado
if (typeof process.env.AUTH_COOKIE_SECRET !== 'string') {
  throw new Error('Missing env: AUTH_COOKIE_SECRET');
}

//Cambiamos de userIdCookie a sessionCookie por estandar
export const sessionCookie = createCookie('remix-recipes__session', {
  secrets: [process.env.AUTH_COOKIE_SECRET], //['a', 'b', 'c'], //Aqui incluyes las claves privadas validad de encriptacion y autentificacion pero solo la primera sera valida para las outgoing cookies. Se diseña asi para que nos sea facil rotar los secrets/Claves ecretas al inicio del array que nos dara mas proteccion, para sacar estas claves del git history (PROHIBIDO SUBIRLAS), para que no se filtren, mejor meterlas en .env y leerlas desde ahi
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Solo seguro en producción, solo true cuando no es desarrollo
  sameSite: 'lax',
});
