const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// ─── Azure AD Token Validation Middleware ─────────────────────
// This middleware validates Azure AD access tokens on protected routes.
// Set AZURE_TENANT_ID and AZURE_CLIENT_ID as environment variables.

const TENANT_ID = process.env.AZURE_TENANT_ID || 'common';
const CLIENT_ID = process.env.AZURE_CLIENT_ID || '';

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
});

function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

/**
 * Express middleware to optionally validate Azure AD Bearer tokens.
 * If no Authorization header is present, the request proceeds (for local auth).
 * If a Bearer token is present, it is validated before proceeding.
 */
function validateAzureToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // No auth header — allow through (local auth / unauthenticated endpoints)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  // SSO is not configured on the server — skip validation
  if (!CLIENT_ID) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  const options = {
    audience: CLIENT_ID,
    issuer: [
      `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
      `https://sts.windows.net/${TENANT_ID}/`,
    ],
    algorithms: ['RS256'],
  };

  jwt.verify(token, getSigningKey, options, (err, decoded) => {
    if (err) {
      console.error('[Auth] Token validation failed:', err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info from the token to the request
    req.azureUser = {
      oid: decoded.oid,
      email: decoded.preferred_username || decoded.email || decoded.upn,
      name: decoded.name,
      roles: decoded.roles || [],
    };
    next();
  });
}

module.exports = { validateAzureToken };
