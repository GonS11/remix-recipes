import db from '~/db.server';
import { handleDelete } from './utils';

//Filtrar para asignar a un user determinado
export function createShelfItem(userId: string, shelfId: string, name: string) {
  return db.pantryItem.create({
    data: {
      userId,
      shelfId,
      name,
    },
  });
}

export async function deleteShelfItem(id: string) {
  //Funcion en models/utils de borrado y se pasa la funcion que indica la tabla de borrado
  return handleDelete(() =>
    db.pantryItem.delete({
      where: {
        id,
      },
    }),
  );
  /* //Hacer control para borrado multiple (Le das a eliminar y mientras se elimina le das de nuevo .delete() te lanza un error)
  try {
    //Tienes que poner await pq sino no entra en el catch tiene que haberse ejecutado
    const deleted = await db.pantryItem.delete({
      where: {
        id,
      },
    });

    return deleted;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        //Este codigo de error lo he visto en la consola
        return error.message;
      }
    }
    throw error;
  } */
}

//Devolvemos el id del item
export function getShelfItem(id: string) {
  return db.pantryItem.findUnique({ where: { id } });
}
