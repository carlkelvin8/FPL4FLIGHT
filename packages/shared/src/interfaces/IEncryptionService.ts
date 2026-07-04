/**
 * IEncryptionService — domain interface for AES-256 encryption.
 * Concrete implementation uses expo-crypto on mobile.
 */

export interface IEncryptionService {
  /**
   * Encrypt a plaintext string.
   * Returns a base64-encoded ciphertext string.
   */
  encrypt(data: string): Promise<string>;

  /**
   * Decrypt a base64-encoded ciphertext string.
   * Returns the original plaintext.
   */
  decrypt(ciphertext: string): Promise<string>;
}
