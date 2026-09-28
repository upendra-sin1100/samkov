import Brand from '../brand';
import ContactOptions from './contact-options';
import styles from '../privacy/privacy.module.css';

export const metadata = {
    title: 'Contact us | SamkovAI',
    description: 'Contact SamkovAI for help with internship applications, projects, certificates, or your account.',
};

export default function ContactPage() {
    return <div className={styles.page}>
        <header className={styles.header}><Brand onClick={undefined}/><a href="/">Back to home</a></header>
        <main className={styles.content}>
            <p className={styles.eyebrow}>SAMKOVAI · SUPPORT</p>
            <h1>Contact us</h1>
            <p>Need help with an application, project, certificate, or your account? Email the SamkovAI team.</p>
            <ContactOptions/>
            <section><h2>Help us find your account</h2><p>Include your registered email, internship track, and a short description of the issue. If relevant, include your certificate ID or a screenshot. Never share passwords or sign-in codes.</p></section>
            <section><h2>Looking for a quick answer?</h2><p><a href="/#support">Read our frequently asked questions</a> for guidance on applications, projects, and certificates.</p></section>
        </main>
        <footer className={styles.footer}><a href="/">SamkovAI home</a><a href="/privacy">Privacy Policy</a></footer>
    </div>;
}
