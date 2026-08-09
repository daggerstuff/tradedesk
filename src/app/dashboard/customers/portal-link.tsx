"use client";

import { useState } from "react";

export function PortalLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://trademechanics.com"}/portal/${token}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
