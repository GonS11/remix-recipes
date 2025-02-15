import { Form } from '@remix-run/react';
import { classNames } from '~/utils/misc';

type PostsPageWrapperProps = {
  children: React.ReactNode;
};

export function PostsPageWrapper({ children }: PostsPageWrapperProps) {
  return <div className="flex flex-col md:flex-row h-full">{children}</div>;
}

type PostsListWrapperProps = {
  children: React.ReactNode;
  categoryName: string;
  className?: string; // Permite personalización adicional
};

export function PostsListWrapper({
  categoryName,
  children,
  className,
}: PostsListWrapperProps) {
  return (
    <div
      className={classNames(
        'flex flex-col p-4 m-2 gap-4 rounded-md shadow-sm bg-white w-full md:w-1/3', // Añade un ancho en pantallas grandes
        className,
      )}
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="text-xl font-semibold">{categoryName}</h1>
        <Form
          method="post"
          action="/ruta-de-accion"
          className="w-full md:w-auto"
        >
          <button
            className="w-full md:w-auto p-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            name="_action"
            value="newPost"
            aria-label="Create new post"
          >
            New Post
          </button>
        </Form>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

type PostProps = {
  title: string;
  username: string;
  message: string;
  imageUrl: string;
  className?: string;
};

export function Post({
  title,
  username,
  message,
  imageUrl,
  className,
}: PostProps) {
  return (
    <div
      className={classNames(
        'flex flex-col gap-2 p-4 rounded-md bg-white shadow-sm',
        className,
      )}
    >
      <div className="flex justify-between items-center">
        <h1 className="text-md font-medium">{title}</h1>
        <span className="text-sm text-gray-600">@{username}</span>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <p className="flex-1 p-2 rounded-md bg-gray-100">{message}</p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`Imagen de ${title}`}
            className="w-full md:w-24 h-24 object-cover rounded-md"
          />
        )}
      </div>
    </div>
  );
}
