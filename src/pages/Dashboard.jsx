import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp, orderBy, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth, storage } from "../firebase/config";
import Timeline from "../components/Timeline";
import Badge from "../components/Badge";
import Loader from "../components/Loader";

const PRIMARY="#1A2E4A",GREEN="#22C55E",BG="#F8FAFC",WHITE="#FFFFFF",BORDER="#E2E8F0",TEXT="#0F172A",MUTED="#64748B",GREENBG="#F0FDF4";

const allSkills=["Java","Python","React","Angular","Vue.js","Node.js","Spring Boot","Microservices","Kafka","Docker","Kubernetes","AWS","Azure","GCP","DevOps","CI/CD","Terraform","SQL","MongoDB","PostgreSQL","Redis","Elasticsearch","SAP SD","SAP MM","SAP FICO","SAP BTP","S/4HANA","Salesforce","ServiceNow","Workday",".NET","C#","C++","Go","Rust","TypeScript","React Native","Flutter","Android","iOS","Swift","Kotlin","Machine Learning","Data Science","Power BI","Tableau","Selenium","Cypress","Jest","JUnit","Linux","Networking","Cybersecurity","Blockchain","Unity"];

const ST={"Applied":{color:"#3B82F6",icon:"📨"},"Reviewing":{color:"#F59E0B",icon:"👀"},"Referred":{color:"#8B5CF6",icon:"🚀"},"Shortlisted":{color:GREEN,icon:"✓"},"Interviewing":{color:"#F97316",icon:"🎯"},"Offered":{color:GREEN,icon:"🎉"},"Hired":{color:GREEN,icon:"🏆"},"Rejected":{color:"#EF4444",icon:"✕"}};

// ── All components defined OUTSIDE to prevent cursor/render bugs ──

const Inp=({label,placeholder,type="text",value,onChange})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:11,fontWeight:700,color:PRIMARY}}>{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"11px 14px",color:TEXT,fontSize:14,outline:"none",fontFamily:"inherit"}}
      onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
  </div>
);

