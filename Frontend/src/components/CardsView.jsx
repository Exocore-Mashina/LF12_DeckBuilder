import CardGrid from "./CardGrid.jsx";
import CardsPagination from "./CardsPagination.jsx";

const CardsView = ({ cards, onAddCard, pagination }) => {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Card Search</h2>
        <p className="text-sm text-slate-400">
          Suche Karten und füge sie deinem Deck hinzu.
        </p>
      </div>
      <CardGrid
        cards={cards}
        mode="cards"
        onAdd={onAddCard}
        emptyState="Starte eine Suche, um Karten zu sehen."
      />
      <CardsPagination {...pagination} />
    </section>
  );
};

export default CardsView;
