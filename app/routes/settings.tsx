import { Link, Outlet } from '@remix-run/react';

//Uso de loader: Solo se usa en el servidor es "seguro", nunca se envia al cliente, por defecto lo serializa a un JSON y devuelve un objeto de respuesta

//The Response interface of the Fetch API represents the response to a request
/**
 * import  {LoaderFunction, useLoaderData} from "remix";
 * export const loader:LoaderFunction = ()=>{
 * return new Response(JSON.stringify({message:"Hello,there!"},{
 *    status:418,
 *    headers:{
 *      "Content-Type":"application/json", //Esto dice al navegador que espere un tipo json
 *      //Despues de content-Type podemos poner mas en el header e incluso hacerlo custom
 *    }}));
 * }
 *
 * Dentro del componente donde se usa
 * const data = useLoaderData();
 *
 * Renderizado mensaje:
 * <p>Message from loader: {data.message}</p>
 */

function Settings() {
  return (
    <div>
      <h1>Settings</h1>
      <p>This is the Settings app</p>
      <nav>
        {/**Etiqueta  que hace client side routing que hace que la pagina no se refresque al hacer click en el link. Esta son nest routes de settings, ahora es con settings.app no carpeta settings con app*/}
        <Link to="app">App</Link>
        <Link to="profile">Profile</Link>
      </nav>
      {/**Outlet es una etiqueta de remix que permite decir donde desplegar la nest-route clickada */}
      <Outlet />
    </div>
  );
}

export default Settings;
