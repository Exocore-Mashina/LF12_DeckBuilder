const LoadingOverlay = ({ isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        <span className="text-sm text-slate-200">Lädt...</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
