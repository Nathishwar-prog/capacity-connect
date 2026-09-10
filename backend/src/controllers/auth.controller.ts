import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseHelper } from '../errors/response.helper';
import { TokenUtils } from '../auth/token.utils';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Public Registration (Signup)
   *
   * Creates an account in PENDING status awaiting Admin Approval.
   * Does NOT issue tokens.
   */
  public register = async (req: Request, res: Response): Promise<Response> => {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const result = await this.authService.register(req.body, ipAddress, userAgent);

    return ResponseHelper.created(res, result, result.message);
  };

  /**
   * User Authentication (Login)
   *
   * Verifies credentials and checks that account is APPROVED.
   * On success, issues Access Token and sets rotating Refresh Token cookie.
   */
  public login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const { accessToken, refreshToken, user } = await this.authService.login(
      email,
      password,
      ipAddress,
      userAgent,
    );

    // Set secure HttpOnly cookie with refresh token
    TokenUtils.setRefreshCookie(res, refreshToken);

    return ResponseHelper.success({
      res,
      message: 'Login successful',
      data: { accessToken, user },
    });
  };

  /**
   * Session Management: Token Refresh
   *
   * Rotates refresh token and generates new access token.
   */
  public refresh = async (req: Request, res: Response): Promise<Response> => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    if (!refreshToken) {
      const { UnauthorizedError } = await import('../errors/app-error');
      throw new UnauthorizedError('No refresh token provided');
    }

    const { accessToken, newRefreshToken } = await this.authService.refreshAccessToken(
      refreshToken,
      ipAddress,
      userAgent,
    );

    // Rotate refresh token cookie
    TokenUtils.setRefreshCookie(res, newRefreshToken);

    return ResponseHelper.success({
      res,
      message: 'Access token refreshed successfully',
      data: { accessToken },
    });
  };

  /**
   * Session Management: Logout
   *
   * Revokes refresh token in database and clears cookie.
   */
  public logout = async (req: Request, res: Response): Promise<Response> => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    TokenUtils.clearRefreshCookie(res);

    return ResponseHelper.success({
      res,
      message: 'Logout successful',
    });
  };

  /**
   * Current Authenticated User Profile
   *
   * Returns safe account details from validated JWT session.
   */
  public getMe = async (req: Request, res: Response): Promise<Response> => {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const user = await this.authService.getMe(userId);

    return ResponseHelper.success({
      res,
      message: 'Authenticated user profile retrieved successfully',
      data: user,
    });
  };

  /**
   * Email Verification
   */
  public verifyEmail = async (req: Request, res: Response): Promise<Response> => {
    const { token } = req.body;
    const result = await this.authService.verifyEmail(token);

    return ResponseHelper.success({
      res,
      message: result.message,
    });
  };

  /**
   * Resend Verification Email
   */
  public resendVerification = async (req: Request, res: Response): Promise<Response> => {
    const { email } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const result = await this.authService.resendVerification(email, ipAddress, userAgent);

    return ResponseHelper.success({
      res,
      message: result.message,
    });
  };

  public getOnboardingMeta = async (_req: Request, res: Response): Promise<Response> => {
    const meta = await this.authService.getOnboardingMeta();
    return ResponseHelper.success({
      res,
      message: 'Onboarding metadata retrieved successfully',
      data: meta,
    });
  };

  public submitTraineeOnboarding = async (req: Request, res: Response): Promise<Response> => {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const updatedUser = await this.authService.submitTraineeOnboarding(userId, req.body);

    return ResponseHelper.success({
      res,
      message: 'Trainee profile setup completed successfully',
      data: updatedUser,
    });
  };
}

export default AuthController;
