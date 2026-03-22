import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ENCODING = 'hex';

function getEncryptionKey() {
    const key = process.env.VAULT_ENCRYPTION_KEY;
    if (!key) {
        // Fallback or warning - in production this must be set
        if (process.env.NODE_ENV === 'production') {
            throw new Error('VAULT_ENCRYPTION_KEY is not set in environment variables');
        }
        // Dev fallback - a fixed 32-byte key for local testing ONLY
        return Buffer.from('4facfe509d3b4b1a9c1a1a2b3c4d5e6f', 'hex').slice(0, 32);
    }
    // Assume hex key, covert to buffer
    try {
        const buf = Buffer.from(key, 'hex');
        if (buf.length !== 32) {
            throw new Error('VAULT_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
        }
        return buf;
    } catch (e) {
        throw new Error('Invalid VAULT_ENCRYPTION_KEY format. Must be hex.');
    }
}

export function encrypt(text: string): string {
    if (!text) return text;
    
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    
    const tag = cipher.getAuthTag();
    
    // Format: iv:tag:encrypted (all in hex)
    return `${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    
    const key = getEncryptionKey();
    const [ivHex, tagHex, content] = encryptedText.split(':');
    
    if (!ivHex || !tagHex || !content) return encryptedText;
    
    const iv = Buffer.from(ivHex, ENCODING);
    const tag = Buffer.from(tagHex, ENCODING);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    decipher.setAuthTag(tag);
    
    try {
        let decrypted = decipher.update(content, ENCODING, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error('Decryption failed. Data might be corrupted or key is incorrect.');
        return encryptedText; // Fallback to original text if decryption fails
    }
}
