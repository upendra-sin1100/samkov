'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
const answers = [
    { keys: /otp|login|sign.?in|code|email/i, text: 'Open Log in, enter your email, and continue with the email-code option. Enter the code to open your dashboard. Check spam if it does not arrive, then use the resend option when available.' },
    { keys: /pay|refund|charged/i, text: 'Learning, applications, and completion certificates are all free. No payment is required. Complete your projects and receive final approval to claim your certificate.' },
    { keys: /certificate|verify|qr/i, text: 'Every required project must be approved, followed by final completion approval. You can then unlock the free certificate from your workspace. Issued certificates have a public verification ID and QR code.' },
    { keys: /progress|remaining|left|dashboard|work/i, text: 'Your dashboard shows the number of approved projects, overall progress, and a checklist of what is left. A project under review still counts as remaining until it is approved.' },
    { keys: /submit|project|review|reject|feedback/i, text: 'Open your Learning roadmap, choose an unlocked project, and select Submit project. Share your GitHub repository and notes. Check your dashboard for feedback; update and resubmit if changes are requested.' },
    { keys: /apply|start|offer|internship/i, text: 'Explore internships, choose a track, and apply after signing in. Once an administrator approves your application, your offer letter and project submissions become available.' },
    { keys: /free|cost|course|learn/i, text: 'Applying and learning are free. Each track has course links and task briefs you can explore before signing in. Your verified completion certificate is free too.' }
];
export default function SupportChat() {
    const [open, setOpen] = useState(false), [input, setInput] = useState(''), [messages, setMessages] = useState([{ role: 'guide', text: 'Hi! I’m the SamkovAI automated guide. Ask about getting started, login codes, project progress, or certificates. I can explain the process, but cannot access your account or contact a human agent.' }]);
    const end = useRef(null), field = useRef(null), launcher = useRef(null);
    useEffect(() => { const show = () => setOpen(true); window.addEventListener('samkov-support', show); return () => window.removeEventListener('samkov-support', show); }, []);
    useEffect(() => { if (open)
        field.current?.focus(); }, [open]);
    useEffect(() => { if (open)
        end.current?.scrollIntoView({ block: 'nearest' }); }, [messages, open]);
    function ask(text) { if (!text.trim())
        return; const answer = answers.find(a => a.keys.test(text))?.text || 'I can help with login codes, applications, project reviews, progress, and certificates. Live human support is not connected yet, so I cannot resolve account-specific issues. Try one of the topics below.'; setMessages(m => [...m, { role: 'you', text: text.trim() }, { role: 'guide', text: answer }]); setInput(''); }
    function close() { setOpen(false); launcher.current?.focus(); }
    return <div className="support-widget">{open && <section className="chat-panel" role="dialog" aria-label="Customer support chat" onKeyDown={e => { if (e.key === 'Escape')
        close(); }}><div className="chat-head"><div><strong>SamkovAI support</strong><small>Automated guide · no live agent</small></div><button aria-label="Close support chat" onClick={close}><X size={20}/></button></div><div className="chat-messages" role="log" aria-live="polite">{messages.map((m, i) => <p key={i} className={'chat-message ' + m.role}><small>{m.role === 'you' ? 'You' : 'Guide'}</small>{m.text}</p>)}<div ref={end}/></div><div className="chat-topics">{['Getting started', 'My progress', 'Login code', 'Certificate'].map(t => <button key={t} onClick={() => ask(t)}>{t}</button>)}</div><form onSubmit={e => { e.preventDefault(); ask(input); }}><input ref={field} aria-label="Message support" value={input} maxLength={500} onChange={e => setInput(e.target.value)} placeholder="How can we help?"/><button className="primary" aria-label="Send support message" disabled={!input.trim()}><Send size={17}/></button></form><small className="chat-privacy">Don’t share passwords, login codes, or payment details.</small></section>}<button ref={launcher} className="chat-launcher" aria-label={open ? 'Hide support chat' : 'Open support chat'} aria-expanded={open} onClick={() => open ? close() : setOpen(true)}><MessageCircle size={21}/><span>Need a hand?</span></button></div>;
}
