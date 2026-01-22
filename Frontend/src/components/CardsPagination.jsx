const CardsPagination = ({
  isVisible,
  page,
  totalCount,
  pageSize,
  onPrev,
  onNext
}) => {
  if (!isVisible) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 transition enabled:hover:border-emerald-400 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Zurück
      </button>
      <span className="text-slate-300">
        Seite {page} von {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 transition enabled:hover:border-emerald-400 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Weiter
      </button>
      <div className="ml-auto text-slate-400">{pageSize} pro Seite</div>
    </div>
  );
};

export default CardsPagination;
