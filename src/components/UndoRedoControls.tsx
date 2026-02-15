import React from 'react';

interface UndoRedoControlsProps {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
}

export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({ canUndo, canRedo, onUndo, onRedo }) => {
    return (
        <div style={{ display: 'flex', gap: '5px' }}>
            <button
                onClick={onUndo}
                disabled={!canUndo}
                className="settings-btn"
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
                style={{ opacity: canUndo ? 1 : 0.5, cursor: canUndo ? 'pointer' : 'not-allowed' }}
            >
                ↩️ Undo
            </button>
            <button
                onClick={onRedo}
                disabled={!canRedo}
                className="settings-btn"
                title="Redo (Ctrl+Y)"
                aria-label="Redo"
                style={{ opacity: canRedo ? 1 : 0.5, cursor: canRedo ? 'pointer' : 'not-allowed' }}
            >
                ↪️ Redo
            </button>
        </div>
    );
};
