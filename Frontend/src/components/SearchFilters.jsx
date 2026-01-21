const inputClassName =
  "mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none";

const labelClassName = "text-xs font-semibold uppercase tracking-wide text-slate-400";

const SearchFilters = ({
  filters,
  deckId,
  deckOptions,
  onFiltersChange,
  onDeckChange,
  onSearch
}) => {
  return (
    <section className="border-b border-slate-800 bg-slate-900/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClassName} htmlFor="colorFilter">
              Farbe
            </label>
            <input
              id="colorFilter"
              type="text"
              value={filters.color}
              onChange={(event) =>
                onFiltersChange({ ...filters, color: event.target.value })
              }
              placeholder="z.B. R,U (kommasepariert; gültige Buchstaben: W U B R G C)"
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="cmcFilter">
              CMC
            </label>
            <input
              id="cmcFilter"
              type="text"
              value={filters.cmc}
              onChange={(event) =>
                onFiltersChange({ ...filters, cmc: event.target.value })
              }
              placeholder=">=3"
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="powerFilter">
              Stärke
            </label>
            <input
              id="powerFilter"
              type="text"
              value={filters.power}
              onChange={(event) =>
                onFiltersChange({ ...filters, power: event.target.value })
              }
              placeholder=">=2"
              className={inputClassName}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className={labelClassName} htmlFor="toughnessFilter">
              Verteidigung
            </label>
            <input
              id="toughnessFilter"
              type="text"
              value={filters.toughness}
              onChange={(event) =>
                onFiltersChange({ ...filters, toughness: event.target.value })
              }
              placeholder=">=2"
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="rarityFilter">
              Seltenheit
            </label>
            <select
              id="rarityFilter"
              value={filters.rarity}
              onChange={(event) =>
                onFiltersChange({ ...filters, rarity: event.target.value })
              }
              className={inputClassName}
            >
              <option value="">All Rarities</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Mythic">Mythic</option>
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor="typeFilter">
              Typ
            </label>
            <select
              id="typeFilter"
              value={filters.typeLine}
              onChange={(event) =>
                onFiltersChange({ ...filters, typeLine: event.target.value })
              }
              className={inputClassName}
            >
              <option value="">All Types</option>
              <option value="Creature">Creature</option>
              <option value="Spell">Spell</option>
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor="deckSelect">
              Deck auswählen
            </label>
            <select
              id="deckSelect"
              value={deckId}
              onChange={(event) => onDeckChange(event.target.value)}
              className={inputClassName}
            >
              <option value="">Deck auswählen</option>
              {deckOptions.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name} ({deck.cardCount} Karten)
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={onSearch}
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
          >
            Suchen
          </button>
        </div>
      </div>
    </section>
  );
};

export default SearchFilters;
