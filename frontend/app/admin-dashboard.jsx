'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Clock3, ExternalLink, GraduationCap, Layers3, LayoutGrid, Search, ShieldCheck, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react';
import { levelFor } from './data';
import { directoryEntries } from './admin-directory';
import AdminDetailsPanel from './admin-details-panel';
import './admin-dashboard.css';
const levels = ['Beginner', 'Intermediate', 'Advanced'];
const people = [['Olivia Rhye', 'generative-ai', 1, 'pending'], ['Phoenix Baker', 'machine-learning', 2, 'pending'], ['Lana Steiner', 'web-development', 3, 'active'], ['Demi Wilkinson', 'data-science', 1, 'pending'], ['Drew Cano', 'python', 2, 'active'], ['Natali Craig', 'generative-ai', 3, 'completed'], ['Orlando Diggs', 'web-development', 1, 'active'], ['Andi Lane', 'data-analytics', 2, 'pending'], ['Kate Morrison', 'artificial-intelligence', 1, 'active'], ['Aarav Shah', 'machine-learning', 3, 'active'], ['Sofia Chen', 'cybersecurity', 1, 'pending'], ['Noah Williams', 'python', 2, 'active'], ['Mia Thompson', 'data-science', 1, 'active'], ['Ethan Brooks', 'generative-ai', 2, 'active']];
function sampleRecords(names) {
    const applications = [], submissions = [];
    people.forEach(([name, slug, level, state], i) => {
        const id = `sample-${i}`, count = names[String(slug)].length, current = levels[Number(level) - 1];
        applications.push({ id, user_id: id, student_name: String(name), email: String(name).toLowerCase().replace(' ', '.') + '@example.com', track_slug: String(slug), status: state === 'completed' ? 'completed' : 'approved' });
        names[String(slug)].forEach((_, j) => { const l = levelFor(j, count); if (state === 'completed' || levels.indexOf(l) < Number(level) - 1 || (l === current && state === 'pending') || (l === current && j === names[String(slug)].findIndex((_, k) => levelFor(k, count) === current) && state === 'active' && i % 2 === 0))
            submissions.push({ id: `${id}-${j}`, application_id: id, project_index: j, status: l === current && state === 'pending' ? 'pending' : 'approved', notes: 'Implemented the project requirements, documented the approach, and included validation results. Ready for a review of the submitted work.' }); });
    });
    return { applications, submissions };
}
export default function AdminDashboard({ records, tracks, names, preview, api, refresh, go }) {
    const [samples, setSamples] = useState(() => sampleRecords(names));
    const data = preview ? samples : records;
    const [feedback, setFeedback] = useState({});
    const [analytics, setAnalytics] = useState(null), [analyticsError, setAnalyticsError] = useState('');
    const apiRef = useRef(api);
    const refreshRef = useRef(refresh); refreshRef.current = refresh;
    apiRef.current = api;
    useEffect(() => {
        if (preview)
            return;
        let stopped = false, inFlight = false;
        async function update() { if (inFlight || document.visibilityState !== 'visible')
            return; inFlight = true; try {
            await refreshRef.current();
            const result = await apiRef.current('analytics', {});
            if (!stopped) {
                setAnalytics(result);
                setAnalyticsError('');
            }
        }
        catch {
            if (!stopped)
                setAnalyticsError('Live statistics unavailable. Retrying automatically.');
        }
        finally {
            inFlight = false;
        } }
        update();
        const timer = setInterval(update, 15000);
        document.addEventListener('visibilitychange', update);
        return () => { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', update); };
    }, [preview]);
    const [query, setQuery] = useState(''), [tab, setTab] = useState('all'), [level, setLevel] = useState('all'), [course, setCourse] = useState('all'), [filters, setFilters] = useState(false), [selected, setSelected] = useState(null), [page, setPage] = useState(1), [sort, setSort] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
    const dialog = useRef(null), previousFocus = useRef(null), search = useRef(null), locked = useRef(false);
    const rows = directoryEntries(data).map(a => {
        const projects = names[a.track_slug] || [], submissions = data.submissions.filter(s => s.application_id === a.id), approved = submissions.filter(s => s.status === 'approved'), nextIndex = projects.findIndex((_, i) => !approved.some(s => s.project_index === i)), current = !projects.length ? 'Not started' : nextIndex < 0 ? 'Advanced' : levelFor(nextIndex, projects.length), currentIndexes = projects.map((_, i) => i).filter(i => levelFor(i, projects.length) === current), pending = submissions.filter(s => s.status === 'pending'), profile = data.users?.find(u => u.id === a.user_id), latest = [...submissions].sort((x, y) => (y.updated_at || '').localeCompare(x.updated_at || '') || y.project_index - x.project_index)[0];
        const status = profile?.disabled ? 'Paused' : a.status === 'completed' ? 'Completed' : a.status === 'pending' ? 'Application pending' : pending.length ? 'Pending review' : a.status === 'approved' ? 'Active' : a.status;
        return { ...a, email: a.email || profile?.email || 'Not available', projects, submissions, current, pending, latest, status, progress: projects.length ? Math.round(approved.length / projects.length * 100) : 0, course: tracks.find(t => t.slug === a.track_slug)?.name || a.track_slug || 'No internship yet', canPromote: a.status === 'approved' && !profile?.disabled && currentIndexes.length > 0 && currentIndexes.every(i => submissions.some(s => s.project_index === i && ['approved', 'pending'].includes(s.status))) && pending.some(s => currentIndexes.includes(s.project_index)), currentIndexes };
    });
    const pendingCount = rows.filter(r => r.status === 'Pending review' || r.status === 'Application pending').length;
    const filtered = rows.filter(r => (tab === 'all' || tab === 'pending' && ['Pending review', 'Application pending'].includes(r.status) || tab === 'active' && r.status === 'Active' || tab === 'completed' && r.status === 'Completed') && (level === 'all' || r.current === level) && (course === 'all' || r.track_slug === course) && `${r.student_name} ${r.username || ''} ${r.email} ${r.course}`.toLowerCase().includes(query.toLowerCase()));
    if (sort)
        filtered.sort((a, b) => a.student_name.localeCompare(b.student_name));
    const pageCount = Math.max(1, Math.ceil(filtered.length / 8)), safePage = Math.min(page, pageCount), visible = filtered.slice((safePage - 1) * 8, safePage * 8), person = rows.find(r => r.id === selected);
    useEffect(() => { setPage(1); }, [query, tab, level, course]);
    useEffect(() => { if (!selected)
        return; previousFocus.current = document.activeElement; dialog.current?.focus(); const key = (e) => { if (e.key === 'Escape')
        setSelected(null); if (e.key === 'Tab') {
        const controls = dialog.current?.querySelectorAll('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]');
        if (!controls?.length)
            return;
        const first = controls[0], last = controls[controls.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
            e.preventDefault();
            last.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    } }; document.addEventListener('keydown', key); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', key); document.body.style.overflow = old; previousFocus.current?.focus(); }; }, [selected]);
    async function approve(row, single, status = 'approved') {
        if (locked.current)
            return;
        locked.current = true;
        setBusy(true);
        setNotice('');
        const reviewFeedback = single ? (feedback[single.id] || '').trim() : '';
        if (status === 'rejected' && reviewFeedback.length < 10) {
            setNotice('Describe the changes needed in at least 10 characters.');
            locked.current = false; setBusy(false); return;
        }
        const ids = single ? [single.id] : row.pending.filter(s => row.currentIndexes.includes(s.project_index)).map(s => s.id);
        try {
            if (preview)
                setSamples(old => ({ ...old, applications: old.applications.map(a => a.id === row.id && a.status === 'pending' ? { ...a, status: 'approved' } : a), submissions: old.submissions.map(s => ids.includes(s.id) ? { ...s, status, feedback: reviewFeedback } : s) }));
            else {
                if (row.status === 'Application pending')
                    await api('approve_application', { id: row.id });
                else
                    for (const id of ids)
                        await api('review', { id, status, feedback: reviewFeedback || 'Project evidence reviewed and approved by the program administrator.' });
                await refresh();
            }
            setNotice(status === 'rejected' ? `Changes requested for ${row.student_name}.` : row.status === 'Application pending' ? `${row.student_name}â€™s application approved.` : single ? `Project approved for ${row.student_name}.` : row.current === 'Advanced' ? `${row.student_name}â€™s final level approved.` : `${row.student_name} promoted to ${levels[levels.indexOf(row.current) + 1]}.`);
        }
        catch (e) {
            setNotice(e.message + ' Refresh the page to confirm the latest review status.');
            try {
                await refresh();
            }
            catch { }
        }
        finally {
            locked.current = false;
            setBusy(false);
        }
    }
    async function complete(row) {
        if (locked.current) return;
        locked.current = true; setBusy(true); setNotice('');
        try {
            if (preview) setSamples(old => ({...old, applications: old.applications.map(a => a.id === row.id ? {...a, status: 'completed'} : a)}));
            else { await api('complete', {id: row.id}); await refresh(); }
            setNotice(`${row.student_name}'s program is complete. They can now claim their free certificate.`);
        } catch (error) { setNotice(error.message); }
        finally { locked.current = false; setBusy(false); }
    }
    function exportRows() { const cell = (value) => '"' + (/^[=+\-@\t\r]/.test(value) ? "'" : '') + value.replaceAll('"', '""') + '"'; const csv = [['Name', 'Email', 'Level', 'Current Course', 'Progress', 'Recent Project', 'Project Link', 'Status'], ...filtered.map(r => [r.student_name, r.email, r.current, r.course, `${r.progress}%`, r.projects[r.latest?.project_index] || '', r.latest?.github_url || '', r.status])].map(r => r.map(cell).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })); const a = document.createElement('a'); a.href = url; a.download = 'samkov-users.csv'; a.click(); URL.revokeObjectURL(url); setNotice(`${filtered.length} users exported.`); }
    const avatar = (name, i = 0) => <span className={`ad-avatar tone-${i % 5}`}>{name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>;
    const badge = (status) => <span className={`ad-status ${status === 'Pending review' || status === 'Application pending' ? 'pending' : status === 'Completed' ? 'completed' : status === 'Active' ? 'active' : 'paused'}`}><i />{status}</span>;
    const action = (r) => r.canPromote ? <button className="ad-promote" disabled={busy} onClick={() => approve(r)}><CheckCheck size={13}/>{r.current === 'Advanced' ? 'Approve final level' : 'Approve & Promote'}</button> : r.status === 'Application pending' ? <button className="ad-promote" disabled={busy} onClick={() => approve(r)}>Approve application</button> : <button className="ad-view" onClick={() => setSelected(r.id)}>View details <ArrowUpRight size={13}/></button>;
    return <div className="ad-shell">
  <aside className="ad-sidebar"><a className="ad-brand" href="/"><span><Sparkles size={21}/></span>samkov<span className="ad-ai">AI</span></a><div className="ad-workspace"><span className="ad-workspace-icon"><Layers3 size={17}/></span><div>Admin workspace<small>Learning management</small></div><ShieldCheck size={14}/></div><span className="ad-nav-label">WORKSPACE</span><nav aria-label="Admin navigation"><button className={tab !== 'pending' ? 'chosen' : ''} onClick={() => setTab('all')}><Users size={17}/>User management <span>{rows.length}</span></button><button className={tab === 'pending' ? 'chosen' : ''} onClick={() => setTab('pending')}><Clock3 size={17}/>Pending reviews <span className="ad-nav-count">{pendingCount}</span></button><button onClick={() => go('/admin/manage')}><BookOpen size={17}/>Curriculum <ArrowUpRight size={13}/></button></nav><div className="ad-sidebar-bottom"><div className="ad-tip"><span><Sparkles size={16}/> Small steps. Real growth.</span><p>Every review brings a learner one step closer to whatâ€™s next.</p><button onClick={() => setTab('pending')}>Review submissions <ArrowRight size={14}/></button></div><a className="ad-back" href="/dashboard"><LayoutGrid size={16}/>Back to my workspace<ArrowUpRight size={13}/></a><div className="ad-account"><span className="ad-avatar">SA</span><div>Samkov admin<small>Program administrator</small></div><ShieldCheck size={16}/></div></div></aside>
  <div className="ad-main"><div className="ad-topbar"><div>Workspace <ChevronRight size={13}/><strong>User management</strong></div><span className="ad-environment"><i />{preview ? 'Preview workspace' : 'Admin workspace'}</span></div><main className="ad-content"><div className="ad-heading"><div><div className="ad-eyebrow">YOUR LEARNERS, AT A GLANCE</div><h1>User management<span>{rows.length}</span></h1><p>A little guidance. A lot of potential. Manage every learnerâ€™s next step.</p></div><button className="ad-button" onClick={exportRows}><ArrowDownToLine size={15}/>Export users</button></div>
   <div className="ad-stats">{[{ label: 'Registered users', value: preview ? 'Demo' : analytics?.total_users, icon: Users, note: 'Enabled accounts, including admins', kind: '' }, { label: 'Active now', value: preview ? 'Demo' : analytics?.active_users, icon: GraduationCap, note: 'Signed in Â· seen in the last 5 minutes', kind: 'green' }, { label: 'Page views today', value: preview ? 'Demo' : analytics?.views_today, icon: Clock3, note: 'Page loads and navigation Â· UTC', kind: 'amber' }, { label: 'Total page views', value: preview ? 'Demo' : analytics?.total_views, icon: Layers3, note: 'Recorded since tracking was enabled', kind: 'purple' }].map(s => <div className={`ad-stat ${s.kind}`} key={s.label}><div>{s.label}<s.icon size={17}/></div><strong>{s.value ?? 'â€”'}</strong><small><span className="ad-stat-dot"/>{s.note}</small></div>)}</div>
   <p className="ad-live-note" role="status">{preview ? 'Design preview Â· sample learners below' : records.account_sync_error || analyticsError || (analytics ? `Updated ${new Date(analytics.updated_at).toLocaleTimeString()} Â· refreshes every 15 seconds` : 'Loading live statisticsâ€¦')}</p>
   {pendingCount > 0 && <div className="ad-review-banner"><div className="ad-review-icon"><CheckCheck size={20}/></div><div><strong>Great work is waiting for your green light.</strong><p><b>{pendingCount} learners</b> have work ready for review. Help them take the next step.</p></div><button onClick={() => { setTab('pending'); setLevel('all'); setCourse('all'); setQuery(''); }}>Review pending <ArrowRight size={15}/></button></div>}
   <section className="ad-sheet" aria-label="Learner directory"><div className="ad-sheet-tabs" role="tablist" aria-label="Filter users by status">{[['all', 'All users', rows.length], ['pending', 'Pending reviews', pendingCount], ['active', 'Active', rows.filter(r => r.status === 'Active').length], ['completed', 'Completed', rows.filter(r => r.status === 'Completed').length]].map(([id, label, count]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'selected' : ''} onClick={() => setTab(String(id))}>{label}<span>{count}</span></button>)}<span className="ad-sheet-caption"><Layers3 size={13}/>Sheet view</span></div>
    <div className="ad-toolbar"><div className="ad-search"><Search size={16}/><input ref={search} aria-label="Search users" placeholder="Search by name, email, or courseâ€¦" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14}/></button>}</div><label className="ad-select"><Layers3 size={14}/><select aria-label="Filter by level" value={level} onChange={e => setLevel(e.target.value)}><option value="all">All levels</option>{levels.map(l => <option key={l}>{l}</option>)}</select><ChevronDown size={12}/></label><button className={`ad-button ${filters ? 'ad-filter-selected' : ''}`} aria-expanded={filters} onClick={() => setFilters(!filters)}><SlidersHorizontal size={14}/>Filters{course !== 'all' && <span className="ad-filter-dot"/>}</button></div>
    {filters && <div className="ad-extra-filters"><label>Current course<select aria-label="Filter by course" value={course} onChange={e => setCourse(e.target.value)}><option value="all">All courses</option>{tracks.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select></label><button onClick={() => { setCourse('all'); setLevel('all'); setQuery(''); setTab('all'); }}>Reset filters</button></div>}
    <div className="ad-table-scroll"><table><thead><tr><th className="ad-number">#</th><th aria-sort={sort ? 'ascending' : 'none'}><button onClick={() => setSort(!sort)} aria-label={sort ? 'Use original order' : 'Sort by name'}>Name <ChevronsUpDown size={12}/></button></th>{['Email', 'Level', 'Current course', 'Progress', 'Recent project', 'Project link', 'Status', 'Actions'].map(s => <th key={s}>{s}</th>)}</tr></thead><tbody>{visible.map((r, i) => <tr key={r.id} className={selected === r.id ? 'ad-row-selected' : ''}><td className="ad-number">{String((safePage - 1) * 8 + i + 1).padStart(2, '0')}</td><td><button className="ad-person" onClick={() => setSelected(r.id)}>{avatar(r.student_name, i)}<strong>{r.student_name}{r.username && <small className="ad-username">@{r.username}</small>}</strong></button></td><td className="ad-email" title={r.email}>{r.email}</td><td><span className={`ad-level level-${Math.max(0, levels.indexOf(r.current))}`}><span className="ad-level-bars">â–‚â–…â–‡</span>{r.current === 'Not started' ? '—' : 'L' + (levels.indexOf(r.current) + 1)}<span className="ad-level-name"> Â· {r.current}</span></span></td><td>{r.course}</td><td><div className="ad-progress"><span><i style={{ width: r.progress + '%' }}/></span><b>{r.progress}%</b></div></td><td className="ad-project" title={r.projects[r.latest?.project_index]}>{r.projects[r.latest?.project_index] || 'No submissions yet'}</td><td>{r.latest?.github_url ? <a className="ad-project-link" href={r.latest.github_url} target="_blank" rel="noreferrer">View project <ExternalLink size={11}/></a> : <span className="ad-dash">â€”</span>}</td><td>{badge(r.status)}</td><td>{action(r)}</td></tr>)}</tbody></table>{!filtered.length && <div className="ad-empty"><Search size={25}/><h3>No users found</h3><p>Try another name or adjust your filters.</p><button className="ad-button" onClick={() => { setQuery(''); setCourse('all'); setLevel('all'); setTab('all'); }}>Clear filters</button></div>}</div>
    <div className="ad-pagination"><span>Showing <b>{filtered.length ? (safePage - 1) * 8 + 1 : 0}â€“{Math.min(safePage * 8, filtered.length)}</b> of <b>{filtered.length}</b> users</span><div><button aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={14}/></button>{Array.from({ length: pageCount }, (_, i) => i + 1).filter(n => n === 1 || n === pageCount || Math.abs(n - safePage) <= 1).map(n => <button aria-label={`Page ${n}`} aria-current={n === safePage ? 'page' : undefined} className={safePage === n ? 'current' : ''} key={n} onClick={() => setPage(n)}>{n}</button>)}<button aria-label="Next page" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)}><ChevronRight size={14}/></button></div></div>
   </section><div className="ad-footnote"><span><ShieldCheck size={13}/>Thoughtful reviews. Meaningful progress.</span><span>{preview ? 'Sample data Â· Changes last until you leave this page' : 'Only approved evidence unlocks the next level'}</span></div>
  </main></div>
  {notice && <div className="ad-toast" role="status"><Check size={17}/>{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16}/></button></div>}
  {person && <div className="ad-overlay" onClick={() => setSelected(null)}><AdminDetailsPanel ref={dialog}><div className="ad-drawer-top"><span>User details</span><button aria-label="Close user details" onClick={() => setSelected(null)}><X size={19}/></button></div><div className="ad-profile">{avatar(person.student_name)}<h2 id="ad-person-title">{person.student_name}</h2><p>{person.email}</p>{badge(person.status)}</div><div className="ad-drawer-section"><div className="ad-section-label">LEARNING JOURNEY</div><h3>{person.course}</h3><div className="ad-journey">{levels.map((l, i) => <span key={l} className={i <= levels.indexOf(person.current) ? 'reached' : ''}><i>{i < levels.indexOf(person.current) ? <Check size={12}/> : i + 1}</i>{l}</span>)}</div><div className="ad-drawer-progress"><span>Overall progress<strong>{person.progress}%</strong></span><div><i style={{ width: person.progress + '%' }}/></div></div></div><div className="ad-drawer-section"><div className="ad-section-label">PROJECT EVIDENCE <span>{person.submissions.length}</span></div>{!person.submissions.length && <p>No project submissions yet.</p>}{[...person.submissions].sort((a, b) => b.project_index - a.project_index).map(s => <div className="ad-evidence" key={s.id}><div><h4>{person.projects[s.project_index]}</h4><span className={s.status === 'pending' ? 'ad-evidence-pending' : ''}>{s.status === 'approved' ? <Check size={12}/> : <Clock3 size={12}/>} {s.status}</span></div>{s.notes && <p>{s.notes}</p>}{s.feedback && <p><strong>Review feedback:</strong> {s.feedback}</p>}{s.github_url && <a href={s.github_url} target="_blank" rel="noreferrer">Open project <ExternalLink size={12}/></a>}{s.live_url && <a href={s.live_url} target="_blank" rel="noreferrer">Live project <ExternalLink size={12}/></a>}{preview && <small>Sample submission Â· No external project attached</small>}{s.status === 'pending' && person.status === 'Pending review' && <div className="ad-review-controls"><label htmlFor={`feedback-${s.id}`}>Review feedback</label><textarea id={`feedback-${s.id}`} value={feedback[s.id] || ''} onChange={e => setFeedback(old => ({...old, [s.id]: e.target.value}))} maxLength={3000} placeholder="Explain what works or what needs to change" disabled={busy}/><div><button className="ad-button" disabled={busy || ((feedback[s.id] || '').trim().length > 0 && (feedback[s.id] || '').trim().length < 10)} onClick={() => approve(person, s)}>Approve project <Check size={13}/></button><button className="ad-button" disabled={busy || (feedback[s.id] || '').trim().length < 10} onClick={() => approve(person, s, 'rejected')}>Request changes</button></div></div>}</div>)}</div><div className="ad-drawer-footer">{person.progress === 100 && person.status === 'Active' ? <><p>All required projects are approved. Complete the program to unlock their free certificate.</p><button className="ad-promote" disabled={busy} onClick={() => complete(person)}>Complete program <CheckCheck size={13}/></button></> : person.canPromote ? <><p>All required evidence for this level is ready to approve.</p>{action(person)}</> : person.status === 'Application pending' ? action(person) : <p>{person.progress === 100 ? person.status === 'Completed' ? 'Program complete. The learner can claim their free certificate.' : 'All projects approved.' : !person.track_slug ? 'This account has not applied for an internship yet.' : 'The next level unlocks after every required project is approved.'}</p>}</div></AdminDetailsPanel></div>}
 </div>;
}
