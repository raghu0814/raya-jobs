import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";
import Timeline from "../components/Timeline";
import Badge from "../components/Badge";
import Loader from "../components/Loader";

const G="#C9A84C",GL="#E8C96A",BG="#080808",S1="#0F0F0F",S2="#161616",S3="#1E1E1E",BR="#2A2A2A",MT="#666666",WT="#F0EDE6";

const BONUS={"Amazon":{min:75000,max:100000},"Microsoft":{min:100000,max:150000},"Google":{min:150000,max:200000},"Swiggy":{min:75000,max:120000},"PhonePe":{min:80000,max:100000},"Flipkart":{min:60000,max:100000},"Cognizant":{min:30000,max:50000},"Infosys":{min:30000,max:50000},"Wipro":{min:25000,max:45000},"TCS":{min:25000,max:40000},"Accenture":{min:35000,max:55000},"HCL":{min:25000,max:40000}};

const allSkills=[
  "Java","Python","React","Angular","Vue.js","Node.js",
  "Spring Boot","Microservices","Kafka","Docker","Kubernetes",
  "AWS","Azure","GCP","DevOps","CI/CD","Terraform",
  "SQL","MongoDB","PostgreSQL","Redis","Elasticsearch",
  "SAP SD","SAP MM","SAP FICO","SAP BTP","S/4HANA",
  "Salesforce","ServiceNow","Workday",
  ".NET","C#","C++","Go","Rust","TypeScript",
  "React Native","Flutter","Android","iOS","Swift","Kotlin",
  "Machine Learning","Data Science","Power BI","Tableau",
  "Selenium","Cypress","Jest","JUnit",
  "Linux","Networking","Cybersecurity","Blockchain","Unity"
];

const ST={"Applied":{color:"#60A5FA",icon:"📨"},"Reviewing":{color:"#FBBF24",icon:"👀"},"Referred":{color:"#A78BFA",icon:"🚀"},"Shortlisted":{color:G,icon:"✓"},"Interviewing":{color:"#F97316",icon:"🎯"},"Offered":{color:"#4ADE80",icon:"🎉"},"Hired":{color:G,icon:"🏆"},"Rejected":{color:"#EF4444",icon:"✕"}};

const Inp=({label,placeholder,type="text",value,onChange})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"12px 14px",color:WT,fontSize:14,outline:"none",fontFamily:"inherit"}}
      onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BR}/>
  </div>
);

const Sel=({label,options,value,onChange})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>{label}</label>
    <select value={value} onChange={onChange} style={{background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"12px 14px",color:value?WT:MT,fontSize:14,outline:"none",fontFamily:"inherit",appearance:"none"}}>
      <option value="">Select…</option>
      {options.map(o=><option key={o} value={o} style={{background:S2}}>{o}</option>)}
    </select>
  </div>
);

