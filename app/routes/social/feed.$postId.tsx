import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, redirect, useFetcher, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import {
  DeleteButton,
  ErrorMessage,
  Input,
  PrimaryButton,
} from '~/components/forms';
import db from '~/db.server';
import { requireLoggedInUser } from '~/utils/auth.server';
import validateForm from '~/utils/validation';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireLoggedInUser(request);

  //Obtener toda la info del post y su categoria
  const post = await db.post.findUnique({
    where: {
      id: params.postId,
    },
    include: {
      categories: true,
    },
  });

  if (post === null) {
    throw {
      message: `A post with id ${params.postId} does not exist.`,
      status: 400,
    };
  }

  if (post.userId !== user.id) {
    throw {
      message: 'You are not authorized to view this recipe',
      status: 401,
    };
  }

  return { post, user };
}

const updatePostSchema = z.object({
  categories: z.string().min(1, 'Categorie cannot be blank'), //String separado por comas
  title: z.string().min(1, 'Title cannot be blank'),
  message: z.string().min(1, 'Message cannot be blank'),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireLoggedInUser(request);
  const formData = await request.formData();

  switch (formData.get('_action')) {
    case 'updatePost': {
      return validateForm(
        formData,
        updatePostSchema,
        async (data) => {
          const categoryNames = data.categories
            .split(',')
            .map((name) => name.trim()); // Limpiar espacios

          // Buscar categorías existentes
          const existingCategories = await db.category.findMany({
            where: { name: { in: categoryNames } },
            select: { id: true, name: true },
          });

          const existingCategoryNames = existingCategories.map(
            (category) => category.name,
          );

          // Determinar cuáles hay que crear
          const newCategories = categoryNames
            .filter((name) => !existingCategoryNames.includes(name))
            .map((name) => ({ name }));

          // Obtener las categorías actuales del post
          const currentPost = await db.post.findUnique({
            where: { id: params.postId },
            include: { categories: true },
          });

          if (!currentPost) {
            throw new Error('Post not found');
          }

          // Identificar las categorías eliminadas
          const deletedCategories = currentPost.categories.filter(
            (category) => !categoryNames.includes(category.name),
          );

          await db.post.update({
            where: {
              userId: user.id,
              id: params.postId,
            },
            data: {
              title: data.title,
              message: data.message,
              categories: {
                connect: existingCategories.map((category) => ({
                  id: category.id,
                })), // Conectar existentes
                create: newCategories.map((category) => ({
                  name: category.name,
                })), // Crear nuevas
                disconnect: deletedCategories.map((category) => ({
                  id: category.id,
                })), // Desconectar eliminadas
              },
            },
          });

          return redirect(`/social/feed/${params.postId}`);
        },
        (errors) => ({ errors, status: 400 }),
      );
    }
    case 'deletePost': {
      await db.post.delete({
        where: { userId: user.id, id: params.postId },
      });

      return redirect('/social/feed');
    }
    default: {
      return null;
    }
  }
}

function PostDetail() {
  const data = useLoaderData<typeof loader>();

  const { post, user } = data;

  // Unir las categorías en una sola cadena de texto separada por comas
  const categoriesString = post.categories
    .map((category) => category.name)
    .join(', ');

  const updatePostFetcher = useFetcher();
  const deletePostFetcher = useFetcher();

  return (
    <div className="flex flex-col gap-2 p-4 rounded-md bg-white shadow-sm">
      <updatePostFetcher.Form method="post" className="flex flex-col w-full">
        <div className="flex justify-between items-baseline">
          <span>Categories: </span>
          <Input
            type="text"
            name="categories"
            className="text-md font-medium bg-gray-100 ml-2"
            defaultValue={categoriesString} // Mostrar las categorías como una cadena de texto
          />
        </div>
        <ErrorMessage>
          {updatePostFetcher?.data?.errors?.categories}
        </ErrorMessage>
        <div className="flex justify-between items-center">
          <Input
            type="text"
            name="title"
            className="text-md font-medium bg-gray-100"
            defaultValue={post.title}
          />
          <span className="text-sm text-gray-600">@{user.firstName}</span>
        </div>
        <ErrorMessage>{updatePostFetcher?.data?.errors?.title}</ErrorMessage>

        <div className="flex flex-col md:flex-row gap-4">
          <textarea
            name="message"
            className="flex-1 p-2 rounded-md bg-gray-100"
          >
            {post.message}
          </textarea>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={`Imagen de ${post.title}`}
              className="w-full md:w-24 h-24 object-cover rounded-md"
            />
          )}
        </div>
        <ErrorMessage>{updatePostFetcher?.data?.errors?.message}</ErrorMessage>
        <PrimaryButton
          name="_action"
          value="updatePost"
          className="self-end mt-4"
        >
          <span>Update Post</span>
        </PrimaryButton>
      </updatePostFetcher.Form>

      <div className="flex justify-end items-center">
        <deletePostFetcher.Form method="post">
          <DeleteButton name="_action" value="deletePost">
            Delete Post
          </DeleteButton>
        </deletePostFetcher.Form>
      </div>
    </div>
  );
}

export default PostDetail;
