import Brand from '../brand';
import styles from './privacy.module.css';

export const metadata = {
    title: 'Privacy Policy | SamkovAI',
    description: 'How SamkovAI handles account information, project submissions, and program records. Contact samkovaicorporation@gmail.com.',
};

const email = 'samkovaicorporation@gmail.com';

export default function PrivacyPage() {
    return <div className={styles.page}>
        <header className={styles.header}>
            <Brand onClick={undefined} />
            <a href="/">Back to home</a>
        </header>
        <main className={styles.content}>
            <p className={styles.eyebrow}>SAMKOVAI · PRIVACY & CONTACT</p>
            <h1>Privacy Policy</h1>
            <p>Last updated: 27 September 2026</p>
            <div className={styles.intro}>
                <p>SamkovAI is an independently operated, project-based internship and learning program. Participants build projects, submit their work for review, and receive program documents after meeting the relevant requirements.</p>
                <p><strong>SamkovAI is not a registered company.</strong> The SamkovAI name identifies this learning initiative. Participation and program documents do not, by themselves, establish employment or guarantee a job, academic credit, or recognition by another organisation.</p>
                <p>For support, privacy questions, or requests about your information, contact <a href={'mailto:' + email}>{email}</a>.</p>
            </div>

            <section>
                <h2>1. Information we collect</h2>
                <ul>
                    <li><strong>Account information:</strong> your name, email address, account identifier, and authentication information supplied through Clerk. If you choose Google sign-in, Google may provide your basic profile information, including your name, email address, and profile picture, through Clerk.</li>
                    <li><strong>Profile and application details:</strong> your occupation, college or company where provided, selected track, motivation, requested start date, and application status.</li>
                    <li><strong>Learning records:</strong> project and repository links, demonstration links, notes, files where uploads are available, review feedback, progress, and offer or certificate records.</li>
                    <li><strong>Activity and technical information:</strong> visit counts, signed-in activity timestamps, and security or operational logs. Hosting and authentication providers may process IP addresses, browser and device information, and request details.</li>
                    <li><strong>Communications and feedback:</strong> information you send to our contact email, and program ratings and feedback you submit. Feedback is screened for abusive language and stored for private review by program administrators; it is not published automatically.</li>
                </ul>
            </section>
            <section>
                <h2>2. How we use information</h2>
                <p>We use this information to create and secure accounts, review applications and projects, save progress, provide feedback, issue and verify program documents, respond to requests, maintain the website, and prevent misuse. Program administrators can access the information needed to carry out these tasks.</p>
            </section>
            <section>
                <h2>3. Google sign-in</h2>
                <p>Google sign-in is optional. When enabled and chosen, we use the basic identity information shared by Google to authenticate you and associate your sign-in with your SamkovAI account. This sign-in integration does not request access to your Gmail messages, Google Drive files, contacts, or calendars. SamkovAI does not receive your Google password.</p>
                <p>We do not sell Google user data or use it for advertising. You can remove SamkovAI&apos;s Google connection through your Google Account settings. Removing that connection does not automatically delete your SamkovAI account or program records; contact us to request their deletion.</p>
            </section>
            <section>
                <h2>4. Storage and service providers</h2>
                <p>We use Clerk for authentication and account management, hosting providers to deliver the website and backend, and database or file-storage services to store program records. Our contact inbox is hosted by Gmail. These providers process information needed to deliver their services, and processing may occur outside your country.</p>
                <p>We do not sell personal information. We may share information when needed to operate the program, respond to your request, meet a legal obligation, or address fraud, security incidents, or misuse. External sites linked in learning resources or project submissions have their own privacy practices.</p>
            </section>
            <section>
                <h2>5. Public document verification</h2>
                <p>Anyone with a valid offer or certificate verification link or QR code can view the associated verification details. These may include the participant&apos;s name, track, program dates, completion information, document identifier, signatory, and document status. Treat these links as shareable public records. Verification pages are not intended to display your email address, college or company, or private submission feedback.</p>
            </section>
            <section>
                <h2>6. Cookies and browser storage</h2>
                <p>Clerk uses cookies and related browser storage to support authentication and sessions. SamkovAI also stores your theme preference in your browser. You can clear or restrict browser storage, but doing so may sign you out or prevent parts of the website from working.</p>
            </section>
            <section>
                <h2>7. Retention and security</h2>
                <p>Account and program records are retained while needed to provide the program, maintain document verification, handle requests, and protect against misuse. Retention varies by record and service provider. Backups and security logs may remain for a limited period after an active record is removed.</p>
                <p>We use authenticated access and access restrictions to protect private records. No online service can guarantee absolute security. Do not include passwords, login codes, financial details, or other unnecessary sensitive information in submissions or support messages.</p>
            </section>
            <section>
                <h2>8. Your choices and requests</h2>
                <p>You can update the profile fields available in your account. To request access, correction, or deletion of other personal information, email <a href={'mailto:' + email}>{email}</a>, preferably from your registered address. We may ask for information needed to confirm that the account belongs to you, but never your password or login code.</p>
                <p>We will review your request and explain any records that must be retained, and why. Deleting an account may affect access to your learning history and the ability to verify your documents. Any rights available under applicable privacy law remain unaffected.</p>
            </section>
            <section>
                <h2>9. Changes and contact</h2>
                <p>We may update this policy when the program or its data practices change. The latest version will be available on this page with an updated date.</p>
                <p>Contact the SamkovAI program operator at <a href={'mailto:' + email}>{email}</a> for privacy matters, program questions, or support.</p>
            </section>
        </main>
        <footer className={styles.footer}>
            <a href="/">SamkovAI home</a>
            <a href={'mailto:' + email}>Contact SamkovAI</a>
        </footer>
    </div>;
}
