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
      userId,
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

function getRecipes(userId: string) {
  return [
    {
      userId,
      name: 'Buttermilk Pancakes',
      totalTime: '15 min',
      imageUrl:
        'https://images.unsplash.com/photo-1528207776546-365bb710ee93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      instructions:
        'Whisk together salt, baking powder, baking soda, four and sugar. In a separate bowl, combine eggs and buttermilk and drizzle in butter. With wooden spoon, combine wet and dry ingredients until just moistened.',
      ingredients: {
        create: [
          { amount: '1 tsp', name: 'salt' },
          { amount: '2 tsp', name: 'baking powder' },
          { amount: '1 tsp', name: 'baking soda' },
          { amount: '2 cups', name: 'flour' },
          { amount: '2 tbsp', name: 'sugar' },
          { amount: '2', name: 'eggs' },
          { amount: '2 cups', name: 'buttermilk' },
          { amount: '2 tbsp', name: 'butter, melted' },
        ],
      },
    },
    {
      userId,
      name: 'French Dip Sandwiches',
      totalTime: '4-10 hrs (crockpot)',
      imageUrl:
        'https://images.pexels.com/photos/5836769/pexels-photo-5836769.jpeg',
      instructions:
        'Place roast in slow cooker and sprinkle onion soup mix over the roast. Add water and beef broth. Cook on high for 4-6 hours or low for 8-10. Serve on rolls with swiss cheese.',
      ingredients: {
        create: [
          { amount: '', name: 'beef roast' },
          { amount: '1 pkg', name: 'dry onion soup mix' },
          { amount: '2 cans', name: 'beef broth' },
          { amount: '2 cans', name: 'water' },
          { amount: '', name: 'sliced swiss cheese' },
          { amount: '', name: 'hoagie buns' },
        ],
      },
    },
    {
      userId,
      name: 'Shepherds Pie',
      totalTime: '40 min',
      imageUrl:
        'https://images.pexels.com/photos/13471546/pexels-photo-13471546.jpeg',
      instructions:
        'Brown ground beef with onion. Add brown sugar, vinegar, tomato soup and mustard. Pour into baking dish and top with mashed potatoes. Sprinkle with grated cheese and bake at 350 for 30 minutes.',
      ingredients: {
        create: [
          { amount: '1/4 cup', name: 'chopped onion' },
          { amount: '1 lb', name: 'ground beef' },
          { amount: '1/3 cup', name: 'brown sugar' },
          { amount: '1 tbsp', name: 'vinegar' },
          { amount: '1 can', name: 'tomato soup' },
          { amount: '1 tsp', name: 'mustard' },
          { amount: '', name: 'mashed potatoes' },
          { amount: '', name: 'grated cheese' },
        ],
      },
    },
    {
      userId,
      name: 'Chicken Alfredo',
      totalTime: '90 min',
      imageUrl:
        'https://images.pexels.com/photos/4371848/pexels-photo-4371848.jpeg',
      instructions:
        'Melt butter in large pan. Add garlic and cook for 30 seconds. Whisk in flour and stir for another 30 seconds. Add cream cheese and stir until it starts to melt down. Pour in cream and parmesan and whisk until cream cheese is incorporated. Once the sauce has thickened, season with salt and pepper.\n\nCut chicken into thin pieces. In a shallow dish combine flour, 1 tsp salt and 1 tsp pepper. In another dish beat eggs. In a third dish combine bread crumbs and parmesan. Working with one piece at a time, dredge in flour, then egg, then bread crumb/parmesan mixture. Cover and place in a baking dish and bake at 350 for 50-60 minutes.\n\n(Sausage can also be added to this alfredo for a variation)',
      ingredients: {
        create: [
          { amount: '1 stick', name: 'butter' },
          { amount: '4', name: 'garlic cloves, minced' },
          { amount: '2 tbsp', name: 'flour' },
          { amount: '8 oz', name: 'cream cheese' },
          { amount: '2 cups', name: 'heavy cream' },
          { amount: '1 1/3 cup', name: 'grated parmesan cheese' },
          { amount: '', name: 'salt and pepper to taste' },
          { amount: '1 pkg', name: 'desired pasta' },
          { amount: '2-3', name: 'chicken breasts' },
          { amount: '1 cup', name: 'flour' },
          { amount: '3', name: 'eggs' },
          { amount: '1 1/2 cup', name: 'bread crumbs' },
          { amount: '1 1/2 cup', name: 'parmesan cheese' },
        ],
      },
    },
  ];
}

//Se crea esta funcion para que cuando ejecutemos seed de nuevo (Pq hemos actualizado la BD con recipes no se duplique la info de shelves ya que se mapeade de nuevo), siempre mejor borrar todo y volver a cargar
async function deleteAll() {
  await db.recipe.deleteMany(); //Como es delete cascade borra ingredientss tambien
  await db.pantryShelf.deleteMany(); //Borra items tambien
  await db.user.deleteMany();
}

//Esta funcion devuelve una promesa asi que tenemos que crear un async await
async function createAll() {
  const user = await createUser();

  //Promise.all es una lista de promesas y espera a todas a la vez
  await Promise.all([
    ...getShelves(user.id).map((shelf) =>
      db.pantryShelf.create({ data: shelf }),
    ),
    ...getRecipes(user.id).map((recipe) => db.recipe.create({ data: recipe })),
  ]);
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

//Para ejecutar el seed de nuevo se ejecuta: npx prisma db seed
async function seed() {
  await deleteAll();
  await createAll();
}

seed();
