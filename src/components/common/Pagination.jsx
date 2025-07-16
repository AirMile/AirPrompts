import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';

/**
 * Pagination component with full controls and keyboard navigation
 * @param {Object} paginationHook - The pagination hook object
 * @param {string} className - Additional CSS classes
 * @param {boolean} showInfo - Whether to show pagination info
 * @param {boolean} showPageSizeSelector - Whether to show page size selector
 * @param {string} variant - Pagination variant ('default', 'compact', 'minimal')
 */
const Pagination = ({ 
  paginationHook, 
  className = '', 
  showInfo = true, 
  showPageSizeSelector = true, 
  variant = 'default' 
}) => {
  const {
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    pageRange,
    showStartEllipsis,
    showEndEllipsis,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage,
    goToNextPage,
    changePageSize,
    isFirstPage,
    isLastPage,
    paginationInfo,
    pageSizeOptions
  } = paginationHook;

  // Don't render if no items or only one page
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`}>
        <button
          onClick={goToPreviousPage}
          disabled={isFirstPage}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <span className="text-sm text-gray-300 px-3">
          {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={goToNextPage}
          disabled={isLastPage}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center gap-1 ${className}`}>
        {pageRange.map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
      </div>
    );
  }

  // Default variant (full featured)
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-2">
        {/* First Page Button */}
        <button
          onClick={goToFirstPage}
          disabled={isFirstPage}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="First page"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        
        {/* Previous Page Button */}
        <button
          onClick={goToPreviousPage}
          disabled={isFirstPage}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {/* Start ellipsis */}
          {showStartEllipsis && (
            <>
              <button
                onClick={() => goToPage(1)}
                className="w-10 h-10 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm font-medium transition-colors"
                aria-label="Go to page 1"
              >
                1
              </button>
              <div className="flex items-center justify-center w-10 h-10 text-gray-400">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </>
          )}
          
          {/* Page range */}
          {pageRange.map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
          
          {/* End ellipsis */}
          {showEndEllipsis && (
            <>
              <div className="flex items-center justify-center w-10 h-10 text-gray-400">
                <MoreHorizontal className="w-4 h-4" />
              </div>
              <button
                onClick={() => goToPage(totalPages)}
                className="w-10 h-10 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm font-medium transition-colors"
                aria-label={`Go to page ${totalPages}`}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        
        {/* Next Page Button */}
        <button
          onClick={goToNextPage}
          disabled={isLastPage}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        
        {/* Last Page Button */}
        <button
          onClick={goToLastPage}
          disabled={isLastPage}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Last page"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Pagination Info and Page Size Selector */}
      {(showInfo || showPageSizeSelector) && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          {/* Pagination Info */}
          {showInfo && (
            <div className="flex items-center gap-4">
              <span>
                Showing {paginationInfo.startIndex} to {paginationInfo.endIndex} of {totalItems} items
              </span>
              <span>
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
          
          {/* Page Size Selector */}
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-gray-400">
                Items per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => changePageSize(parseInt(e.target.value, 10))}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 text-sm"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
                <option value={totalItems}>All ({totalItems})</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Jump to page input component
export const JumpToPage = ({ paginationHook, className = '' }) => {
  const { currentPage, totalPages, goToPage } = paginationHook;
  const [inputValue, setInputValue] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(inputValue, 10);
    if (page >= 1 && page <= totalPages) {
      goToPage(page);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="jumpToPage" className="text-sm text-gray-400">
        Jump to page:
      </label>
      <input
        id="jumpToPage"
        type="number"
        min="1"
        max={totalPages}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={currentPage.toString()}
        className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm"
      />
      <button
        type="submit"
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        Go
      </button>
    </form>
  );
};

// Keyboard navigation info component
export const PaginationKeyboardHelp = ({ className = '' }) => {
  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <div className="flex items-center gap-4">
        <span>Ctrl + ← → Previous/Next</span>
        <span>Ctrl + Home/End First/Last</span>
      </div>
    </div>
  );
};

export default Pagination;