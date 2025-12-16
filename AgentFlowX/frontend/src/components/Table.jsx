export default function Table({ columns, data }) {
  return (
    <div className="overflow-x-auto bg-slate-800 rounded-xl">
      <table className="w-full text-left">
        <thead className="bg-slate-700">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-sm font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-slate-400"
              >
                No data found
              </td>
            </tr>
          )}

          {data.map(row => (
            <tr key={row.id} className="border-t border-slate-700">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
