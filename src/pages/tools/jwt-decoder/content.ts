import type { ToolContent } from '@/data/content';

/** The widely published jwt.io example token, signed with the secret “your-256-bit-secret”. */
export const SAMPLE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
export const SAMPLE_SECRET = 'your-256-bit-secret';

export const content: ToolContent = {
  steps: [
    'Paste a token into the input. A leading “Bearer ” is removed for you.',
    'Read the decoded header and payload, and the claims table with dates in plain language.',
    'For HS256, HS384 or HS512 tokens, enter the secret and select Verify signature.',
  ],
  features: [
    'Decodes the header and payload, and lists every claim with a readable label.',
    'Turns `exp`, `iat` and `nbf` into UTC dates, and shows whether the token has expired.',
    'Verifies HMAC signatures (HS256, HS384, HS512) with the browser’s built-in Web Crypto.',
    'Explains malformed tokens, encrypted tokens (JWE) and unsigned “alg: none” tokens.',
    'Runs entirely on your device, so tokens are never sent to a server.',
  ],
  limitations: [
    'RS256, ES256 and other public-key signatures are decoded but not verified.',
    'Encrypted tokens (JWE, five parts) cannot be read without the decryption key.',
    'Decoding is not validation: always verify tokens on the server before trusting them.',
  ],
  article: [
    { h: 'What is inside a JWT?' },
    { p: 'A JSON Web Token has three parts separated by dots: a header, a payload and a signature. The first two are JSON, Base64URL-encoded. They are encoded, not encrypted, so anyone with the token can read them. The signature lets the receiver check that nobody changed the first two parts.' },
    { code: `header.payload.signature\n\n{"alg":"HS256","typ":"JWT"}            ← header\n{"sub":"1234567890","iat":1516239022}  ← payload (claims)`, lang: 'text' },
    { h: 'Standard claims' },
    { ul: [
      '`iss` (issuer): who created the token.',
      '`sub` (subject): who the token is about, often a user ID or username.',
      '`aud` (audience): who the token is meant for.',
      '`exp` (expires), `nbf` (not before) and `iat` (issued at): times in seconds since 1 January 1970, UTC.',
      '`jti`: a unique ID that lets a server reject a token used twice.',
    ] },
    { h: 'JWTs in Salesforce' },
    { p: 'The OAuth 2.0 JWT Bearer flow lets a server sign in to Salesforce without a password. It signs a token with RS256 using the private key that matches the certificate uploaded to a connected app. The claims Salesforce expects are:' },
    { ul: [
      '`iss`: the connected app’s consumer key.',
      '`sub`: the Salesforce username to sign in as.',
      '`aud`: `https://login.salesforce.com`, `https://test.salesforce.com` for sandboxes, or your community URL.',
      '`exp`: an expiry no more than three minutes away.',
    ] },
    { p: 'In Apex, the `Auth.JWT`, `Auth.JWS` and `Auth.JWTBearerTokenExchange` classes create and exchange these tokens.' },
    { h: 'Keep tokens safe' },
    { p: 'A valid token is a key: whoever holds it can act as the user until it expires. Only paste tokens into tools that run locally, like this one, and never share them in tickets or chat.' },
  ],
  faqs: [
    { q: 'Is the token sent to a server?', a: 'No. Decoding and signature checks run in your browser using built-in features. Nothing is uploaded or stored.' },
    { q: 'Why can I read the payload without a key?', a: 'JWT payloads are only encoded, not encrypted. The signature protects against changes, not against reading. Never put secrets in a JWT payload.' },
    { q: 'Why is RS256 not verified?', a: 'RS256 needs the issuer’s public key in PEM or JWK form. Verification of public-key signatures is planned; for now the tool decodes these tokens and shows their claims.' },
    { q: 'What does “Expired” mean here?', a: 'The `exp` claim is earlier than your device’s current time. A server would reject the token, although some allow a minute or two of clock skew.' },
    { q: 'Is the sample token safe to use?', a: 'Yes. It is the widely published example from the JWT standard’s community site, signed with the secret “your-256-bit-secret”.' },
  ],
};
