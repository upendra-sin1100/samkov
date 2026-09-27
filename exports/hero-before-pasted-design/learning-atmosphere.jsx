'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

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
        let frame = 0;
        const move = event => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const bounds = stage.getBoundingClientRect();
                element.style.setProperty('--drift-x', `${((event.clientX - bounds.left) / bounds.width - .5) * 18}px`);
                element.style.setProperty('--drift-y', `${((event.clientY - bounds.top) / bounds.height - .5) * 12}px`);
            });
        };
        const reset = () => {
            cancelAnimationFrame(frame);
            element.style.setProperty('--drift-x', '0px');
            element.style.setProperty('--drift-y', '0px');
        };
        stage.addEventListener('pointermove', move, { passive: true });
        stage.addEventListener('pointerleave', reset);
        return () => {
            stage.removeEventListener('pointermove', move);
            stage.removeEventListener('pointerleave', reset);
            reset();
        };
    }, [paused, reducedMotion]);

    return <>
        <div ref={layer} className="learning-atmosphere" data-paused={paused || reducedMotion} aria-hidden="true">
            <div className="atmosphere-grid" />
            <div className="atmosphere-glow" />
            <div className="atmosphere-orbits">
                <svg viewBox="0 0 1000 900" fill="none">
                    <g className="orbit-contours">
                        {Array.from({ length: 9 }, (_, index) => <ellipse key={index} cx="520" cy="440" rx={260 + index * 21} ry={160 + index * 21} transform="rotate(-32 520 440)" />)}
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
