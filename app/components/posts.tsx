import { classNames } from '~/utils/misc';

type PostsPageWrapperProps = {
  children: React.ReactNode;
};

export function PostsPageWrapper({ children }: PostsPageWrapperProps) {
  return (
    // Estructura principal de la página de posts
    <div className="grid grid-cols-1 md:grid-cols-3 w-full h-full gap-4 p-4">
      {children}
    </div>
  );
}

type PostsListWrapperProps = {
  children: React.ReactNode;
  className?: string; // Permite personalización adicional
};

export function PostsListWrapper({
  children,
  className,
}: PostsListWrapperProps) {
  return (
    <div
      className={classNames(
        'flex flex-col p-4 gap-4 bg-primary-light2 rounded-md shadow-sm w-full  md:w-4/5',
        className,
      )}
    >
      {/* Contenedor de los posts dentro de la lista */}
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
      {/* Información del post */}
      <div className="flex justify-between items-center">
        <h1 className="text-md font-medium">{title}</h1>
        <span className="text-sm text-gray-600">@{username}</span>
      </div>

      {/* Cuerpo del post */}
      <div className="flex flex-col md:flex-row gap-4">
        <p className="flex-1 p-2 rounded-md bg-gray-100">{message}</p>

        {/* Imagen del post */}
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
