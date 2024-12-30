import { NextResponse, NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '30d';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
      
      // Generate new access token
      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      const response = NextResponse.json(
        { message: 'Token refreshed successfully' },
        { status: 200 }
      );

      // Set new access token cookie
      response.cookies.set('auth-token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      });

      return response;
    } catch (error) {
      // If refresh token is invalid or expired
      const response = NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );

      // Clear both tokens
      response.cookies.delete('auth-token');
      response.cookies.delete('refresh-token');

      return response;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 