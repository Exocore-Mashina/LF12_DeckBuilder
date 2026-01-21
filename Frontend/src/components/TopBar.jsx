import Tabs from "./Tabs.jsx";

const TopBar = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchTermChange,
  onSearchSubmit
}) => {
  return (
    <header className="bg-slate-900/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Magic Deckbuilder</h1>
          <span className="text-sm text-slate-300">
            Baue, analysiere und verwalte deine Decks
          </span>
        </div>
        <div className="flex justify-center">
          <Tabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>
        <div className="flex md:justify-end">
          {activeTab === "cards" ? (
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSearchSubmit();
                }
              }}
              placeholder="Search cards..."
              className="w-full rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none md:max-w-[240px]"
            />
          ) : (
            <div className="hidden md:block md:h-10 md:w-[240px]" />
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
