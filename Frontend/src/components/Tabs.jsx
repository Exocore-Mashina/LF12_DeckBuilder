const baseClass =
  "rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";

const Tabs = ({ activeTab, onTabChange }) => {
  return (
    <nav className="flex gap-2 rounded-full bg-slate-800/70 p-1">
      <button
        type="button"
        onClick={() => onTabChange("cards")}
        className={`${baseClass} ${
          activeTab === "cards"
            ? "bg-emerald-400 text-slate-900"
            : "text-slate-300 hover:text-white"
        }`}
      >
        Karten
      </button>
      <button
        type="button"
        onClick={() => onTabChange("decks")}
        className={`${baseClass} ${
          activeTab === "decks"
            ? "bg-emerald-400 text-slate-900"
            : "text-slate-300 hover:text-white"
        }`}
      >
        Decks
      </button>
    </nav>
  );
};

export default Tabs;
