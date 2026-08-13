import { Link } from 'react-router-dom';

interface Section {
  heading: string;
  body: string;
}

const TERMS: Section[] = [
  { heading: '1. Acceptance of Terms', body: 'By accessing or using CodeSphere, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.' },
  { heading: '2. Use of the Platform', body: 'CodeSphere provides coding practice and technical assessment tools. You agree to use the platform only for lawful purposes and not to attempt to disrupt, reverse-engineer, or gain unauthorized access to any part of the service.' },
  { heading: '3. Accounts', body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Provide accurate information when registering.' },
  { heading: '4. Code Execution', body: 'Code you submit is run in isolated sandboxed environments. Do not submit malicious code or attempt to escape the sandbox or exhaust shared resources.' },
  { heading: '5. Intellectual Property', body: 'You retain ownership of the code you write. You grant CodeSphere a limited license to store and process your submissions to operate the service.' },
  { heading: '6. Termination', body: 'We may suspend or terminate access for conduct that violates these terms or harms other users or the platform.' },
  { heading: '7. Changes', body: 'We may update these terms from time to time. Continued use after changes constitutes acceptance of the revised terms.' },
];

const PRIVACY: Section[] = [
  { heading: '1. Information We Collect', body: 'We collect the account information you provide (name, email), your code submissions and results, and technical usage data needed to operate the platform.' },
  { heading: '2. How We Use Information', body: 'We use your information to provide the service, track your progress, generate assessment reports for recruiters you interact with, and improve the platform.' },
  { heading: '3. Assessment Data', body: 'When you take an assessment, the recruiter who invited you can see your results and process analytics for that assessment.' },
  { heading: '4. Data Sharing', body: 'We do not sell your personal data. We share data only as needed to operate the service or where required by law.' },
  { heading: '5. Security', body: 'We use industry-standard measures including sandbox isolation, encrypted transport, and access controls to protect your data.' },
  { heading: '6. Your Rights', body: 'You may request access to or deletion of your personal data by contacting us.' },
  { heading: '7. Contact', body: 'For privacy questions, contact sunnyas1824@gmail.com.' },
];

export function LegalPage({ kind }: { kind: 'terms' | 'privacy' }) {
  const isTerms = kind === 'terms';
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const sections = isTerms ? TERMS : PRIVACY;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-semibold text-foreground">{s.heading}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-12 rounded-lg border border-border bg-card/40 p-4 text-sm text-muted-foreground">
          This is a template intended as a starting point and is not legal advice. Have it
          reviewed by a qualified professional before relying on it.
        </p>
      </div>
    </div>
  );
}
