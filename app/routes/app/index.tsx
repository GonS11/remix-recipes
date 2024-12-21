import { LoaderFunction } from '@remix-run/node';

//En este caso esta pagina es un index de la ruta app, pero como queremos que siempre vaya a app/pantry directamente, solo se despliega con app solo. Pero como no queremos mostrar nada en este index no hace falta crear un componente, sino que funcione como carga de recursos como un loader. Si se hace un loader normal con return devuelve un json. Pero para que no nos salga eso no hace falta deovlver nada
export const loader: LoaderFunction = () => {
  return 'hello';
};
