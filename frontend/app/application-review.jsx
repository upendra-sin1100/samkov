import { documentDate } from './program-documents';

export default function ApplicationReview({ application }) {
    return <section className="application-review" aria-label="Application details">
        <h3>Why they want to join</h3>
        <p className="application-motivation">{application.motivation?.trim() || 'No reason was recorded for this application.'}</p>
        <dl><div><dt>Current situation</dt><dd>{application.occupation === 'employee' ? 'Employee' : application.occupation === 'other' ? 'Other' : application.occupation === 'student' || application.college ? 'Student' : 'Not provided'}</dd></div>
            {application.college && <div><dt>College / institution</dt><dd>{application.college}</dd></div>}
            {application.company && <div><dt>Company</dt><dd>{application.company}</dd></div>}
            {application.start_date && <div><dt>Preferred start date</dt><dd>{documentDate(application.start_date)}</dd></div>}
            {application.created_at && <div><dt>Application submitted</dt><dd>{documentDate(application.created_at)}</dd></div>}
        </dl>
    </section>;
}
