import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

/**
 * Landing zone for Google (and future) OAuth redirects.
 * Backend redirects to: /auth/callback?token=JWT
 * We save the token via loginWithToken() then forward to /dashboard.
 */
function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/auth/login?error=oauth_failed', { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/auth/login?error=oauth_failed', { replace: true }));
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="empty-state min-h-[50vh]">
      <div className="spinner mx-auto" />
      <p className="text-sm text-slate-500 mt-3">Signing you in with Google…</p>
    </div>
  );
}

export default OAuthCallbackPage;
