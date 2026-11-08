import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard  {
  constructor(private router: Router) {}

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    return this.hasAuthToken()
      ? true
      : this.router.createUrlTree(['/'], {
          queryParams: { returnUrl: state.url }
        });
  }

  private hasAuthToken(): boolean {
    const storedToken = localStorage.getItem('x-auth-token');
    if (!storedToken) return false;

    try {
      return Boolean(JSON.parse(storedToken));
    } catch {
      return Boolean(storedToken);
    }
  }
}
