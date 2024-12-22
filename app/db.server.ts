//Conexion con BD (Se crea una instancia con PrismaClient cada vez y eso es un problema pq la BD solo permite cierto numero de conexion). Es mejor usar un solo PrismaClient en un solo archivo y enviar todo ahi (db.server.ts)
//Remix sabe separar que parte de codigo va a servidor y cual a cliente, pero a veces es mejor especificarlo poniendo .server o .client para decir donde enviarlo

//IMP DE client no client/extension. Ahora lo podemos importar desde cualquier lado. En produccion estaria bien en hecho pero en desarrollo tendriamos un problema. Remix se recarga siempre que haya cambios y ntonces ejecutaria este archivo de nuevo y crearia una nueva instancia continuamente y volveriamos al mismo problema del numero de instancias.
//Para solucionarlo: Usar global object para que no se cree siempre
import { PrismaClient } from '@prisma/client';

//tipar el global.db
interface CustomNodeJSGlobal extends NodeJS.Global {
  db: PrismaClient;
}

//Declaras el tipado
declare const global: CustomNodeJSGlobal;

//const db = new PrismaClient(); ESTE CREA CONTINUAS INSTANCIAS AL RECARGAR
const db = global.db || new PrismaClient(); //Si existe no crea una nueva

if (process.env.NODE_ENV === 'development') global.db = db;

export default db;
