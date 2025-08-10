
interface ConfirmNavigationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmNavigationModal({
  isOpen,
  title = 'Leave this page?',
  message = 'A recording is in progress. If you navigate away, your recording will stop and be lost.',
  confirmLabel = 'Leave',
  cancelLabel = 'Stay',
  onConfirm,
  onCancel,
}: ConfirmNavigationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem'
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#1a1c2a',
          border: '1px solid rgba(86, 88, 245, 0.2)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'rgba(239,68,68,0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>⚠️</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>{title}</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '.95rem', lineHeight: 1.5, marginBottom: 16 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '.7rem 1rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: 10,
              cursor: 'pointer',
              minWidth: 110,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '.7rem 1rem',
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              borderRadius: 10,
              cursor: 'pointer',
              minWidth: 110,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


