import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";
import Badge from "../components/Badge";
import Loader from "../components/Loader";

const G="#C9A84C",GL="#E8C96A",BG="#080808",S1="#0F0F0F",S2="#161616",S3="#1E1E1E",BR="#2A2A2A",MT="#666666",WT="#F0EDE6";
const BONUS={"Amazon":{min:75000,max:100000},"Microsoft":{min:100000,max:150000},"Swiggy":{min:75000,max:120000},"Cognizant":{min:30000,max:50000},"Infosys":{min:30000,max:50000},"Wipro":{min:25000,max:45000},"TCS":{min:25000,max:40000},"Accenture":{min:35000,max:55000}};
const ST={"Applied":{color:"#60A5FA",icon:"📨"},"Reviewing":{color:"#FBBF24",icon:"👀"},"Referred":{color:"#A78BFA",icon:"🚀"},"Shortlisted":{color:G,icon:"✓"},"Rejected":{color:"#EF4444",icon:"✕"},"Hired":{color:G,icon:"🏆"}};

export default function DashEmployee() {
  const nav = useNavigate();
  const [tab, setTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) { nav("/login-employee"); return; }
    const fetch = async () => {
      try {
        const q = query(collection(db,"referralPosts"), where("employeeId","==",user.uid));
        const snap = await getDocs(q);
        setPosts(snap.docs.map(d=>({id:d.id,...d.data()})));
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const loadApplicants = async (post) => {
    setSelectedPost(post); setLoadingApps(true);
    try {
      const q = query(collection(db,"applications"), where("referralPostId","==",post.id));
      const snap = await getDocs(q);
      setApplicants(snap.docs.map(d=>({id:d.id,...d.data()})));
    } catch(e) { console.error(e); }
    finally { setLoadingApps(false); }
  };

  const updateAppStatus = async (appId, status) => {
    await updateDoc(doc(db,"applications",appId), { status });
    setApplicants(p=>p.map(a=>a.id===appId?{...a,status}:a));
  };

  const handleLogout = async () => { await signOut(auth); nav("/"); };
  const bonus = BONUS[posts[0]?.company]||{min:30000,max:75000};

  if (loading) return <Loader text="Loading dashboard..."/>;

  return (
    <div style={{background:BG,minHeight:"100vh",color:WT,fontFamily:"'DM Sans',sans-serif",paddingBottom:40}}>
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(8,8,8,0.96)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BR}`,padding:"0 20px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>nav("/")} style={{background:"none",border:"none",color:MT,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>← Home</button>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,background:`linear-gradient(135deg,${G},${GL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>RaYa Jobs</span>
        <button onClick={handleLogout} style={{background:"none",border:`1px solid ${BR}`,color:MT,padding:"5px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
      </nav>

      <div style={{padding:"24px 20px 0"}}>
        <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"2px",marginBottom:4}}>EMPLOYEE DASHBOARD</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:WT,marginBottom:4}}>Welcome, {user?.displayName?.split(" ")[0]||"there"} 👋</h1>
        <p style={{color:MT,fontSize:13,marginBottom:18}}>Manage your referral posts and track bonuses</p>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
          {[{icon:"📝",label:"Posts",value:posts.length,color:G},{icon:"👥",label:"Applicants",value:applicants.length,color:"#60A5FA"},{icon:"🚀",label:"Referred",value:applicants.filter(a=>a.status==="Referred").length,color:"#A78BFA"},{icon:"💰",label:"Est Bonus",value:`₹${(bonus.min/1000).toFixed(0)}k`,color:"#4ADE80"}].map(s=>(
            <div key={s.label} style={{background:S1,border:`1px solid ${BR}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</div>
              <div style={{color:MT,fontSize:9,marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:2,borderBottom:`1px solid ${BR}`}}>
          {[["posts","My Posts"],["earnings","Earnings"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setTab(k);setSelectedPost(null);}} style={{background:"none",border:"none",cursor:"pointer",padding:"10px 14px",fontSize:13,fontWeight:tab===k?700:400,color:tab===k?G:MT,fontFamily:"inherit",borderBottom:`2px solid ${tab===k?G:"transparent"}`}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px",maxWidth:860,margin:"0 auto"}}>

        {tab==="posts"&&!selectedPost&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"3px"}}>YOUR REFERRAL POSTS</div>
              <button onClick={()=>nav("/register-employee")} style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ New Post</button>
            </div>
            {posts.length===0?(
              <div style={{textAlign:"center",padding:"60px 0",color:MT}}>
                <div style={{fontSize:40,marginBottom:12}}>📝</div>
                <div style={{color:WT,fontSize:16,marginBottom:8}}>No posts yet</div>
                <button onClick={()=>nav("/register-employee")} style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Post Your First Referral →</button>
              </div>
            ):posts.map(post=>(
              <div key={post.id} style={{background:S1,border:`1px solid ${BR}`,borderRadius:14,padding:18,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:WT,marginBottom:6}}>{post.role}</div>
                    <div style={{display:"flex",gap:6}}>
                      <Badge color="#4ADE80">{post.status}</Badge>
                      <Badge color={MT}>{post.ctcMin}–{post.ctcMax} LPA</Badge>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:G,lineHeight:1}}>{post.slots}</div>
                    <div style={{color:MT,fontSize:11}}>slots</div>
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {(post.skills||[]).map(s=><span key={s} style={{background:S3,border:`1px solid ${BR}`,color:"#AAA",padding:"3px 10px",borderRadius:100,fontSize:11}}>{s}</span>)}
                </div>
                <button onClick={()=>loadApplicants(post)} style={{width:"100%",background:`${G}15`,border:`1px solid ${G}33`,color:G,padding:"10px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View Applicants →</button>
              </div>
            ))}
          </div>
        )}

        {tab==="posts"&&selectedPost&&(
          <div>
            <button onClick={()=>setSelectedPost(null)} style={{background:"none",border:"none",color:MT,cursor:"pointer",fontSize:13,marginBottom:14,fontFamily:"inherit"}}>← Back to Posts</button>
            <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:12,padding:16,marginBottom:14}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:WT}}>{selectedPost.role}</div>
              <div style={{color:MT,fontSize:13,marginTop:4}}>{selectedPost.company}</div>
            </div>
            {loadingApps?<Loader text="Loading applicants..."/>:applicants.length===0?(
              <div style={{textAlign:"center",padding:"40px 0",color:MT}}>
                <div style={{fontSize:32,marginBottom:10}}>👥</div>
                <div style={{color:WT,fontSize:15}}>No applicants yet</div>
              </div>
            ):applicants.map(app=>{
              const cfg=ST[app.status]||ST["Applied"];
              return(
                <div key={app.id} style={{background:S1,border:`1px solid ${BR}`,borderRadius:12,padding:16,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:WT}}>{app.candidateName||"Candidate"}</div>
                      <div style={{color:MT,fontSize:12,marginTop:2}}>Applied {app.appliedAt?.toDate?.()?.toLocaleDateString()||"Recently"}</div>
                    </div>
                    <Badge color={cfg.color}>{cfg.icon} {app.status}</Badge>
                  </div>
                  {app.status!=="Referred"&&app.status!=="Hired"&&(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      {[{l:"✓ Shortlist",a:"Shortlisted",c:G,bg:`${G}15`,b:`${G}33`},{l:"🚀 Refer",a:"Referred",c:"#A78BFA",bg:"#A78BFA15",b:"#A78BFA33"},{l:"✕ Reject",a:"Rejected",c:"#EF4444",bg:"#EF444415",b:"#EF444433"}].map(btn=>(
                        <button key={btn.a} onClick={()=>updateAppStatus(app.id,btn.a)} style={{background:btn.bg,border:`1px solid ${btn.b}`,color:btn.c,padding:"9px 6px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{btn.l}</button>
                      ))}
                    </div>
                  )}
                  {app.status==="Referred"&&<div style={{background:"#0A0A1F",border:"1px solid #A78BFA44",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#A78BFA",fontWeight:600}}>🚀 Referred internally — waiting for HR to process</div>}
                </div>
              );
            })}
          </div>
        )}

        {tab==="earnings"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
              {[{icon:"💰",label:"Est. Bonus",value:`₹${(bonus.min/1000).toFixed(0)}k–₹${(bonus.max/1000).toFixed(0)}k`,color:G,sub:posts[0]?.company||"Your company"},{icon:"🚀",label:"Referred",value:applicants.filter(a=>a.status==="Referred").length,color:"#A78BFA",sub:"Total referred"}].map(s=>(
                <div key={s.label} style={{background:S1,border:`1px solid ${BR}`,borderRadius:12,padding:16}}>
                  <div style={{fontSize:22,marginBottom:8}}>{s.icon}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:s.color,lineHeight:1,marginBottom:4}}>{s.value}</div>
                  <div style={{color:WT,fontWeight:600,fontSize:12}}>{s.label}</div>
                  <div style={{color:MT,fontSize:11,marginTop:2}}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:14,padding:18}}>
              <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"3px",marginBottom:12}}>COMPANY BONUS REFERENCE</div>
              {Object.entries(BONUS).map(([co,b],i)=>(
                <div key={co} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<Object.entries(BONUS).length-1?`1px solid ${BR}`:"none"}}>
                  <span style={{color:"#CCC",fontSize:13,fontWeight:600}}>{co}</span>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",color:G,fontWeight:700,fontSize:14}}>₹{(b.min/1000).toFixed(0)}k–₹{(b.max/1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
            <div style={{background:`${G}08`,border:`1px solid ${G}22`,borderRadius:10,padding:"12px 14px",marginTop:14,fontSize:12,color:MT,lineHeight:1.7}}>✦ Bonus credited directly by your company within 30–90 days of candidate joining.</div>
          </div>
        )}
      </div>
    </div>
  );
}
