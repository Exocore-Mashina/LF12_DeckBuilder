import { getCardImageUrl } from "../utils/api.js";

const CardGrid = ({ cards, mode, onAdd, onRemove, emptyState }) => {
  if (!cards || cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 px-6 py-10 text-center text-sm text-slate-400">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const scryfallId = card.scryfallId || card.id || "";
        const imageUrl = getCardImageUrl(scryfallId);
        const name = card.name || "Unbekannte Karte";
        const quantity = card.quantity ? `x${card.quantity}` : "";

        return (
          <div
            key={`${scryfallId}-${mode}`}
            className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"
          >
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              className="w-full object-contain"
            />
            {quantity ? (
              <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                {quantity}
              </span>
            ) : null}
            <div className="flex items-center justify-end gap-2 px-4 py-3">
              {mode === "deck" ? (
                <button
                  type="button"
                  onClick={() => onRemove(scryfallId)}
                  className="rounded-full bg-rose-400/90 px-3 py-1 text-xs font-semibold text-slate-950 transition hover:bg-rose-300"
                >
                  Entfernen
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onAdd(scryfallId)}
                  className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Hinzufügen
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardGrid;
