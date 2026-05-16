import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";

const G="#C9A84C",GL="#E8C96A",BG="#080808",S1="#0F0F0F",BR="#2A2A2A",MT="#666666",WT="#F0EDE6";
const companies=["TCS","Infosys","Wipro","Accenture","Amazon","Microsoft","Cognizant","HCL","Swiggy","Zomato","PhonePe","Flipkart"];
const steps=[
  {n:"01",icon:"📝",t:"Post a Referral",d:"Post your company's open role. Get serious applicants who paid ₹799 to apply."},
  {n:"02",icon:"🎯",t:"Apply to Referrals",d:"Find employees at your dream company willing to refer you. Apply directly."},
  {n:"03",icon:"🚀",t:"Internal Referral",d:"Employee submits your profile through their company's referral system."},
  {n:"04",icon:"💰",t:"Everyone Wins",d:"You get hired. Referrer earns ₹25k–₹1L bonus from their company."},
];

export default function Landing() {
  const nav = useNavigate();
  const user = auth.currentUser;

  return (
    <div style={{background:BG,minHeight:"100vh",color:WT,overflowX:"hidden"}}>
      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(8,8,8,0.95)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BR}`,padding:"0 20px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,background:`linear-gradient(135deg,${G},${GL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>RaYa Jobs</span>
        <div style={{display:"flex",gap:8}}>
          {user ? (
            <button onClick={()=>nav("/dashboard")} style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"7px 18px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Dashboard →</button>
          ) : (
            <>
              <button onClick={()=>nav("/login")} style={{background:"none",border:`1px solid ${BR}`,color:MT,padding:"7px 18px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Login</button>
              <button onClick={()=>nav("/register")} style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"7px 18px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Join Free</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div style={{padding:"80px 20px 64px",textAlign:"center",background:`radial-gradient(ellipse 100% 60% at 50% 0%,${G}0C,transparent 65%)`}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${G}11`,border:`1px solid ${G}33`,borderRadius:100,padding:"5px 14px",marginBottom:20,fontSize:11,color:G,fontWeight:600,letterSpacing:"1px"}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#4ADE80",display:"inline-block"}}/>
          ONE ACCOUNT — FIND JOBS & POST REFERRALS
        </div>

        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(40px,8vw,68px)",fontWeight:700,lineHeight:1.1,marginBottom:16}}>
          Get Referred.<br/><span style={{color:G}}>Get Hired.</span><br/>
          <span style={{fontSize:"clamp(28px,5vw,44px)",color:"#AAA"}}>Help Others Too.</span>
        </h1>

        <p style={{color:MT,fontSize:16,maxWidth:520,margin:"0 auto 16px",lineHeight:1.7}}>
          One platform. Post referrals from your company. Apply to referrals at others. Whether you're hiring or job hunting — RaYa works both ways.
        </p>

        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${G}15`,border:`1px solid ${G}44`,borderRadius:100,padding:"8px 20px",marginBottom:36,fontSize:14,color:G,fontWeight:700}}>
          ✦ Everything unlocked at ₹799 / 3 months
        </div>

        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>nav("/register")} style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"14px 32px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Join RaYa — ₹799 →</button>
          <button onClick={()=>nav("/browse")} style={{background:"transparent",border:`1.5px solid ${G}`,color:G,padding:"14px 32px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Browse Referrals</button>
        </div>

        {/* STATS */}
        <div style={{display:"flex",justifyContent:"center",gap:"clamp(16px,4vw,40px)",marginTop:48,background:S1,border:`1px solid ${BR}`,borderRadius:14,padding:"20px clamp(16px,4vw,40px)",maxWidth:520,margin:"48px auto 0"}}>
          {[["12k+","Referrals"],["48k+","Members"],["3.2k+","Hired"],["₹47Cr","Bonuses"]].map(([v,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(20px,4vw,26px)",fontWeight:700,color:G,lineHeight:1}}>{v}</div>
              <div style={{color:MT,fontSize:11,marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TICKER */}
      <div style={{borderTop:`1px solid ${BR}`,borderBottom:`1px solid ${BR}`,padding:"12px 0",overflow:"hidden",background:S1}}>
        <div style={{display:"flex",animation:"ticker 22s linear infinite",width:"max-content"}}>
          {[...companies,...companies].map((c,i)=><span key={i} style={{padding:"5px 16px",margin:"0 4px",border:`1px solid ${BR}`,borderRadius:6,color:MT,fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{c}</span>)}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{padding:"72px 20px",maxWidth:960,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{color:G,fontSize:10,letterSpacing:"3px",fontWeight:700,marginBottom:10}}>THE PROCESS</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,5vw,40px)",fontWeight:700}}>How RaYa Works</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
          {steps.map((s,i)=>(
            <div key={i} style={{background:S1,border:`1px solid ${BR}`,borderRadius:12,padding:22}}>
              <div style={{fontSize:28,marginBottom:10}}>{s.icon}</div>
              <div style={{color:G,fontSize:10,fontWeight:700,letterSpacing:"2px",marginBottom:6}}>{s.n}</div>
              <div style={{color:WT,fontWeight:700,fontSize:15,marginBottom:8,lineHeight:1.3}}>{s.t}</div>
              <div style={{color:MT,fontSize:13,lineHeight:1.6}}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DUAL VALUE CARDS */}
      <div style={{padding:"0 20px 80px",maxWidth:960,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
          {/* Looking for job */}
          <div style={{background:`linear-gradient(145deg,${G}14,${S1})`,border:`1px solid ${G}33`,borderRadius:16,padding:32}}>
            <div style={{fontSize:36,marginBottom:14}}>🎯</div>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,marginBottom:10}}>Looking for a Job?</h3>
            <p style={{color:MT,fontSize:14,lineHeight:1.7,marginBottom:20}}>Apply directly to employees who can refer you inside top IT companies. 5x higher chance of getting hired vs direct application.</p>
            {["Browse referrals by company & role","Apply directly to employee insider","Get response within 7 days guaranteed","Track every application live"].map(f=>(
              <div key={f} style={{display:"flex",gap:8,marginBottom:8,fontSize:13,color:"#CCC"}}><span style={{color:G,flexShrink:0}}>✦</span>{f}</div>
            ))}
          </div>

          {/* Working & want to refer */}
          <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:16,padding:32}}>
            <div style={{fontSize:36,marginBottom:14}}>💼</div>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,marginBottom:10}}>Working in IT?</h3>
            <p style={{color:MT,fontSize:14,lineHeight:1.7,marginBottom:20}}>Post your company's referral openings. Earn ₹25,000–₹1,00,000 referral bonus when your candidate joins.</p>
            {["Post referral openings in 2 minutes","Receive only serious paid applicants","Review profiles and refer the best","Earn your full company referral bonus"].map(f=>(
              <div key={f} style={{display:"flex",gap:8,marginBottom:8,fontSize:13,color:"#CCC"}}><span style={{color:G,flexShrink:0}}>✦</span>{f}</div>
            ))}
          </div>
        </div>

        {/* PRICING */}
        <div style={{marginTop:24,background:`linear-gradient(145deg,${G}18,${S1})`,border:`1px solid ${G}44`,borderRadius:16,padding:32,textAlign:"center"}}>
          <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"3px",marginBottom:12}}>ONE SIMPLE PLAN</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:56,fontWeight:700,color:G,lineHeight:1,marginBottom:4}}>₹799</div>
          <div style={{color:MT,fontSize:14,marginBottom:24}}>per 3 months • Everything included</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:28,maxWidth:600,margin:"0 auto 28px"}}>
            {["Unlimited job applications","Unlimited referral posts","Application tracking","7-day response guarantee","Direct employee contact","Resume upload & storage"].map(f=>(
              <div key={f} style={{display:"flex",gap:8,fontSize:13,color:"#CCC",alignItems:"center"}}><span style={{color:G}}>✓</span>{f}</div>
            ))}
          </div>
          <button onClick={()=>nav("/register")} style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"14px 40px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Get Started — ₹799 →</button>
          <div style={{color:MT,fontSize:12,marginTop:12}}>First 2 applications & 1 referral post are free. No credit card to start.</div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{borderTop:`1px solid ${BR}`,padding:"24px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",background:`linear-gradient(135deg,${G},${GL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontSize:18,fontWeight:700}}>RaYa Jobs</span>
        <span style={{color:MT,fontSize:12}}>Get Referred. Get Hired. © 2025</span>
        <span style={{color:`${G}66`,fontSize:11}}>Built with ❤️ by Raghu & Yaksha</span>
      </div>
    </div>
  );
}
