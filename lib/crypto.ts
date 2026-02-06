import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'fallback-secret-key';

export function signReportParams(payload: object) {
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  const token = Buffer.from(data).toString('base64');
  return `${token}.${signature}`;
}

export function verifyReportParams(tokenString: string) {
  const [token, signature] = tokenString.split('.');
  if (!token || !signature) return null;

  const data = Buffer.from(token, 'base64').toString('utf-8');
  const expectedSignature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');

  if (signature !== expectedSignature) return null;

  return JSON.parse(data);
}