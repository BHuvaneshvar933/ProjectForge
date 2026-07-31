import React from 'react';

export default function DashboardPagination({ page, totalPages, setPage }) {
  const safeTotalPages = totalPages || 1;
  const safePage = page || 1;

  return (
    <div className="dashboard-pagination">
      <button
        onClick={() => setPage(safePage - 1)}
        disabled={safePage <= 1}
        className={`dashboard-pagination__nav-btn ${safePage <= 1 ? 'is-disabled' : ''}`.trim()}
      >
        <svg className="dashboard-pagination__nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="dashboard-pagination__nav-text">Prev</span>
      </button>

      <div className="dashboard-pagination__pages">
        {[...Array(Math.min(5, safeTotalPages))].map((_, i) => {
          let pageNum;
          if (safeTotalPages <= 5) {
            pageNum = i + 1;
          } else if (safePage <= 3) {
            pageNum = i + 1;
          } else if (safePage >= safeTotalPages - 2) {
            pageNum = safeTotalPages - 4 + i;
          } else {
            pageNum = safePage - 2 + i;
          }

          return (
            <button
              key={i}
              onClick={() => setPage(pageNum)}
              className={`dashboard-pagination__page-btn ${safePage === pageNum ? 'is-active' : ''}`.trim()}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setPage(safePage + 1)}
        disabled={safePage >= safeTotalPages}
        className={`dashboard-pagination__nav-btn ${safePage >= safeTotalPages ? 'is-disabled' : ''}`.trim()}
      >
        <span className="dashboard-pagination__nav-text">Next</span>
        <svg className="dashboard-pagination__nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
