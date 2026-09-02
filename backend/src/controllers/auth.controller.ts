import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseHelper } from '../errors/response.helper';
import { TokenUtils } from '../auth/token.utils';
import { BadRequestError } from '../errors/app-error';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public register = async (req: Request, res: Response): Promise<Response> => {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const { accessToken, refreshToken, user } = await this.authService.register(
      req.body,
      ipAddress,
      userAgent,
    );

    // Set secure HttpOnly cookie with refresh token
    TokenUtils.setRefreshCookie(res, refreshToken);

    return ResponseHelper.created(
      res,
      { accessToken, user },
      'User registered and authenticated successfully',
    );
  };

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

  public refresh = async (req: Request, res: Response): Promise<Response> => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
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

  public getMe = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const user = await this.authService.getMe(userId);

    return ResponseHelper.success({
      res,
      message: 'Authenticated user profile retrieved successfully',
      data: user,
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
    const userId = req.user!.userId;
    const updatedUser = await this.authService.submitTraineeOnboarding(userId, req.body);

    return ResponseHelper.success({
      res,
      message: 'Trainee profile setup completed successfully',
      data: updatedUser,
    });
  };
}

export default AuthController;
