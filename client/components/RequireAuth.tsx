import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onUserChanged } from '@/auth';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<any | undefined>(undefined);
  const location = useLocation();

  useEffect(() => {
    const unsub = onUserChanged((u) => setUser(u));
    return unsub;
  }, []);

  // While we don't yet know auth state, render nothing (avoids flash)
  if (user === undefined) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
