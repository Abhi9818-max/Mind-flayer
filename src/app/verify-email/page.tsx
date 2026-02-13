import Link from "next/link";

export default function VerifyEmailPage() {
    return (
        <div style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            {/* Background orbs */}
            <div className="orb orb-purple" style={{ width: '400px', height: '400px', top: '20%', left: '-15%' }} />
            <div className="orb orb-pink" style={{ width: '300px', height: '300px', bottom: '20%', right: '-10%' }} />

            <div style={{
                maxWidth: '420px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Success Icon */}
                <div className="animate-glow" style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    margin: '0 auto 2rem'
                }}>
                    ✉️
                </div>

                <h1 className="font-display" style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    marginBottom: '0.75rem',
                    color: 'white'
                }}>
                    Check Your Email
                </h1>

                <p style={{
                    color: 'var(--gray-400)',
                    fontSize: '1rem',
                    lineHeight: 1.7,
                    marginBottom: '2rem'
                }}>
                    We&apos;ve sent a verification link to your college email.
                    Click the link to activate your account and enter the bubble.
                </p>

                {/* Tips Card */}
                <div className="card" style={{
                    padding: '1.5rem',
                    textAlign: 'left',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--gray-200)',
                        marginBottom: '1rem'
                    }}>
                        Didn&apos;t receive it?
                    </h3>
                    <ul style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        listStyle: 'none'
                    }}>
                        <li style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            fontSize: '0.875rem',
                            color: 'var(--gray-400)'
                        }}>
                            <span style={{ color: 'var(--purple-500)' }}>•</span>
                            Check your spam or junk folder
                        </li>
                        <li style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            fontSize: '0.875rem',
                            color: 'var(--gray-400)'
                        }}>
                            <span style={{ color: 'var(--purple-500)' }}>•</span>
                            Make sure you used your college email
                        </li>
                        <li style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            fontSize: '0.875rem',
                            color: 'var(--gray-400)'
                        }}>
                            <span style={{ color: 'var(--purple-500)' }}>•</span>
                            Wait a few minutes and check again
                        </li>
                    </ul>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
                        I&apos;ve Verified My Email
                    </Link>
                    <Link href="/signup" className="btn btn-secondary" style={{ width: '100%' }}>
                        Use a Different Email
                    </Link>
                </div>

                <p style={{
                    marginTop: '2rem',
                    fontSize: '0.75rem',
                    color: 'var(--gray-500)'
                }}>
                    Still having trouble?{" "}
                    <a href="mailto:support@mindflayer.app" style={{ color: 'var(--purple-500)', textDecoration: 'none' }}>
                        Contact support
                    </a>
                </p>
            </div>
        </div>
    );
}
