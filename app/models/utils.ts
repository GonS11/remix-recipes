import { Prisma } from '@prisma/client';

//Se abstrae el borrado ya que el de un item y un shelf son casi iguales, pero en vez de eliminar de pantryitem solo tiene que dejarte borrar de cualquier lado. Para que permita cualquier tabla se crea una funcion de eliminado que se pasara de argumento con un tipo generico
export async function handleDelete<X>(deleteFx: () => X) {
  //Hacer control para borrado multiple (Le das a eliminar y mientras se elimina le das de nuevo .delete() te lanza un error)
  try {
    //Tienes que poner await pq sino no entra en el catch tiene que haberse ejecutado
    const deleted = await deleteFx(); //deleteFx especifica la tabla

    return deleted;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        //Este codigo de error lo he visto en la consola
        return error.message;
      }
    }
    throw error;
  }
}
