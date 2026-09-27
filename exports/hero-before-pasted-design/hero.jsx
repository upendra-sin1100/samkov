'use client';

import { ArrowUpRight, ArrowRight, Check, Code2, ShieldCheck, Sparkles } from 'lucide-react';
import LearningAtmosphere from './learning-atmosphere';

export default function Hero({ go }) {
    return (
        <div className="intro-hero-stage">
        <LearningAtmosphere/>
        <section className="container intro-hero">
        <div>
        <span className="intro-kicker">
        <span className="live-dot"/> THE SPACE BETWEEN LEARNING & DOING</span>
        <h1>You bring the curiosity.<br />
        <span>Build what comes next.</span>
        </h1>
        <p>SamkovAI turns online learning into hands-on experience. Follow a guided internship, build real projects, and leave with work that shows what you can do.</p>
        <div className="hero-actions">
        <button className="primary" onClick={() => go('/internships')}>Find your path <ArrowUpRight size={18}/>
        </button>
        <a className="secondary" href="#how-it-works">See how it works <ArrowRight size={17}/>
        </a>
        </div>
        <div className="intro-promises">
        <span>
        <Check size={15}/>Free to learn</span>
        <span>
        <Check size={15}/>Projects with purpose</span>
        <span>
        <Check size={15}/>Reviewed by people</span>
        </div>
        </div>
        <div className="intro-visual">
        <div className="intro-orbit" aria-hidden="true"/>
        <div className="hero-cube" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        </div>
        <span className="hero-float-tag" aria-hidden="true">&lt;build your future /&gt;</span>
        <div className="build-board">
        <div className="board-top">
        <span>
        <i />
        <i />
        <i />
        </span>
        <small>YOUR NEXT CHAPTER</small>
        <Sparkles size={16}/>
        </div>
        <div className="board-body">
        <span className="board-tag">FROM IDEA TO “I BUILT THIS”</span>
        <h2>Less wondering.<br />More creating.</h2>
        <div className="board-project">
        <span className="board-project-icon">
        <Code2 size={26}/>
        </span>
        <div>
        <small>YOUR FIRST PROJECT</small>
        <strong>Something worth sharing.</strong>
        </div>
        <ArrowUpRight size={20}/>
        </div>
        <div className="board-path">
        <span>
        <Check size={12}/> Learn</span>
        <i />
        <span>
        <Code2 size={12}/> Build</span>
        <i />
        <span>
        <ShieldCheck size={12}/> Prove</span>
        </div>
        <div className="board-code">
        <span>01</span> curiosity + consistent practice<br />
        <span>02</span> <b>→ skills you can demonstrate</b>
        </div>
        </div>
        <div className="board-bottom">
        <span className="live-dot"/>Your pace. Your progress. Your proof.</div>
        </div>
        <div className="intro-sticker">
        <ShieldCheck size={23}/>
        <span>Earned through effort.<small>Backed by real work.</small>
        </span>
        </div>
        </div>
        </section>
 </div>
    );
}
