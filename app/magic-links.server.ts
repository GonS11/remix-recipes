import Cryptr from 'cryptr';

// Verifica que la variable de entorno para la clave secreta exista
if (typeof process.env.MAGIC_LINK_SECRET !== 'string') {
  throw new Error('Missing env: MAGIC_LINK_SECRET');
}

// Instancia de Cryptr para encriptar y desencriptar datos sensibles usando la clave secreta
const cryptr = new Cryptr(process.env.MAGIC_LINK_SECRET);

// Tipado para el payload del magic link
type MagicLinkPayload = {
  email: string; // Correo electrónico asociado al usuario
  nonce: string; // Valor único generado al crear el link
  createdAt: string; // Marca de tiempo para validar la expiración del link
};

/**
 * Genera un enlace mágico para el usuario.
 * @param email - Correo del usuario
 * @param nonce - Identificador único
 * @returns La URL generada con el payload encriptado como parámetro
 */
export function generateMagicLink(email: string, nonce: string) {
  // Crear el payload para el magic link
  const payload: MagicLinkPayload = {
    email,
    nonce,
    createdAt: new Date().toISOString(), // Fecha y hora actuales en formato ISO
  };

  // Encriptar el payload para asegurar que los datos sean seguros
  const encryptedPayload = cryptr.encrypt(JSON.stringify(payload));

  // Validar que la URL base esté configurada en las variables de entorno
  if (typeof process.env.ORIGIN !== 'string') {
    throw new Error('Missing env: ORIGIN');
  }

  // Crear la URL del magic link con el payload encriptado como parámetro
  const url = new URL(process.env.ORIGIN);
  url.pathname = '/validate-magic-link'; // Endpoint para validar el enlace
  url.searchParams.set('magic', encryptedPayload);

  return url.toString(); // Devolver la URL generada
}

/**
 * Verifica si un valor tiene la estructura de un payload válido de magic link.
 * @param value - Valor a verificar
 * @returns `true` si el valor cumple con el tipo `MagicLinkPayload`
 */
function isMagicLinkPayload(value: any): value is MagicLinkPayload {
  // Validar que el valor sea un objeto y que contenga las propiedades necesarias con los tipos correctos
  return (
    typeof value === 'object' &&
    typeof value.email === 'string' &&
    typeof value.nonce === 'string' &&
    typeof value.createdAt === 'string'
  );
}

/**
 * Genera una respuesta para enlaces mágicos inválidos.
 * @param message - Mensaje de error
 * @returns Un objeto `Response` con el error y un código de estado 400
 */
export function invalidMagicLink(message: string): Response {
  // Crear una respuesta JSON con el mensaje de error
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Obtiene y valida el payload del magic link desde una solicitud HTTP.
 * @param request - La solicitud HTTP que contiene el enlace mágico
 * @returns El payload del magic link si es válido
 * @throws Responde con un error si el enlace es inválido
 */
export function getMagicLinkPayload(request: Request) {
  // Extraer el valor del parámetro "magic" de la URL
  const url = new URL(request.url);
  const magic = url.searchParams.get('magic');

  // Validar que el parámetro "magic" exista y sea un string
  if (typeof magic !== 'string') {
    throw invalidMagicLink("'magic' search parameter does not exist");
  }

  // Desencriptar el valor del magic link y convertirlo a un objeto
  const magicLinkPayload = JSON.parse(cryptr.decrypt(magic));

  // Verificar que el payload tenga el formato correcto
  if (!isMagicLinkPayload(magicLinkPayload)) {
    throw invalidMagicLink('Invalid magic link payload');
  }

  // Devolver el payload válido
  return magicLinkPayload;
}
