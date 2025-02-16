import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import {
  Form,
  NavLink,
  redirect,
  useFetcher,
  useLoaderData,
  useLocation,
} from '@remix-run/react';
import { z } from 'zod';
import {
  DeleteButton,
  ErrorMessage,
  Input,
  PrimaryButton,
} from '~/components/forms';
import { XIcon } from '~/components/icons';
import { Post, PostsListWrapper, PostsPageWrapper } from '~/components/posts';
import db from '~/db.server';
import { requireLoggedInUser } from '~/utils/auth.server';
import validateForm from '~/utils/validation';

// Loader para obtener datos de la base de datos
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

// Validación para el formulario de nuevo post
const newPostSchema = z.object({
  categoryId: z.string(),
  newPostTitle: z.string().min(1, 'Title cannot be blank'),
  newPostMessage: z.string().min(1, 'Message cannot be blank'),
});

// Validación para actualizar el nombre de categoría
const updateCategorieNameSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string().min(1, 'Category name cannot be blank'),
});

// Validación para eliminar categoría
const deleteCategorySchema = z.object({
  categoryId: z.string(),
});

// Acción para manejar la creación, actualización y eliminación de categorías y posts
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireLoggedInUser(request);
  const formData = await request.formData();

  switch (formData.get('_action')) {
    case 'createPost': {
      return validateForm(
        formData,
        newPostSchema,
        async (data) => {
          // Crear el post y asociarlo a la categoría
          const post = await db.post.create({
            data: {
              title: data.newPostTitle,
              message: data.newPostMessage,
              userId: user.id,
              categories: {
                connect: { id: data.categoryId }, // Conectar el post a la categoría
              },
            },
          });

          return { post }; // Retornar el post creado
        },
        (errors) => ({
          errors,
          status: 400,
          categoryId: formData.get('categoryId'), // Devolver categoryId para el error
        }),
      );
    }

    case 'updateCategorieName': {
      return validateForm(
        formData,
        updateCategorieNameSchema,
        async ({ categoryId, categoryName }) => {
          // Verificar si el nombre de la categoría ya existe
          const existCategory = await db.category.findFirst({
            where: { name: categoryName },
            select: { id: true, name: true },
          });

          if (existCategory) {
            throw { message: `Category name ${categoryName} already exists` };
          }

          // Actualizar el nombre de la categoría
          await db.category.update({
            where: { id: categoryId },
            data: {
              name: categoryName,
            },
          });

          // Redirigir después de la actualización
          return redirect('/social/feed');
        },
        (errors) => ({ errors, status: 400 }),
      );
    }

    case 'deleteCategorie': {
      return validateForm(
        formData,
        deleteCategorySchema,
        async ({ categoryId }) => {
          // Verificar si la categoría existe y pertenece al usuario
          const category = await db.category.findFirst({
            where: {
              id: categoryId,
            },
            include: {
              posts: true, // Incluir los posts asociados a la categoría
            },
          });

          if (!category) {
            return {
              errors: { categoryId: 'Category not found' },
              status: 404,
            };
          }

          // Desconectar la categoría de todos los posts asociados
          await db.post.updateMany({
            where: {
              userId: user.id, // Filtrar solo los posts del usuario actual
              categories: {
                some: { id: categoryId }, // Filtrar los posts que tienen la categoría
              },
            },
            data: {
              categories: {
                disconnect: [{ id: categoryId }], // Desconectar la categoría de los posts
              },
            },
          });

          // Eliminar la categoría
          await db.category.delete({
            where: { id: categoryId },
          });

          // Redirigir después de la eliminación
          return redirect('/social/feed');
        },
        (errors) => ({ errors, status: 400 }),
      );
    }

    default:
      return null;
  }
}

// Componente Feed que renderiza todas las categorías y posts
function Feed() {
  const data = useLoaderData<typeof loader>();

  const location = useLocation();

  const fetcher = useFetcher();
  const updateCategoryNameFetcher = useFetcher();
  const deleteCategoryFetcher = useFetcher();

  return (
    <PostsPageWrapper>
      {data.categories.map((category) => (
        <PostsListWrapper key={category.id}>
          {/**Formulario para actualizar nombre de categoría */}
          <updateCategoryNameFetcher.Form
            method="post"
            className="flex flex-col md:flex-row justify-between items-center gap-2"
          >
            <input type="hidden" name="categoryId" value={category.id} />
            <Input
              type="text"
              name="categoryName"
              className="text-xl font-semibold w-1/2 rounded-md"
              defaultValue={category.name} //IMP IMPUT ES CERRADO Y CON VALUE
            />
            <ErrorMessage>
              {updateCategoryNameFetcher?.data?.errors?.categoryName}
            </ErrorMessage>
            <PrimaryButton name="_action" value="updateCategorieName">
              <span>Change Category</span>
            </PrimaryButton>
          </updateCategoryNameFetcher.Form>

          {/**Formulario para eliminar categoría */}
          <deleteCategoryFetcher.Form
            method="post"
            onSubmit={(event) => {
              if (!confirm('Are you sure you want to delete this category?')) {
                event.preventDefault(); //Se evita que s eenvie si damos a no
              }
            }}
          >
            <input type="hidden" name="categoryId" value={category.id} />
            <DeleteButton name="_action" value="deleteCategorie">
              <XIcon />
            </DeleteButton>
          </deleteCategoryFetcher.Form>

          {/**Lista de posts asociados a la categoría */}
          {category.posts.map((post) => (
            <NavLink
              key={post.id}
              to={{ pathname: String(post.id), search: location.search }}
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

          {/* Formulario para crear post en esta categoría */}
          <fetcher.Form
            method="post"
            className="flex flex-col gap-2 p-4 rounded-md bg-white shadow-sm"
          >
            <input type="hidden" name="categoryId" value={category.id} />
            <label htmlFor={`newPostTitle-${category.id}`}>
              Title
              <Input
                type="text"
                name="newPostTitle"
                id={`newPostTitle-${category.id}`}
                className="bg-gray-100 rounded-md"
              />
            </label>
            {/* Mostrar el error solo si pertenece a esta categoría */}
            <ErrorMessage>
              {fetcher.data?.categoryId === category.id
                ? fetcher.data?.errors?.newPostTitle
                : null}
            </ErrorMessage>

            <label htmlFor={`newPostMessage-${category.id}`}>
              Message
              <Input
                type="text"
                name="newPostMessage"
                id={`newPostMessage-${category.id}`}
                className="bg-gray-100 rounded-md"
              />
            </label>
            {/* Mostrar el error solo si pertenece a esta categoría */}
            <ErrorMessage>
              {fetcher.data?.categoryId === category.id
                ? fetcher.data?.errors?.newPostMessage
                : null}
            </ErrorMessage>

            <PrimaryButton name="_action" value="createPost">
              <span>New Post</span>
            </PrimaryButton>
          </fetcher.Form>
        </PostsListWrapper>
      ))}
    </PostsPageWrapper>
  );
}

export default Feed;
