"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("wm_cookie_ok")) {
        setVisible(true);
      }
    } catch {
      // localStorage blocked (private browsing, etc.) — don't show banner
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem("wm_cookie_ok", "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "min(560px, calc(100vw - 48px))",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
        We collect basic analytics data to improve this site. No third-party tracking.{" "}
        <a href="/privacy" style={{ color: "var(--gold)", textDecoration: "none" }}>
          Privacy Policy
        </a>
      </p>
      <button
        onClick={dismiss}
        style={{
          flexShrink: 0,
          background: "var(--gold)",
          color: "#07070A",
          border: "none",
          borderRadius: 8,
          padding: "8px 18px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Got it
      </button>
    </div>
  );
}
