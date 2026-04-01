export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
      <p className="text-sm text-on-surface-variant/50 mt-4 font-medium">Loading...</p>
    </div>
  );
}
