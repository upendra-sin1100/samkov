import { ArrowUpRight, BrainCircuit, ChartNoAxesCombined, ChartPie, Clock, Code2, Layers, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

const icons = { chart: ChartNoAxesCombined, brain: BrainCircuit, code: Code2, terminal: Terminal, shield: ShieldCheck, spark: Sparkles, pie: ChartPie };

export default function InternshipCard({ track, go }) {
    const Icon = icons[track.icon] || Code2;
    return <article className={`track-card internship-card tone-${track.color}`}>
        <div className="internship-art" aria-hidden="true"><span className="internship-grid"/><Icon size={44} strokeWidth={1.4}/><span className="internship-orbit"/></div>
        <div className="internship-card-body">
            <div className="internship-category"><span>{track.category}</span><span className="internship-free">Free</span></div>
            <h3>{track.name}</h3><p>{track.description}</p>
            <div className="skill-tags">{track.skills.map(skill => <span key={skill}>{skill}</span>)}</div>
            <div className="card-meta"><span><Clock size={14}/>{track.weeks} weeks</span><span><Layers size={14}/>{track.projects} projects</span></div>
            <a className="card-link" href={'/internships/' + track.slug} onClick={event => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); go('/internships/' + track.slug); } }}>Explore internship <span><ArrowUpRight size={19}/></span></a>
        </div>
    </article>;
}
