import { z } from 'zod';

type FieldErrors = { [key: string]: string };

//Se hace tipado generico (X)
function validateForm<X>(
  formData: FormData,
  zodSchema: z.Schema<X>,
  succesFx: (data: X) => unknown,
  errorFx: (errors: FieldErrors) => unknown,
) {
  const result = zodSchema.safeParse(Object.fromEntries(formData)); //Transforma lo que le pases y se dispara si no coincide con lo declarado en el esquema. Se le dice el tipo que debe tener las entradas

  if (!result.success) {
    //Crear instancia de error
    const errors: FieldErrors = {};

    //Para cada error crear ruta concateda que desenvoca en el mensaje (Necesita explicacion)
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    });
    return errorFx(errors); //Devolver el error
  }

  return succesFx(result.data);
}

export default validateForm;
