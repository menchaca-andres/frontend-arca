import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  containerClassName?: string
}

export function Table({ children, className = '', containerClassName = '', ...props }: TableProps) {
  return (
    <div className={`table-container-ds ${containerClassName}`}>
      <table className={`table-ds ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`table-header-ds ${className}`} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`table-body-ds ${className}`} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`table-row-ds ${className}`} {...props}>
      {children}
    </tr>
  )
}

export function TableHead({
  children,
  className = '',
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`table-th-ds ${className}`} {...props}>
      {children}
    </th>
  )
}

export function TableCell({
  children,
  className = '',
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`table-td-ds ${className}`} {...props}>
      {children}
    </td>
  )
}
