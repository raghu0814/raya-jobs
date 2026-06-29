import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { useState, useEffect, useRef } from "react";

const PRIMARY="#1A2E4A",GREEN="#22C55E",GREENBG="#F0FDF4";
const BG="#FFFFFF",BG2="#F8FAFC",BORDER="#E2E8F0",TEXT="#0F172A",MUTED="#64748B";

const IlluPost=()=>(<svg viewBox="0 0 180 140" fill="none" style={{width:"100%",maxWidth:160}}><rect x="10" y="10" width="160" height="120" rx="16" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/><rect x="26" y="30" width="80" height="7" rx="3.5" fill="#93C5FD"/><rect x="26" y="44" width="60" height="5" rx="2.5" fill="#BFDBFE"/><rect x="26" y="56" width="110" height="5" rx="2.5" fill="#BFDBFE"/><rect x="26" y="68" width="80" height="5" rx="2.5" fill="#BFDBFE"/><rect x="26" y="88" width="56" height="24" rx="8" fill={GREEN}/><rect x="34" y="97" width="40" height="5" rx="2.5" fill="white"/><rect x="110" y="20" width="48" height="26" rx="8" fill="white" stroke={BORDER} strokeWidth="1"/><circle cx="120" cy="33" r="5" fill="#DCFCE7"/><rect x="129" y="29" width="22" height="4" rx="2" fill="#86EFAC"/><rect x="129" y="36" width="16" height="3" rx="1.5" fill="#BBF7D0"/></svg>);
const IlluRefer=()=>(<svg viewBox="0 0 180 140" fill="none" style={{width:"100%",maxWidth:160}}><circle cx="44" cy="56" r="26" fill="#E0F2FE" stroke="#BAE6FD" strokeWidth="1.5"/><circle cx="44" cy="48" r="11" fill="#7DD3FC"/><path d="M22 72 Q44 62 66 72" fill="#7DD3FC"/><path d="M74 60 L106 60" stroke={GREEN} strokeWidth="2.5" strokeDasharray="4 3"/><path d="M102 55 L108 60 L102 65" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"/><circle cx="136" cy="56" r="26" fill="#DCFCE7" stroke="#BBF7D0" strokeWidth="1.5"/><circle cx="136" cy="48" r="11" fill={GREEN}/><path d="M114 72 Q136 62 158 72" fill={GREEN}/><rect x="96" y="90" width="56" height="28" rx="8" fill="white" stroke={BORDER} strokeWidth="1"/><circle cx="110" cy="104" r="5" fill="#DCFCE7"/><rect x="120" y="100" width="24" height="4" rx="2" fill="#86EFAC"/><rect x="120" y="107" width="18" height="3" rx="1.5" fill="#BBF7D0"/></svg>);
const IlluHire=()=>(<svg viewBox="0 0 180 140" fill="none" style={{width:"100%",maxWidth:160}}><rect x="20" y="20" width="140" height="100" rx="16" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1.5"/><path d="M76 48 L104 48 L101 66 Q90 76 79 66 Z" fill="#FCD34D"/><rect x="87" y="66" width="6" height="10" fill="#FCD34D"/><rect x="80" y="76" width="20" height="5" rx="2.5" fill="#F59E0B"/><text x="50" y="60" fontSize="12">⭐</text><text x="118" y="60" fontSize="12">⭐</text><text x="84" y="40" fontSize="11">🎉</text><rect x="40" y="96" width="100" height="5" rx="2.5" fill="#86EFAC"/><rect x="60" y="106" width="60" height="4" rx="2" fill="#BBF7D0"/></svg>);
const IlluReward=()=>(<svg viewBox="0 0 180 140" fill="none" style={{width:"100%",maxWidth:160}}><rect x="20" y="30" width="140" height="80" rx="14" fill={PRIMARY}/><rect x="20" y="30" width="140" height="36" rx="14" fill="#1E3A5F"/><rect x="20" y="48" width="140" height="18" fill="#1E3A5F"/><rect x="34" y="38" width="26" height="18" rx="4" fill="#FCD34D" opacity="0.9"/><text x="42" y="88" fontSize="10" fill="white" fontWeight="bold">Referral Bonus</text><text x="42" y="102" fontSize="8" fill="#94A3B8">Credited by your company</text><rect x="110" y="20" width="52" height="26" rx="8" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="1"/><rect x="128" y="27" width="26" height="4" rx="2" fill="#86EFAC"/><rect x="128" y="34" width="18" height="3" rx="1.5" fill="#BBF7D0"/></svg>);
const HeroIllus=()=>(<svg viewBox="0 0 440 360" fill="none" style={{width:"100%",maxWidth:440}}><ellipse cx="260" cy="190" rx="150" ry="130" fill="#F0FDF4" opacity="0.8"/><ellipse cx="160" cy="270" rx="90" ry="70" fill="#DCFCE7" opacity="0.5"/><rect x="30" y="50" width="210" height="155" rx="18" fill="white" stroke={BORDER} strokeWidth="1.5"/><rect x="30" y="50" width="210" height="46" rx="18" fill="#EFF6FF"/><rect x="30" y="78" width="210" height="18" fill="#EFF6FF"/><circle cx="56" cy="74" r="14" fill="#BFDBFE"/><rect x="78" y="67" width="72" height="5" rx="2.5" fill="#93C5FD"/><rect x="78" y="75" width="54" height="4" rx="2" fill="#BFDBFE"/><rect x="50" y="112" width="110" height="4" rx="2" fill="#E2E8F0"/><rect x="50" y="122" width="90" height="4" rx="2" fill="#E2E8F0"/><rect x="50" y="132" width="130" height="4" rx="2" fill="#E2E8F0"/><rect x="50" y="156" width="72" height="26" rx="8" fill={GREEN}/><rect x="58" y="165" width="56" height="5" rx="2.5" fill="white" opacity="0.9"/><rect x="134" y="156" width="72" height="26" rx="8" fill="#F1F5F9" stroke={BORDER} strokeWidth="1"/><rect x="142" y="165" width="56" height="5" rx="2.5" fill="#94A3B8"/><rect x="222" y="32" width="168" height="74" rx="14" fill="white" stroke={BORDER} strokeWidth="1.5"/><circle cx="246" cy="70" r="18" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="1"/><text x="239" y="75" fontSize="12">✓</text><rect x="272" y="58" width="90" height="5" rx="2.5" fill={PRIMARY}/><rect x="272" y="68" width="66" height="4" rx="2" fill={MUTED} opacity="0.4"/><rect x="272" y="80" width="46" height="14" rx="6" fill={GREENBG}/><rect x="278" y="84" width="34" height="4" rx="2" fill={GREEN}/><rect x="248" y="190" width="168" height="74" rx="14" fill={PRIMARY}/><text x="268" y="228" fontSize="24">🎉</text><rect x="302" y="212" width="84" height="5" rx="2.5" fill="white" opacity="0.9"/><rect x="302" y="222" width="66" height="4" rx="2" fill="white" opacity="0.5"/><rect x="302" y="234" width="56" height="16" rx="6" fill={GREEN}/><rect x="308" y="239" width="44" height="4" rx="2" fill={PRIMARY}/><rect x="30" y="248" width="150" height="64" rx="14" fill="white" stroke={BORDER} strokeWidth="1.5"/><circle cx="56" cy="280" r="18" fill="#DCFCE7" stroke="#BBF7D0" strokeWidth="1"/><text x="47" y="285" fontSize="14">🤝</text><rect x="82" y="270" width="72" height="5" rx="2.5" fill={PRIMARY}/><rect x="82" y="280" width="54" height="4" rx="2" fill={MUTED} opacity="0.4"/><rect x="82" y="290" width="80" height="4" rx="2" fill="#86EFAC"/></svg>);

const Pill=({children})=>(<div style={{display:"inline-flex",alignItems:"center",gap:6,background:GREENBG,border:"1px solid #BBF7D0",borderRadius:100,padding:"5px 12px",fontSize:12,color:"#15803D",fontWeight:600}}><span style={{color:GREEN,fontSize:10}}>✓</span>{children}</div>);
const Check=({text,color=GREEN,bg=GREENBG})=>(<div style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:14,color:TEXT}}><div style={{width:20,height:20,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color,fontWeight:700,flexShrink:0,marginTop:1}}>✓</div>{text}</div>);
const StepCard=({num,title,desc,Illus,color})=>(<div style={{background:"white",border:`1px solid ${BORDER}`,borderRadius:20,padding:24,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",transition:"transform 0.2s,box-shadow 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(15,23,42,0.08)";}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}><div style={{width:44,height:44,borderRadius:"50%",background:color+"18",border:`2px solid ${color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color,marginBottom:14}}>{num}</div><div style={{marginBottom:12,height:110,display:"flex",alignItems:"center"}}><Illus/></div><div style={{fontWeight:700,fontSize:15,color:PRIMARY,marginBottom:6}}>{title}</div><div style={{color:MUTED,fontSize:13,lineHeight:1.7}}>{desc}</div></div>);
const Testimonial=({quote,name,role,company,emoji})=>(<div style={{background:"white",border:`1px solid ${BORDER}`,borderRadius:20,padding:24}}><div style={{fontSize:28,marginBottom:10}}>{emoji}</div><p style={{color:TEXT,fontSize:13,lineHeight:1.8,marginBottom:14,fontStyle:"italic"}}>"{quote}"</p><div style={{borderTop:`1px solid ${BORDER}`,paddingTop:12}}><div style={{fontWeight:700,color:PRIMARY,fontSize:13}}>{name}</div><div style={{color:MUTED,fontSize:11,marginTop:2}}>{role} • {company}</div></div></div>);

export default function Landing(){
  const nav=useNavigate();
  const user=auth.currentUser;
  const[scrolled,setScrolled]=useState(false);
  const howItWorksRef=useRef(null);
  useEffect(()=>{const h=()=>setScrolled(window.scrollY>20);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);
  const companies=["TCS","Infosys","Wipro","Accenture","Amazon","Microsoft","Cognizant","HCL","Swiggy","Zomato","PhonePe","Flipkart","Razorpay","CRED","Meesho"];

  return(
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:BG,color:TEXT,overflowX:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px;}@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}.hero-img{animation:float 5s ease-in-out infinite;}.cta-btn{transition:all 0.2s;}.cta-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(34,197,94,0.3);}`}</style>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:scrolled?"rgba(255,255,255,0.97)":"white",backdropFilter:"blur(16px)",borderBottom:scrolled?`1px solid ${BORDER}`:"1px solid transparent",padding:`0 clamp(16px,4vw,48px)`,height:66,display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>nav("/")}>
          <div style={{width:34,height:34,borderRadius:10,background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🤝</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:19,color:PRIMARY}}>Rytaine Jobs</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <span onClick={()=>nav("/browse")} style={{color:MUTED,fontSize:13,fontWeight:500,cursor:"pointer"}}>Browse Jobs</span>
          <span onClick={()=>howItWorksRef.current?.scrollIntoView({behavior:"smooth"})} style={{color:MUTED,fontSize:13,fontWeight:500,cursor:"pointer"}}>How it Works</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {user?(
            <button className="cta-btn" onClick={()=>nav("/dashboard")} style={{background:GREEN,border:"none",color:"white",padding:"9px 20px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Dashboard →</button>
          ):(
            <>
              <button onClick={()=>nav("/login")} style={{background:"none",border:`1.5px solid ${BORDER}`,color:PRIMARY,padding:"8px 18px",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Login</button>
              <button className="cta-btn" onClick={()=>nav("/register")} style={{background:GREEN,border:"none",color:"white",padding:"9px 20px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Get Started Free</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{padding:"clamp(48px,7vw,96px) clamp(16px,4vw,48px)",maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:48,alignItems:"center"}}>
        <div>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:GREENBG,border:"1px solid #BBF7D0",borderRadius:100,padding:"6px 14px",marginBottom:22,fontSize:11,color:"#15803D",fontWeight:700,letterSpacing:"0.5px"}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:GREEN,display:"inline-block"}}/>INDIA'S REFERRAL JOBS PLATFORM
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(34px,6vw,58px)",fontWeight:800,lineHeight:1.15,marginBottom:18,color:PRIMARY}}>Refer Talent.<br/><span style={{color:GREEN}}>Get Rewarded.</span></h1>
          <p style={{color:MUTED,fontSize:"clamp(14px,2vw,17px)",lineHeight:1.8,marginBottom:28,maxWidth:480}}>Connect job seekers with employees who can refer them inside top IT companies. One platform — find jobs, post referrals, get hired.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:32}}>
            <Pill>5x higher chance of getting hired</Pill>
            <Pill>Direct employee contact</Pill>
            <Pill>100% Free to use</Pill>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <button className="cta-btn" onClick={()=>nav("/register")} style={{background:GREEN,border:"none",color:"white",padding:"13px 30px",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Get Started Free →</button>
            <button onClick={()=>nav("/browse")} style={{background:"none",border:`2px solid ${BORDER}`,color:PRIMARY,padding:"13px 26px",borderRadius:12,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Browse Referrals</button>
          </div>
          <p style={{color:MUTED,fontSize:12,marginTop:12}}>Free to use. No credit card needed.</p>
        </div>
        <div className="hero-img" style={{display:"flex",justifyContent:"center"}}><HeroIllus/></div>
      </section>

      {/* STATS */}
      <section style={{background:BG2,borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))"}}>
          {[["12,000+","Referral Posts","📝"],["48,000+","Job Seekers","👥"],["3,200+","Hired","🏆"],["94%","Response Rate","✅"]].map(([v,l,icon],i,arr)=>(
            <div key={l} style={{textAlign:"center",padding:"20px 12px",borderRight:i<arr.length-1?`1px solid ${BORDER}`:"none"}}>
              <div style={{fontSize:26,marginBottom:4}}>{icon}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,4vw,32px)",fontWeight:700,color:PRIMARY,lineHeight:1}}>{v}</div>
              <div style={{color:MUTED,fontSize:12,marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TICKER */}
      <section style={{padding:"18px 0",overflow:"hidden",background:"white",borderBottom:`1px solid ${BORDER}`}}>
        <p style={{textAlign:"center",fontSize:11,color:MUTED,fontWeight:600,letterSpacing:"1px",marginBottom:12}}>EMPLOYEES FROM THESE COMPANIES ARE ALREADY ON RYTAINE</p>
        <div style={{display:"flex",animation:"ticker 28s linear infinite",width:"max-content"}}>
          {[...companies,...companies].map((c,i)=>(<div key={i} style={{display:"flex",alignItems:"center",padding:"7px 18px",margin:"0 4px",background:BG2,border:`1px solid ${BORDER}`,borderRadius:100,fontSize:12,fontWeight:600,color:PRIMARY,whiteSpace:"nowrap"}}>{c}</div>))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={howItWorksRef} style={{padding:"clamp(56px,7vw,96px) clamp(16px,4vw,48px)",maxWidth:1200,margin:"0 auto",scrollMarginTop:80}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <div style={{display:"inline-block",background:GREENBG,border:"1px solid #BBF7D0",borderRadius:100,padding:"5px 14px",fontSize:11,color:"#15803D",fontWeight:700,letterSpacing:"1px",marginBottom:14}}>THE PROCESS</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,5vw,42px)",fontWeight:800,color:PRIMARY,marginBottom:12}}>How Rytaine Jobs Works</h2>
          <p style={{color:MUTED,fontSize:15,maxWidth:500,margin:"0 auto",lineHeight:1.7}}>Four simple steps from finding a referral to getting hired</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
          <StepCard num="1" title="Post a Referral" desc="IT employees post their company's open roles. Your company's referral programme does the rest." Illus={IlluPost} color={GREEN}/>
          <StepCard num="2" title="Apply Directly" desc="Job seekers find employees willing to refer them and apply with their profile directly." Illus={IlluRefer} color="#3B82F6"/>
          <StepCard num="3" title="Get Hired" desc="Employee submits your profile through their company's internal referral system." Illus={IlluHire} color="#F97316"/>
          <StepCard num="4" title="Everyone Wins" desc="You land the job. The employee gets credit through their company's existing referral programme." Illus={IlluReward} color="#A855F7"/>
        </div>
      </section>

      {/* DUAL VALUE */}
      <section style={{background:BG2,padding:"clamp(56px,7vw,96px) clamp(16px,4vw,48px)"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,5vw,40px)",fontWeight:800,color:PRIMARY,marginBottom:10}}>Built for Everyone in IT</h2>
            <p style={{color:MUTED,fontSize:15,maxWidth:480,margin:"0 auto"}}>Whether you're job hunting or want to help others get hired — Rytaine Jobs works both ways</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20}}>
            <div style={{background:"white",border:`1px solid ${BORDER}`,borderRadius:22,padding:32,borderTop:`4px solid ${GREEN}`}}>
              <div style={{width:52,height:52,borderRadius:14,background:GREENBG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:18}}>🎯</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:PRIMARY,marginBottom:8}}>Looking for a Job?</h3>
              <p style={{color:MUTED,fontSize:14,lineHeight:1.8,marginBottom:22}}>Get referred by real employees at top IT companies. Referred candidates are <strong style={{color:PRIMARY}}>5x more likely</strong> to get an interview.</p>
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:26}}>
                <Check text="Browse referrals by company and role"/>
                <Check text="Apply directly to an employee insider"/>
                <Check text="Track every application in real time"/>
                <Check text="Communicate directly with the employee"/>
              </div>
              <button className="cta-btn" onClick={()=>nav("/register")} style={{width:"100%",background:GREEN,border:"none",color:"white",padding:"13px",borderRadius:11,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Find Referrals →</button>
            </div>
            <div style={{background:"white",border:`1px solid ${BORDER}`,borderRadius:22,padding:32,borderTop:`4px solid ${PRIMARY}`}}>
              <div style={{width:52,height:52,borderRadius:14,background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:18}}>💼</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:PRIMARY,marginBottom:8}}>Working in IT?</h3>
              <p style={{color:MUTED,fontSize:14,lineHeight:1.8,marginBottom:22}}>Your company already has a referral programme. Rytaine helps you find the <strong style={{color:PRIMARY}}>right candidate faster</strong> so you can make a successful referral.</p>
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:26}}>
                <Check text="Post referral openings in 2 minutes" color="#3B82F6" bg="#EFF6FF"/>
                <Check text="Receive only serious applicants" color="#3B82F6" bg="#EFF6FF"/>
                <Check text="Smart routing to best matched candidate" color="#3B82F6" bg="#EFF6FF"/>
                <Check text="Your company rewards you when they join" color="#3B82F6" bg="#EFF6FF"/>
              </div>
              <button className="cta-btn" onClick={()=>nav("/register")} style={{width:"100%",background:PRIMARY,border:"none",color:"white",padding:"13px",borderRadius:11,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Post a Referral →</button>
            </div>
          </div>
          <div style={{marginTop:20,background:"white",border:`1px solid ${BORDER}`,borderRadius:16,padding:"24px 28px",display:"flex",gap:16,alignItems:"flex-start"}}>
            <div style={{width:44,height:44,borderRadius:12,background:GREENBG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>💡</div>
            <div>
              <div style={{fontWeight:700,color:PRIMARY,fontSize:15,marginBottom:6}}>How does the referral reward work?</div>
              <p style={{color:MUTED,fontSize:13,lineHeight:1.8}}>Most IT companies have an internal referral programme where employees earn a reward when someone they refer gets hired. Rytaine Jobs helps you find the right candidate quickly so your referral succeeds. The reward amount is determined entirely by your company's HR policy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{padding:"clamp(56px,7vw,96px) clamp(16px,4vw,48px)",maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,5vw,38px)",fontWeight:800,color:PRIMARY,marginBottom:10}}>What Our Users Say</h2>
          <p style={{color:MUTED,fontSize:14}}>Real results from real IT professionals</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:18}}>
          <Testimonial emoji="🎉" quote="Got referred to Amazon through Rytaine Jobs. The employee responded quickly, interview was scheduled, and I joined last month!" name="Preethi Nair" role="SDE-2" company="Amazon"/>
          <Testimonial emoji="🚀" quote="My company has a referral programme but I never found the right candidates. Rytaine sent me 3 quality profiles in 2 days. One of them joined!" name="Kiran Reddy" role="Senior Developer" company="Amazon"/>
          <Testimonial emoji="💪" quote="Applied to 50 jobs on Naukri — heard from 1. Applied to 3 referrals on Rytaine Jobs — heard from all 3. The difference is real." name="Arjun Sharma" role="SAP Consultant" company="Cognizant"/>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{background:`linear-gradient(135deg,${PRIMARY} 0%,#0F3460 100%)`,padding:"clamp(56px,7vw,96px) clamp(16px,4vw,48px)",textAlign:"center"}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,5vw,46px)",fontWeight:800,color:"white",marginBottom:14,lineHeight:1.2}}>Ready to Get<br/><span style={{color:GREEN}}>Referred?</span></h2>
          <p style={{color:"rgba(255,255,255,0.7)",fontSize:15,lineHeight:1.8,marginBottom:32}}>Join thousands of IT professionals finding jobs through referrals — or helping others get hired through their company's referral programme.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="cta-btn" onClick={()=>nav("/register")} style={{background:GREEN,border:"none",color:"white",padding:"14px 36px",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Join Rytaine Free →</button>
            <button onClick={()=>nav("/browse")} style={{background:"transparent",border:"2px solid rgba(255,255,255,0.3)",color:"white",padding:"14px 28px",borderRadius:12,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Browse Referrals</button>
          </div>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginTop:18}}>Free to use • No credit card needed</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"white",borderTop:`1px solid ${BORDER}`,padding:"28px clamp(16px,4vw,48px)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:8,background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🤝</div>
            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:PRIMARY}}>Rytaine Jobs</span>
          </div>
          <span style={{color:MUTED,fontSize:12}}>© 2025 Rytaine Jobs. Connecting IT talent through referrals.</span>
          <div style={{display:"flex",gap:18}}>{["Privacy","Terms","Contact"].map(l=><span key={l} style={{color:MUTED,fontSize:12,cursor:"pointer"}}>{l}</span>)}</div>
        </div>
      </footer>
    </div>
  );
}
