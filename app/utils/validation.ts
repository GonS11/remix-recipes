import { z } from 'zod';

type FieldErrors = { [key: string]: string };

type FormField = {
  [key: string]: FormDataEntryValue | FormDataEntryValue[];
};

function objectify(formData: FormData) {
  //Convierte un objeto de formData en uno normal para que zod sepa validarlo todo y no coger solo el ultimo valor como con fromEntries
  const formFields: FormField = {};

  formData.forEach((value, name) => {
    //Validar si ese formData es array o no, para eso le añadimos a cada name de arrays un [] al final
    const isArrayField = name.endsWith('[]');
    //Si es array le quitamos el [] del final
    const fieldName = isArrayField ? name.slice(0, -2) : name;

    if (!(fieldName in formFields)) {
      formFields[fieldName] = isArrayField ? formData.getAll(name) : value;
    }
  });

  return formFields;
}

//Se hace tipado generico (X)
function validateForm<X>(
  formData: FormData,
  zodSchema: z.Schema<X>,
  succesFx: (data: X) => unknown,
  errorFx: (errors: FieldErrors) => unknown,
) {
  const result = zodSchema.safeParse(objectify(formData)); //Transforma lo que le pases y se dispara si no coincide con lo declarado en el esquema. Se le dice el tipo que debe tener las entradas

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
