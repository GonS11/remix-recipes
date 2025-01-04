//Seeding a una BD quiere decir meter datos

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

function createUser() {
  return db.user.create({
    data: {
      email: 'me@example.com',
      firstName: 'Pepe',
      lastName: 'Perez',
    },
  });
}

//Esta funcion sirve para refactorizar la funcion seed y crear varias shelf a la vez con un await y no crear multiples await que lo realentezaria
function getShelves(userId: string) {
  return [
    {
      userId,
      name: 'Dairy',
      items: {
        create: [
          { userId, name: 'Milk' },
          { userId, name: 'Eggs' },
          { userId, name: 'Cheese' },
        ],
      },
    },
    {
      name: 'Fruits',
      items: {
        create: [
          { userId, name: 'Apples' },
          { userId, name: 'Oranges' },
        ],
      },
    },
  ];
}
console.log('Starting seed...');

//Esta funcion devuelve una promesa asi que tenemos que crear un async await
async function seed() {
  const user = await createUser();

  //Promise.all es una lista de promesas y espera a todas a la vez
  await Promise.all(
    getShelves(user.id).map((shelf) => db.pantryShelf.create({ data: shelf })),
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
