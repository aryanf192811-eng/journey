import { SearchForm } from './components/SearchForm';

export default function SearchPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Find the journey that works</h1>
        <p className="text-neutral-600">Not just the train that's full.</p>
      </div>
      <SearchForm />
    </main>
  );
}
