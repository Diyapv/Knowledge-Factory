import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

// ─── Azure AD Configuration ──────────────────────────────────────
// Replace these with your actual Azure AD app registration values.
// 1. Go to https://portal.azure.com → Azure Active Directory → App registrations
// 2. Register a new app (SPA), set redirect URI to your app's URL
// 3. Copy the Application (client) ID and Directory (tenant) ID below
const AZURE_CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const AZURE_TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID || 'common';
const REDIRECT_URI = import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;

export const msalConfig = {
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: REDIRECT_URI,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (level, message) => {
        if (level === LogLevel.Error) console.error('[MSAL]', message);
      },
    },
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};

// Check if SSO is properly configured (not using placeholder values)
export function isSSOConfigured() {
  return AZURE_CLIENT_ID !== 'YOUR_CLIENT_ID_HERE' && AZURE_CLIENT_ID.length > 10;
}

// Singleton MSAL instance — only created if configured
let msalInstance = null;

export function getMsalInstance() {
  if (!msalInstance && isSSOConfigured()) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}
