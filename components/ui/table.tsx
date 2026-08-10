// table.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Core table components
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div data-ui="table-container" className="relative w-full overflow-auto rounded-xl border bg-card shadow-sm">
    <table
      ref={ref}
      data-ui="table"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("sticky top-0 z-10 bg-muted [&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "min-h-[52px] border-b transition-colors duration-150 hover:bg-muted/55 data-[state=selected]:bg-primary/[0.055] data-[state=selected]:shadow-[inset_3px_0_0_hsl(var(--primary))]",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-11 whitespace-nowrap px-4 text-left align-middle text-[10px] font-semibold uppercase tracking-[.075em] text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-3 align-middle text-[13px] [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

// Reusable Pagination component
interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1,
  );
  return (
    <nav aria-label="Table pagination" className="flex flex-wrap items-center justify-between gap-3 border-t px-1 py-3">
      <span className="text-xs text-muted-foreground">
        Page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{Math.max(totalPages, 1)}</strong>
      </span>
      <div className="flex items-center gap-1">
      <Button
        size="icon-sm"
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>
      {pages.map((page, index) => (
        <React.Fragment key={page}>
          {index > 0 && page - pages[index - 1] > 1 && <span aria-hidden="true" className="px-1 text-muted-foreground">…</span>}
          <Button
            size="icon-sm"
            variant={page === currentPage ? "default" : "ghost"}
            onClick={() => onPageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
        </React.Fragment>
      ))}
      <Button
        size="icon-sm"
        variant="outline"
        disabled={currentPage === totalPages || totalPages === 0}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
      </div>
    </nav>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
