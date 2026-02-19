import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TableProps {
  className?: string;
  children?: ReactNode;
}

interface TableCellProps extends TableProps {
  colSpan?: number;
}

function Table({ className, children }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)}>{children}</table>
    </div>
  );
}

function TableHeader({ className, children }: TableProps) {
  return <thead className={cn("[&_tr]:border-b", className)}>{children}</thead>;
}

function TableBody({ className, children }: TableProps) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)}>{children}</tbody>;
}

function TableRow({ className, children }: TableProps) {
  return (
    <tr className={cn("border-b transition-colors hover:bg-muted/50", className)}>{children}</tr>
  );
}

function TableHead({ className, children }: TableProps) {
  return (
    <th className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground", className)}>
      {children}
    </th>
  );
}

function TableCell({ className, children, colSpan }: TableCellProps) {
  return <td className={cn("p-4 align-middle", className)} colSpan={colSpan}>{children}</td>;
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
