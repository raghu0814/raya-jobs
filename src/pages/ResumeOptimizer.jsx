import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";

const PRIMARY = "#1A2E4A", GREEN = "#22C55E", BG = "#F8FAFC", WHITE = "#FFFFFF";
const BORDER = "#E2E8F0", TEXT = "#0F172A", MUTED = "#64748B", GREENBG = "#F0FDF4";

// ── Score colors ───────────────────────────────────────────
const scoreColor = (s) => s >= 85 ? "#22C55E" : s >= 70 ? "#F59E0B" : s >= 50 ? "#F97316" : "#EF4444";
const scoreBg   = (s) => s >= 85 ? "#F0FDF4" : s >= 70 ? "#FFFBEB" : s >= 50 ? "#FFF7ED" : "#FEF2F2";
const scoreBdr  = (s) => s >= 85 ? "#BBF7D0" : s >= 70 ? "#FDE68A" : s >= 50 ? "#FED7AA" : "#FECACA";
const scoreLabel= (s) => s >= 90 ? "Excellent ✅" : s >= 80 ? "Good 👍" : s >= 70 ? "Average ⚠️" : s >= 50 ? "Needs Work 🔧" : "Poor ❌";

// ── Circular Score Ring ────────────────────────────────────
function ScoreRing({ score, size = 160 }) {
  const r = 54, c = size / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ - (circ * score) / 100;
  const col = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#E2E8F0" strokeWidth="12"/>
      <circle cx={c} cy={c} r={r} fill="none" stroke={col} strokeWidth="12"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`}
        style={{transition:"stroke-dashoffset 1.5s ease"}}/>
      <text x={c} y={c-8} textAnchor="middle" fontSize="30" fontWeight="800" fill={col} fontFamily="'Playfair Display',serif">{score}</text>
      <text x={c} y={c+14} textAnchor="middle" fontSize="11" fill={MUTED} fontFamily="'Plus Jakarta Sans',sans-serif">out of 100</text>
      <text x={c} y={c+28} textAnchor="middle" fontSize="10" fontWeight="700" fill={col} fontFamily="'Plus Jakarta Sans',sans-serif">{scoreLabel(score)}</text>
    </svg>
  );
}

// ── Section score bar ──────────────────────────────────────
function ScoreBar({ label, score, max, icon }) {
  const pct = Math.round((score / max) * 100);
  const col = scoreColor(pct);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: TEXT }}>
          <span>{icon}</span>{label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: col }}>{score}/{max}</div>
      </div>
      <div style={{ height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 4, transition: "width 1.2s ease" }}/>
      </div>
    </div>
  );
}

export default function ResumeOptimizer() {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const[file, setFile] = useState(null);
  const[jobRole, setJobRole] = useState("");
  const[analyzing, setAnalyzing] = useState(false);
  const[result, setResult] = useState(null);
  const[error, setError] = useState("");
  const[progress, setProgress] = useState("");

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Please upload a PDF file only."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("File too large. Max 5MB."); return; }
    setFile(f); setError(""); setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile({ target: { files: [f] } });
  };

  const analyze = async () => {
    if (!file) { setError("Please upload your resume first."); return; }
    setAnalyzing(true); setError(""); setResult(null);

    try {
      // Read PDF as base64
      setProgress("Reading your resume…");
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = () => rej(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      setProgress("Sending to AI for analysis…");

      const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer and career coach.

Analyze this resume and provide a detailed ATS score report. The user is targeting: "${jobRole || "IT / Software roles in India"}".

Score the resume on these 5 sections (total 100 points):
1. Format & Structure (20 points) — layout, sections, readability, length, fonts
2. Keywords & Skills (25 points) — relevant tech skills, industry keywords, tools mentioned
3. Work Experience (25 points) — job descriptions, responsibilities, clarity, relevance
4. Achievements & Impact (20 points) — quantified results, metrics, numbers, accomplishments
5. Education & Certifications (10 points) — degree, institutions, certifications, courses

Return ONLY a JSON object in this exact format, nothing else, no markdown:
{
  "overallScore": 72,
  "atsPassProbability": 68,
  "sections": {
    "format": { "score": 16, "max": 20, "status": "Good", "feedback": "..." },
    "keywords": { "score": 14, "max": 25, "status": "Needs Work", "feedback": "..." },
    "experience": { "score": 18, "max": 25, "status": "Average", "feedback": "..." },
    "achievements": { "score": 12, "max": 20, "status": "Needs Work", "feedback": "..." },
    "education": { "score": 8, "max": 10, "status": "Good", "feedback": "..." }
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "criticalIssues": ["issue 1", "issue 2", "issue 3"],
  "missingKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "quickWins": [
    { "action": "Add quantified achievements", "impact": "High", "example": "Reduced deployment time by 40%" },
    { "action": "Include LinkedIn URL", "impact": "Medium", "example": "linkedin.com/in/yourname" },
    { "action": "Add a professional summary", "impact": "High", "example": "5+ years Java developer with expertise in microservices..." }
  ],
  "rewriteSuggestion": "Provide ONE specific bullet point rewrite example from their experience section. Show before and after.",
  "verdict": "One sentence honest verdict about this resume."
}`;

      setProgress("AI is scoring your resume…");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          messages: [{
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: base64 }
              },
              { type: "text", text: prompt }
            ]
          }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const text = data.content?.[0]?.text || "";

      setProgress("Processing results…");

      // Parse JSON — strip any accidental markdown
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);

    } catch (e) {
      console.error(e);
      if (e.message?.includes("JSON")) {
        setError("AI returned unexpected response. Please try again.");
      } else {
        setError("Analysis failed. Please check your connection and try again.");
      }
    } finally {
      setAnalyzing(false); setProgress("");
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(""); setJobRole(""); if (fileRef.current) fileRef.current.value = ""; };

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif", paddingBottom: 60 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${BORDER}`, padding: "0 clamp(16px,4vw,32px)", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <button onClick={() => nav(auth.currentUser ? "/dashboard" : "/")} style={{ background: "none", border: `1px solid ${BORDER}`, color: MUTED, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: "6px 14px", borderRadius: 8, fontWeight: 500 }}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🤝</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 17, color: PRIMARY }}>Rytaine Jobs</span>
        </div>
        <div style={{ width: 80 }} />
      </nav>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px clamp(16px,4vw,32px)" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GREENBG, border: "1px solid #BBF7D0", borderRadius: 100, padding: "6px 16px", marginBottom: 16, fontSize: 11, color: "#15803D", fontWeight: 700, letterSpacing: "0.5px" }}>
            <span>⚡</span> AI-POWERED RESUME OPTIMIZER
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,5vw,40px)", fontWeight: 800, color: PRIMARY, marginBottom: 12, lineHeight: 1.2 }}>
            Get Your Resume to <span style={{ color: GREEN }}>90+ Score</span>
          </h1>
          <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
            Upload your resume and our AI analyzes it against ATS systems used by top IT companies. Get a score, find gaps, and fix them instantly.
          </p>
        </div>

        {/* HOW IT WORKS PILLS */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          {[["📄", "Upload PDF"], ["🤖", "AI Analyzes"], ["📊", "Get Score"], ["✅", "Fix & Apply"]].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 100, padding: "6px 14px", fontSize: 12, color: TEXT, fontWeight: 500 }}>
              {icon} {label}
            </div>
          ))}
        </div>

        {/* UPLOAD AREA */}
        {!result && (
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 28, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: PRIMARY, marginBottom: 16 }}>Upload Your Resume</h2>

            {/* Drop zone */}
            <label
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              style={{ display: "block", border: `2px dashed ${file ? GREEN : BORDER}`, borderRadius: 14, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: file ? GREENBG : BG, transition: "all 0.2s", marginBottom: 16 }}>
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} style={{ display: "none" }} />
              {file ? (
                <>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                  <div style={{ fontWeight: 700, color: "#15803D", fontSize: 15, marginBottom: 4 }}>{file.name}</div>
                  <div style={{ color: MUTED, fontSize: 12 }}>{(file.size / 1024).toFixed(0)} KB • Ready to analyze</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
                  <div style={{ fontWeight: 700, color: TEXT, fontSize: 15, marginBottom: 4 }}>Drop your resume here or click to browse</div>
                  <div style={{ color: MUTED, fontSize: 12 }}>PDF only • Max 5MB</div>
                </>
              )}
            </label>

            {/* Target role */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, display: "block", marginBottom: 6 }}>TARGET ROLE (optional but improves accuracy)</label>
              <input
                placeholder="e.g. SAP SD Consultant, Senior Java Developer, DevOps Engineer…"
                value={jobRole} onChange={e => setJobRole(e.target.value)}
                style={{ width: "100%", background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: "11px 14px", color: TEXT, fontSize: 14, outline: "none", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = GREEN} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>

            {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>{error}</div>}

            {analyzing ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: `4px solid ${BORDER}`, borderTop: `4px solid ${GREEN}`, animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                <div style={{ color: PRIMARY, fontWeight: 600, fontSize: 15 }}>{progress}</div>
                <div style={{ color: MUTED, fontSize: 13, marginTop: 6 }}>This takes 10–20 seconds…</div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : (
              <button onClick={analyze} disabled={!file}
                style={{ width: "100%", background: file ? GREEN : "#E2E8F0", border: "none", color: file ? WHITE : MUTED, padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: file ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                {file ? "Analyze My Resume ✦" : "Upload Resume First"}
              </button>
            )}
          </div>
        )}

        {/* RESULTS */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Overall Score Card */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <ScoreRing score={result.overallScore} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: PRIMARY, marginBottom: 8 }}>Resume Score</h2>
                  <div style={{ background: scoreBg(result.overallScore), border: `1px solid ${scoreBdr(result.overallScore)}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: TEXT, lineHeight: 1.6 }}>
                    {result.verdict}
                  </div>
                  {/* ATS Pass probability */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED, marginBottom: 4 }}>
                        <span>ATS Pass Probability</span>
                        <span style={{ fontWeight: 700, color: scoreColor(result.atsPassProbability) }}>{result.atsPassProbability}%</span>
                      </div>
                      <div style={{ height: 10, background: "#E2E8F0", borderRadius: 5, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${result.atsPassProbability}%`, background: scoreColor(result.atsPassProbability), borderRadius: 5, transition: "width 1.5s ease" }} />
                      </div>
                    </div>
                  </div>
                  {result.atsPassProbability < 90 && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#DC2626", fontWeight: 600 }}>
                      🎯 Target: Get to 90%+ ATS pass rate — follow the fixes below
                    </div>
                  )}
                  {result.atsPassProbability >= 90 && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#15803D", fontWeight: 600 }}>
                      ✅ Your resume passes most ATS systems. Keep it updated!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section Scores */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: PRIMARY, marginBottom: 20 }}>Section Breakdown</h3>
              <ScoreBar label="Format & Structure" score={result.sections.format.score} max={20} icon="📐"/>
              <ScoreBar label="Keywords & Skills" score={result.sections.keywords.score} max={25} icon="🔑"/>
              <ScoreBar label="Work Experience" score={result.sections.experience.score} max={25} icon="💼"/>
              <ScoreBar label="Achievements & Impact" score={result.sections.achievements.score} max={20} icon="🏆"/>
              <ScoreBar label="Education & Certifications" score={result.sections.education.score} max={10} icon="🎓"/>
            </div>

            {/* Section Feedback */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
              {Object.entries(result.sections).map(([key, val]) => {
                const icons = { format: "📐", keywords: "🔑", experience: "💼", achievements: "🏆", education: "🎓" };
                const labels = { format: "Format & Structure", keywords: "Keywords & Skills", experience: "Work Experience", achievements: "Achievements & Impact", education: "Education" };
                const pct = Math.round((val.score / val.max) * 100);
                return (
                  <div key={key} style={{ background: scoreBg(pct), border: `1px solid ${scoreBdr(pct)}`, borderRadius: 14, padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span>{icons[key]}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{labels[key]}</span>
                      <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 13, color: scoreColor(pct) }}>{val.score}/{val.max}</span>
                    </div>
                    <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{val.feedback}</p>
                  </div>
                );
              })}
            </div>

            {/* Strengths + Issues */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              <div style={{ background: GREENBG, border: "1px solid #BBF7D0", borderRadius: 16, padding: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#15803D", fontSize: 15, marginBottom: 12 }}>✅ Strengths</h3>
                {result.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: TEXT, marginBottom: 8 }}>
                    <span style={{ color: GREEN, fontWeight: 700, flexShrink: 0 }}>✓</span>{s}
                  </div>
                ))}
              </div>
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 16, padding: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#DC2626", fontSize: 15, marginBottom: 12 }}>🚨 Critical Issues</h3>
                {result.criticalIssues.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: TEXT, marginBottom: 8 }}>
                    <span style={{ color: "#EF4444", fontWeight: 700, flexShrink: 0 }}>✕</span>{s}
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontWeight: 700, color: PRIMARY, fontSize: 15, marginBottom: 12 }}>🔑 Missing Keywords — Add These to Your Resume</h3>
              <p style={{ color: MUTED, fontSize: 12, marginBottom: 12 }}>ATS systems scan for these keywords. Add relevant ones to your resume to boost your score.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.missingKeywords.map((kw, i) => (
                  <span key={i} style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#C2410C", padding: "5px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600 }}>+ {kw}</span>
                ))}
              </div>
            </div>

            {/* Quick Wins */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontWeight: 700, color: PRIMARY, fontSize: 15, marginBottom: 4 }}>⚡ Quick Wins — Fix These First</h3>
              <p style={{ color: MUTED, fontSize: 12, marginBottom: 16 }}>These changes will have the biggest impact on your score.</p>
              {result.quickWins.map((w, i) => (
                <div key={i} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: PRIMARY, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontWeight: 700, color: TEXT, fontSize: 13 }}>{w.action}</div>
                    <span style={{ marginLeft: "auto", background: w.impact === "High" ? "#FEF2F2" : "#FFF7ED", border: `1px solid ${w.impact === "High" ? "#FECACA" : "#FED7AA"}`, color: w.impact === "High" ? "#DC2626" : "#C2410C", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, flexShrink: 0 }}>{w.impact} Impact</span>
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, paddingLeft: 34 }}>Example: <em style={{ color: PRIMARY, fontWeight: 500 }}>{w.example}</em></div>
                </div>
              ))}
            </div>

            {/* Rewrite suggestion */}
            {result.rewriteSuggestion && (
              <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 16, padding: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#5B21B6", fontSize: 15, marginBottom: 8 }}>✍️ AI Rewrite Suggestion</h3>
                <p style={{ color: MUTED, fontSize: 12, marginBottom: 12 }}>Here's how to rewrite a bullet point from your resume to make it stronger:</p>
                <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{result.rewriteSuggestion}</div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button onClick={reset} style={{ background: WHITE, border: `1.5px solid ${BORDER}`, color: PRIMARY, padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ← Analyze Another Resume
              </button>
              <button onClick={() => nav("/browse")} style={{ background: GREEN, border: "none", color: WHITE, padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Browse Referrals →
              </button>
            </div>

            {/* Score target */}
            {result.overallScore < 90 && (
              <div style={{ background: GREENBG, border: "1px solid #BBF7D0", borderRadius: 14, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: "#15803D", fontSize: 15, marginBottom: 4 }}>
                  🎯 You need {90 - result.overallScore} more points to hit 90+
                </div>
                <div style={{ color: MUTED, fontSize: 13 }}>
                  Apply all the Quick Wins above and re-analyze your updated resume.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
