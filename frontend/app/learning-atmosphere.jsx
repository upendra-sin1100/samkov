'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const strings = Array.from({ length: 9 }, (_, ring) => Array.from({ length: 96 }, (_, point) => {
    const angle = point / 96 * Math.PI * 2;
    const x = (260 + ring * 21) * Math.cos(angle);
    const y = (160 + ring * 21) * Math.sin(angle);
    const tilt = -32 * Math.PI / 180;
    return { x: 520 + x * Math.cos(tilt) - y * Math.sin(tilt), y: 440 + x * Math.sin(tilt) + y * Math.cos(tilt) };
}));
const stringPath = points => points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + 'Z';

export default function LearningAtmosphere() {
    const layer = useRef(null);
    const [paused, setPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReducedMotion(preference.matches);
        update();
        preference.addEventListener('change', update);
        return () => preference.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        const element = layer.current;
        const stage = element?.parentElement;
        if (!element || !stage || paused || reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        const svg = element.querySelector('svg');
        const paths = [...element.querySelectorAll('.orbit-string')];
        if (!svg) return;
        const particles = strings.map(points => points.map(p => ({ ...p, dx: 0, dy: 0, vx: 0, vy: 0 })));
        let frame = 0, lastTime = 0;
        let pointer = null;
        const draw = time => {
            const delta = lastTime ? Math.min((time - lastTime) / 16.67, 2) : 1;
            lastTime = time;
            let energy = 0;
            particles.forEach((points, ring) => {
                const shape = points.map(p => {
                    const x = pointer ? pointer.x - p.x : 0;
                    const y = pointer ? pointer.y - p.y : 0;
                    const influence = pointer ? Math.exp(-(x * x + y * y) / (2 * 135 * 135)) * .55 : 0;
                    p.vx = (p.vx + (x * influence - p.dx) * .07 * delta) * Math.pow(.77, delta);
                    p.vy = (p.vy + (y * influence - p.dy) * .07 * delta) * Math.pow(.77, delta);
                    p.dx += p.vx * delta;
                    p.dy += p.vy * delta;
                    energy += Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(x * influence - p.dx) + Math.abs(y * influence - p.dy);
                    return { x: p.x + p.dx, y: p.y + p.dy };
                });
                paths[ring].setAttribute('d', stringPath(shape));
            });
            frame = energy > .2 ? requestAnimationFrame(draw) : 0;
            if (!frame) lastTime = 0;
        };
        const wake = () => { if (!frame) frame = requestAnimationFrame(draw); };
        const move = event => {
            const matrix = svg.getScreenCTM();
            if (!matrix) return;
            const point = svg.createSVGPoint();
            point.x = event.clientX;
            point.y = event.clientY;
            pointer = point.matrixTransform(matrix.inverse());
            element.dataset.interacting = 'true';
            wake();
        };
        const reset = () => {
            pointer = null;
            element.dataset.interacting = 'false';
            wake();
        };
        stage.addEventListener('pointermove', move, { passive: true });
        stage.addEventListener('pointerleave', reset);
        window.addEventListener('blur', reset);
        return () => {
            stage.removeEventListener('pointermove', move);
            stage.removeEventListener('pointerleave', reset);
            window.removeEventListener('blur', reset);
            cancelAnimationFrame(frame);
            element.dataset.interacting = 'false';
            paths.forEach((path, index) => path.setAttribute('d', stringPath(strings[index])));
        };
    }, [paused, reducedMotion]);

    return <>
        <div ref={layer} className="learning-atmosphere" data-paused={paused || reducedMotion} aria-hidden="true">
            <div className="atmosphere-grid" />
            <div className="atmosphere-glow" />
            <div className="atmosphere-orbits">
                <svg viewBox="0 0 1000 900" fill="none">
                    <g className="orbit-contours">
                        {strings.map((points, index) => <path className="orbit-string" key={index} d={stringPath(points)} />)}
                    </g>
                    <path className="orbit-route" d="M80 780C80 530 330 710 420 510S700 190 945 165" />
                    <g className="orbit-stations">
                        <circle cx="80" cy="780" r="7" /><circle cx="420" cy="510" r="7" /><circle cx="945" cy="165" r="7" />
                    </g>
                    <circle className="orbit-satellite" cx="255" cy="178" r="13" />
                    <circle className="orbit-satellite orbit-satellite-cool" cx="845" cy="535" r="9" />
                    <path className="orbit-cross" d="M175 560v24m-12-12h24M790 100v18m-9-9h18" />
                </svg>
            </div>
            <div className="atmosphere-ribbon" />
            <div className="atmosphere-coordinate atmosphere-coordinate-one">01 / EXPLORE</div>
            <div className="atmosphere-coordinate atmosphere-coordinate-two">02 / CREATE</div>
        </div>
        {!reducedMotion && <button className="atmosphere-motion" aria-pressed={paused} aria-label={paused ? 'Resume hero motion' : 'Pause hero motion'} onClick={() => setPaused(value => !value)}>{paused ? <Play size={12}/> : <Pause size={12}/>}<span>{paused ? 'Motion paused' : 'Pause motion'}</span></button>}
    </>;
}
