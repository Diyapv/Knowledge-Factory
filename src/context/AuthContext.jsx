import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMsalInstance, loginRequest, graphConfig, isSSOConfigured } from '../config/msalConfig';

// All users — roles: admin, reviewer, contributor
const USERS = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin', initials: 'AD' },
  { username: 'abhijith', password: 'abhijith123', role: 'reviewer', name: 'Abhijith', initials: 'AB' },
  { username: 'diya', password: 'diya123', role: 'contributor', name: 'Diya', initials: 'DI' },
  { username: 'hari', password: 'hari123', role: 'reviewer', name: 'Hari', initials: 'HA' },
  { username: 'niharika', password: 'niharika123', role: 'contributor', name: 'Niharika', initials: 'NI' },
  { username: 'anjana', password: 'anjana123', role: 'contributor', name: 'Anjana', initials: 'AN' },
];

// Approvers list — reviewers who can approve/reject submissions
const APPROVERS = ['abhijith', 'hari'];

// Approver assignments per category
export const REVIEWER_ASSIGNMENTS = {
  'Authentication': ['abhijith', 'hari'],
  'API Utils': ['abhijith', 'hari'],
  'Security': ['abhijith', 'hari'],
  'DevOps': ['hari'],
  'Testing': ['abhijith'],
  'Database': ['hari'],
  'Frontend': ['abhijith'],
  'Backend': ['hari'],
  'Middleware': ['abhijith'],
  'Data Processing': ['hari'],
  'EB Products': ['abhijith', 'hari'],
  'EB tresos': ['abhijith'],
  'EB corbos': ['hari'],
  'EB GUIDE': ['abhijith'],
  'AUTOSAR': ['hari'],
  'Architecture': ['abhijith', 'hari'],
  'Standards & Compliance': ['abhijith', 'hari'],
  'CI/CD & DevOps': ['hari'],
  'Other': ['abhijith', 'hari'],
};

// Fallback: if a category has no assigned approver, all approvers can review
export function getReviewersForCategory(category) {
  const assigned = REVIEWER_ASSIGNMENTS[category];
  if (assigned && assigned.length > 0) return assigned;
  return APPROVERS;
}

