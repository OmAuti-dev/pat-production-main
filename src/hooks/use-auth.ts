import { useAuth as useClerkAuth, useSession } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const { session } = useSession();
  const { signOut } = useClerkAuth();
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    if (!session) return;

    // Check token expiration
    const checkToken = async () => {
      try {
        const token = await session.getToken();
        if (!token) {
          setIsTokenValid(false);
          return;
        }
        setIsTokenValid(true);
      } catch (error) {
        console.error('Token validation error:', error);
        setIsTokenValid(false);
      }
    };

    // Initial check
    checkToken();

    // Set up periodic token checks
    const interval = setInterval(checkToken, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [session]);

  // Handle invalid token
  useEffect(() => {
    if (!isTokenValid) {
      // Attempt to refresh the session
      session?.refresh()
        .catch((error) => {
          console.error('Session refresh failed:', error);
          // If refresh fails, sign out the user
          signOut();
        });
    }
  }, [isTokenValid, session, signOut]);

  return {
    isAuthenticated: !!session && isTokenValid,
    session,
    signOut
  };
}; 