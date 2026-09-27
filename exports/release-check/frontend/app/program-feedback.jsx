'use client';
import { useEffect, useState } from 'react';
import './program-feedback.css';

export default function ProgramFeedback({ applicationId, api }) {
    const [rating, setRating] = useState('5');
    const [message, setMessage] = useState('');
    const [state, setState] = useState('loading');
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let active = true;
        setState('loading'); setError('');
        api('my_feedback', { application_id: applicationId }).then(data => {
            if (active) setState(data.feedback.length ? 'sent' : 'ready');
        }).catch(() => { if (active) {setState('failed'); setError('Could not load your feedback. Please retry.');} });
        return () => { active = false; };
    }, [applicationId, retry]);
    async function submit(event) {
        event.preventDefault();
        if (state !== 'ready') return;
        setState('saving'); setError('');
        try {
            await api('send_feedback', { application_id: applicationId, rating: Number(rating), message: message.trim() });
            setState('sent'); setMessage('');
        } catch (e) { setState('ready'); setError(e.message); }
    }
    return <section className="program-feedback panel space-top" aria-labelledby="feedback-heading">
        <span className="eyebrow">HELP US IMPROVE</span><h2 id="feedback-heading">How was your experience?</h2>
        <p>Tell us what helped and what could be better. Honest criticism is welcome. Please avoid insults, threats, and personal information.</p>
        {state === 'sent' ? <p role="status">Thank you. Your feedback has been received for private review by the program team.</p> : state === 'loading' ? <p role="status">Loading feedback…</p> : state === 'failed' ? <><p role="alert">{error}</p><button className="secondary" onClick={() => setRetry(retry + 1)}>Retry</button></> : <form onSubmit={submit}>
            <label htmlFor="program-rating">Your rating<select id="program-rating" value={rating} onChange={e => setRating(e.target.value)} disabled={state === 'saving'}>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} / 5{n === 5 ? ' — Excellent' : n === 1 ? ' — Needs improvement' : ''}</option>)}</select></label>
            <label htmlFor="program-message">Your feedback<textarea id="program-message" required minLength={10} maxLength={2000} rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="What worked well? What should we improve?" disabled={state === 'saving'} aria-describedby="feedback-help"/></label>
            <small id="feedback-help">10–2,000 characters. Abusive language is screened before submission. Feedback is not published automatically.</small>
            {error && <p role="alert">{error}</p>}
            <button className="primary" disabled={state === 'saving'}>{state === 'saving' ? 'Sending…' : 'Send feedback'}</button>
        </form>}
    </section>;
}

export function FeedbackInbox({ api }) {
    const [items, setItems] = useState([]), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
    async function load() {
        setBusy(true); setError('');
        try { const data = await api('list_feedback'); setItems(data.feedback); setLoaded(true); }
        catch (e) { setError(e.message); }
        finally { setBusy(false); }
    }
    async function review(id, status) {
        setBusy(true); setError('');
        try { await api('review_feedback', {id,status}); setItems(old => old.filter(item => item.id !== id)); }
        catch (e) { setError(e.message); }
        finally { setBusy(false); }
    }
    return <section className="program-feedback panel space-top"><h2>Program feedback</h2><p>Private participant feedback awaiting review. Respectful negative reviews are valid feedback.</p><button className="secondary" disabled={busy} onClick={load}>{busy ? 'Loading…' : loaded ? 'Refresh feedback' : 'Load feedback'}</button>{error && <p role="alert">{error}</p>}{loaded && !items.length && <p role="status">No feedback awaiting review.</p>}{items.map(item => <article key={item.id} className="feedback-item"><strong>{item.rating} / 5</strong><small>Application: {item.application_id}</small><p>{item.message}</p><div><button className="secondary" disabled={busy} onClick={() => review(item.id,'reviewed')}>Mark reviewed</button><button className="text-link" disabled={busy} onClick={() => review(item.id,'dismissed')}>Dismiss abuse or spam</button></div></article>)}</section>;
}
