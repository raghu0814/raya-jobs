import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import NavBar from "../components/NavBar";

const PRIMARY="#1A2E4A",GREEN="#22C55E",BG="#F8FAFC",WHITE="#FFFFFF",BORDER="#E2E8F0",TEXT="#0F172A",MUTED="#64748B",GREENBG="#F0FDF4";

const Inp=({label,placeholder,type="text",value,onChange,onKeyDown})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:11,fontWeight:700,color:PRIMARY,letterSpacing:"0.5px"}}>{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown}
      style={{background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"12px 14px",color:TEXT,fontSize:14,outline:"none",fontFamily:"inherit"}}
      onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
  </div>
);

export default function Login(){
  const nav=useNavigate();
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[resetSent,setResetSent]=useState(false);
  const[resetLoading,setResetLoading]=useState(false);

  const handleLogin=async()=>{
    if(!email||!pass){setError("Please fill all fields");return;}
    setLoading(true);setError("");
    try{
      await signInWithEmailAndPassword(auth,email,pass);
      nav("/dashboard");
    }catch(e){
      if(e.code==="auth/user-not-found"||e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"){
        setError("Invalid email or password. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    }finally{setLoading(false);}
  };

  const handleForgot=async()=>{
    if(!email){setError("Enter your email address above first, then click Forgot Password.");return;}
    setResetLoading(true);setError("");setResetSent(false);
    try{
      // actionCodeSettings ensures the reset link works correctly
      const actionCodeSettings={
        url: window.location.origin+"/login",
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth,email,actionCodeSettings);
      setResetSent(true);
    }catch(e){
      if(e.code==="auth/user-not-found"){
        setError("No account found with this email address.");
      } else if(e.code==="auth/invalid-email"){
        setError("Please enter a valid email address.");
      } else {
        setError("Could not send reset email. Please try again.");
      }
    }finally{setResetLoading(false);}
  };

  return(
    <div style={{background:BG,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <NavBar onBack={()=>nav("/")}/>
      <div style={{maxWidth:440,margin:"48px auto",padding:"0 20px"}}>
        <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:20,padding:36,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{width:56,height:56,borderRadius:16,background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:26}}>🤝</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:PRIMARY,marginBottom:6}}>Welcome Back</h2>
            <p style={{color:MUTED,fontSize:14}}>Login to find jobs and post referrals</p>
          </div>

          {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",color:"#DC2626",fontSize:13,marginBottom:16,textAlign:"center",lineHeight:1.6}}>{error}</div>}
          {resetSent&&(
            <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:10,padding:"14px",color:"#15803D",fontSize:13,marginBottom:16,lineHeight:1.7}}>
              <strong>✓ Reset email sent!</strong><br/>
              Check your inbox at <strong>{email}</strong>. Also check your spam/junk folder if you don't see it within 2 minutes.
            </div>
          )}

          <div style={{display:"grid",gap:16,marginBottom:8}}>
            <Inp label="Email" placeholder="you@email.com" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            <Inp label="Password" placeholder="••••••••" type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>

          <div style={{textAlign:"right",marginBottom:20}}>
            <span onClick={handleForgot} style={{color:resetLoading?MUTED:GREEN,fontSize:13,cursor:resetLoading?"not-allowed":"pointer",fontWeight:600}}>
              {resetLoading?"Sending...":"Forgot password?"}
            </span>
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{width:"100%",background:GREEN,border:"none",color:WHITE,padding:"13px",borderRadius:10,fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.7:1}}>
            {loading?"Logging in...":"Login →"}
          </button>

          <div style={{textAlign:"center",marginTop:20}}>
            <span style={{color:MUTED,fontSize:14}}>Don't have an account? </span>
            <span onClick={()=>nav("/register")} style={{color:GREEN,fontWeight:700,fontSize:14,cursor:"pointer"}}>Register</span>
          </div>
        </div>

        {/* Reset password help box */}
        <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:14,padding:"16px 20px",marginTop:16,fontSize:13,color:MUTED,lineHeight:1.7}}>
          <strong style={{color:PRIMARY}}>Having trouble logging in?</strong><br/>
          Enter your email above and click "Forgot password?" to receive a reset link. Check spam/junk if not received.
        </div>
      </div>
    </div>
  );
}
