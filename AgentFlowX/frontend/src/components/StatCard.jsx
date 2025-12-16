export default function StatCard({ title, value, icon }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <h2 className="text-3xl font-bold mt-1">{value}</h2>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  )
}
