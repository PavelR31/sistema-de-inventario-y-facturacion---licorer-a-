import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

/**
 * Reusable pagination bar.
 * @param {object} meta – { current_page, last_page, total }
 * @param {function} onPageChange – called with new page number
 */
export default function DataPagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page, last_page, total } = meta;

  // Build page number list with ellipsis logic
  const getPages = () => {
    const pages = [];
    const delta = 1; // pages around current
    for (let i = 1; i <= last_page; i++) {
      if (
        i === 1 ||
        i === last_page ||
        (i >= current_page - delta && i <= current_page + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-muted-foreground">
        {total} {total === 1 ? 'registro' : 'registros'} · Página {current_page} de {last_page}
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => current_page > 1 && onPageChange(current_page - 1)}
              className={current_page <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
            />
          </PaginationItem>

          {getPages().map((page, idx) =>
            page === '...' ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === current_page}
                  onClick={() => page !== current_page && onPageChange(page)}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => current_page < last_page && onPageChange(current_page + 1)}
              className={current_page >= last_page ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
