/**
 * WebCrypto AES-GCM Encryption / Decryption utility for local JSON backups.
 * No external dependencies, 100% on-device client cryptography.
 */

export async function encryptData(plainText: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key using PBKDF2
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(plainText)
  );

  const packageObj = {
    v: 1,
    cipher: 'AES-GCM-256',
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encryptedContent))
  };

  return JSON.stringify(packageObj, null, 2);
}

export async function decryptData(cipherPackageStr: string, passphrase: string): Promise<string> {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const packageObj = JSON.parse(cipherPackageStr);

  if (!packageObj.salt || !packageObj.iv || !packageObj.data) {
    throw new Error('Invalid encrypted backup format.');
  }

  const salt = new Uint8Array(packageObj.salt);
  const iv = new Uint8Array(packageObj.iv);
  const data = new Uint8Array(packageObj.data);

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedContent = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    data
  );

  return dec.decode(decryptedContent);
}
