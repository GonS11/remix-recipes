import db from '~/db.server';

//Funcion para comprobar en el login si existe el usuario y recuperar su userId para usarlo en la cookie con autentificacion
function getUser(email: string) {
  return db.user.findUnique({ where: { email } });
}

export default getUser;
