import { useLoaderData } from '@remix-run/react';
import { DiscoverGrid, DiscoverListItem } from '~/components/discover';
import db from '~/db.server';

export async function loader() {
  //En discover queremos mostras las ultimas 25 recetas y el usuario al que pertenecen
  const recipes = await db.recipe.findMany({
    take: 25,
    orderBy: { updatedAt: 'desc' },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  return { recipes };
}

function Discover() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="h-[calc(100vh-1rem)] p-4 m[-1rem] overflow-auto">
      <h1 className="text-2xl font-bold mb-4">Discover</h1>
      <DiscoverGrid>
        {data.recipes.map((recipe) => (
          <DiscoverListItem key={recipe.id} recipe={recipe} />
        ))}
      </DiscoverGrid>
    </div>
  );
}

export default Discover;
