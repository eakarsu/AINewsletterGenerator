import React from 'react';

function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  for (let i = left; i <= right; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', padding: '16px 0' }}>
      <button
        className="btn btn-secondary"
        style={{ padding: '4px 10px', fontSize: '13px' }}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        &laquo; Prev
      </button>

      {left > 1 && (
        <>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '13px' }}
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {left > 2 && <span style={{ padding: '0 4px', color: '#888' }}>…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ padding: '4px 10px', fontSize: '13px' }}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {right < totalPages && (
        <>
          {right < totalPages - 1 && <span style={{ padding: '0 4px', color: '#888' }}>…</span>}
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '13px' }}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className="btn btn-secondary"
        style={{ padding: '4px 10px', fontSize: '13px' }}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next &raquo;
      </button>
    </div>
  );
}

export default Pagination;
