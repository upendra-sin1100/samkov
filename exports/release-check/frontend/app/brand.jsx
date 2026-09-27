export default function Brand({ onClick, admin = false }) {
    return <a href="/" onClick={onClick} className={`samkov-brand${admin ? ' samkov-brand-admin' : ''}`} aria-label="SamkovAI home — Learn, Create, Progress">
        <svg viewBox="0 0 80 145" aria-hidden="true" className="samkov-symbol"><path fill="currentColor" d="M70 2 4 52v25l39 28-39 29v10l65-46-44-32 45-34Z"/><path fill="#ff681f" d="m49 50 27 20v23L36 62Z"/></svg>
        <span className="samkov-wordmark"><strong>SAMKOVAI</strong><small>LEARN CREATE PROGRESS</small></span>
    </a>;
}
