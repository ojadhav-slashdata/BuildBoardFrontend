export default function EmptyState({ message, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant/60">
      <div className="h-20 w-20 rounded-2xl bg-surface-container-high flex items-center justify-center mb-5">
        <span className="text-4xl">{icon || '📭'}</span>
      </div>
      <p className="text-lg font-manrope font-semibold text-on-surface-variant">{message || 'Nothing here yet.'}</p>
      <p className="text-sm text-on-surface-variant/50 mt-1">Check back later or try a different filter.</p>
    </div>
  );
}
