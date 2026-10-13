import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/states';
import { TableSkeleton } from '@/components/feedback/skeletons';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
  /** Hide below the `md` breakpoint to keep tables readable on phones. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  loading?: boolean;
  empty?: { title: string; description?: string; action?: React.ReactNode };
  className?: string;
}

/** Presentational table with loading and empty states. Sorting/pagination are driven by the server via URL params. */
export function DataTable<T>({ columns, rows, rowKey, caption, loading, empty, className }: DataTableProps<T>) {
  if (loading) return <TableSkeleton />;
  if (rows.length === 0) {
    return <EmptyState compact title={empty?.title ?? 'Nothing here yet'} description={empty?.description} action={empty?.action} />;
  }
  return (
    <Table className={className}>
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((c) => (
            <TableHead
              key={c.key}
              scope="col"
              className={cn('text-xs font-semibold tracking-wide text-muted-foreground uppercase', c.align === 'end' && 'text-end', c.hideOnMobile && 'hidden md:table-cell', c.className)}
            >
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={rowKey(row)}>
            {columns.map((c) => (
              <TableCell key={c.key} className={cn(c.align === 'end' && 'text-end tabular-nums', c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                {c.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
