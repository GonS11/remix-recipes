import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import db from '~/db.server';
import { requireLoggedInUser } from '~/utils/auth.server';
import { classNames } from '~/utils/misc';

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

function PostDetail() {
  const data = useLoaderData<typeof loader>();

  const { post, user } = data;

  return (
    <div className="flex flex-col gap-2 p-4 rounded-md bg-white shadow-sm">
      <div className="flex justify-between items-center">
        <h1 className="text-md font-medium">{post.title}</h1>
        <span className="text-sm text-gray-600">@{user.firstName}</span>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <p className="flex-1 p-2 rounded-md bg-gray-100">{post.message}</p>
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={`Imagen de ${post.title}`}
            className="w-full md:w-24 h-24 object-cover rounded-md"
          />
        )}
      </div>
    </div>
  );
}

export default PostDetail;
