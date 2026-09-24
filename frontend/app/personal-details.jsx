'use client';
import { useState } from 'react';
import { ArrowRight, Check, UserRound } from 'lucide-react';

export function PersonalFields({ initial }) {
    const [occupation, setOccupation] = useState(initial.occupation || '');
    return <>
        <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={100} defaultValue={initial.name || ''}/></label>
        <label>I am a<select name="occupation" required value={occupation} onChange={e => setOccupation(e.target.value)}>
            <option value="" disabled>Select your current situation</option>
            <option value="student">Student</option><option value="employee">Employee</option><option value="other">Other</option>
        </select></label>
        {occupation === 'student' && <label>College / institution<input key="college" name="college" autoComplete="organization" required minLength={2} maxLength={200} defaultValue={initial.college || ''} placeholder="Your college or institution"/></label>}
        {occupation === 'employee' && <label>Company<input key="company" name="company" autoComplete="organization" required minLength={2} maxLength={200} defaultValue={initial.company || ''} placeholder="Your company name"/></label>}
    </>;
}

export function personalData(form) {
    return { name: String(form.get('name') || '').trim(), occupation: String(form.get('occupation') || ''), college: String(form.get('college') || '').trim(), company: String(form.get('company') || '').trim() };
}

export function EnrollmentForm({ initial, busy, onSubmit }) {
    const [motivation, setMotivation] = useState('');
    const words = motivation.trim().split(/\s+/u).filter(Boolean).length;
    const today = new Date();
    const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return <form className="panel form-panel" onSubmit={e => { e.preventDefault(); if (words > 15) return; onSubmit(new FormData(e.currentTarget)); }}>
        <div className="personal-form-heading"><UserRound size={22}/><div><h2>A little about you</h2><p>Tell us where you are in your journey.</p></div></div>
        <PersonalFields initial={initial}/>
        <label>Preferred start date<input type="date" name="start" required min={minimumDate}/></label>
        <label>Why would you like to join?<textarea name="motivation" required maxLength={1500} value={motivation} aria-describedby="motivation-count" aria-invalid={words > 15} onChange={e => { setMotivation(e.target.value); e.target.setCustomValidity(e.target.value.trim().split(/\s+/u).filter(Boolean).length > 15 ? 'Please use 15 words or fewer.' : ''); }} placeholder="Share what you want to learn or build."/></label>
        <small id="motivation-count" className={'word-count' + (words > 15 ? ' over-limit' : '')} aria-live="polite">{words} / 15 words · Maximum 15 words</small>
        <label className="checkbox-label"><input type="checkbox" required/>I understand that projects must be my own work and certificates require verified completion.</label>
        <button className="primary" disabled={busy || words > 15}>{busy ? 'Submitting…' : 'Submit application'}<ArrowRight size={17}/></button>
    </form>;
}

export function ProfileForm({ initial, email, busy, onSave }) {
    return <form className="panel form-panel profile-form" onSubmit={e => { e.preventDefault(); onSave(personalData(new FormData(e.currentTarget))); }}>
        <div className="personal-form-heading"><UserRound size={24}/><div><h2>Your details</h2><p>Keep your name and current situation up to date.</p></div></div>
        <PersonalFields initial={initial}/>
        {email && <label>Sign-in email<input type="email" value={email} readOnly/><small>Your email is managed through your sign-in account.</small></label>}
        <p className="profile-note">Saved details will fill your next application. Existing applications, offer letters and certificates keep the details used when you applied.</p>
        <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}<Check size={17}/></button>
    </form>;
}
