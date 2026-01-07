// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import Hex from 'crypto-js/enc-hex';
import PBKDF2 from 'crypto-js/pbkdf2';
import WordArray from 'crypto-js/lib-typedarrays';

const PBKDF2_ITERATIONS = 250000;
const KEY_SIZE = 256 / 32;

export function encrypt(data: string, password: string): string {
  if (data.length < 10) throw new Error('data length cant be < 10');

  const salt = WordArray.random(16);
  const iv = WordArray.random(16);
  const key = PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
  });

  const encrypted = AES.encrypt(data, key, {
    iv,
  });

  const transitmessage = salt.toString(Hex) + ':' + iv.toString(Hex) + ':' + encrypted.ciphertext.toString(Hex);
  return transitmessage;
}

export function decrypt(data: string, password: string): string | false {
  const parts = data.split(':');
  if (parts.length !== 3) {
    // backward compatibility
    const bytes = AES.decrypt(data, password);
    let str: string | false = false;
    try {
      str = bytes.toString(Utf8);
    } catch (e) {}
    if (str && str.length < 10) return false;
    return str;
  }

  const salt = Hex.parse(parts[0]);
  const iv = Hex.parse(parts[1]);
  const ciphertext = Hex.parse(parts[2]);

  const key = PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
  });

  const decrypted = AES.decrypt({ ciphertext: ciphertext } as any, key, {
    iv,
  });

  let str: string | false = false;
  try {
    str = decrypted.toString(Utf8);
  } catch (e) {
    return false;
  }

  if (str && str.length < 10) return false;

  return str;
}
