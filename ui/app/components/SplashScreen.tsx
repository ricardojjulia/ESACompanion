import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onAuthenticated: (isManager: boolean, appId?: string | null) => void;
  userName?: string; // optional, passed by App.tsx
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const getUserEmail = () => {
    try {
      const w = window as any;
      if (w.dt?.user?.email) return String(w.dt.user.email);
      if (w.__DT_USER__?.email) return String(w.__DT_USER__.email);
      const stored = localStorage.getItem('esa-user-email');
      if (stored) return stored;
    } catch {}
    return 'Signed in';
  };
  const userEmail = getUserEmail();

  const validatePassword = (input: string): { isValid: boolean; isManager: boolean } => {
    const trimmedInput = input.trim();
    
    // Load configured users (APPIDs) from localStorage
    let users: any[] = [];
    try {
      const stored = localStorage.getItem('esa-users');
      users = stored ? JSON.parse(stored) : [];
    } catch (e) {
      users = [];
    }

    const appIds = users.map((u: any) => u.appId.trim());
    
    // Check if input matches any configured APPID (case-sensitive exact match)
    const isValidAppId = appIds.includes(trimmedInput);
    
    const digits = trimmedInput.match(/\d/g);
    const hasDigits = digits && digits.length > 0;
    const sum = hasDigits ? digits.reduce((acc, d) => acc + parseInt(d, 10), 0) : 0;
    const hasUpperM = /[M]/.test(trimmedInput);
    const sumValid = sum === 30;
    
    console.log("Password validation:", { input: trimmedInput, appIds, hasUpperM, sum, sumValid, isValidAppId });
    
    // Manager: needs uppercase M AND sum to 30
    if (hasUpperM && sumValid) {
      console.log("Validated as MANAGER");
      return { isValid: true, isManager: true };
    }
    
    // Regular user: must use configured APPID
    if (isValidAppId) {
      console.log("Validated as REGULAR USER (APPID match)");
      return { isValid: true, isManager: false };
    }
    
    return { isValid: false, isManager: false };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Please enter a password');
      return;
    }
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError('Invalid credentials. Use a configured APPID or manager password (M + digits = 30).');
      return;
    }
    console.log("Calling onAuthenticated with isManager:", validation.isManager);
    setIsValidating(true);
    
    // Pass APPID if regular user
    const appId = !validation.isManager ? password.trim() : null;
    
    setTimeout(() => onAuthenticated(validation.isManager, appId), 800);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0e27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '420px', background: '#0b1220', border: '1px solid #334155', borderRadius: '12px', padding: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Visually hidden username field to satisfy accessibility guidance */}
          <input type="text" name="username" autoComplete="username" style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }} aria-hidden="true" tabIndex={-1} />
          <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security Password</div>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Enter digits that sum to 30"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            disabled={isValidating}
            style={{ width: '100%', padding: '8px 12px', height: '34px', backgroundColor: '#0b1220', border: error ? '2px solid #ef4444' : '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', fontSize: '12px' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#64748b'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#ef4444' : '#334155'; }}
          />
          {error && <div style={{ fontSize: '12px', color: '#ff6666' }}>{error}</div>}
          <button type="submit" disabled={isValidating} style={{ height: '44px', fontSize: '16px', fontWeight: 600, backgroundColor: isValidating ? 'rgba(100, 200, 255, 0.5)' : '#64c8ff', color: '#000', border: 'none', borderRadius: '8px', cursor: isValidating ? 'not-allowed' : 'pointer' }}>
            {isValidating ? 'Authenticating...' : 'Enter System'}
          </button>
        </form>
      </div>
    </div>
  );
};
// Minimal, clean SplashScreen without extra JSX fragments
