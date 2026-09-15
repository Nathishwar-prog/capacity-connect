import jwt from 'jsonwebtoken';
import { Response } from 'express';
import config from '../config';

export interface TokenPayload {
  userId: string;
  id?: string;
  email: string;
  role: string;
  organizationId?: string;
  permissions: string[];
}

export interface EmailVerificationPayload {
  userId: string;
  email: string;
  type: 'email_verification';
}

export class TokenUtils {
  /**
   * Generates a signed Access JWT
   */
  public static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: config.JWT_ACCESS_EXPIRATION as any,
    });
  }

  /**
   * Generates a signed Refresh JWT
   */
  public static generateRefreshToken(payload: Omit<TokenPayload, 'permissions'>): string {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: config.JWT_REFRESH_EXPIRATION as any,
    });
  }

  /**
   * Generates a signed Email Verification JWT (valid for 24 hours)
   */
  public static generateEmailVerificationToken(payload: { userId: string; email: string }): string {
    const tokenPayload: EmailVerificationPayload = {
      userId: payload.userId,
      email: payload.email.toLowerCase(),
      type: 'email_verification',
    };
    return jwt.sign(tokenPayload, config.JWT_SECRET, {
      expiresIn: '24h',
    });
  }

  /**
   * Verifies an Access JWT
   */
  public static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  }

  /**
   * Verifies a Refresh JWT
   */
  public static verifyRefreshToken(token: string): Omit<TokenPayload, 'permissions'> {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as Omit<TokenPayload, 'permissions'>;
  }

  /**
   * Verifies an Email Verification JWT
   */
  public static verifyEmailVerificationToken(token: string): EmailVerificationPayload {
    const decoded = jwt.verify(token, config.JWT_SECRET) as EmailVerificationPayload;
    if (decoded.type !== 'email_verification') {
      throw new Error('Invalid verification token type');
    }
    return decoded;
  }

  /**
   * Sets the refresh token as a secure cookie
   */
  public static setRefreshCookie(res: Response, token: string): void {
    // Parse cookie expiry (e.g. '7d' to milliseconds)
    const maxAge = this.parseDurationToMs(config.JWT_REFRESH_EXPIRATION);

    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
      maxAge,
      path: `${config.API_PREFIX}/auth`, // Scope cookie to auth routes (/refresh and /logout)
    });
  }

  /**
   * Clears the refresh token cookie
   */
  public static clearRefreshCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
      path: `${config.API_PREFIX}/auth`,
    });
  }

  /**
   * Helper utility to parse expiration strings to milliseconds (e.g., '15m', '7d')
   */
  private static parseDurationToMs(duration: string): number {
    const unit = duration.slice(-1);
    const amount = parseInt(duration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000; // Default 7 days
    }
  }
}

export default TokenUtils;
