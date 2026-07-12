import { NextRequest } from 'next/server';
import { User } from '../types';

export function getAuthenticatedUser(request: Request | NextRequest): User | null {
  try {
    let cookieStr = '';
    
    if ('cookies' in request && typeof request.cookies.get === 'function') {
      const cookieObj = (request as NextRequest).cookies.get('transitops-user');
      cookieStr = cookieObj?.value || '';
    } else {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/transitops-user=([^;]+)/);
      if (match) {
        cookieStr = decodeURIComponent(match[1]);
      }
    }

    if (!cookieStr) {
      cookieStr = request.headers.get('x-user-data') || '';
      if (cookieStr) {
        cookieStr = decodeURIComponent(cookieStr);
      }
    }

    if (!cookieStr) return null;
    const user = JSON.parse(cookieStr) as User;
    if (user && user.email && user.role) {
      return user;
    }
    return null;
  } catch (error) {
    return null;
  }
}
