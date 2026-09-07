import { SENSITIVE_FIELDS } from '../constants/audit.constants';

/**
 * Utility for sanitizing data payloads before writing to AuditLog or application logs.
 * Guarantees that passwords, JWTs, refresh tokens, API keys, and authorization headers
 * never appear in persisted audit records or log streams.
 */
export class AuditSanitizer {
  private static readonly REDACTED_MARKER = '[REDACTED]';

  // Regular expression detecting JWT patterns (header.payload.signature)
  private static readonly JWT_REGEX = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

  // Regular expression detecting Bearer tokens
  private static readonly BEARER_REGEX = /^Bearer\s+[A-Za-z0-9-_=.]+/i;

  /**
   * Deeply sanitizes an unknown value (object, array, or primitive) to remove all sensitive information.
   * Creates a new cloned copy without mutating original inputs.
   */
  public static sanitize<T = unknown>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return this.sanitizeString(data) as unknown as T;
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item)) as unknown as T;
    }

    if (data instanceof Date) {
      return data;
    }

    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      if (this.isSensitiveKey(key)) {
        // Redact or omit sensitive key
        sanitizedObj[key] = this.REDACTED_MARKER;
      } else {
        sanitizedObj[key] = this.sanitize(val);
      }
    }

    return sanitizedObj as T;
  }

  /**
   * Determines if a key name matches any forbidden sensitive keywords
   */
  public static isSensitiveKey(key: string): boolean {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');
    return SENSITIVE_FIELDS.some((sensitive) => {
      const normalizedSensitive = sensitive.toLowerCase().replace(/[-_]/g, '');
      return (
        normalizedKey === normalizedSensitive ||
        normalizedKey.includes(normalizedSensitive) ||
        normalizedSensitive.includes(normalizedKey)
      );
    });
  }

  /**
   * Redacts sensitive string patterns such as JWT tokens or Bearer authorizations
   */
  private static sanitizeString(str: string): string {
    if (this.BEARER_REGEX.test(str)) {
      return `Bearer ${this.REDACTED_MARKER}`;
    }

    if (this.JWT_REGEX.test(str)) {
      const segments = str.split('.');
      if (segments.length === 3 && segments[0].startsWith('ey')) {
        return this.REDACTED_MARKER;
      }
    }

    return str;
  }
}
