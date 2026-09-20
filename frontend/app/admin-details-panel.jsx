'use client';
import {forwardRef, useEffect, useRef, useState} from 'react';

const AdminDetailsPanel = forwardRef(function AdminDetailsPanel({children}, ref) {
    const [width, setWidth] = useState(520);
    const drag = useRef(null);
    const clamp = value => Math.min(Math.max(360, value), Math.max(360, window.innerWidth));
    useEffect(() => {
        try {
            const saved = Number(localStorage.getItem('samkov-admin-panel-width'));
            if (saved >= 360) setWidth(clamp(saved));
        } catch { /* Storage can be unavailable in private browsing. */ }
    }, []);
    function resize(value) {
        const next = Math.round(clamp(value));
        setWidth(next);
        try { localStorage.setItem('samkov-admin-panel-width', String(next)); } catch {}
    }
    return <div className="ad-drawer ad-resizable-drawer" ref={ref} tabIndex={-1}
        role="dialog" aria-modal="true" aria-labelledby="ad-person-title"
        style={{width: `${width}px`}} onClick={event => event.stopPropagation()}>
        <div className="ad-resize-handle" role="separator" tabIndex={0}
            aria-label="Resize user details panel" aria-orientation="vertical"
            aria-valuemin={360} aria-valuenow={width}
            onPointerDown={event => {
                if (event.button !== 0) return;
                drag.current = {x: event.clientX, width};
                event.currentTarget.setPointerCapture(event.pointerId);
                event.preventDefault();
            }}
            onPointerMove={event => {
                if (drag.current) resize(drag.current.width + drag.current.x - event.clientX);
            }}
            onPointerUp={event => {
                drag.current = null;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onLostPointerCapture={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
            onKeyDown={event => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault(); resize(width + (event.key === 'ArrowLeft' ? 40 : -40));
                }
            }}/>
        <div className="ad-panel-size"><span>Drag the left edge to resize</span><button type="button" onClick={() => resize(window.innerWidth)}>Expand</button><button type="button" onClick={() => resize(520)}>Reset size</button></div>
        {children}
    </div>;
});
export default AdminDetailsPanel;
