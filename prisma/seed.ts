//Seeding a una BD quiere decir meter datos

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

//Esta funcion sirve para refactorizar la funcion seed y crear varias shelf a la vez con un await y no crear multiples await que lo realentezaria
function getShelves() {
  return [
    {
      name: 'Dairy',
      items: {
        create: [{ name: 'Milk' }, { name: 'Eggs' }, { name: 'Cheese' }],
      },
    },
    {
      name: 'Fruits',
      items: {
        create: [{ name: 'Apples' }, { name: 'Oranges' }],
      },
    },
  ];
}
console.log('Starting seed...');

//Esta funcion devuelve una promesa asi que tenemos que crear un async await
async function seed() {
  //Promise.all es una lista de promesas y espera a todas a la vez
  await Promise.all(
    getShelves().map((shelf) => {
      return db.pantryShelf.create({ data: shelf });
    }),
  );
}

/* async function seed() {
  await db.pantryShelf.create({
    data: {
      name: 'Dairy',
      items: {
        create: [{ name: 'Milk' }, { name: 'Eggs' }, { name: 'Cheese' }],
      },
    },
  });

  await db.pantryShelf.create({ //Otra shelf });
} */

seed();
