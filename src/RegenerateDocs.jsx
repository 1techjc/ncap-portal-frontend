import { useState, useCallback, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const PLATFORMS = [
  {
    id: "googledrive",
    name: "Google Drive",
    color: "#4285F4",
    bg: "#EBF1FF",
    icon: (
      <svg viewBox="0 0 87.3 78" width="32" height="32">
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
        <path d="M43.65 25L29.9 1.2C28.55.4 27 0 25.45 0L6.6 33.15 0 48.5h27.5z" fill="#00AC47"/>
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.65z" fill="#EA4335"/>
        <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.1c-1.55 0-3.1.4-4.45 1.2z" fill="#00832D"/>
        <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h49.9c1.55 0 3.1-.4 4.45-1.2z" fill="#2684FC"/>
        <path d="M73.4 26.35L59.65 3c-1.35-2.35-3.8-3-6.25-3L43.65 25l16.15 28H87.3c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
      </svg>
    ),
    authUrl: (clientId, redirect) =>
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=https://www.googleapis.com/auth/drive.file&access_type=offline&prompt=consent`,
    clientIdEnv: "VITE_GOOGLE_CLIENT_ID",
  },
  {
    id: "onedrive",
    name: "OneDrive / SharePoint",
    color: "#0078D4",
    bg: "#E6F2FF",
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
        <path d="M14.548 7.3A6.5 6.5 0 002.1 10.042 4.5 4.5 0 004.5 19H19a4 4 0 00.853-7.91A6.5 6.5 0 0014.548 7.3z" fill="#0078D4"/>
        <path d="M10.5 8.5A5 5 0 0120 11a4 4 0 010 8H7a4 4 0 01-1-7.874A5 5 0 0110.5 8.5z" fill="#50E6FF" opacity=".8"/>
      </svg>
    ),
    authUrl: (clientId, redirect) =>
      `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=Files.ReadWrite.All offline_access`,
    clientIdEnv: "VITE_ONEDRIVE_CLIENT_ID",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    color: "#0061FF",
    bg: "#E6F0FF",
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32">
        <path d="M6 2L0 6l6 4-6 4 6 4 6-4-6-4 6-4L6 2zm12 0l-6 4 6 4-6 4 6 4 6-4-6-4 6-4-6-4zM6 16.5L0 20.5l6 4 6-4-6-4zm12 0l-6 4 6 4 6-4-6-4z" fill="#0061FF"/>
      </svg>
    ),
    authUrl: (clientId, redirect) =>
      `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&token_access_type=offline`,
    clientIdEnv: "VITE_DROPBOX_APP_KEY",
  },
  {
    id: "box",
    name: "Box",
    color: "#0061D5",
    bg: "#E6F0FF",
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32">
        <path d="M3 3h18v18H3V3zm9 13.5l6-4.5-6-4.5-6 4.5 6 4.5z" fill="#0061D5"/>
      </svg>
    ),
    authUrl: (clientId, redirect) =>
      `https://account.box.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code`,
    clientIdEnv: "VITE_BOX_CLIENT_ID",
  },
];

