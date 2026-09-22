import { ReactNode } from 'react'

export interface Column<T> {
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export default function DataTable<T>({ columns, rows, emptyLabel, rowKey }: {
  columns: Column<T>[]
  rows: T[]
  emptyLabel: string
  rowKey: (row: T) => string
}) {
  return (
    <div className="overflow-x-auto border border-navy-700 rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-navy-800 text-slate-400">
          <tr>
            {columns.map((c) => (
              <th key={c.header} className="font-medium border-b border-navy-700">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-slate-500 italic">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-navy-800 hover:bg-navy-800/50">
                {columns.map((c) => (
                  <td key={c.header} className={c.className}>{c.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
