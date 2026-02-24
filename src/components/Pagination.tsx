import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
    onItemsPerPageChange,
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalItems <= 10 && currentPage === 1 && itemsPerPage === 10) return null;

    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            pages.push(i);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            pages.push('...');
        }
    }

    // Remove consecutive ellipses
    const uniquePages = pages.filter((page, index) => {
        if (page === '...' && pages[index - 1] === '...') return false;
        return true;
    });

    return (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>
                    Showing <span className="font-semibold text-slate-900">{startItem}</span> to{' '}
                    <span className="font-semibold text-slate-900">{endItem}</span> of{' '}
                    <span className="font-semibold text-slate-900">{totalItems}</span> results
                </span>
                <div className="flex items-center gap-2 ml-4">
                    <label htmlFor="per-page" className="whitespace-nowrap">Show:</label>
                    <select
                        id="per-page"
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                        {[10, 25, 50, 100].map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {uniquePages.map((page, index) => (
                    <button
                        key={index}
                        disabled={page === '...'}
                        onClick={() => typeof page === 'number' && onPageChange(page)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${page === currentPage
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                                : page === '...'
                                    ? 'text-slate-400 cursor-default'
                                    : 'text-slate-600 hover:bg-white hover:text-indigo-600'
                            }`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
