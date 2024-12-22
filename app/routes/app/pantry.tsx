import { useLoaderData } from '@remix-run/react';
import { getAllShelves } from '~/models/pantry-shelf.server';
import { classNames } from '~/utils/misc';

export async function loader() {
  //Conexion con BD importada de db.server.ts
  //Recuperar todo de pantryshelf. findMany() devuelve una promesa (Ponerle await Y HACER ASYNC LA FUNCTION LOADER)
  //Al llamar a un modelo, el loader no sabe que lo obtenemos de prisma
  const shelves = await getAllShelves();
  //No se devuelve ni con json() ni con New Response JSON.stringify por incompatibilidad de tipados. Remix lo trnasforma a json automatico
  return { shelves };
}

function Pantry() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <ul
        className={classNames(
          'flex gap-8 overflow-x-auto',
          'snap-x snap-mandatory md:snap-none',
        )}
      >
        {data.shelves.map((shelf) => (
          <li
            key={shelf.id}
            className={classNames(
              'border-2 border-primary rounded-md p-4 h-fit',
              'w-[calc(100vw-2rem)] flex-none snap-center',
              'md:w-96',
            )}
          >
            <h1 className="text-2xl font-extrabold mb-2">{shelf.name}</h1>
            <ul>
              {shelf.items.map((item) => (
                <li key={item.id} className="py-2">
                  {item.name}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Pantry;
