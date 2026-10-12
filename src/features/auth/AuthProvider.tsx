import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { Access } from "../../domain/contracts";
import { client } from "../../lib/client";
import { rpc, errorMessage } from "../../lib/api";
import { privateStateMustClear } from "./policy";
type Auth = {
  user: User | null;
  profile: Access["profile"] | null;
  access: Access | null;
  loading: boolean;
  error: string;
  refreshAccess: () => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw Error("Auth provider unavailable");
  return value;
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [access, setAccess] = useState<Access | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const owner = useRef<string | null>(
      sessionStorage.getItem("registrix:owner"),
    ),
    generation = useRef(0),
    alive = useRef(true),
    currentUser = useRef<User | null>(null);
  async function refreshAccess() {
    const id = currentUser.current?.id,
      revision = generation.current;
    if (!id) return;
    try {
      const a = await rpc<Access>("get_my_access");
      if (alive.current && revision === generation.current) {
        setAccess(a);
        setError("");
      }
    } catch (e) {
      if (alive.current && revision === generation.current) {
        setError(errorMessage(e));
        setAccess(null);
      }
    } finally {
      if (alive.current && revision === generation.current) setLoading(false);
    }
  }
  function accept(next: User | null) {
    const id = next?.id ?? null;
    if (privateStateMustClear(owner.current, id)) {
      generation.current++;
      for (const key of Object.keys(sessionStorage))
        if (key.startsWith("registrix:")) sessionStorage.removeItem(key);
      owner.current = id;
      setAccess(null);
      setError("");
      setLoading(!!next);
    }
    if (id) sessionStorage.setItem("registrix:owner", id);
    currentUser.current = next;
    setUser(next);
    if (next) void refreshAccess();
    else setLoading(false);
  }
  useEffect(() => {
    alive.current = true;
    if (!client) {
      setLoading(false);
      return;
    }
    let subscribed = true;
    client.auth.getSession().then(({ data, error }) => {
      if (!subscribed) return;
      if (error) setError("Session could not be restored. Sign in again.");
      accept(data.session?.user ?? null);
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        if (subscribed) accept(session?.user ?? null);
      });
    });
    return () => {
      subscribed = false;
      alive.current = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void refreshAccess();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("registrix-access-refresh", refresh);
    const interval = window.setInterval(refresh, 45000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("registrix-access-refresh", refresh);
      window.clearInterval(interval);
    };
  }, []);
  async function signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) {
      setError("Sign out could not be confirmed. Try again.");
      return;
    }
    accept(null);
  }
  return (
    <Context.Provider
      value={{
        user,
        profile: access?.profile ?? null,
        access,
        loading,
        error,
        refreshAccess,
        signOut,
      }}
    >
      {children}
    </Context.Provider>
  );
}
