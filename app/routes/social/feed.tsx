import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, NavLink, useLoaderData, useLocation } from '@remix-run/react';
import { z } from 'zod';
import { Input, PrimaryButton } from '~/components/forms';
import { Post, PostsListWrapper, PostsPageWrapper } from '~/components/posts';
import db from '~/db.server';
import { requireLoggedInUser } from '~/utils/auth.server';
import validateForm from '~/utils/validation';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireLoggedInUser(request);

  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  // Obtener categorías y sus posts asociados
  const categories = await db.category.findMany({
    where: {
      name: {
        contains: q ?? '', // Filtrar por nombre si hay una búsqueda
      },
    },
    include: {
      posts: {
        where: {
          userId: user.id, // Filtrar posts por el usuario actual
        },
        select: {
          id: true,
          title: true,
          message: true,
          imageUrl: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return { categories, user };
}

const newPostSchema = z.object({
  categoryId: z.string(),
  newPostTitle: z.string().min(1, 'title cannot be blank'),
  newPostMessage: z.string().min(1, 'message cannot be blank'),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireLoggedInUser(request);
  const formData = await request.formData();

  switch (formData.get('_action')) {
    case 'createPost': {
      return validateForm(
        formData,
        newPostSchema,
        async (data) => {
          // Crear el post con valores fijos y asociarlo a la categoría
          const post = await db.post.create({
            data: {
              title: data.newPostTitle,
              message: data.newPostMessage,
              userId: user.id,
              categories: {
                connect: { id: data.categoryId }, // Asociar el post a la categoría (IMP EL CONTROL DE ID NUMBER O STRING)
              },
            },
          });

          return { post }; // Retornar el post creado
        },
        (errors) => ({ errors, status: 400 }),
      );
    }
    default:
      return null;
  }
}

function Feed() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <PostsPageWrapper>
      {data.categories.map((category) => (
        <PostsListWrapper key={category.id} categoryName={category.name}>
          {/* Renderizar los posts dentro de la categoría */}
          {category.posts.map((post) => (
            <NavLink
              key={post.id}
              to={{ pathname: String(post.id), search: location.search }} // Ruta dinámica con búsqueda actual
              prefetch="intent"
            >
              <Post
                title={post.title}
                username={data.user.firstName}
                message={post.message}
                imageUrl={post.imageUrl}
              />
            </NavLink>
          ))}

          {/* Formulario para crear un nuevo post en la categoría */}
          <Form
            method="post"
            className="flex flex-col gap-2 p-4 rounded-md bg-white shadow-sm"
            reloadDocument
          >
            <input type="hidden" name="categoryId" value={category.id} />
            <label htmlFor="newPostTitle">
              Title
              <Input
                type="text"
                name="newPostTitle"
                className="bg-gray-100 rounded-md"
              />
            </label>
            <label htmlFor="newPostMessage">
              Message
              <Input
                type="text"
                name="newPostMessage"
                className="bg-gray-100 rounded-md"
              />
            </label>

            <PrimaryButton name="_action" value="createPost">
              <span>New Post</span>
            </PrimaryButton>
          </Form>
        </PostsListWrapper>
      ))}
    </PostsPageWrapper>
  );
}

export default Feed;