function SkillSelector({skills,setSkills}){
  const[input,setInput]=useState("");
  const add=(s)=>{const v=s.trim();if(v&&!skills.includes(v))setSkills(p=>[...p,v]);};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <label style={{fontSize:11,fontWeight:700,color:PRIMARY}}>Skills Required</label>
      {skills.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {skills.map(s=>(
            <span key={s} onClick={()=>setSkills(p=>p.filter(x=>x!==s))}
              style={{background:GREENBG,border:"1px solid #BBF7D0",color:"#15803D",padding:"4px 10px",borderRadius:100,fontSize:12,cursor:"pointer",fontWeight:500}}>
              {s} ✕
            </span>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&input.trim()){add(input);setInput("");}}}
          placeholder="Type any skill and press Enter…"
          style={{flex:1,background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"10px 14px",color:TEXT,fontSize:13,outline:"none",fontFamily:"inherit"}}
          onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
        <button onClick={()=>{add(input);setInput("");}}
          style={{background:GREEN,border:"none",color:WHITE,padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {allSkills.filter(s=>!skills.includes(s)).map(s=>(
          <span key={s} onClick={()=>add(s)}
            style={{background:BG,border:`1px solid ${BORDER}`,color:MUTED,padding:"4px 10px",borderRadius:100,fontSize:11,cursor:"pointer",fontWeight:500}}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function EditSkillSelector({skills,setSkills}){
  const[input,setInput]=useState("");
  const add=(s)=>{const v=s.trim();if(v&&!skills.includes(v))setSkills(p=>[...p,v]);};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <label style={{fontSize:11,fontWeight:700,color:PRIMARY}}>Skills Required</label>
      {skills.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {skills.map(s=>(
            <span key={s} onClick={()=>setSkills(p=>p.filter(x=>x!==s))}
              style={{background:GREENBG,border:"1px solid #BBF7D0",color:"#15803D",padding:"4px 10px",borderRadius:100,fontSize:12,cursor:"pointer",fontWeight:500}}>
              {s} ✕
            </span>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&input.trim()){add(input);setInput("");}}}
          placeholder="Type any skill and press Enter…"
          style={{flex:1,background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"10px 14px",color:TEXT,fontSize:13,outline:"none",fontFamily:"inherit"}}
          onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
        <button onClick={()=>{add(input);setInput("");}}
          style={{background:GREEN,border:"none",color:WHITE,padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {allSkills.filter(s=>!skills.includes(s)).slice(0,24).map(s=>(
          <span key={s} onClick={()=>add(s)}
            style={{background:BG,border:`1px solid ${BORDER}`,color:MUTED,padding:"3px 10px",borderRadius:100,fontSize:11,cursor:"pointer",fontWeight:500}}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function CommentThread({appId,currentUser,role}){
  const[comments,setComments]=useState([]);
  const[text,setText]=useState("");
  const[sending,setSending]=useState(false);
  const bottomRef=useRef(null);

  useEffect(()=>{
    const q=query(collection(db,"applications",appId,"comments"),orderBy("createdAt","asc"));
    const unsub=onSnapshot(q,(snap)=>{setComments(snap.docs.map(d=>({id:d.id,...d.data()})));});
    return()=>unsub();
  },[appId]);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[comments]);

  const handleSend=async()=>{
    if(!text.trim()) return;
    setSending(true);
    try{
      await addDoc(collection(db,"applications",appId,"comments"),{
        text:text.trim(),authorId:currentUser.uid,
        authorName:currentUser.displayName,
        authorRole:role,createdAt:serverTimestamp()
      });
      setText("");
    }catch(e){console.error(e);}
    finally{setSending(false);}
  };

  const fmt=(ts)=>{
    if(!ts?.toDate) return "";
    const d=ts.toDate();
    return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"})+", "+d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
  };

  return(
    <div style={{borderTop:`1px solid ${BORDER}`,marginTop:4}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px 8px"}}>
        <span style={{fontSize:14}}>💬</span>
        <span style={{fontSize:11,fontWeight:700,color:PRIMARY,letterSpacing:"0.5px"}}>UPDATES & COMMENTS</span>
        {comments.length>0&&<span style={{background:GREENBG,border:"1px solid #BBF7D0",color:"#15803D",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:100}}>{comments.length}</span>}
      </div>
      <div style={{maxHeight:280,overflowY:"auto",padding:"4px 16px 8px",display:"flex",flexDirection:"column",gap:10}}>
        {comments.length===0&&<div style={{textAlign:"center",padding:"16px 0",color:MUTED,fontSize:13}}>No updates yet. Add the first comment below.</div>}
        {comments.map(c=>{
          const isMe=c.authorId===currentUser.uid;
          return(
            <div key={c.id} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
              <div style={{fontSize:11,color:MUTED,marginBottom:3,display:"flex",gap:4,alignItems:"center"}}>
                <span style={{fontWeight:600,color:c.authorRole==="candidate"?"#3B82F6":"#8B5CF6"}}>{c.authorName}</span>
                <span>•</span><span>{c.authorRole==="candidate"?"Job Seeker":"Employee"}</span>
                <span>•</span><span>{fmt(c.createdAt)}</span>
              </div>
              <div style={{maxWidth:"82%",background:isMe?GREENBG:WHITE,border:`1px solid ${isMe?"#BBF7D0":BORDER}`,borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"10px 14px",fontSize:13,color:TEXT,lineHeight:1.6,wordBreak:"break-word"}}>{c.text}</div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"10px 16px 14px",borderTop:`1px solid ${BORDER}`}}>
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
            placeholder="Add an update or ask a question… (Enter to send)"
            rows={2}
            style={{flex:1,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"10px 14px",color:TEXT,fontSize:13,outline:"none",fontFamily:"inherit",resize:"none",lineHeight:1.5}}
            onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
          <button onClick={handleSend} disabled={sending||!text.trim()}
            style={{background:text.trim()?GREEN:"#E2E8F0",border:"none",color:text.trim()?WHITE:MUTED,padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:700,cursor:text.trim()?"pointer":"not-allowed",fontFamily:"inherit",flexShrink:0}}>
            {sending?"...":"Send"}
          </button>
        </div>
        <div style={{fontSize:11,color:MUTED,marginTop:5}}>Enter to send • Shift+Enter for new line</div>
      </div>
    </div>
  );
}

function daysLeft(lastDate){
  if(!lastDate) return null;
  return Math.ceil((new Date(lastDate)-new Date())/(1000*60*60*24));
}

export default function Dashboard(){
  const nav=useNavigate();
  const user=auth.currentUser;
  const[tab,setTab]=useState("applications");
  const[loading,setLoading]=useState(true);
  const[apps,setApps]=useState([]);
  const[expanded,setExpanded]=useState(null);
  const[myPosts,setMyPosts]=useState([]);
  const[selectedPost,setSelectedPost]=useState(null);
  const[applicants,setApplicants]=useState([]);
  const[expandedApp,setExpandedApp]=useState(null);
  const[loadingApps,setLoadingApps]=useState(false);
  const[posting,setPosting]=useState(false);
  const[postError,setPostError]=useState("");
  const[postSkills,setPostSkills]=useState([]);
  const[j,setJ]=useState({company:"",role:"",expMin:"",expMax:"",ctcMin:"",ctcMax:"",slots:"",lastDate:"",desc:""});
  const sj=(k,v)=>setJ(p=>({...p,[k]:v}));
  const[editPost,setEditPost]=useState(null);
  const[editForm,setEditForm]=useState({});
  const[editSkills,setEditSkills]=useState([]);
  const[editSaving,setEditSaving]=useState(false);
  const[editError,setEditError]=useState("");
  const[userProfile,setUserProfile]=useState(null);
  const[resumeUploading,setResumeUploading]=useState(false);
  const[resumeMsg,setResumeMsg]=useState("");

  useEffect(()=>{
    if(!user){nav("/login");return;}
    const fetchAll=async()=>{
      try{
        const[aSnap,pSnap,uSnap]=await Promise.all([
          getDocs(query(collection(db,"applications"),where("candidateId","==",user.uid))),
          getDocs(query(collection(db,"referralPosts"),where("employeeId","==",user.uid))),
          getDoc(doc(db,"users",user.uid))
        ]);
        setApps(aSnap.docs.map(d=>({id:d.id,...d.data()})));
        if(uSnap.exists()) setUserProfile(uSnap.data());
        const posts=pSnap.docs.map(d=>({id:d.id,...d.data()}));
        const today=new Date();
        const postsWithCounts=await Promise.all(posts.map(async(p)=>{
          if(p.lastDate&&new Date(p.lastDate)<today&&p.status==="Active"){
            await updateDoc(doc(db,"referralPosts",p.id),{status:"Closed"});
            p.status="Closed";
          }
          try{const s=await getDocs(query(collection(db,"applications"),where("referralPostId","==",p.id)));return{...p,appCount:s.size};}
          catch{return{...p,appCount:0};}
        }));
        setMyPosts(postsWithCounts);
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
      const list=snap.docs.map(d=>({id:d.id,...d.data()}));
      setApplicants(list);
      setMyPosts(p=>p.map(x=>x.id===post.id?{...x,appCount:list.length}:x));
    }catch(e){console.error(e);}
    finally{setLoadingApps(false);}
  };

  const updateAppStatus=async(appId,status)=>{
    await updateDoc(doc(db,"applications",appId),{status});
    setApplicants(p=>p.map(a=>a.id===appId?{...a,status}:a));
  };

  const handlePostReferral=async()=>{
    if(!j.company||!j.role){setPostError("Company and role are required");return;}
    if(!j.lastDate){setPostError("Please set a last date");return;}
    if(new Date(j.lastDate)<new Date()){setPostError("Last date must be in the future");return;}
    setPosting(true);setPostError("");
    try{
      const newRef=await addDoc(collection(db,"referralPosts"),{
        employeeId:user.uid,employeeName:user.displayName,
        company:j.company,designation:"Employee",role:j.role,skills:postSkills,
        expMin:j.expMin?Number(j.expMin):0,expMax:j.expMax?Number(j.expMax):0,
        ctcMin:j.ctcMin?Number(j.ctcMin):0,ctcMax:j.ctcMax?Number(j.ctcMax):0,
        slots:j.slots?Number(j.slots):2,description:j.desc,
        status:"Active",lastDate:j.lastDate,postedAt:serverTimestamp()
      });
      setMyPosts(p=>[{id:newRef.id,employeeId:user.uid,employeeName:user.displayName,status:"Active",...j,skills:postSkills,appCount:0},...p]);
      setJ({company:"",role:"",expMin:"",expMax:"",ctcMin:"",ctcMax:"",slots:"",lastDate:"",desc:""});
      setPostSkills([]);setTab("myreferrals");
    }catch(e){setPostError("Failed to post. Try again.");}
    finally{setPosting(false);}
  };

  const openEdit=(post)=>{
    setEditForm({role:post.role||"",company:post.company||"",expMin:post.expMin||"",expMax:post.expMax||"",ctcMin:post.ctcMin||"",ctcMax:post.ctcMax||"",slots:post.slots||"",lastDate:post.lastDate||"",desc:post.description||""});
    setEditSkills(post.skills||[]);setEditPost(post);setEditError("");
  };

  const handleSaveEdit=async()=>{
    if(!editForm.role||!editForm.company){setEditError("Company and role are required");return;}
    if(!editForm.lastDate){setEditError("Please set a last date");return;}
    if(new Date(editForm.lastDate)<new Date()){setEditError("Last date must be in the future");return;}
    setEditSaving(true);setEditError("");
    try{
      await updateDoc(doc(db,"referralPosts",editPost.id),{
        role:editForm.role,company:editForm.company,skills:editSkills,
        expMin:editForm.expMin?Number(editForm.expMin):0,expMax:editForm.expMax?Number(editForm.expMax):0,
        ctcMin:editForm.ctcMin?Number(editForm.ctcMin):0,ctcMax:editForm.ctcMax?Number(editForm.ctcMax):0,
        slots:editForm.slots?Number(editForm.slots):2,lastDate:editForm.lastDate,description:editForm.desc,
      });
      setMyPosts(p=>p.map(x=>x.id===editPost.id?{...x,...editForm,skills:editSkills,slots:editForm.slots?Number(editForm.slots):2}:x));
      setEditPost(null);
    }catch(e){setEditError("Failed to save. Try again.");}
    finally{setEditSaving(false);}
  };

  const handleResumeUpload=async(file)=>{
    if(!file) return;
    setResumeUploading(true);setResumeMsg("");
    try{
      const storageRef=ref(storage,`resumes/${user.uid}/${file.name}`);
      await uploadBytes(storageRef,file);
      const url=await getDownloadURL(storageRef);
      await updateDoc(doc(db,"users",user.uid),{resumeURL:url,resumeName:file.name});
      setUserProfile(p=>({...p,resumeURL:url,resumeName:file.name}));
      setResumeMsg("✓ Resume uploaded successfully");
    }catch(e){setResumeMsg("Upload failed. Try again.");}
    finally{setResumeUploading(false);}
  };

  const handleResumeDelete=async()=>{
    setResumeUploading(true);setResumeMsg("");
    try{
      try{await deleteObject(ref(storage,`resumes/${user.uid}/${userProfile.resumeName||"resume.pdf"}`));}catch{}
      await updateDoc(doc(db,"users",user.uid),{resumeURL:"",resumeName:""});
      setUserProfile(p=>({...p,resumeURL:"",resumeName:""}));
      setResumeMsg("Resume deleted.");
    }catch(e){setResumeMsg("Delete failed. Try again.");}
    finally{setResumeUploading(false);}
  };

  const handleLogout=async()=>{await signOut(auth);nav("/login");};

  const counts={applications:apps.length,active:apps.filter(a=>!["Rejected","Hired"].includes(a.status)).length,myPosts:myPosts.filter(p=>p.status==="Active").length,hired:apps.filter(a=>a.status==="Hired").length};

  if(loading) return <Loader text="Loading dashboard..."/>;

  const Card=({children,style={}})=>(
    <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)",...style}}>{children}</div>
  );

  return(
    <div style={{background:BG,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif",paddingBottom:40}}>
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BORDER}`,padding:"0 clamp(16px,4vw,32px)",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <button onClick={()=>nav("/")} style={{background:"none",border:`1px solid ${BORDER}`,color:MUTED,cursor:"pointer",fontSize:13,fontFamily:"inherit",padding:"6px 14px",borderRadius:8,fontWeight:500}}>← Home</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:8,background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤝</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:PRIMARY}}>Rytaine Jobs</span>
        </div>
        <button onClick={handleLogout} style={{background:"none",border:`1px solid ${BORDER}`,color:MUTED,padding:"6px 14px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>Logout</button>
      </nav>

      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,padding:"24px clamp(16px,4vw,32px) 0",boxShadow:"0 1px 3px rgba(0,0,0,0.03)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{fontSize:11,color:GREEN,fontWeight:700,letterSpacing:"1px",marginBottom:4}}>DASHBOARD</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,5vw,30px)",fontWeight:700,color:PRIMARY,marginBottom:4}}>Welcome, {user?.displayName?.split(" ")[0]||"there"} 👋</h1>
          <p style={{color:MUTED,fontSize:14,marginBottom:20}}>Find referrals, post openings, track everything.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
            {[{icon:"📋",label:"Applied",value:counts.applications,color:PRIMARY},{icon:"⚡",label:"Active",value:counts.active,color:"#3B82F6"},{icon:"📝",label:"My Posts",value:counts.myPosts,color:"#8B5CF6"},{icon:"🏆",label:"Hired",value:counts.hired,color:GREEN}].map(s=>(
              <div key={s.label} style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
                <div style={{fontSize:"clamp(14px,3vw,20px)",marginBottom:4}}>{s.icon}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(20px,4vw,28px)",fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{color:MUTED,fontSize:10,marginTop:3,fontWeight:500}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:0,overflowX:"auto"}}>
            {[["applications","My Applications"],["myreferrals","My Referrals"],["postreferral","+ Post Referral"],["profile","Profile"]].map(([k,l])=>(
              <button key={k} onClick={()=>{setTab(k);setSelectedPost(null);}} style={{background:"none",border:"none",cursor:"pointer",padding:"10px 16px",fontSize:13,fontWeight:tab===k?700:500,color:tab===k?GREEN:MUTED,fontFamily:"inherit",borderBottom:`2px solid ${tab===k?GREEN:"transparent"}`,whiteSpace:"nowrap",transition:"all 0.2s"}}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{padding:"24px clamp(16px,4vw,32px)",maxWidth:900,margin:"0 auto"}}>

        {/* MY APPLICATIONS */}
        {tab==="applications"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:10,padding:"10px 14px",display:"flex",gap:8,alignItems:"center",fontSize:13,color:"#15803D"}}>
              <span>💬</span><span>Click any application to <strong>add updates or ask questions</strong> directly to the employee.</span>
            </div>
            {apps.length===0?(
              <Card><div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{fontSize:48,marginBottom:14}}>📋</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:PRIMARY,marginBottom:8}}>No applications yet</div>
                <div style={{fontSize:14,color:MUTED,marginBottom:20}}>Browse referrals and apply to get started</div>
                <button onClick={()=>nav("/browse")} style={{background:GREEN,border:"none",color:WHITE,padding:"12px 24px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Browse Referrals →</button>
              </div></Card>
            ):apps.map(app=>{
              const cfg=ST[app.status]||ST["Applied"];
              const isOpen=expanded===app.id;
              return(
                <Card key={app.id} style={{border:`1.5px solid ${isOpen?"#86EFAC":BORDER}`}}>
                  <div style={{padding:"16px 18px",cursor:"pointer"}} onClick={()=>setExpanded(isOpen?null:app.id)}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:15,color:TEXT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{app.role}</div>
                        <div style={{color:MUTED,fontSize:13,marginTop:2}}>{app.company}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <Badge color={cfg.color}>{cfg.icon} {app.status}</Badge>
                        <span style={{color:MUTED}}>{isOpen?"▲":"▼"}</span>
                      </div>
                    </div>
                    <Timeline status={app.status}/>
                  </div>
                  {isOpen&&(
                    <div style={{borderTop:`1px solid ${BORDER}`,background:BG}}>
                      <div style={{padding:"10px 18px 12px",display:"flex",gap:20,flexWrap:"wrap"}}>
                        <div style={{fontSize:13,color:MUTED}}>Applied: <strong style={{color:TEXT}}>{app.appliedAt?.toDate?.()?.toLocaleDateString()||"Recently"}</strong></div>
                        {app.employeeName&&<div style={{fontSize:13,color:MUTED}}>Referred by: <strong style={{color:TEXT}}>{app.employeeName}</strong></div>}
                      </div>
                      {app.status==="Referred"&&<div style={{margin:"0 18px 12px",background:GREENBG,border:"1px solid #BBF7D0",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#15803D"}}>🚀 Referred internally — use comments below to stay updated.</div>}
                      {app.status==="Rejected"&&<div style={{margin:"0 18px 12px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#DC2626"}}>Don't give up — keep applying! 💪</div>}
                      <CommentThread appId={app.id} currentUser={user} role="candidate"/>
                    </div>
                  )}
                </Card>
              );
            })}
            {apps.length>0&&<button onClick={()=>nav("/browse")} style={{background:GREENBG,border:"1px solid #BBF7D0",color:"#15803D",padding:"12px",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>+ Apply to More Referrals</button>}
          </div>
        )}

        {/* MY REFERRAL POSTS */}
        {tab==="myreferrals"&&!selectedPost&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:11,color:PRIMARY,fontWeight:700,letterSpacing:"1px"}}>MY REFERRAL POSTS</div>
              <button onClick={()=>setTab("postreferral")} style={{background:GREEN,border:"none",color:WHITE,padding:"9px 18px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ New Post</button>
            </div>
            {myPosts.length===0?(
              <Card><div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{fontSize:48,marginBottom:14}}>📝</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:PRIMARY,marginBottom:8}}>No referral posts yet</div>
                <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:10,padding:"12px 16px",margin:"0 auto 20px",maxWidth:380,fontSize:13,color:"#15803D",lineHeight:1.7}}>
                  💡 Your company already has a referral programme. Rytaine helps you find the right candidate faster.
                </div>
                <button onClick={()=>setTab("postreferral")} style={{background:GREEN,border:"none",color:WHITE,padding:"12px 24px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Post Your First Referral →</button>
              </div></Card>
            ):myPosts.map(post=>{
              const dl=daysLeft(post.lastDate);
              const expired=post.status==="Closed"||(dl!==null&&dl<=0);
              return(
                <Card key={post.id} style={{marginBottom:12,opacity:expired?0.75:1}}>
                  <div style={{padding:"18px 18px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:15,color:TEXT,marginBottom:8}}>{post.role}</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          <Badge color={expired?"#EF4444":GREEN}>{expired?"Closed":"Active"}</Badge>
                          {!expired&&dl!==null&&<Badge color={dl<=3?"#EF4444":dl<=7?"#F59E0B":"#3B82F6"}>{dl}d left</Badge>}
                          <Badge color={MUTED}>{post.company}</Badge>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8,flexShrink:0,marginLeft:12}}>
                        <div style={{textAlign:"center",background:BG,border:`1px solid ${BORDER}`,borderRadius:10,padding:"8px 14px"}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:PRIMARY,lineHeight:1}}>{post.slots||2}</div>
                          <div style={{color:MUTED,fontSize:10,marginTop:2,fontWeight:500}}>slots</div>
                        </div>
                        <div style={{textAlign:"center",background:post.appCount>0?GREENBG:BG,border:`1px solid ${post.appCount>0?"#BBF7D0":BORDER}`,borderRadius:10,padding:"8px 14px"}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:post.appCount>0?GREEN:MUTED,lineHeight:1}}>{post.appCount||0}</div>
                          <div style={{color:MUTED,fontSize:10,marginTop:2,fontWeight:500}}>applied</div>
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                      {(post.skills||[]).map(s=><span key={s} style={{background:BG,border:`1px solid ${BORDER}`,color:MUTED,padding:"3px 10px",borderRadius:100,fontSize:11,fontWeight:500}}>{s}</span>)}
                    </div>
                    {!expired?(
                      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8}}>
                        <button onClick={()=>loadApplicants(post)} style={{background:GREENBG,border:"1px solid #BBF7D0",color:"#15803D",padding:"10px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View Applicants →</button>
                        <button onClick={()=>openEdit(post)} style={{background:WHITE,border:`1.5px solid ${BORDER}`,color:PRIMARY,padding:"10px 16px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>
                      </div>
                    ):(
                      <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:9,padding:"10px",fontSize:13,color:"#DC2626",textAlign:"center"}}>
                        This post has expired and is no longer visible to job seekers.
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* APPLICANTS */}
        {tab==="myreferrals"&&selectedPost&&(
          <div>
            <button onClick={()=>{setSelectedPost(null);setExpandedApp(null);}} style={{background:"none",border:`1px solid ${BORDER}`,color:MUTED,cursor:"pointer",fontSize:13,marginBottom:16,fontFamily:"inherit",padding:"7px 16px",borderRadius:8,fontWeight:500}}>← Back to Posts</button>
            <Card style={{marginBottom:16}}><div style={{padding:"16px 18px"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:PRIMARY}}>{selectedPost.role}</div>
              <div style={{color:MUTED,fontSize:13,marginTop:4}}>{selectedPost.company}</div>
            </div></Card>
            <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#15803D",display:"flex",gap:8}}>
              <span>💬</span><span>Click any applicant to <strong>view updates and send messages</strong>.</span>
            </div>
            <div style={{fontSize:11,color:PRIMARY,fontWeight:700,letterSpacing:"1px",marginBottom:12}}>APPLICANTS</div>
            {loadingApps?<Loader text="Loading..."/>:applicants.length===0?(
              <Card><div style={{textAlign:"center",padding:"40px 20px",color:MUTED}}><div style={{fontSize:36,marginBottom:10}}>👥</div><div style={{color:TEXT,fontSize:15,fontWeight:600}}>No applicants yet</div></div></Card>
            ):applicants.map(app=>{
              const cfg=ST[app.status]||ST["Applied"];
              const isOpen=expandedApp===app.id;
              return(
                <Card key={app.id} style={{marginBottom:10,border:`1.5px solid ${isOpen?"#86EFAC":BORDER}`}}>
                  <div style={{padding:"16px 18px",cursor:"pointer"}} onClick={()=>setExpandedApp(isOpen?null:app.id)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:TEXT}}>{app.candidateName||"Candidate"}</div>
                        <div style={{color:MUTED,fontSize:12,marginTop:2}}>Applied {app.appliedAt?.toDate?.()?.toLocaleDateString()||"Recently"}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <Badge color={cfg.color}>{cfg.icon} {app.status}</Badge>
                        <span style={{color:MUTED}}>{isOpen?"▲":"▼"}</span>
                      </div>
                    </div>
                    {app.status!=="Referred"&&app.status!=="Hired"&&(
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}} onClick={e=>e.stopPropagation()}>
                        {[{l:"✓ Shortlist",a:"Shortlisted",c:GREEN,bg:GREENBG,b:"#BBF7D0"},{l:"🚀 Refer",a:"Referred",c:"#8B5CF6",bg:"#F5F3FF",b:"#DDD6FE"},{l:"✕ Reject",a:"Rejected",c:"#EF4444",bg:"#FEF2F2",b:"#FECACA"}].map(btn=>(
                          <button key={btn.a} onClick={()=>updateAppStatus(app.id,btn.a)} style={{background:btn.bg,border:`1px solid ${btn.b}`,color:btn.c,padding:"9px 6px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{btn.l}</button>
                        ))}
                      </div>
                    )}
                    {app.status==="Referred"&&<div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#8B5CF6"}}>🚀 Referred — HR team will take it from here.</div>}
                    {app.status==="Hired"&&<div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#15803D"}}>🏆 Hired! Check with HR about your referral reward.</div>}
                  </div>
                  {isOpen&&<div style={{borderTop:`1px solid ${BORDER}`,background:BG}}><CommentThread appId={app.id} currentUser={user} role="employee"/></div>}
                </Card>
              );
            })}
          </div>
        )}

        {/* POST REFERRAL */}
        {tab==="postreferral"&&(
          <Card><div style={{padding:28}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:PRIMARY,marginBottom:4}}>Post a Referral</h2>
            <p style={{color:MUTED,fontSize:14,marginBottom:16}}>Help someone get hired through your company's referral programme.</p>
            <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:10,padding:"12px 14px",marginBottom:20,display:"flex",gap:10}}>
              <span style={{fontSize:18,flexShrink:0}}>💡</span>
              <div>
                <div style={{color:"#15803D",fontWeight:700,fontSize:13,marginBottom:4}}>Why post on Rytaine?</div>
                <div style={{color:MUTED,fontSize:13,lineHeight:1.7}}>Your company already rewards you when someone you refer gets hired. Rytaine helps you find the right candidate faster — so your referral actually succeeds.</div>
              </div>
            </div>
            {postError&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",color:"#DC2626",fontSize:13,marginBottom:16}}>{postError}</div>}
            <div style={{display:"grid",gap:16}}>
              <Inp label="Your Company *" placeholder="Amazon, Cognizant, TCS…" value={j.company} onChange={e=>sj("company",e.target.value)}/>
              <Inp label="Job Title *" placeholder="Senior Java Developer" value={j.role} onChange={e=>sj("role",e.target.value)}/>
              <SkillSelector skills={postSkills} setSkills={setPostSkills}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Inp label="Min Exp (yrs)" placeholder="e.g. 3" value={j.expMin} onChange={e=>sj("expMin",e.target.value)}/>
                <Inp label="Max Exp (yrs)" placeholder="e.g. 7" value={j.expMax} onChange={e=>sj("expMax",e.target.value)}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Inp label="CTC Min (LPA)" placeholder="e.g. 8" value={j.ctcMin} onChange={e=>sj("ctcMin",e.target.value)}/>
                <Inp label="CTC Max (LPA)" placeholder="e.g. 14" value={j.ctcMax} onChange={e=>sj("ctcMax",e.target.value)}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Inp label="Referral Slots" placeholder="e.g. 2" value={j.slots} onChange={e=>sj("slots",e.target.value)}/>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:PRIMARY}}>Last Date *</label>
                  <input type="date" value={j.lastDate} onChange={e=>sj("lastDate",e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    style={{background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"11px 14px",color:TEXT,fontSize:14,outline:"none",fontFamily:"inherit"}}
                    onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
                  <span style={{fontSize:11,color:MUTED}}>Post auto-closes on this date.</span>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:11,fontWeight:700,color:PRIMARY}}>Job Description</label>
                <textarea placeholder="Describe the role and what you're looking for…" value={j.desc} onChange={e=>sj("desc",e.target.value)} rows={4}
                  style={{background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"11px 14px",color:TEXT,fontSize:14,outline:"none",fontFamily:"inherit",resize:"vertical",lineHeight:1.6}}
                  onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
            </div>
            <button onClick={handlePostReferral} disabled={posting}
              style={{marginTop:20,width:"100%",background:GREEN,border:"none",color:WHITE,padding:"13px",borderRadius:10,fontSize:15,fontWeight:700,cursor:posting?"not-allowed":"pointer",fontFamily:"inherit",opacity:posting?0.7:1}}>
              {posting?"Posting...":"Post Referral ✦"}
            </button>
          </div></Card>
        )}

        {/* PROFILE */}
        {tab==="profile"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Card><div style={{padding:24}}>
              <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:20}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:24,color:WHITE,flexShrink:0}}>
                  {user?.displayName?.charAt(0)||"U"}
                </div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:PRIMARY}}>{user?.displayName}</div>
                  <div style={{color:MUTED,fontSize:13,marginTop:2}}>{user?.email}</div>
                  <div style={{marginTop:6}}><Badge color={GREEN}>Active</Badge></div>
                </div>
              </div>
              {userProfile&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:20,padding:"14px",background:BG,borderRadius:10,border:`1px solid ${BORDER}`}}>
                  {[["Experience",userProfile.experience],["Current Company",userProfile.currentCompany],["Job Title",userProfile.currentTitle],["City",userProfile.city],["Primary Skill",userProfile.primarySkill],["Notice Period",userProfile.noticePeriod]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l}>
                      <div style={{fontSize:10,color:MUTED,fontWeight:600,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.5px"}}>{l}</div>
                      <div style={{fontSize:13,color:TEXT,fontWeight:500}}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {[["Applications",apps.length],["My Posts",myPosts.length],["Hired",counts.hired]].map(([l,v])=>(
                  <div key={l} style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:PRIMARY}}>{v}</div>
                    <div style={{color:MUTED,fontSize:12,marginTop:2,fontWeight:500}}>{l}</div>
                  </div>
                ))}
              </div>
            </div></Card>

            {/* RESUME */}
            <Card><div style={{padding:24}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:PRIMARY,marginBottom:4}}>Resume</div>
              <p style={{color:MUTED,fontSize:13,marginBottom:16}}>Upload, view or update your resume. Employees will see this when you apply.</p>
              {resumeMsg&&(
                <div style={{background:resumeMsg.startsWith("✓")?GREENBG:"#FEF2F2",border:`1px solid ${resumeMsg.startsWith("✓")?"#BBF7D0":"#FECACA"}`,borderRadius:8,padding:"10px 14px",color:resumeMsg.startsWith("✓")?"#15803D":"#DC2626",fontSize:13,marginBottom:14}}>
                  {resumeMsg}
                </div>
              )}
              {userProfile?.resumeURL?(
                <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                  <div style={{width:44,height:44,borderRadius:10,background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📄</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,color:TEXT,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userProfile.resumeName||"resume.pdf"}</div>
                    <div style={{color:MUTED,fontSize:12,marginTop:2}}>Uploaded • PDF</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <a href={userProfile.resumeURL} target="_blank" rel="noreferrer" style={{background:GREEN,border:"none",color:WHITE,padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textDecoration:"none",display:"inline-block"}}>View ↗</a>
                    <label style={{background:WHITE,border:`1px solid ${BORDER}`,color:PRIMARY,padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      <input type="file" accept=".pdf" onChange={e=>e.target.files[0]&&handleResumeUpload(e.target.files[0])} style={{display:"none"}}/>Replace
                    </label>
                    <button onClick={handleResumeDelete} disabled={resumeUploading} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                  </div>
                </div>
              ):(
                <label style={{border:`2px dashed ${BORDER}`,borderRadius:12,padding:28,textAlign:"center",cursor:"pointer",background:BG,display:"block"}}>
                  <input type="file" accept=".pdf" onChange={e=>e.target.files[0]&&handleResumeUpload(e.target.files[0])} style={{display:"none"}}/>
                  <div style={{fontSize:36,marginBottom:10}}>{resumeUploading?"⏳":"📄"}</div>
                  <div style={{color:TEXT,fontSize:14,fontWeight:600,marginBottom:4}}>{resumeUploading?"Uploading...":"Click to upload your Resume"}</div>
                  <div style={{color:MUTED,fontSize:12}}>PDF only • Max 5MB</div>
                </label>
              )}
            </div></Card>

            <button onClick={handleLogout} style={{width:"100%",background:"none",border:"1.5px solid #FECACA",color:"#DC2626",padding:"12px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
          </div>
        )}
      </div>

      {/* EDIT POST MODAL */}
      {editPost&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={e=>e.target===e.currentTarget&&setEditPost(null)}>
          <div style={{background:WHITE,borderRadius:20,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:WHITE,zIndex:10}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:PRIMARY}}>Edit Referral Post</div>
                <div style={{color:MUTED,fontSize:13,marginTop:2}}>{editPost.company} — {editPost.role}</div>
              </div>
              <button onClick={()=>setEditPost(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:MUTED}}>✕</button>
            </div>
            <div style={{padding:"20px 24px"}}>
              {editError&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",color:"#DC2626",fontSize:13,marginBottom:16}}>{editError}</div>}
              <div style={{display:"grid",gap:16}}>
                <Inp label="Company *" placeholder="Amazon, Cognizant…" value={editForm.company||""} onChange={e=>setEditForm(p=>({...p,company:e.target.value}))}/>
                <Inp label="Job Title *" placeholder="Senior Java Developer" value={editForm.role||""} onChange={e=>setEditForm(p=>({...p,role:e.target.value}))}/>
                <EditSkillSelector skills={editSkills} setSkills={setEditSkills}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Inp label="Min Exp (yrs)" placeholder="e.g. 3" value={editForm.expMin||""} onChange={e=>setEditForm(p=>({...p,expMin:e.target.value}))}/>
                  <Inp label="Max Exp (yrs)" placeholder="e.g. 7" value={editForm.expMax||""} onChange={e=>setEditForm(p=>({...p,expMax:e.target.value}))}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Inp label="CTC Min (LPA)" placeholder="e.g. 8" value={editForm.ctcMin||""} onChange={e=>setEditForm(p=>({...p,ctcMin:e.target.value}))}/>
                  <Inp label="CTC Max (LPA)" placeholder="e.g. 14" value={editForm.ctcMax||""} onChange={e=>setEditForm(p=>({...p,ctcMax:e.target.value}))}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Inp label="Referral Slots" placeholder="e.g. 2" value={editForm.slots||""} onChange={e=>setEditForm(p=>({...p,slots:e.target.value}))}/>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <label style={{fontSize:11,fontWeight:700,color:PRIMARY}}>Last Date *</label>
                    <input type="date" value={editForm.lastDate||""} onChange={e=>setEditForm(p=>({...p,lastDate:e.target.value}))}
                      min={new Date().toISOString().split("T")[0]}
                      style={{background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"11px 14px",color:TEXT,fontSize:14,outline:"none",fontFamily:"inherit"}}
                      onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:PRIMARY}}>Job Description</label>
                  <textarea placeholder="Describe the role…" value={editForm.desc||""} onChange={e=>setEditForm(p=>({...p,desc:e.target.value}))} rows={3}
                    style={{background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"11px 14px",color:TEXT,fontSize:14,outline:"none",fontFamily:"inherit",resize:"vertical"}}
                    onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
                </div>
              </div>
            </div>
            <div style={{padding:"16px 24px",borderTop:`1px solid ${BORDER}`,display:"flex",gap:10,position:"sticky",bottom:0,background:WHITE}}>
              <button onClick={()=>setEditPost(null)} style={{flex:1,background:"none",border:`1.5px solid ${BORDER}`,color:MUTED,padding:"12px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={editSaving}
                style={{flex:2,background:GREEN,border:"none",color:WHITE,padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:editSaving?"not-allowed":"pointer",fontFamily:"inherit",opacity:editSaving?0.7:1}}>
                {editSaving?"Saving...":"Save Changes ✓"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
