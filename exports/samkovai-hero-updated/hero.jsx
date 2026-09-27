'use client';

import { ArrowUpRight, ArrowRight, Check, Code2, ShieldCheck, Sparkles } from 'lucide-react';
import LearningAtmosphere from './learning-atmosphere';

export default function Hero({ go }) {
    return <div className="intro-hero-stage sk-hero-stage">
        <LearningAtmosphere />
        <section className="container sk-hero">
            <div>
                <span className="sk-kicker"><span className="sk-live-dot" aria-hidden="true" />Learning meets doing</span>
                <h1>You’ve done the courses.<br /><mark className="sk-highlight">Now build something real.</mark></h1>
                <p className="sk-lede">SamkovAI turns finished courses into guided internships. Pick a track, build a real project, get feedback from actual people — and walk away with work you can show.</p>
                <div className="sk-actions">
                    <button className="sk-btn-primary" onClick={() => go('/internships')}>Find your internship <ArrowUpRight size={18} /></button>
                    <a className="sk-btn-secondary" href="#how-it-works">See how it works <ArrowRight size={17} /></a>
                </div>
                <ul className="sk-promises">
                    <li><Check size={15} />No cost to start</li>
                    <li><Check size={15} />Projects with purpose</li>
                    <li><Check size={15} />Reviewed by real mentors</li>
                </ul>
            </div>
            <div className="sk-hero-visual">
                <div className="sk-waypoint" aria-hidden="true">
                    <svg viewBox="0 0 140 170" fill="none">
                        <path d="M70 165C70 165 10 108 10 62C10 27.7 36.7 1 70 1C103.3 1 130 27.7 130 62C130 108 70 165 70 165Z" className="sk-waypoint-shell" />
                        <circle cx="70" cy="62" r="26" className="sk-waypoint-core" />
                    </svg>
                    <span className="sk-waypoint-dot" />
                </div>
                <div className="sk-path-card">
                    <div className="sk-path-card-top"><span className="sk-card-eyebrow">Your path</span><Sparkles size={16} /></div>
                    <h2>Idea to<br />portfolio-ready.</h2>
                    <div className="sk-project-row">
                        <span className="sk-project-icon"><Code2 size={22} /></span>
                        <div><small>First deliverable</small><strong>Something worth sharing.</strong></div>
                        <ArrowUpRight size={18} />
                    </div>
                    <div className="sk-route"><span><Check size={12} />Learn</span><i /><span><Code2 size={12} />Build</span><i /><span><ShieldCheck size={12} />Prove</span></div>
                    <div className="sk-snippet"><span>01</span> curiosity + consistent practice<br /><span>02</span> <b>→ skills you can demonstrate</b></div>
                </div>
                <div className="sk-sticker"><ShieldCheck size={20} /><span>Not auto-generated.<small>Actually built by you.</small></span></div>
            </div>
        </section>
    </div>;
}
