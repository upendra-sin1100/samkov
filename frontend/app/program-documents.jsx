'use client';
import { useId, useState } from 'react';
import { Download, ShieldCheck, ShieldX, Search, ExternalLink, BriefcaseBusiness, CalendarDays, Laptop, Layers, UsersRound, BadgeIndianRupee } from 'lucide-react';
import Brand from './brand';

const documentOrigin = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const documentHost = new URL(documentOrigin).host;

export const programStatement = 'An independent SamkovAI project-based learning program. This document does not certify employment or claim government recognition, accreditation, or affiliation with any other company.';
export function offerDocumentId(application) {
    return 'SKAI-OL-' + String(application.verification_id || '').replaceAll('-', '').toUpperCase();
}
export function documentDate(value) {
    if (!value) return 'Not recorded';
    const date = new Date(String(value).slice(0, 10) + 'T00:00:00Z');
    return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleDateString('en-GB', {day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'});
}
function BrandMark({ className }) {
    return <svg className={className} viewBox="0 0 80 145" aria-hidden="true"><path fill="currentColor" d="M70 2 4 52v25l39 28-39 29v10l65-46-44-32 45-34Z"/><path fill="#ff681f" d="m49 50 27 20v23L36 62Z"/></svg>;
}
function DocumentArt() {
    return <div className="document-art" aria-hidden="true"><i className="document-corner corner-top"/><i className="document-corner corner-bottom"/><BrandMark className="document-watermark"/></div>;
}
function DocumentSeal() {
    const sealId = useId();
    return <div className="document-seal" aria-label="SamkovAI program seal"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id={sealId + '-top'} d="M19 62 A41 41 0 0 1 101 62"/><path id={sealId + '-bottom'} d="M11 64 A49 49 0 0 0 109 64"/></defs><circle cx="60" cy="60" r="57" fill="white" stroke="#32383e" strokeWidth="1"/><circle cx="60" cy="60" r="50" fill="none" stroke="#b7b9bb" strokeWidth=".6"/><text fontFamily="Arial,sans-serif" fontSize="11" fontWeight="700" letterSpacing="2.6" fill="#161c23"><textPath href={'#' + sealId + '-top'} startOffset="50%" textAnchor="middle">SAMKOVAI</textPath></text><text fontFamily="Arial,sans-serif" fontSize="6.5" fontWeight="600" letterSpacing="1.2" fill="#32383e"><textPath href={'#' + sealId + '-bottom'} startOffset="50%" textAnchor="middle">LEARN · CREATE · PROGRESS</textPath></text><svg x="44" y="33" width="32" height="58" viewBox="0 0 80 145"><path fill="#161c23" d="M70 2 4 52v25l39 28-39 29v10l65-46-44-32 45-34Z"/><path fill="#ff681f" d="m49 50 27 20v23L36 62Z"/></svg><circle cx="16" cy="62" r="1.5"/><circle cx="104" cy="62" r="1.5"/></svg></div>;
}
function DocumentHeader({ label }) {
    return <div className="program-doc-header"><Brand/><div className="document-motto">IDEAS<br/>SKILLS<br/>BETTER TOMORROW<span>{label}</span></div></div>;
}
function VerificationCode({ id }) {
    const [failed, setFailed] = useState(false);
    return <div className="document-verification">
        {failed ? <div className="qr-unavailable">QR unavailable<br/>Use the document ID below</div> : <img src={'/api/qr?id=' + encodeURIComponent(id)} width={112} height={112} alt="Scan to open this document’s SamkovAI verification record" onError={() => setFailed(true)}/>}
        <div><strong>Verify with SamkovAI</strong><p>Scan the QR code or enter this ID at {documentHost}/verify.</p><a href={documentOrigin + '/verify/' + encodeURIComponent(id)}>{documentHost}/verify <ExternalLink size={13}/></a><small>Internship / document ID</small><code>{id}</code></div>
    </div>;
}
function DocumentFooter({ id, signatory, issuedAt }) {
    return <><div className="program-doc-footer"><div className="program-issuer"><span className="issuer-kicker">LEARN. CREATE. PROGRESS.</span><strong>{signatory || 'SamkovAI Program Office'}</strong><span>Authorized program issuer</span>{issuedAt && <small>Date of issue · {documentDate(issuedAt)}</small>}</div><DocumentSeal/><VerificationCode id={id}/></div><div className="document-bottomline"><a href={documentOrigin}>{documentHost}</a><span>PEOPLE · PROJECTS · POSSIBILITIES</span></div><p className="program-disclaimer">{programStatement}</p></>;
}
export function OfferDocument({ application, track }) {
    const id = offerDocumentId(application);
    const facts = [
        [BriefcaseBusiness, 'Internship track', track.name],
        [CalendarDays, 'Program dates', documentDate(application.start_date) + ' – ' + documentDate(application.end_date)],
        [Laptop, 'Mode', 'Remote · online'],
        [Layers, 'Program duration', track.weeks + ' weeks · project-based'],
        [UsersRound, 'Program team', 'SamkovAI'],
        [BadgeIndianRupee, 'Fees & stipend', 'Free participation · unpaid'],
    ];
    return <article className="document program-document program-offer">
        <DocumentArt/><DocumentHeader label="YOUR NEXT CHAPTER"/>
        <div className="program-doc-title"><span>LEARN WITH PURPOSE. BUILD WITH CONFIDENCE.</span><h2>OFFER <em>LETTER</em></h2><p>Project-based virtual internship</p></div>
        <div className="offer-reference"><span>INTERNSHIP / OFFER ID</span><code>{id}</code></div>
        <p className="offer-salutation">Dear <strong>{application.student_name},</strong></p>
        <p>Welcome to <strong>SamkovAI.</strong> We are pleased to offer you a place in our <strong>{track.name}</strong> virtual internship program. Turn your curiosity into practical skills through purposeful learning, original projects and feedback on your work.</p>
        <dl className="program-facts offer-facts">{facts.map(([Icon, label, value]) => <div key={label}><Icon aria-hidden="true"/><div><dt>{label}</dt><dd>{value}</dd></div></div>)}</dl>
        <h3>Internship overview</h3><p>Explore your learning roadmap, build projects that demonstrate your skills and develop a portfolio you can be proud of. Each level opens after the previous stage is reviewed and approved.</p>
        <h3>Your responsibilities</h3><ul><li>Follow the learning resources and complete the projects assigned to your track.</li><li>Submit original work with clear project links, documentation and supporting evidence.</li><li>Apply reviewer feedback and complete the required stages of the program.</li></ul>
        <h3>Completion & recognition</h3><p>Your completion certificate becomes available after all required projects and final completion are approved. Participation is free and unpaid. This offer confirms admission to a learning program; it does not offer employment, salary, placement or a job guarantee.</p>
        <p className="offer-closing">We look forward to seeing what you create.<br/><strong>Your next chapter starts in your SamkovAI workspace.</strong></p>
        <DocumentFooter id={id} signatory={application.authorized_signatory}/>
    </article>;
}
export function CertificateDocument({ certificate: c }) {
    return <article className={'document program-document program-certificate' + (c.status === 'revoked' ? ' document-revoked' : '')}>
        <DocumentArt/><DocumentHeader label="A MILESTONE EARNED"/>
        <div className="program-doc-title"><h2>CERTIFICATE</h2><p>OF INTERNSHIP COMPLETION</p></div>
        {c.status === 'revoked' && <p className="document-status-revoked">REVOKED — this certificate is no longer valid.</p>}
        <div className="certificate-award"><p className="award-intro">This is to certify that</p><h3>{c.student_name}</h3><p>has successfully completed the</p><h4>{c.track_title}</h4><p>project-based virtual internship program at <strong>SamkovAI</strong></p><p className="certificate-dates">{documentDate(c.start_date)} <span>TO</span> {documentDate(c.end_date)}<b>·</b>{c.duration_weeks} weeks</p><p className="certificate-recognition">Demonstrated practical skills through <strong>{c.projects_completed} approved projects</strong>,<br className="certificate-wide-break"/> completing the required learning activities and program review.</p><p className="certificate-completed">Completion approved · {documentDate(c.completed_at)}</p></div>
        <DocumentFooter id={c.id} signatory={c.authorized_signatory} issuedAt={c.issued_at}/>
    </article>;
}
export function PrintDocumentButton() {
    return <button className="secondary space-top" onClick={() => window.print()}><Download size={17}/>Print / Save PDF</button>;
}
export function VerificationPanel({ document, checked, error, id, go }) {
    const isOffer = document?.type === 'offer';
    const valid = document && (isOffer ? document.status === 'issued' : document.status === 'active');
    const title = error ? 'Verification unavailable' : !document ? 'Document not found' : valid ? isOffer ? 'Offer verified' : 'Completion verified' : document.status === 'revoked' ? 'Certificate revoked' : 'Document is not valid';
    return <main className="container narrow section"><div className="page-title"><div className="eyebrow blue-text">SAMKOVAI RECORDS</div><h1>Verify a document.</h1><p>Check an offer or certificate directly against SamkovAI’s issued records. No sign-in is needed.</p></div>
        <form className="panel form-panel" onSubmit={e => {e.preventDefault();go('/verify/' + encodeURIComponent(String(new FormData(e.currentTarget).get('id')).trim().toUpperCase()));}}><label>Certificate or internship ID<input name="id" key={id} required defaultValue={id} placeholder="Enter the full SKAI document ID" maxLength={100}/></label><button className="primary">Check record <Search size={18}/></button></form>
        {id && (!checked ? <p role="status">Checking SamkovAI records…</p> : <section className={'panel verification verification-result ' + (valid && !error ? 'record-valid' : 'record-unverified')} role="status">{valid && !error ? <ShieldCheck size={34}/> : <ShieldX size={34}/>}<h2>{title}</h2>
            {error ? <p>{error} <button className="text-link" onClick={() => window.location.reload()}>Retry</button></p> : document ? <><p>{valid ? isOffer ? 'SamkovAI confirms this offer was issued for admission to the program. It does not confirm completion.' : 'SamkovAI confirms this completion certificate is recorded as active.' : 'Do not treat this document as a valid completion certificate.'}</p><dl className="verification-facts">{[['Document ID',document.id],['Document type',isOffer ? 'Program offer' : 'Completion certificate'],['Participant',document.student_name],['Learning track',document.track_title],['Status',document.status],['Program dates',documentDate(document.start_date) + ' – ' + documentDate(document.end_date)],['Duration',document.duration_weeks + ' weeks'],...(!isOffer ? [['Approved projects',document.projects_completed],['Completion approved',documentDate(document.completed_at)],['Issued',documentDate(document.issued_at)]] : [])].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl><p>Compare the participant, track and dates here with the document you received. A copied QR code or ID does not validate altered details.</p></> : <p>No issued record matches this ID. Check the full ID and try again.</p>}
        </section>)}<p className="verification-scope">{programStatement} Verification confirms SamkovAI’s own record only.</p>
    </main>;
}
