import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;
  const state = { url: '/index' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [AuthGuard]
    });
    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  it('allows a session with a stored token', () => {
    localStorage.setItem('x-auth-token', JSON.stringify('token'));
    expect(guard.canActivateChild({} as any, state)).toBeTrue();
  });

  it('redirects a visitor without a token to login', () => {
    const result: any = guard.canActivateChild({} as any, state);
    expect(router.serializeUrl(result)).toBe('/?returnUrl=%2Findex');
  });
});
