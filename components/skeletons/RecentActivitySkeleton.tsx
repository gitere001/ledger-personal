// Matches Recent Savings Activity table: 5 rows with date, type badge, note, amount
const ROWS = [
  { noteW: '45%' },
  { noteW: '60%' },
  { noteW: '30%' },
  { noteW: '50%' },
  { noteW: '40%' },
]

export default function RecentActivitySkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse">
      <div className="px-5 py-3.5 border-b border-gray-800">
        <div className="h-4 w-44 bg-gray-800 rounded" />
      </div>
      <div className="divide-y divide-gray-800/50">
        {ROWS.map(({ noteW }, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-4"
            style={{ animationDelay: `${i * 60}ms` }}>
            {/* Date */}
            <div className="h-3 w-20 bg-gray-800 rounded shrink-0" />
            {/* Type badge */}
            <div className="h-5 w-16 bg-gray-800 rounded-full shrink-0" />
            {/* Note */}
            <div className="h-3 bg-gray-800 rounded" style={{ width: noteW }} />
            {/* Amount */}
            <div className="h-4 w-20 bg-gray-800 rounded ml-auto shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
