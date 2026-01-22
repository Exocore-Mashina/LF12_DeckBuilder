const DeckSummary = ({ summary }) => {
  if (!summary) {
    return null;
  }

  const items = [
    { label: "Deck", value: summary.name || "-" },
    { label: "Karten", value: summary.totalCards ?? 0 },
    {
      label: "Ø CMC",
      value:
        summary.averageCmc !== null && summary.averageCmc !== undefined
          ? summary.averageCmc.toFixed(2)
          : "0.00"
    }
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
        >
          <h3 className="text-xs font-semibold text-slate-400">{item.label}</h3>
          <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </section>
  );
};

export default DeckSummary;
