import { PageLayout } from '~/components/layout';

export default function App() {
  //Indice de app con opciond de Pantry, Recipes y Grocery
  return (
    <PageLayout
      title="App"
      links={[
        { to: 'recipes', label: 'Recipes' },
        { to: 'pantry', label: 'Pantry' },
        { to: 'grocery-list', label: 'Grocery List' },
      ]}
    />
  );
}
