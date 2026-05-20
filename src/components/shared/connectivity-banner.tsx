"use client";

import { useConnectivityOptional } from "@/contexts/connectivity-context";

export function ConnectivityBanner() {
  const connectivity = useConnectivityOptional();
  if (!connectivity?.isOffline || !connectivity.message) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900"
    >
      {connectivity.message}
      <button
        type="button"
        onClick={connectivity.clearConnectivityIssue}
        className="ml-2 cursor-pointer font-medium underline"
      >
        Dismiss
      </button>
    </div>
  );
}
