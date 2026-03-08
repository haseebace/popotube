import crypto from 'crypto';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SECRET = process.env.NGINX_SECURE_LINK_SECRET || 'supersecret123';

/**
 * Generates an Nginx Secure Link for a given file path.
 * 
 * @param filePath The URI path configured in Nginx (e.g., `/downloads/my-video.mp4`)
 * @param expirationMinutes How long the link is valid for (default 24 hours)
 */
export function generateSecureLink(filePath: string, expirationMinutes: number = 60 * 24): string {
    const expires = Math.floor(Date.now() / 1000) + expirationMinutes * 60;
    
    // Nginx standard format: expirypath secret
    const payload = `${expires}${filePath} ${SECRET}`;
    
    // Generate base64 MD5 hash
    const hash = crypto.createHash('md5').update(payload).digest('base64');
    
    // Nginx uses a URL-safe variant of base64 that removes padding
    const md5 = hash.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    return `${filePath}?md5=${md5}&expires=${expires}`;
}