export default function RegenerateDocs() {
  const [platform, setPlatform] = useState(null);
  const [campName, setCampName] = useState("");
  const [councilName, setCouncilName] = useState("");
  const [folderId, setFolderId] = useState("");
  const [accessToken, setAccessToken] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const popupRef = useRef(null);

  const redirectUri = `${window.location.origin}/oauth-callback.html`;

  const handleConnect = useCallback(() => {
    const p = PLATFORMS.find(p => p.id === platform);
    const clientId = import.meta.env[p.clientIdEnv];
    const url = p.authUrl(clientId, redirectUri);

    setStatus("connecting");
    const popup = window.open(url, "oauth", "width=520,height=600,left=200,top=100");
    popupRef.current = popup;

    const handler = async (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "oauth_code") return;
      window.removeEventListener("message", handler);
      if (popupRef.current) popupRef.current.close();

      const code = e.data.code;
      const resp = await fetch(`${API}/exchange-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, code, redirectUri }),
      });
      const data = await resp.json();
      setAccessToken(data.accessToken);
      setStatus("connected");
    };

    window.addEventListener("message", handler);
  }, [platform, redirectUri]);

  const handleRegenerate = useCallback(async () => {
    setStatus("regenerating");
    setProgress(0);
    setProgressMsg("Starting...");

    try {
      const response = await fetch(`${API}/regenerate-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          accessToken,
          rootFolderId: folderId,
          campName,
          councilName,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim().startsWith("data:"));

        for (const line of lines) {
          try {
            const msg = JSON.parse(line.slice(6));
            if (msg.type === "progress" || msg.type === "status") {
              setProgress(msg.progress);
              setProgressMsg(msg.message);
            } else if (msg.type === "complete") {
              setProgress(100);
              setProgressMsg(msg.message);
              setStatus("done");
            } else if (msg.type === "error") {
              setStatus("error");
              setErrorMsg(msg.message);
            }
          } catch {}
        }
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }, [platform, accessToken, folderId, campName, councilName]);

  const p = PLATFORMS.find(pl => pl.id === platform);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%)", padding: 40 }}>
      <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: 16, padding: 40, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, color: "#1a3a5c", margin: "0 0 8px", fontWeight: 700 }}>
            Regenerate NCAP Documents
          </h1>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
            Update your TOCs, Dashboard, and Quick Start Guide for an existing folder
          </p>
        </div>

        {/* Step 1: Platform */}
        {!platform && (
          <div>
            <h3 style={{ fontSize: 16, color: "#333", marginBottom: 16 }}>Select Your Cloud Platform</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {PLATFORMS.map(plat => (
                <button
                  key={plat.id}
                  onClick={() => setPlatform(plat.id)}
                  style={{
                    border: "2px solid #e8e0d4",
                    borderRadius: 12,
                    background: "#fafaf8",
                    padding: "20px 18px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {plat.icon}
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#444", textAlign: "center" }}>
                    {plat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Folder Info */}
        {platform && !accessToken && (
          <div>
            <h3 style={{ fontSize: 16, color: "#333", marginBottom: 16 }}>Enter Folder Information</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Camp Name *
              </label>
              <input
                value={campName}
                onChange={e => setCampName(e.target.value)}
                placeholder="e.g., Camp Wilderness"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "2px solid #e8e0d4",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Council Name
              </label>
              <input
                value={councilName}
                onChange={e => setCouncilName(e.target.value)}
                placeholder="e.g., Greater Atlanta Council"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "2px solid #e8e0d4",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Folder ID *
              </label>
              <input
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                placeholder={
                  platform === "googledrive" ? "Folder ID from URL" :
                  platform === "onedrive" ? "Item ID from URL" :
                  platform === "dropbox" ? "Full path (e.g., /Camp - NCAP Standards 2026)" :
                  "Folder ID"
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "2px solid #e8e0d4",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
                {platform === "googledrive" && "Find in Google Drive URL: /folders/[ID]"}
                {platform === "onedrive" && "Find in OneDrive URL: ?id=[ID]"}
                {platform === "dropbox" && "Full path to your folder (e.g., /Camp Name - NCAP Standards 2026)"}
                {platform === "box" && "Find in Box URL: /folder/[ID]"}
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={!campName || !folderId || status === "connecting"}
              style={{
                width: "100%",
                padding: "14px",
                background: campName && folderId ? "#003F87" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: campName && folderId ? "pointer" : "not-allowed",
              }}
            >
              {status === "connecting" ? "Connecting..." : `Connect to ${p.name}`}
            </button>

            <button
              onClick={() => setPlatform(null)}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                color: "#666",
                border: "none",
                fontSize: 13,
                marginTop: 12,
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Regenerate */}
        {accessToken && status !== "regenerating" && status !== "done" && (
          <div>
            <h3 style={{ fontSize: 16, color: "#333", marginBottom: 16 }}>Ready to Regenerate</h3>
            
            <div style={{ background: "#f5f0e8", borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
                <strong>Platform:</strong> {p.name}<br/>
                <strong>Camp:</strong> {campName}<br/>
                {councilName && <><strong>Council:</strong> {councilName}<br/></>}
                <strong>Folder:</strong> {folderId}
              </p>
            </div>

            {errorMsg && (
              <div style={{ background: "#fff0ee", border: "1px solid #f5c0b0", borderRadius: 8, padding: 12, marginBottom: 16, color: "#be3a1c", fontSize: 13 }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              This will regenerate and replace:
            </p>
            <ul style={{ fontSize: 13, color: "#666", marginLeft: 20 }}>
              <li>Table of Contents (HTML, DOCX, Fillable PDF)</li>
              <li>Progress Dashboard (HTML)</li>
              <li>Quick Start Guide (PDF)</li>
            </ul>

            <button
              onClick={handleRegenerate}
              style={{
                width: "100%",
                padding: "14px",
                background: "#CE1126",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ⚡ Regenerate Documents
            </button>
          </div>
        )}

        {/* Regenerating */}
        {status === "regenerating" && (
          <div>
            <h3 style={{ fontSize: 16, color: "#333", marginBottom: 16 }}>Regenerating Documents...</h3>
            <div style={{ background: "#f5f0e8", borderRadius: 8, padding: 16 }}>
              <div style={{ marginBottom: 8, fontSize: 13, color: "#666" }}>{progressMsg}</div>
              <div style={{ background: "#e8e0d4", borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{
                  background: "#003F87",
                  width: `${progress}%`,
                  height: "100%",
                  transition: "width 0.3s",
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Done */}
        {status === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 18, color: "#1a3a5c", marginBottom: 8 }}>Documents Regenerated!</h3>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>{progressMsg}</p>
            <button
              onClick={() => window.location.href = "/"}
              style={{
                padding: "12px 24px",
                background: "#003F87",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