// ── Shared skill selector with type + tap ────────────────
function SkillSelector({skills,setSkills,exclude}){
  const [input,setInput]=useState("");
  const add=(s)=>{const v=s.trim();if(v&&!skills.includes(v))setSkills(p=>[...p,v]);};
  const handleKey=(e)=>{if(e.key==="Enter"&&input.trim()){add(input);setInput("");}};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>Skills Required</label>
      {skills.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {skills.map(s=>(
            <span key={s} onClick={()=>setSkills(p=>p.filter(x=>x!==s))}
              style={{background:`${G}22`,border:`1px solid ${G}55`,color:G,padding:"4px 10px",borderRadius:100,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              {s} <span style={{fontSize:10}}>✕</span>
            </span>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Type any skill and press Enter…"
          style={{flex:1,background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"10px 14px",color:WT,fontSize:13,outline:"none",fontFamily:"inherit"}}
          onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BR}/>
        <button onClick={()=>{add(input);setInput("");}}
          style={{background:`${G}22`,border:`1px solid ${G}44`,color:G,padding:"10px 16px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          Add
        </button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {allSkills.filter(s=>!skills.includes(s)&&s!==exclude).map(s=>(
          <span key={s} onClick={()=>add(s)}
            style={{background:S3,border:`1px solid ${BR}`,color:MT,padding:"4px 10px",borderRadius:100,fontSize:11,cursor:"pointer"}}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Check if a post is expired ────────────────────────────
function isExpired(lastDate){
  if(!lastDate) return false;
  return new Date(lastDate) < new Date();
}

export default function Dashboard(){
  const nav=useNavigate();
  const user=auth.currentUser;
  const [tab,setTab]=useState("applications");
  const [loading,setLoading]=useState(true);
  const [apps,setApps]=useState([]);
  const [expanded,setExpanded]=useState(null);
  const [myPosts,setMyPosts]=useState([]);
  const [selectedPost,setSelectedPost]=useState(null);
  const [applicants,setApplicants]=useState([]);
  const [loadingApps,setLoadingApps]=useState(false);

  // Post referral form
  const [posting,setPosting]=useState(false);
  const [postError,setPostError]=useState("");
  const [postSkills,setPostSkills]=useState([]);
  const [j,setJ]=useState({company:"",role:"",expMin:"",expMax:"",ctcMin:"",ctcMax:"",slots:"2",lastDate:"",desc:""});
  const sj=(k,v)=>setJ(p=>({...p,[k]:v}));
  const bonus=BONUS[j.company]||{min:25000,max:75000};

  useEffect(()=>{
    if(!user){nav("/login");return;}
    const fetchAll=async()=>{
      try{
        const [aSnap,pSnap]=await Promise.all([
          getDocs(query(collection(db,"applications"),where("candidateId","==",user.uid))),
          getDocs(query(collection(db,"referralPosts"),where("employeeId","==",user.uid)))
        ]);
        setApps(aSnap.docs.map(d=>({id:d.id,...d.data()})));

        // Auto-close expired posts in Firestore + filter locally
        const posts=pSnap.docs.map(d=>({id:d.id,...d.data()}));
        const today=new Date();
        for(const p of posts){
          if(p.lastDate && new Date(p.lastDate)<today && p.status==="Active"){
            await updateDoc(doc(db,"referralPosts",p.id),{status:"Closed"});
            p.status="Closed";
          }
        }
        setMyPosts(posts);
      }catch(e){console.error(e);}
      finally{setLoading(false);}
    };
    fetchAll();
  },[user]);

  const loadApplicants=async(post)=>{
    setSelectedPost(post);setLoadingApps(true);
    try{
      const q=query(collection(db,"applications"),where("referralPostId","==",post.id));
      const snap=await getDocs(q);
      setApplicants(snap.docs.map(d=>({id:d.id,...d.data()})));
    }catch(e){console.error(e);}
    finally{setLoadingApps(false);}
  };

  const updateAppStatus=async(appId,status)=>{
    await updateDoc(doc(db,"applications",appId),{status});
    setApplicants(p=>p.map(a=>a.id===appId?{...a,status}:a));
  };

  const handlePostReferral=async()=>{
    if(!j.company||!j.role){setPostError("Company and role are required");return;}
    if(!j.lastDate){setPostError("Please set a last date for the referral");return;}
    if(new Date(j.lastDate)<new Date()){setPostError("Last date must be in the future");return;}
    setPosting(true);setPostError("");
    try{
      const newRef=await addDoc(collection(db,"referralPosts"),{
        employeeId:user.uid,employeeName:user.displayName,
        company:j.company,designation:"Employee",
        role:j.role,skills:postSkills,
        expMin:Number(j.expMin)||0,expMax:Number(j.expMax)||0,
        ctcMin:Number(j.ctcMin)||0,ctcMax:Number(j.ctcMax)||0,
        slots:Number(j.slots)||2,description:j.desc,
        bonusMin:bonus.min,bonusMax:bonus.max,
        status:"Active",lastDate:j.lastDate,
        postedAt:serverTimestamp()
      });
      setMyPosts(p=>[{id:newRef.id,employeeId:user.uid,employeeName:user.displayName,status:"Active",...j,skills:postSkills,bonusMin:bonus.min,bonusMax:bonus.max},...p]);
      setJ({company:"",role:"",expMin:"",expMax:"",ctcMin:"",ctcMax:"",slots:"2",lastDate:"",desc:""});
      setPostSkills([]);
      setTab("myreferrals");
    }catch(e){setPostError("Failed to post. Try again.");}
    finally{setPosting(false);}
  };

  const handleLogout=async()=>{await signOut(auth);nav("/");};

  const counts={
    applications:apps.length,
    active:apps.filter(a=>!["Rejected","Hired"].includes(a.status)).length,
    myPosts:myPosts.filter(p=>p.status==="Active").length,
    hired:apps.filter(a=>a.status==="Hired").length,
  };

  // Days remaining for a post
  const daysLeft=(lastDate)=>{
    if(!lastDate) return null;
    const diff=Math.ceil((new Date(lastDate)-new Date())/(1000*60*60*24));
    return diff;
  };

  if(loading) return <Loader text="Loading dashboard..."/>;

  return(
    <div style={{background:BG,minHeight:"100vh",color:WT,fontFamily:"'DM Sans',sans-serif",paddingBottom:40}}>
      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(8,8,8,0.96)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BR}`,padding:"0 20px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>nav("/")} style={{background:"none",border:"none",color:MT,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>← Home</button>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,background:`linear-gradient(135deg,${G},${GL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>RaYa Jobs</span>
        <button onClick={handleLogout} style={{background:"none",border:`1px solid ${BR}`,color:MT,padding:"5px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
      </nav>

      {/* HEADER */}
      <div style={{padding:"24px 20px 0",background:`radial-gradient(ellipse 100% 60% at 50% -10%,${G}08,transparent 60%)`}}>
        <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"2px",marginBottom:4}}>DASHBOARD</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(22px,5vw,30px)",fontWeight:700,color:WT,marginBottom:4}}>
          Welcome, {user?.displayName?.split(" ")[0]||"there"} 👋
        </h1>
        <p style={{color:MT,fontSize:13,marginBottom:20}}>Find referrals, post openings, track everything.</p>

        {/* STATS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
          {[
            {icon:"📋",label:"Applied",value:counts.applications,color:G},
            {icon:"⚡",label:"Active",value:counts.active,color:"#60A5FA"},
            {icon:"📝",label:"My Posts",value:counts.myPosts,color:"#A78BFA"},
            {icon:"🏆",label:"Hired",value:counts.hired,color:"#4ADE80"},
          ].map(s=>(
            <div key={s.label} style={{background:S1,border:`1px solid ${BR}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:"clamp(14px,3vw,18px)",marginBottom:4}}>{s.icon}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(18px,4vw,24px)",fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</div>
              <div style={{color:MT,fontSize:9,marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:0,borderBottom:`1px solid ${BR}`,overflowX:"auto"}}>
          {[["applications","My Applications"],["myreferrals","My Referrals"],["postreferral","+ Post Referral"],["profile","Profile"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setTab(k);setSelectedPost(null);}} style={{background:"none",border:"none",cursor:"pointer",padding:"10px 14px",fontSize:12,fontWeight:tab===k?700:400,color:tab===k?G:MT,fontFamily:"inherit",borderBottom:`2px solid ${tab===k?G:"transparent"}`,whiteSpace:"nowrap"}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"20px",maxWidth:860,margin:"0 auto"}}>

        {/* ── MY APPLICATIONS ── */}
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
                  <div style={{padding:16}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
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
                      {app.status==="Interviewing"&&<div style={{marginTop:8,background:`${G}0F`,border:`1px solid ${G}33`,borderRadius:8,padding:"10px 12px",fontSize:12,color:"#CCC"}}>🎯 Interview in progress — prepare well!</div>}
                      {app.status==="Referred"&&<div style={{marginTop:8,background:"#0A0A1F",border:"1px solid #A78BFA44",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#A78BFA",fontWeight:600}}>🚀 Referred internally — waiting for HR to process</div>}
                    </div>
                  )}
                </div>
              );
            })}
            {apps.length>0&&(
              <button onClick={()=>nav("/browse")} style={{background:`${G}15`,border:`1px solid ${G}33`,color:G,padding:"12px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%",marginTop:4}}>
                + Apply to More Referrals
              </button>
            )}
          </div>
        )}

        {/* ── MY REFERRAL POSTS ── */}
        {tab==="myreferrals"&&!selectedPost&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"3px"}}>MY REFERRAL POSTS</div>
              <button onClick={()=>setTab("postreferral")} style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ New Post</button>
            </div>
            {myPosts.length===0?(
              <div style={{textAlign:"center",padding:"60px 0",color:MT}}>
                <div style={{fontSize:40,marginBottom:12}}>📝</div>
                <div style={{color:WT,fontSize:16,marginBottom:8}}>No referral posts yet</div>
                <div style={{fontSize:13,marginBottom:20}}>Post your company's open roles and earn your referral bonus</div>
                <button onClick={()=>setTab("postreferral")} style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Post Your First Referral →</button>
              </div>
            ):myPosts.map(post=>{
              const dl=daysLeft(post.lastDate);
              const expired=post.status==="Closed"||dl<=0;
              return(
                <div key={post.id} style={{background:S1,border:`1px solid ${expired?"#EF444422":BR}`,borderRadius:14,padding:18,marginBottom:12,opacity:expired?0.7:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,color:WT,marginBottom:6}}>{post.role}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <Badge color={expired?"#EF4444":"#4ADE80"}>{expired?"Closed":post.status}</Badge>
                        {!expired&&dl!==null&&<Badge color={dl<=3?"#EF4444":dl<=7?"#FBBF24":"#60A5FA"}>{dl}d left</Badge>}
                        <Badge color={MT}>{post.company}</Badge>
                      </div>
                    </div>
                    <div style={{background:`${G}15`,border:`1px solid ${G}33`,borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
                      <div style={{fontSize:9,color:G,fontWeight:700}}>BONUS</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,color:G}}>₹{Math.round((post.bonusMin||30000)/1000)}k</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                    {(post.skills||[]).map(s=><span key={s} style={{background:S3,border:`1px solid ${BR}`,color:"#AAA",padding:"3px 10px",borderRadius:100,fontSize:11}}>{s}</span>)}
                  </div>
                  {!expired&&(
                    <button onClick={()=>loadApplicants(post)} style={{width:"100%",background:`${G}15`,border:`1px solid ${G}33`,color:G,padding:"10px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      View Applicants →
                    </button>
                  )}
                  {expired&&(
                    <div style={{background:"#1A0A0A",border:"1px solid #EF444433",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#EF4444",fontWeight:600,textAlign:"center"}}>
                      This referral post has expired and is no longer visible to job seekers.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── APPLICANTS VIEW ── */}
        {tab==="myreferrals"&&selectedPost&&(
          <div>
            <button onClick={()=>setSelectedPost(null)} style={{background:"none",border:"none",color:MT,cursor:"pointer",fontSize:13,marginBottom:14,fontFamily:"inherit"}}>← Back to Posts</button>
            <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:12,padding:16,marginBottom:14}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:WT}}>{selectedPost.role}</div>
              <div style={{color:MT,fontSize:13,marginTop:4}}>{selectedPost.company}</div>
            </div>
            <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"3px",marginBottom:12}}>APPLICANTS</div>
            {loadingApps?<Loader text="Loading applicants..."/>:applicants.length===0?(
              <div style={{textAlign:"center",padding:"40px 0",color:MT}}>
                <div style={{fontSize:32,marginBottom:10}}>👥</div>
                <div style={{color:WT,fontSize:15}}>No applicants yet</div>
                <div style={{fontSize:13,marginTop:4}}>Share RaYa with IT professionals to get applications</div>
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
                  {app.status==="Referred"&&<div style={{background:"#0A0A1F",border:"1px solid #A78BFA44",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#A78BFA",fontWeight:600}}>🚀 Referred internally — your bonus is incoming!</div>}
                  {app.status==="Hired"&&<div style={{background:`${G}10`,border:`1px solid ${G}33`,borderRadius:8,padding:"10px 12px",fontSize:12,color:G,fontWeight:600}}>🏆 Hired — referral bonus from your company incoming!</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── POST REFERRAL ── */}
        {tab==="postreferral"&&(
          <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:16,padding:28}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:WT,marginBottom:4}}>Post a Referral</h2>
            <p style={{color:MT,fontSize:13,marginBottom:14}}>Help someone get hired and earn your referral bonus.</p>

            <div style={{background:`${G}0A`,border:`1px solid ${G}22`,borderRadius:10,padding:"10px 14px",marginBottom:20,display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:18}}>💰</span>
              <div>
                <div style={{color:G,fontWeight:700,fontSize:13}}>Est. Bonus: ₹{(bonus.min/1000).toFixed(0)}k–₹{(bonus.max/1000).toFixed(0)}k</div>
                <div style={{color:MT,fontSize:11}}>from your company when candidate joins</div>
              </div>
            </div>

            {postError&&<div style={{background:"#1A0A0A",border:"1px solid #EF444444",borderRadius:8,padding:"10px 14px",color:"#EF4444",fontSize:13,marginBottom:16}}>{postError}</div>}

            <div style={{display:"grid",gap:16}}>
              <Inp label="Your Company *" placeholder="Amazon, Cognizant, TCS…" value={j.company} onChange={e=>sj("company",e.target.value)}/>
              <Inp label="Job Title *" placeholder="Senior Java Developer" value={j.role} onChange={e=>sj("role",e.target.value)}/>
              <SkillSelector skills={postSkills} setSkills={setPostSkills}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Inp label="Min Exp (yrs)" placeholder="3" value={j.expMin} onChange={e=>sj("expMin",e.target.value)}/>
                <Inp label="Max Exp (yrs)" placeholder="7" value={j.expMax} onChange={e=>sj("expMax",e.target.value)}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Inp label="CTC Min (LPA)" placeholder="8" value={j.ctcMin} onChange={e=>sj("ctcMin",e.target.value)}/>
                <Inp label="CTC Max (LPA)" placeholder="14" value={j.ctcMax} onChange={e=>sj("ctcMax",e.target.value)}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Inp label="Referral Slots" placeholder="2" value={j.slots} onChange={e=>sj("slots",e.target.value)}/>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>Last Date *</label>
                  <input type="date" value={j.lastDate} onChange={e=>sj("lastDate",e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    style={{background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"12px 14px",color:WT,fontSize:14,outline:"none",fontFamily:"inherit"}}
                    onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BR}/>
                  <span style={{fontSize:11,color:MT}}>Post auto-closes on this date.</span>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>Job Description</label>
                <textarea placeholder="What is this role about? What are you looking for?" value={j.desc} onChange={e=>sj("desc",e.target.value)} rows={3}
                  style={{background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"12px 14px",color:WT,fontSize:14,outline:"none",fontFamily:"inherit",resize:"vertical"}}/>
              </div>
            </div>

            <button onClick={handlePostReferral} disabled={posting}
              style={{marginTop:20,width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"13px",borderRadius:8,fontSize:14,fontWeight:700,cursor:posting?"not-allowed":"pointer",fontFamily:"inherit",opacity:posting?0.7:1}}>
              {posting?"Posting...":"Post Referral ✦"}
            </button>
            <div style={{marginTop:10,fontSize:12,color:MT,textAlign:"center"}}>
              First 1 post free. Unlimited with ₹799 / 3-month plan.
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab==="profile"&&(
          <div>
            <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:14,padding:24,marginBottom:14}}>
              <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:20}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${G},${GL})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:BG,flexShrink:0}}>
                  {user?.displayName?.charAt(0)||"U"}
                </div>
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:WT}}>{user?.displayName}</div>
                  <div style={{color:MT,fontSize:13}}>{user?.email}</div>
                  <div style={{marginTop:6,display:"flex",gap:6}}>
                    <Badge color="#4ADE80">Active</Badge>
                    <Badge color={G}>Free Plan</Badge>
                  </div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
                {[["Applications",apps.length],["My Posts",myPosts.length],["Hired",counts.hired]].map(([l,v])=>(
                  <div key={l} style={{background:S2,borderRadius:8,padding:"10px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:G}}>{v}</div>
                    <div style={{color:MT,fontSize:11,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{background:`${G}10`,border:`1px solid ${G}33`,borderRadius:12,padding:"16px 18px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                <div>
                  <div style={{color:G,fontWeight:700,fontSize:14,marginBottom:2}}>Upgrade to ₹799 Plan</div>
                  <div style={{color:MT,fontSize:12}}>Unlimited applications + unlimited referral posts</div>
                </div>
                <button style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Upgrade</button>
              </div>
            </div>
            <button onClick={handleLogout} style={{width:"100%",background:"none",border:"1px solid #EF444433",color:"#EF4444",padding:"12px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
          </div>
        )}
      </div>
    </div>
  );
}
