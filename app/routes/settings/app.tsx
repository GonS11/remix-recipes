import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { PrimaryButton } from '~/components/forms';
import { themeCookie } from '~/cookies';
import validateForm from '~/utils/validation';

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('cookie');
  const theme = await themeCookie.parse(cookieHeader);

  return { theme: typeof theme !== 'string' ? '#00743e' : theme };
}

const themeSchema = z.object({
  theme: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  return validateForm(
    formData,
    themeSchema,
    async ({ theme }) => {
      //console.log('Saving theme:', theme);
      return new Response(JSON.stringify({ theme }), {
        headers: {
          'Set-Cookie': await themeCookie.serialize(theme),
          'Content-Type': 'application/json',
        },
      });
    },
    (errors) => ({ errors, status: 400 }),
  );
}

function App() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post" reloadDocument>
      <div className="flex flex-col mb-4">
        <label htmlFor="theme">Color theme</label>
        <input
          type="color"
          name="theme"
          id="theme"
          defaultValue={actionData?.theme ?? data.theme}
          className="p-2 mt-2 border-2 border-gray-200 rounded-md"
        />
      </div>
      <PrimaryButton>Save</PrimaryButton>
    </Form>
  );
}

export default App;
