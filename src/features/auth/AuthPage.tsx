import { LoadingOverlay } from '@mantine/core';
import { useLayoutEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectAuthState, authenticateWithToken } from './authSlice';

function AuthPage() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [returnUrl, setReturnUrl] = useState('/');
  const authState = useAppSelector(selectAuthState);

  useLayoutEffect(() => {
    if (location.hash) {
      const authInfo = new URLSearchParams(location.hash.substring(1));
      const accessToken = authInfo.get('access_token');
      const state = authInfo.get('state');

      window.history.replaceState(
        window.history.state,
        document.title,
        `${window.location.pathname}${window.location.search}`
      );

      if (state) {
        setReturnUrl(state);
      }

      if (accessToken) {
        dispatch(authenticateWithToken(accessToken));
      }
    }
  }, [dispatch, location.hash]);

  switch (authState) {
    case 'authenticating':
      return <LoadingOverlay loaderProps={{ size: 'xl' }} visible />;
    case 'authenticated':
      return <Navigate to={returnUrl} replace />;
    case 'unauthenticated':
      return <Navigate to={'/'} replace />;
  }
}

export default AuthPage;
