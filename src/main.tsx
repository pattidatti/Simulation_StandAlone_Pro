
/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const isChunkError =
                this.state.error?.name === 'TypeError' &&
                (this.state.error?.message?.toLowerCase().includes('failed to fetch dynamically imported module') ||
                    this.state.error?.message?.toLowerCase().includes('loading chunk') ||
                    this.state.error?.message?.toLowerCase().includes('dynamic import'));

            return (
                <div style={{
                    padding: '2rem',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    textAlign: 'center'
                }}>
                    <div style={{
                        maxWidth: '600px',
                        padding: '3rem',
                        backgroundColor: '#1e293b',
                        borderRadius: '2rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem', color: '#ef4444' }}>
                            {isChunkError ? 'Applikasjonen må oppdateres' : 'Noe gikk galt'}
                        </h1>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1.1rem' }}>
                            {isChunkError
                                ? 'En ny versjon av simulatoren er tilgjengelig. Trykk på knappen under for å laste inn på nytt.'
                                : 'Det oppstod en uventet feil i simuleringshallen.'}
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '1rem 2rem',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '1rem',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                        >
                            Oppdater applikasjonen
                        </button>

                        <details style={{ marginTop: '2rem', textAlign: 'left' }}>
                            <summary style={{ cursor: 'pointer', color: '#64748b', fontSize: '0.8rem' }}>Teknisk feilinfo</summary>
                            <pre style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: '#0f172a',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                overflowX: 'auto',
                                color: '#ef4444',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {this.state.error && (this.state.error.toString() + "\n\n" + this.state.error.stack)}
                            </pre>
                        </details>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
