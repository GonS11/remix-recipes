//Crear modelos para que no vayan directos a PrismaClient sino que apunten a los modelos y todos los modelos a un PrismaCLient asi si queremos cambiar el ORM en el futuro o PrismaClient cambia de API o algo parecido es mas facil cambiarlo.
import { Prisma } from '@prisma/client';
import db from '~/db.server'; //IMPORTADO (Soluciona multiples instancias)
import { handleDelete } from './utils';

//Crear modelos/querys
export function getAllShelves(query: string | null) {
  //Recuperar todo de pantryshelf. findMany() devuelve una promesa
  return db.pantryShelf.findMany({
    where: {
      name: {
        //NOMBRE
        contains: query ?? '', // Filtro parcial por nombre
        mode: 'insensitive', // Ignorar mayúsculas/minúsculas
      },
    },
    include: {
      items: {
        orderBy: {
          name: 'asc', // Ordenar los ítems alfabéticamente
        },
      },
    },
    orderBy: {
      createAt: 'desc',
    },
  });
}

export function createShelf() {
  return db.pantryShelf.create({
    data: {
      name: 'New Shelf',
    },
  });
}

export async function deleteShelf(shelfId: string) {
  return handleDelete(() =>
    db.pantryShelf.delete({
      where: {
        id: shelfId,
      },
    }),
  );
  /*  //Hacer control para borrado multiple (Le das a eliminar y mientras se elimina le das de nuevo .delete() te lanza un error)
  try {
    //Tienes que poner await pq sino no entra en el catch tiene que haberse ejecutado
    const deleted = await db.pantryShelf.delete({
      where: {
        id: shelfId,
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

export function saveShelfName(shelfId: string, shelfName: string) {
  return db.pantryShelf.update({
    where: {
      id: shelfId,
    },
    data: {
      name: shelfName,
    },
  });
}
