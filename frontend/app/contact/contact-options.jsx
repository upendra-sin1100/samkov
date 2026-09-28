'use client';
import { useState } from 'react';
import styles from './contact.module.css';

const email = 'samkovaicorporation@gmail.com';
export default function ContactOptions() {
    const [message, setMessage] = useState('');
    async function copyEmail() {
        try {
            await navigator.clipboard.writeText(email);
            setMessage('Email address copied.');
        } catch {
            setMessage('Could not copy automatically. Select and copy the email address above.');
        }
    }
    return <section className={styles.card} aria-label="Email support">
        <h2>Email our team</h2>
        <a className={styles.email} href={'mailto:' + email}>{email}</a>
        <div className={styles.actions}>
            <a href={'mailto:' + email + '?subject=SamkovAI%20support'}>Open email app</a>
            <a href={'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email) + '&su=SamkovAI%20support'} target="_blank" rel="noopener noreferrer">Open Gmail ↗</a>
            <button type="button" onClick={copyEmail}>Copy email address</button>
        </div>
        <p>Choose an option to write your message. Opening an email draft does not send it.</p>
        <p role="status" aria-live="polite">{message}</p>
    </section>;
}
