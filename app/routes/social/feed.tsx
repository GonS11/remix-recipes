import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { PostsListWrapper, PostsPageWrapper } from '~/components/posts';
import db from '~/db.server';
import { requireLoggedInUser } from '~/utils/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireLoggedInUser(request);

  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  const categories = await db.category.findMany({
    where: {
      userId: user.id,
      name: {
        contains: q ?? '',
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return { categories, user };
}

function Feed() {
  const data = useLoaderData<typeof loader>();

  return (
    <PostsPageWrapper>
      {data.categories.map((categorie) => (
        <PostsListWrapper key={categorie.id} categoryName={categorie.name}>
          {data.user.firstName}
        </PostsListWrapper>
      ))}
    </PostsPageWrapper>
  );
}

export default Feed;

//Bloques por categorias
//En cada categoria unos posts
//Al hacer click en el post con ruta dinamica te manda a el
