import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { environment } from '../../environments/environment';

function storedAuthToken(): string | null {
  const storedToken = localStorage.getItem('x-auth-token');
  if (!storedToken) return null;

  try {
    return JSON.parse(storedToken);
  } catch {
    return storedToken;
  }
}

@Injectable()
export class SocketOne extends Socket {
  constructor() {
    super({
      url: environment.apiBaseUrl,
      options: {
        query: { token: storedAuthToken() || '' }
      }
    });
  }
}
