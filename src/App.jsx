import { useState, useRef, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ─── Platform config ─────────────────────────────────────────────────────────
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
    authUrl: (appKey, redirect) =>
      `https://www.dropbox.com/oauth2/authorize?client_id=${appKey}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&token_access_type=offline`,
    clientIdEnv: "VITE_DROPBOX_APP_KEY",
  },
  {
    id: "box",
    name: "Box",
    color: "#0061D5",
    bg: "#E6F0FF",
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="#0061D5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
        <text x="4" y="16" fontSize="9" fontWeight="bold" fill="white">box</text>
      </svg>
    ),
    authUrl: (clientId, redirect) =>
      `https://account.box.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code`,
    clientIdEnv: "VITE_BOX_CLIENT_ID",
  },
];

const STANDARDS_COUNT = 140;
const SECTIONS_COUNT = 8;

// ─── Step components ──────────────────────────────────────────────────────────

function StepIndicator({ step }) {
  const steps = ["Platform", "Camp Info", "Connect", "Upload"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 40 }}>
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: done ? "#be3a1c" : active ? "#be3a1c" : "#e0d5c5",
                color: done || active ? "#fff" : "#999",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14,
                boxShadow: active ? "0 0 0 4px rgba(190,58,28,0.18)" : "none",
                transition: "all 0.3s",
              }}>
                {done ? "✓" : num}
              </div>
              <span style={{ fontSize: 11, color: active ? "#be3a1c" : done ? "#555" : "#aaa", fontWeight: active ? 700 : 400, letterSpacing: 0.5 }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 60, height: 2, background: done ? "#be3a1c" : "#e0d5c5", margin: "0 4px", marginBottom: 22, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlatformCard({ platform, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      border: `2px solid ${selected ? platform.color : "#e8e0d4"}`,
      borderRadius: 12,
      background: selected ? platform.bg : "#fafaf8",
      padding: "20px 18px",
      cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      transition: "all 0.2s",
      boxShadow: selected ? `0 0 0 3px ${platform.color}33` : "0 1px 3px rgba(0,0,0,0.06)",
      transform: selected ? "translateY(-2px)" : "none",
    }}>
      {platform.icon}
      <span style={{ fontSize: 13, fontWeight: 600, color: selected ? platform.color : "#444", textAlign: "center", lineHeight: 1.3 }}>
        {platform.name}
      </span>
      {selected && (
        <span style={{ fontSize: 10, background: platform.color, color: "#fff", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>
          SELECTED
        </span>
      )}
    </button>
  );
}

function ProgressBar({ value, color = "#be3a1c" }) {
  return (
    <div style={{ background: "#f0ebe3", borderRadius: 99, height: 10, overflow: "hidden", margin: "8px 0" }}>
      <div style={{
        height: "100%", borderRadius: 99,
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        width: `${value}%`, transition: "width 0.4s ease",
      }} />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState(null);
  const [campType, setCampType] = useState("all"); // New: camp type filter
  const [campName, setCampName] = useState("");
  const [councilName, setCouncilName] = useState("");
  const [accessToken, setAccessToken] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | connecting | uploading | done | error
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

      try {
        const resp = await fetch(`${API}/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, code: e.data.code, redirectUri }),
        });
        const data = await resp.json();
        if (data.access_token) {
          setAccessToken(data.access_token);
          setStatus("idle");
          setStep(4);
        } else {
          throw new Error("No token returned");
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg("Authentication failed. Please try again.");
      }
    };
    window.addEventListener("message", handler);
  }, [platform, redirectUri]);

  const handleUpload = useCallback(async () => {
    setStatus("uploading");
    setProgress(0);
    setProgressMsg("Preparing upload...");
    setUploadedCount(0);

    // Fetch the zip from public folder and extract PDFs
    const resp = await fetch("/ncap-standards.zip");
    const blob = await resp.blob();

    // Use JSZip to extract
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(blob);

    const pdfEntries = Object.entries(zip.files).filter(([name]) => name.endsWith(".pdf"));

    const formData = new FormData();
    formData.append("platform", platform);
    formData.append("accessToken", accessToken);
    formData.append("campName", campName);
    formData.append("councilName", councilName);
    formData.append("campType", campType); // Add camp type filter

    for (const [name, entry] of pdfEntries) {
      const content = await entry.async("blob");
      const file = new File([content], name.split("/").pop(), { type: "application/pdf" });
      formData.append("pdfs", file);
    }

    const fetchResp = await fetch(`${API}/setup`, { method: "POST", body: formData });
    const reader = fetchResp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) {
        try {
          const msg = JSON.parse(line.slice(6));
          if (msg.type === "progress" || msg.type === "status") {
            setProgress(msg.progress);
            setProgressMsg(msg.message);
            if (msg.done) setUploadedCount(msg.done);
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
  }, [platform, accessToken, campName, councilName]);

  const p = PLATFORMS.find(pl => pl.id === platform);

  return (
    <div style={{ minHeight: "100vh", background: "#E9E9E4", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #003F87 0%, #CE1126 100%)",
        padding: "0",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.07) 0%, transparent 60%)",
        }} />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            {/* Scout fleur-de-lis */}
            <img 
              src="/fleur-de-lis.webp" 
              alt="Scouting America" 
              style={{ width: 52, height: 52 }}
            />
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2, fontFamily: "Arial, sans-serif" }}>
                Scouting America
              </div>
              <div style={{ fontSize: 20, color: "#fff", fontWeight: 700, lineHeight: 1.2, fontFamily: "Arial, sans-serif" }}>
                National Camp Accreditation Program
              </div>
            </div>
          </div>
          <h1 style={{ fontSize: 28, color: "#fff", fontWeight: 700, margin: 0, lineHeight: 1.3, fontFamily: "Arial, sans-serif" }}>
            Digital Standards Setup Portal
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", margin: "8px 0 0", fontSize: 14 }}>
            Copy all 2026 NCAP standards into your camp's file storage — organized and ready for evidence collection.
          </p>
        </div>

        {/* Stats ribbon */}
        <div style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 24px", display: "flex", gap: 32 }}>
            {[
              { n: STANDARDS_COUNT, label: "Standards & RPs" },
              { n: SECTIONS_COUNT, label: "Sections" },
              { n: 4, label: "Storage Platforms" },
            ].map(({ n, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{n}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main card */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "40px 48px",
          border: "1px solid #D6CEBD",
        }}>
          <StepIndicator step={step} />

          {/* ── STEP 1: Platform ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 22, color: "#1a3a5c", margin: "0 0 6px", fontWeight: 700 }}>
                Choose your storage platform
              </h2>
              <p style={{ color: "#777", fontSize: 14, margin: "0 0 28px" }}>
                Select where you'd like your NCAP standards folder to be created.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
                {PLATFORMS.map(pl => (
                  <PlatformCard key={pl.id} platform={pl} selected={platform === pl.id} onClick={() => setPlatform(pl.id)} />
                ))}
              </div>
              <button
                onClick={() => platform && setStep(2)}
                disabled={!platform}
                style={{
                  width: "100%", padding: "14px 0",
                  background: platform ? "#003F87" : "#D6CEBD",
                  color: platform ? "#fff" : "#515354",
                  border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700,
                  cursor: platform ? "pointer" : "not-allowed",
                  letterSpacing: 0.5, transition: "all 0.2s",
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2: Camp Info ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 22, color: "#1a3a5c", margin: "0 0 6px", fontWeight: 700 }}>
                Tell us about your camp
              </h2>
              <p style={{ color: "#777", fontSize: 14, margin: "0 0 28px" }}>
                Your root folder will be named: <strong style={{ color: "#be3a1c" }}>
                  {campName || "Camp Name"} — NCAP Standards 2026{campType !== "all" ? ` (${campType.replace("-", " ")})` : ""}
                </strong>
              </p>

              {[
                { label: "Camp Name *", val: campName, set: setCampName, ph: "e.g. Camp Wilderness" },
                { label: "Council Name", val: councilName, set: setCouncilName, ph: "e.g. Greater New York Councils" },
              ].map(({ label, val, set, ph }) => (
                <div key={label} style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 6 }}>{label}</label>
                  <input
                    value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 8,
                      border: "2px solid #e8e0d4", fontSize: 15, color: "#222",
                      outline: "none", boxSizing: "border-box",
                      fontFamily: "Georgia, serif",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={e => e.target.style.borderColor = "#be3a1c"}
                    onBlur={e => e.target.style.borderColor = "#e8e0d4"}
                  />
                </div>
              ))}

              {/* Camp Type Selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 6 }}>
                  Camp Type *
                </label>
                <p style={{ fontSize: 12, color: "#777", margin: "0 0 10px" }}>
                  Choose which standards to include based on your camp type
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {[
                    { id: "all", label: "All Standards", count: 140 },
                    { id: "short-term", label: "Short-term Camp", count: 96 },
                    { id: "day-camp", label: "Day Camp", count: 103 },
                    { id: "camp-property", label: "Camp Property", count: 26 },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setCampType(type.id)}
                      style={{
                        padding: "14px 12px",
                        borderRadius: 8,
                        border: `2px solid ${campType === type.id ? "#003f87" : "#e8e0d4"}`,
                        background: campType === type.id ? "#ebf1ff" : "#fafaf8",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: campType === type.id ? "#003f87" : "#444", marginBottom: 3 }}>
                        {type.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#777" }}>
                        {type.count} standards
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button onClick={() => setStep(1)} style={{
                  flex: 1, padding: "13px 0", background: "#f5f0e8",
                  border: "2px solid #e8e0d4", borderRadius: 10, fontSize: 15, color: "#555", cursor: "pointer",
                }}>← Back</button>
                <button
                  onClick={() => campName.trim() && setStep(3)}
                  disabled={!campName.trim()}
                  style={{
                    flex: 2, padding: "13px 0",
                    background: campName.trim() ? "#003F87" : "#D6CEBD",
                    color: campName.trim() ? "#fff" : "#515354",
                    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                    cursor: campName.trim() ? "pointer" : "not-allowed",
                  }}
                >Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Connect ── */}
          {step === 3 && p && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, borderRadius: 16,
                background: p.bg, display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", border: `2px solid ${p.color}33`,
              }}>
                {p.icon}
              </div>
              <h2 style={{ fontSize: 22, color: "#1a3a5c", margin: "0 0 8px", fontWeight: 700 }}>
                Connect to {p.name}
              </h2>
              <p style={{ color: "#777", fontSize: 14, margin: "0 0 8px" }}>
                Click the button below to securely authorize access to your {p.name} account.
              </p>
              <div style={{ background: "#f5f0e8", borderRadius: 10, padding: "14px 18px", margin: "20px 0 28px", textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  This will create:
                </div>
                {[
                  `📁 ${campName} — NCAP Standards 2026`,
                  "  └── 8 section folders",
                  "       └── 140 standard folders + PDFs",
                ].map(line => (
                  <div key={line} style={{ fontSize: 13, color: "#555", fontFamily: "monospace", lineHeight: 1.8 }}>{line}</div>
                ))}
              </div>

              {status === "error" && (
                <div style={{ background: "#fff0ee", border: "1px solid #f5c0b0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#be3a1c", fontSize: 13 }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button onClick={handleConnect} disabled={status === "connecting"} style={{
                width: "100%", padding: "15px 0",
                background: status === "connecting" ? "#D6CEBD" : p.color,
                color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700,
                cursor: status === "connecting" ? "wait" : "pointer",
                boxShadow: `0 4px 16px ${p.color}44`,
              }}>
                {status === "connecting" ? "Opening authorization window..." : `Connect ${p.name} →`}
              </button>
              <button onClick={() => setStep(2)} style={{
                width: "100%", padding: "12px 0", marginTop: 10,
                background: "transparent", border: "none", color: "#999", fontSize: 14, cursor: "pointer",
              }}>← Back</button>
            </div>
          )}

          {/* ── STEP 4: Upload ── */}
          {step === 4 && (
            <div>
              {status === "idle" && (
                <>
                  <h2 style={{ fontSize: 22, color: "#1a3a5c", margin: "0 0 6px", fontWeight: 700 }}>
                    Ready to set up your folder
                  </h2>
                  <p style={{ color: "#777", fontSize: 14, margin: "0 0 24px" }}>
                    Connected to {p?.name}. Click below to create the full NCAP folder structure and upload all 140 standard PDFs.
                  </p>
                  <div style={{ background: "#f5f0e8", borderRadius: 10, padding: 18, marginBottom: 24 }}>
                    {[
                      ["Camp", campName],
                      ["Council", councilName || "—"],
                      ["Platform", p?.name],
                      ["Standards", "140 PDFs across 8 sections"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14, borderBottom: "1px solid #ece6da" }}>
                        <span style={{ color: "#888" }}>{k}</span>
                        <span style={{ color: "#333", fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleUpload} style={{
                    width: "100%", padding: "15px 0",
                    background: "#CE1126",
                    color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700,
                    cursor: "pointer", boxShadow: "0 4px 16px rgba(206,17,38,0.3)",
                  }}>
                    ⚡ Start Setup — Upload All Standards
                  </button>
                </>
              )}

              {status === "uploading" && (
                <>
                  <h2 style={{ fontSize: 22, color: "#1a3a5c", margin: "0 0 6px", fontWeight: 700 }}>
                    Setting up your folder...
                  </h2>
                  <p style={{ color: "#777", fontSize: 14, margin: "0 0 24px" }}>
                    Please keep this window open while we upload your files.
                  </p>
                  <ProgressBar value={progress} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", margin: "6px 0 16px" }}>
                    <span>{progressMsg}</span>
                    <span>{progress}%</span>
                  </div>
                  {uploadedCount > 0 && (
                    <div style={{ fontSize: 13, color: "#be3a1c", fontWeight: 600 }}>
                      {uploadedCount} of {STANDARDS_COUNT} files uploaded
                    </div>
                  )}
                </>
              )}

              {status === "done" && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                  <h2 style={{ fontSize: 24, color: "#1a3a5c", margin: "0 0 8px", fontWeight: 700 }}>
                    Setup Complete!
                  </h2>
                  <p style={{ color: "#555", fontSize: 15, margin: "0 0 8px" }}>
                    <strong>{campName}</strong>'s NCAP Standards 2026 folder is ready in {p?.name}.
                  </p>
                  <p style={{ color: "#777", fontSize: 13, margin: "0 0 28px" }}>
                    All 140 standards are organized and waiting for evidence documents.
                  </p>
                  
                  <div style={{ background: "#fff8e1", border: "1px solid #fde68a", borderRadius: 10, padding: "14px 18px", textAlign: "left", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#7d6608", marginBottom: 8 }}>📘 START HERE - Quick Start Guide.pdf</div>
                    <div style={{ fontSize: 13, color: "#555" }}>
                      Open this file first! It explains exactly what to do next with step-by-step instructions.
                    </div>
                  </div>
                  
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "14px 18px", textAlign: "left", marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginBottom: 8 }}>📊 Progress Dashboard.html</div>
                    <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
                      Download this file to your computer, then open it in your web browser to:
                    </div>
                    {[
                      "Track completion status of all 140 standards",
                      "Check off standards as In Progress or Complete",
                      "Add notes about what evidence you still need",
                      "See your overall progress percentage",
                      "Click links to jump to any standard folder"
                    ].map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#555", padding: "2px 0 2px 12px" }}>
                        • {s}
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: "#777", marginTop: 8, fontStyle: "italic" }}>
                      Progress auto-saves in your browser - no account needed!
                    </div>
                  </div>
                  
                  <button onClick={() => { setStep(1); setPlatform(null); setCampName(""); setCouncilName(""); setAccessToken(null); setStatus("idle"); setProgress(0); }} style={{
                    padding: "12px 28px", background: "#003F87", color: "#fff",
                    border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}>
                    Set Up Another Camp
                  </button>
                </div>
              )}

              {status === "error" && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                  <h2 style={{ fontSize: 20, color: "#be3a1c", margin: "0 0 8px" }}>Something went wrong</h2>
                  <p style={{ color: "#777", fontSize: 14, margin: "0 0 20px" }}>{errorMsg}</p>
                  <button onClick={() => { setStatus("idle"); setProgress(0); }} style={{
                    padding: "12px 24px", background: "#CE1126", color: "#fff",
                    border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700,
                  }}>Try Again</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: "#aaa" }}>
          NCAP Standards 2026 · Scouting America · This portal does not store your credentials.
        </div>
      </div>
    </div>
  );
}
