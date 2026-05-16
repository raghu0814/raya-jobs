import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";
import Timeline from "../components/Timeline";
import Badge from "../components/Badge";
import Loader from "../components/Loader";

const G="#C9A84C",GL="#E8C96A",BG="#080808",S1="#0F0F0F",S2="#161616",S3="#1E1E1E",BR="#2A2A2A",MT="#666666",WT="#F0EDE6";
const ST={"Applied":{color:"#60A5FA",icon:"📨"},"Reviewing":{color:"#FBBF24",icon:"👀"},"Referred":{color:"#A78BFA",icon:"🚀"},"Interviewing":{color:"#F97316",icon:"🎯"},"Offered":{color:"#4ADE80",icon:"🎉"},"Hired":{color:"#C9A84C",icon:"🏆"},"Rejected":{color:"#EF4444",icon:"✕"}};

export default function DashCandidate() {
  const nav = useNavigate();
  const [tab, setTab] = useState("applications");
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) { nav("/login-candidate"); return; }
    const fetch = async () => {
      try {
        const q = query(collection(db,"applications"), where("candidateId","==",user.uid));
        const snap = await getDocs(q);
        setApps(snap.docs.map(d=>({id:d.id,...d.data()})));
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const handleLogout = async () => { await signOut(auth); nav("/"); };

  const counts = {
    total:apps.length,
    active:apps.filter(a=>!["Rejected","Hired"].includes(a.status)).length,
    interviews:apps.filter(a=>a.status==="Interviewing").length,
    hired:apps.filter(a=>a.status==="Hired").length,
  };

  if (loading) return <Loader text="Loading dashboard..."/>;

  return (
    <div style={{background:BG,minHeight:"100vh",color:WT,fontFamily:"'DM Sans',sans-serif",paddingBottom:40}}>
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(8,8,8,0.96)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BR}`,padding:"0 20px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>nav("/")} style={{background:"none",border:"none",color:MT,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>← Home</button>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,background:`linear-gradient(135deg,${G},${GL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>RaYa Jobs</span>
        <button onClick={handleLogout} style={{background:"none",border:`1px solid ${BR}`,color:MT,padding:"5px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
      </nav>

      <div style={{padding:"24px 20px 0"}}>
        <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"2px",marginBottom:4}}>CANDIDATE DASHBOARD</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:WT,marginBottom:4}}>Welcome, {user?.displayName?.split(" ")[0]||"there"} 👋</h1>
        <p style={{color:MT,fontSize:13,marginBottom:18}}>Track your referral applications</p>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
          {[{icon:"📋",label:"Applied",value:counts.total,color:G},{icon:"⚡",label:"Active",value:counts.active,color:"#60A5FA"},{icon:"🎯",label:"Interviews",value:counts.interviews,color:"#F97316"},{icon:"🏆",label:"Hired",value:counts.hired,color:"#4ADE80"}].map(s=>(
            <div key={s.label} style={{background:S1,border:`1px solid ${BR}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</div>
              <div style={{color:MT,fontSize:9,marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:2,borderBottom:`1px solid ${BR}`}}>
          {[["applications","Applications"],["profile","Profile"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{background:"none",border:"none",cursor:"pointer",padding:"10px 14px",fontSize:13,fontWeight:tab===k?700:400,color:tab===k?G:MT,fontFamily:"inherit",borderBottom:`2px solid ${tab===k?G:"transparent"}`}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px",maxWidth:860,margin:"0 auto"}}>
        {tab==="applications"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {apps.length===0?(
              <div style={{textAlign:"center",padding:"60px 0",color:MT}}>
                <div style={{fontSize:40,marginBottom:12}}>📋</div>
                <div style={{color:WT,fontSize:16,marginBottom:8}}>No applications yet</div>
                <div style={{fontSize:13,marginBottom:20}}>Browse referrals and apply to get started</div>
                <button onClick={()=>nav("/browse")} style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Browse Referrals →</button>
              </div>
            ):apps.map(app=>{
              const cfg=ST[app.status]||ST["Applied"];
              return(
                <div key={app.id} style={{background:S1,border:`1px solid ${expanded===app.id?G+"55":BR}`,borderRadius:14,overflow:"hidden",cursor:"pointer"}} onClick={()=>setExpanded(expanded===app.id?null:app.id)}>
                  <div style={{padding:"16px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:14,color:WT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{app.role}</div>
                        <div style={{color:MT,fontSize:12,marginTop:1}}>{app.company}</div>
                      </div>
                      <Badge color={cfg.color}>{cfg.icon} {app.status}</Badge>
                    </div>
                    <Timeline status={app.status}/>
                  </div>
                  {expanded===app.id&&(
                    <div style={{borderTop:`1px solid ${BR}`,padding:"12px 16px",background:S2}}>
                      <div style={{color:MT,fontSize:12}}>Applied: {app.appliedAt?.toDate?.()?.toLocaleDateString()||"Recently"}</div>
                      {app.status==="Rejected"&&<div style={{marginTop:8,color:MT,fontSize:12}}>Don't give up — keep applying! 💪</div>}
                    </div>
                  )}
                </div>
              );
            })}
            {apps.length>0&&(
              <button onClick={()=>nav("/browse")} style={{background:`${G}15`,border:`1px solid ${G}33`,color:G,padding:"12px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%",marginTop:8}}>+ Apply to More Referrals</button>
            )}
          </div>
        )}

        {tab==="profile"&&(
          <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:14,padding:24}}>
            <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:20}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${G},${GL})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:BG}}>
                {user?.displayName?.charAt(0)||"U"}
              </div>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:WT}}>{user?.displayName}</div>
                <div style={{color:MT,fontSize:13}}>{user?.email}</div>
                <div style={{marginTop:6}}><Badge color="#4ADE80">Active</Badge></div>
              </div>
            </div>
            <button onClick={handleLogout} style={{width:"100%",background:"none",border:"1px solid #EF444444",color:"#EF4444",padding:"12px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
          </div>
        )}
      </div>
    </div>
  );
}
