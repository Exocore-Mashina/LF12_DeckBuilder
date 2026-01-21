import CardGrid from "./CardGrid.jsx";
import DeckPagination from "./DeckPagination.jsx";
import DeckSummary from "./DeckSummary.jsx";

const DecksView = ({
  decks,
  selectedDeckId,
  onDeckChange,
  onDeckCreate,
  deckSummary,
  deckCards,
  onRemoveCard,
  deckPagination
}) => {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Decks</h2>
        <p className="text-sm text-slate-400">
          Wähle ein Deck aus und analysiere dessen Aufbau.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4">
        <label className="text-sm font-medium text-slate-300" htmlFor="deckViewSelect">
          Deck auswählen
        </label>
        <select
          id="deckViewSelect"
          value={selectedDeckId}
          onChange={(event) => onDeckChange(event.target.value)}
          className="rounded-full border border-emerald-400/60 bg-slate-950 px-4 py-2 text-sm text-slate-100"
        >
          <option value="">Deck auswählen</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name} ({deck.cardCount} Karten)
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-400">
          Bitte wähle ein Deck aus, um die Karten zu sehen.
        </span>
      </div>

      <form
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
        onSubmit={onDeckCreate}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wide text-slate-400"
              htmlFor="deckNameInput"
            >
              Neues Deck
            </label>
            <input
              id="deckNameInput"
              name="deckNameInput"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              placeholder="z.B. Mono Red"
            />
          </div>
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wide text-slate-400"
              htmlFor="deckDescriptionInput"
            >
              Beschreibung (optional)
            </label>
            <input
              id="deckDescriptionInput"
              name="deckDescriptionInput"
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              placeholder="Kurzer Hinweis zum Deck"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
        >
          Deck erstellen
        </button>
      </form>

      <DeckSummary summary={deckSummary} />

      <CardGrid
        cards={deckCards}
        mode="deck"
        onRemove={onRemoveCard}
        emptyState="Wähle ein Deck aus, um Karten zu sehen."
      />

      <DeckPagination {...deckPagination} />
    </section>
  );
};

export default DecksView;
