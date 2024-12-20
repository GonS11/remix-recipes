//Como importar links de css, js...
/**
 * import {LinksFunction} from "@remix-run/node";
 * import styles from "~/styles/index.css";
 *
 * export const links:LinksFunction =()=>{
 *  return [{rel:"stylesheet",href:styles (Ruta importada)}]
 * }
 *
 */
export default function Index() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome home!</p>
    </div>
  );
}
