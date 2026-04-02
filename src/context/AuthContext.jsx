import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = async (sessionUser) => {
    if (!sessionUser) return;

    const discordId =
      sessionUser.user_metadata?.provider_id ||
      sessionUser.user_metadata?.sub ||
      null;

    const nickname =
      sessionUser.user_metadata?.full_name ||
      sessionUser.user_metadata?.name ||
      sessionUser.user_metadata?.preferred_username ||
      "디스코드유저";

    const avatarUrl =
      sessionUser.user_metadata?.avatar_url ||
      sessionUser.user_metadata?.picture ||
      null;

    const { error } = await supabase.from("profiles").upsert(
      {
        id: sessionUser.id,
        discord_id: discordId,
        nickname,
        avatar_url: avatarUrl,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("프로필 동기화 에러:", error.message);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("세션 확인 에러:", error.message);
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          void syncProfile(currentUser);
        }
      } catch (error) {
        console.error("AuthProvider init 에러:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;

      if (event === "SIGNED_OUT") {
        setUser(null);
        return;
      }

      setUser(currentUser);

      if (
        currentUser &&
        (event === "SIGNED_IN" || event === "USER_UPDATED")
      ) {
        void syncProfile(currentUser);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}

export { AuthProvider, useAuthContext };