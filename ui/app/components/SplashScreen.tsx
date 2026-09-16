import React, { useState } from 'react';

interface SplashScreenProps {
  onAuthenticated: (isManager: boolean) => void;
  userName?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'choose' | 'architect'>('choose');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateArchitectPassword = (input: string): boolean => {
    const trimmed = input.trim();
    const digits = trimmed.match(/\d/g);
    const hasDigits = digits && digits.length > 0;
    const sum = hasDigits ? digits.reduce((acc, d) => acc + parseInt(d, 10), 0) : 0;
    return /[M]/.test(trimmed) && sum === 30;
  };

  const handleArchitectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Please enter the architect password'); return; }
    if (!validateArchitectPassword(password)) {
      setError('Invalid password. Hint: uppercase M + digits that sum to 30.');
      return;
    }
    setIsValidating(true);
    setTimeout(() => onAuthenticated(true), 800);
  };

  const handleClientAccess = () => {
    setIsValidating(true);
    setTimeout(() => onAuthenticated(false), 600);
  };

  const cardStyle: React.CSSProperties = {
    width: '420px',
    background: '#0b1220',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '32px 28px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '6px',
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0e27', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      {/* Logo / title */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.5px' }}>ESA Companion</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Project Management Platform</div>
      </div>

      <div style={cardStyle}>
        {mode === 'choose' ? (
          <>
            <div>
              <div style={{ ...labelStyle, textAlign: 'center' }}>Select your role</div>
              <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>How are you accessing this application?</div>
            </div>

            {/* Architect button */}
            <button
              disabled={isValidating}
              onClick={() => setMode('architect')}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'transparent',
                border: '1px solid #3b82f6',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#93c5fd', marginBottom: '4px' }}>Architect Login</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Create and manage projects, tasks, and exports</div>
            </button>

            {/* Client button */}
            <button
              disabled={isValidating}
              onClick={handleClientAccess}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'transparent',
                border: '1px solid #10b981',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#6ee7b7', marginBottom: '4px' }}>Client Access</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>View projects, update status, and add notes</div>
            </button>

            {isValidating && (
              <div style={{ textAlign: 'center', color: '#64c8ff', fontSize: '13px' }}>Entering…</div>
            )}
          </>
        ) : (
          <>
            <div>
              <div style={{ ...labelStyle }}>Architect Authentication</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>Enter your architect password to continue</div>
            </div>

            <form onSubmit={handleArchitectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Hidden username for accessibility */}
              <input type="text" name="username" autoComplete="username" style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }} aria-hidden="true" tabIndex={-1} />
              <div>
                <div style={labelStyle}>Password</div>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Architect password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  disabled={isValidating}
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0a0e1f', border: error ? '1px solid #ef4444' : '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              {error && <div style={{ fontSize: '12px', color: '#f87171' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setMode('choose'); setPassword(''); setError(''); }}
                  style={{ flex: 1, height: '40px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isValidating}
                  style={{ flex: 2, height: '40px', backgroundColor: isValidating ? 'rgba(59,130,246,0.4)' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: isValidating ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}
                >
                  {isValidating ? 'Authenticating…' : 'Login as Architect'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
