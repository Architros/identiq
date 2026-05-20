"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ConnectivityContextValue = {
  isOffline: boolean;
  message: string | null;
  reportServiceUnavailable: () => void;
  clearConnectivityIssue: () => void;
};

const ConnectivityContext = createContext<ConnectivityContextValue | null>(
  null,
);

export function ConnectivityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOffline, setIsOffline] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reportServiceUnavailable = useCallback(() => {
    setIsOffline(true);
    setMessage(
      "We couldn't reach the cloud. Your work is saved locally where possible — try again when your connection is stable.",
    );
  }, []);

  const clearConnectivityIssue = useCallback(() => {
    setIsOffline(false);
    setMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      isOffline,
      message,
      reportServiceUnavailable,
      clearConnectivityIssue,
    }),
    [isOffline, message, reportServiceUnavailable, clearConnectivityIssue],
  );

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error("useConnectivity must be used within ConnectivityProvider");
  }
  return context;
}

/** Safe when provider is optional (e.g. tests). */
export function useConnectivityOptional() {
  return useContext(ConnectivityContext);
}
