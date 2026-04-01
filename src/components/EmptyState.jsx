export default function EmptyState({ message, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-5xl mb-4">{icon || '📭'}</span>
      <p className="text-lg">{message || 'Nothing here yet.'}</p>
    </div>
  );
}