export function getReviewerNames(category) {
  const usernames = getReviewersForCategory(category);
  return usernames.map(u => {
    const user = USERS.find(usr => usr.username === u);
    return user ? user.name : u;
  });
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('kf_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState(null);

  const ssoEnabled = isSSOConfigured();

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('kf_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('kf_user');
    }
  }, [user]);

  // Check for SSO redirect result on mount
  useEffect(() => {
    if (!ssoEnabled || user) return;
    const msalInstance = getMsalInstance();
    if (!msalInstance) return;

    msalInstance.initialize().then(() => {
      msalInstance.handleRedirectPromise().then(response => {
        if (response?.account) {
          handleSSOAccount(response.account);
        }
      }).catch(err => {
        console.error('[SSO] Redirect error:', err);
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build a user object from the Microsoft Graph profile
  const handleSSOAccount = useCallback(async (account) => {
    const msalInstance = getMsalInstance();
    if (!msalInstance) return;

    try {
      // Get access token to call Graph API
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      // Fetch user profile from Microsoft Graph
      const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
        headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
      });

      let profile = {};
      if (graphResponse.ok) {
        profile = await graphResponse.json();
      }

      const displayName = profile.displayName || account.name || account.username;
      const email = profile.mail || profile.userPrincipalName || account.username;
      const initials = displayName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      // Check if this email matches a local user for role inheritance
      const localMatch = USERS.find(u =>
        u.username.toLowerCase() === email.split('@')[0].toLowerCase()
      );

      const ssoUser = {
        username: email.split('@')[0].toLowerCase(),
        name: displayName,
        initials,
        email,
        role: localMatch?.role || 'member',
        authMethod: 'sso',
        azureId: account.localAccountId,
      };

      setUser(ssoUser);
    } catch (err) {
      console.error('[SSO] Profile fetch error:', err);
      // Fallback: use account info directly
      const displayName = account.name || account.username;
      const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      setUser({
        username: account.username.split('@')[0].toLowerCase(),
        name: displayName,
        initials,
        email: account.username,
        role: 'member',
        authMethod: 'sso',
        azureId: account.localAccountId,
      });
    }
  }, []);

  // Local username/password login
  // First checks hardcoded admin/reviewer accounts, then employee directory
  const [employeeList, setEmployeeList] = useState([]);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:3001/api/employees`)
      .then(r => r.json())
      .then(data => { setEmployeeList(data); setEmployeesLoaded(true); })
      .catch(() => { setEmployeesLoaded(true); });
  }, []);

  const login = (username, password) => {
    // Check hardcoded users first (admin, reviewers)
    const found = USERS.find(u => u.username === username && u.password === password);
    if (found) {
      const { password: _, ...safeUser } = found;
      setUser({ ...safeUser, authMethod: 'local' });
      return { success: true };
    }

    // Check employee directory by email
    // Username: email (e.g. aarti.patil@elektrobit.com) or firstname.lastname or firstname
    // Password: firstname + "123"
    if (!employeesLoaded) {
      return { success: false, error: 'Loading employee directory, please try again in a moment.' };
    }
    const input = username.toLowerCase().trim();
    let emp = null;

    // Try email match first
    emp = employeeList.find(e => e.email && e.email.toLowerCase() === input);

    // Try firstname.lastname match
    if (!emp && input.includes('.') && !input.includes('@')) {
      emp = employeeList.find(e => e.name.toLowerCase().replace(/\s+/g, '.') === input);
    }

    // Try firstname only (if unique)
    if (!emp && !input.includes('.') && !input.includes('@')) {
      const matches = employeeList.filter(e => e.name.toLowerCase().split(' ')[0] === input);
      if (matches.length === 1) {
        emp = matches[0];
      } else if (matches.length > 1) {
        return { success: false, error: `Multiple employees named "${input}". Use your email ID to login.` };
      }
    }

    if (!emp) return { success: false, error: 'Invalid username or password' };

    const firstName = emp.name.toLowerCase().split(' ')[0];
    if (password !== firstName + '123') {
      return { success: false, error: 'Invalid username or password' };
    }

    const initials = emp.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    setUser({
      username: emp.email ? emp.email.split('@')[0] : emp.name.toLowerCase().replace(/\s+/g, '.'),
      name: emp.name,
      initials,
      email: emp.email || '',
      role: 'contributor',
      department: emp.department || '',
      authMethod: 'local',
    });
    return { success: true };
  };

  // Microsoft SSO login (popup mode)
  const loginWithSSO = useCallback(async () => {
    const msalInstance = getMsalInstance();
    if (!msalInstance) {
      setSsoError('SSO is not configured. Set VITE_AZURE_CLIENT_ID in your .env file.');
      return;
    }

    setSsoLoading(true);
    setSsoError(null);

    try {
      await msalInstance.initialize();
      const response = await msalInstance.loginPopup(loginRequest);
      if (response?.account) {
        await handleSSOAccount(response.account);
      }
    } catch (err) {
      if (err.errorCode === 'user_cancelled') {
        setSsoError(null); // user closed the popup
      } else {
        console.error('[SSO] Login error:', err);
        setSsoError(err.message || 'SSO login failed. Please try again.');
      }
    } finally {
      setSsoLoading(false);
    }
  }, [handleSSOAccount]);

  const logout = useCallback(() => {
    const wasSSO = user?.authMethod === 'sso';
    setUser(null);

    if (wasSSO && ssoEnabled) {
      const msalInstance = getMsalInstance();
      if (msalInstance) {
        msalInstance.logoutPopup().catch(() => {});
      }
    }
  }, [user, ssoEnabled]);

  const isAdmin = user?.role === 'admin';
  const isReviewer = user?.role === 'reviewer' || isAdmin;
  const isApprover = isAdmin || APPROVERS.includes(user?.username);

  return (
    <AuthContext.Provider value={{
      user, login, loginWithSSO, logout,
      isAdmin, isReviewer, isApprover,
      ssoEnabled, ssoLoading, ssoError, employeesLoaded,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
