//Crear modelos para que no vayan directos a PrismaClient sino que apunten a los modelos y todos los modelos a un PrismaCLient asi si queremos cambiar el ORM en el futuro o PrismaClient cambia de API o algo parecido es mas facil cambiarlo.
import db from '~/db.server'; //IMPORTADO (Soluciona multiples instancias)

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

export function deleteShelf(shelfId: string) {
  return db.pantryShelf.delete({
    where: {
      id: shelfId,
    },
  });
}
