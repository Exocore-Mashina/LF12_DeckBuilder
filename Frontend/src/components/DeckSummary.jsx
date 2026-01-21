const formatMap = (map) => {
  if (!map || Object.keys(map).length === 0) return "-";
  return Object.entries(map)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
};

const DeckSummary = ({ summary }) => {
  if (!summary) {
    return null;
  }

  const items = [
    { label: "Deck", value: summary.name || "-" },
    { label: "Karten insgesamt", value: summary.totalCards ?? 0 },
    {
      label: "Durchschnittliches CMC",
      value:
        summary.averageCmc !== null && summary.averageCmc !== undefined
          ? summary.averageCmc.toFixed(2)
          : "0.00"
    },
    { label: "Farben", value: formatMap(summary.colors) },
    { label: "Typen", value: formatMap(summary.types) },
    { label: "Seltenheit", value: formatMap(summary.rarities) }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {item.label}
          </h3>
          <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </section>
  );
};

export default DeckSummary;
