//Crear modelos para que no vayan directos a PrismaClient sino que apunten a los modelos y todos los modelos a un PrismaCLient asi si queremos cambiar el ORM en el futuro o PrismaClient cambia de API o algo parecido es mas facil cambiarlo.
import db from '~/db.server'; //IMPORTADO (Soluciona multiples instancias)

//Crear modelos/querys
export function getAllShelves() {
  //Recuperar todo de pantryshelf. findMany() devuelve una promesa
  return db.pantryShelf.findMany();
}