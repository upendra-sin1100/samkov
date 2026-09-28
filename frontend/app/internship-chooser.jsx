import { ArrowUpRight, BookOpen, Clock, Layers } from 'lucide-react';
import './internship-chooser.css';

export default function InternshipChooser({ applications, tracks, submissions, names, go }) {
    return <section className="internship-chooser" aria-labelledby="internship-chooser-title">
        <div className="chooser-heading"><div><span className="eyebrow">YOUR LEARNING JOURNEY</span><h2 id="internship-chooser-title">Choose your internship</h2><p>Pick a workspace to see your projects, feedback, and next steps.</p></div><span className="chooser-count">{applications.length} internships</span></div>
        <div className="chooser-grid">{applications.map(application => {
            const track = tracks.find(t => t.slug === application.track_slug);
            const total = names[application.track_slug]?.length || track?.projects || 0;
            const approved = new Set(submissions.filter(s => s.application_id === application.id && s.status === 'approved').map(s => s.project_index)).size;
            const pending = application.status === 'pending';
            return <button className="chooser-card" key={application.id} onClick={() => go('/dashboard/' + application.track_slug)}>
                <div className="chooser-card-top"><span className="chooser-icon"><BookOpen size={23}/></span><span className={'chooser-status ' + (pending ? 'waiting' : 'learning')}>{pending ? <Clock size={13}/> : <Layers size={13}/>} {pending ? 'Awaiting approval' : 'In progress'}</span></div>
                <h3>{track?.name || application.track_slug}</h3><p>{track?.weeks ? `${track.weeks} weeks · ` : ''}{total} projects · Remote</p>
                <div className="chooser-progress"><span>{pending ? 'Your application is being reviewed' : `${approved} of ${total} projects approved`}</span><div className="chooser-progress-track"><i style={{width: `${total ? Math.min(100, approved / total * 100) : 0}%`}}/></div></div>
                <div className="chooser-card-bottom"><span>Open workspace</span><ArrowUpRight size={19}/></div>
            </button>;
        })}</div>
    </section>;
}
