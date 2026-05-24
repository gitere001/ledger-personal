// Matches the Savings Snapshot panel: 3 rows (Deposited/Interest/Withdrawn) + Balance + button
export default function SavingsSnapshotSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[
        { labelW: 56, valueW: 72 },
        { labelW: 44, valueW: 52 },
        { labelW: 60, valueW: 44 },
      ].map(({ labelW, valueW }, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800">
          <div className="h-3 bg-gray-800 rounded" style={{ width: labelW }} />
          <div className="h-4 bg-gray-800 rounded" style={{ width: valueW }} />
        </div>
      ))}
      {/* Balance row */}
      <div className="flex items-center justify-between pt-1">
        <div className="h-4 w-14 bg-gray-700 rounded" />
        <div className="h-5 w-24 bg-gray-700 rounded" />
      </div>
      {/* Button */}
      <div className="mt-auto h-9 w-full bg-gray-800 rounded-lg" />
    </div>
  )
}
