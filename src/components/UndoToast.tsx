import React, { useEffect, useState } from 'react';
import './UndoToast.css';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  duration?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({ message, onUndo, duration = 5000 }) => {
  const [width, setWidth] = useState(100);

  useEffect(() => {
    // Small delay to ensure the initial 100% renders before transitioning to 0
    const timer = requestAnimationFrame(() => {
        setWidth(0);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div className="undo-toast" role="alert">
      <div className="undo-toast-content">
        <span>{message}</span>
        <button onClick={onUndo} className="undo-btn">Undo</button>
      </div>
      <div
        className="progress-bar"
        style={{
            width: `${width}%`,
            transition: `width ${duration}ms linear`
        }}
      />
    </div>
  );
};
