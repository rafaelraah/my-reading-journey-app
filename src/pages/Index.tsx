import { KanbanBoard } from '@/components/KanbanBoard';
import { FilterBar } from '@/components/FilterBar';
import { useUserBooks } from '@/hooks/useUserBooks';
import { Library, Loader2 } from 'lucide-react';

const Index = () => {
  const {
    books,
    loading,
    updateStatus,
    getBooksByStatus,
    saveReview,
    deleteBook,
    filter,
    setFilter,
    sortBy,
    setSortBy,
  } = useUserBooks();

  return (
    <div className="min-h-screen bg-background">
      <header className="parchment-bg border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Library className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-wide">
                My Reading Journey
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                Organize sua jornada literária em um quadro mágico
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-display font-semibold text-foreground">
            Sua Estante
          </h2>
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <section className="animate-fade-in">
            <KanbanBoard
              getBooksByStatus={getBooksByStatus}
              onUpdateStatus={updateStatus}
              onSaveReview={saveReview}
              onDeleteBook={deleteBook}
              books={books}
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
