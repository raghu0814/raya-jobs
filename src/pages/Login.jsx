import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import NavBar from "../components/NavBar";

const G="#C9A84C",GL="#E8C96A",BG="#080808",S1="#0F0F0F",S2="#161616",BR="#2A2A2A",MT="#666666",WT="#F0EDE6";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      nav("/dashboard");
    } catch (e) {
      setError("Invalid email or password. Please try again.");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email above first"); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("");
    } catch (e) {
      setError("Could not send reset email. Check your email address.");
    }
  };

  return (
    <div style={{ background:BG, minHeight:"100vh", color:WT, fontFamily:"'DM Sans',sans-serif" }}>
      <NavBar onBack={()=>nav("/")}/>
      <div style={{ maxWidth:440, margin:"56px auto", padding:"0 20px" }}>
        <div style={{ background:S1, border:`1px solid ${BR}`, borderRadius:16, padding:36 }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:`linear-gradient(135deg,${G},${GL})`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:28 }}>✦</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:WT, marginBottom:4 }}>Welcome Back</h2>
            <p style={{ color:MT, fontSize:13 }}>Login to find jobs and post referrals</p>
          </div>

          {error && (
            <div style={{ background:"#1A0A0A", border:"1px solid #EF444444", borderRadius:8, padding:"10px 14px", color:"#EF4444", fontSize:13, marginBottom:16, textAlign:"center" }}>{error}</div>
          )}

          {resetSent && (
            <div style={{ background:"#0A1F0A", border:"1px solid #1F5C1F", borderRadius:8, padding:"10px 14px", color:"#4ADE80", fontSize:13, marginBottom:16, textAlign:"center" }}>
              ✓ Password reset email sent. Check your inbox.
            </div>
          )}

          <div style={{ display:"grid", gap:14, marginBottom:8 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:10, fontWeight:700, color:G, letterSpacing:"2px", textTransform:"uppercase" }}>Email</label>
              <input type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{ background:S2, border:`1px solid ${BR}`, borderRadius:8, padding:"13px 14px", color:WT, fontSize:14, outline:"none", fontFamily:"inherit" }}
                onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BR}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:10, fontWeight:700, color:G, letterSpacing:"2px", textTransform:"uppercase" }}>Password</label>
              <input type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{ background:S2, border:`1px solid ${BR}`, borderRadius:8, padding:"13px 14px", color:WT, fontSize:14, outline:"none", fontFamily:"inherit" }}
                onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BR}/>
            </div>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign:"right", marginBottom:16 }}>
            <span onClick={handleForgotPassword} style={{ color:G, fontSize:12, cursor:"pointer", fontWeight:600 }}>Forgot password?</span>
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{ width:"100%", background:`linear-gradient(135deg,${G},${GL})`, border:"none", color:BG, padding:"13px", borderRadius:8, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", opacity:loading?0.7:1 }}>
            {loading ? "Logging in..." : "Login →"}
          </button>

          <div style={{ textAlign:"center", marginTop:20 }}>
            <span style={{ color:MT, fontSize:13 }}>Don't have an account? </span>
            <span onClick={()=>nav("/register")} style={{ color:G, fontWeight:700, fontSize:13, cursor:"pointer" }}>Register</span>
          </div>
        </div>
      </div>
    </div>
  );
}
