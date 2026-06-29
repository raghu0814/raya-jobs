import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";
import Loader from "../components/Loader";

const PRIMARY="#1A2E4A",GREEN="#22C55E",BG="#F8FAFC",WHITE="#FFFFFF",BORDER="#E2E8F0",TEXT="#0F172A",MUTED="#64748B",GREENBG="#F0FDF4";

// ── ONLY these emails can access admin ──
const ADMIN_EMAILS=["raghugadupudi8@gmail.com"];

export default function Admin(){
  const nav=useNavigate();
  const user=auth.currentUser;
  const[tab,setTab]=useState("users");
  const[loading,setLoading]=useState(true);
  const[users,setUsers]=useState([]);
  const[posts,setPosts]=useState([]);
  const[apps,setApps]=useState([]);
  const[search,setSearch]=useState("");
  const[selectedUser,setSelectedUser]=useState(null);

  // Guard — only admins
  useEffect(()=>{
    if(!user){nav("/login");return;}
    if(!ADMIN_EMAILS.includes(user.email)){nav("/dashboard");return;}
    fetchAll();
  },[user]);

  const fetchAll=async()=>{
    setLoading(true);
    try{
      const[uSnap,pSnap,aSnap]=await Promise.all([
        getDocs(collection(db,"users")),
        getDocs(collection(db,"referralPosts")),
        getDocs(collection(db,"applications")),
      ]);
      const uList=uSnap.docs.map(d=>({id:d.id,...d.data()}));
      const pList=pSnap.docs.map(d=>({id:d.id,...d.data()}));
      const aList=aSnap.docs.map(d=>({id:d.id,...d.data()}));
      // Sort users by registeredAt descending
      uList.sort((a,b)=>{
        const ta=a.registeredAt?.toDate?.()?.getTime()||0;
        const tb=b.registeredAt?.toDate?.()?.getTime()||0;
        return tb-ta;
      });
      setUsers(uList);setPosts(pList);setApps(aList);
    }catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  const handleLogout=async()=>{await signOut(auth);nav("/login");};

  const fmt=(ts)=>{
    if(!ts?.toDate) return "—";
    const d=ts.toDate();
    return d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})+", "+d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
  };

  const filteredUsers=users.filter(u=>
    search===""||
    u.name?.toLowerCase().includes(search.toLowerCase())||
    u.email?.toLowerCase().includes(search.toLowerCase())||
    u.city?.toLowerCase().includes(search.toLowerCase())||
    u.primarySkill?.toLowerCase().includes(search.toLowerCase())||
    u.currentCompany?.toLowerCase().includes(search.toLowerCase())
  );

  const userPosts=(uid)=>posts.filter(p=>p.employeeId===uid);
  const userApps=(uid)=>apps.filter(a=>a.candidateId===uid);

  const stats={
    totalUsers:users.length,
    todayUsers:users.filter(u=>{
      const d=u.registeredAt?.toDate?.();
      if(!d) return false;
      const now=new Date();
      return d.toDateString()===now.toDateString();
    }).length,
    totalPosts:posts.length,
    activePosts:posts.filter(p=>p.status==="Active").length,
    totalApps:apps.length,
    cities:[...new Set(users.map(u=>u.city).filter(Boolean))],
  };

  if(loading) return <Loader text="Loading admin dashboard..."/>;

  return(
    <div style={{background:BG,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif",paddingBottom:40}}>
      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BORDER}`,padding:"0 clamp(16px,4vw,32px)",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <button onClick={()=>nav("/dashboard")} style={{background:"none",border:`1px solid ${BORDER}`,color:MUTED,cursor:"pointer",fontSize:13,fontFamily:"inherit",padding:"6px 14px",borderRadius:8,fontWeight:500}}>← Dashboard</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:8,background:"#1A2E4A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⚙️</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:PRIMARY}}>Admin Panel</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={fetchAll} style={{background:GREENBG,border:"1px solid #BBF7D0",color:"#15803D",padding:"6px 14px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>↻ Refresh</button>
          <button onClick={handleLogout} style={{background:"none",border:`1px solid ${BORDER}`,color:MUTED,padding:"6px 14px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>Logout</button>
        </div>
      </nav>

      {/* HEADER */}
      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,padding:"24px clamp(16px,4vw,32px) 0"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{fontSize:11,color:GREEN,fontWeight:700,letterSpacing:"1px",marginBottom:4}}>ADMIN DASHBOARD</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:PRIMARY,marginBottom:4}}>Rytaine Jobs — Control Panel</h1>
          <p style={{color:MUTED,fontSize:14,marginBottom:20}}>Track users, posts and applications across the platform.</p>

          {/* STATS */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
            {[
              {icon:"👥",label:"Total Users",value:stats.totalUsers,color:PRIMARY,sub:`+${stats.todayUsers} today`},
              {icon:"📝",label:"Total Posts",value:stats.totalPosts,color:"#8B5CF6",sub:`${stats.activePosts} active`},
              {icon:"📋",label:"Applications",value:stats.totalApps,color:"#3B82F6",sub:"total"},
              {icon:"🏙️",label:"Cities",value:stats.cities.length,color:GREEN,sub:"covered"},
            ].map(s=>(
              <div key={s.label} style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:12,padding:"14px",textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{color:MUTED,fontSize:10,marginTop:3,fontWeight:600,textTransform:"uppercase"}}>{s.label}</div>
                <div style={{color:GREEN,fontSize:11,marginTop:2,fontWeight:600}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div style={{display:"flex",overflowX:"auto"}}>
            {[["users",`👥 Users (${stats.totalUsers})`],["posts",`📝 Referral Posts (${stats.totalPosts})`],["apps",`📋 Applications (${stats.totalApps})`]].map(([k,l])=>(
              <button key={k} onClick={()=>{setTab(k);setSelectedUser(null);}} style={{background:"none",border:"none",cursor:"pointer",padding:"10px 16px",fontSize:13,fontWeight:tab===k?700:500,color:tab===k?GREEN:MUTED,fontFamily:"inherit",borderBottom:`2px solid ${tab===k?GREEN:"transparent"}`,whiteSpace:"nowrap"}}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{padding:"24px clamp(16px,4vw,32px)",maxWidth:1100,margin:"0 auto"}}>

        {/* SEARCH */}
        <div style={{marginBottom:16}}>
          <input placeholder="Search by name, email, city, company, skill…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"11px 16px",color:TEXT,fontSize:14,outline:"none",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
          <div style={{marginTop:8,fontSize:13,color:MUTED}}><span style={{color:PRIMARY,fontWeight:700}}>{filteredUsers.length}</span> users matching</div>
        </div>

        {/* USERS TAB */}
        {tab==="users"&&(
          <div>
            {filteredUsers.length===0?(
              <div style={{textAlign:"center",padding:"60px",color:MUTED}}>
                <div style={{fontSize:40,marginBottom:12}}>👥</div>
                <div style={{color:TEXT,fontSize:16,fontWeight:600}}>No users found</div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {filteredUsers.map(u=>{
                  const uPosts=userPosts(u.id);
                  const uApps=userApps(u.id);
                  const isExpanded=selectedUser===u.id;
                  return(
                    <div key={u.id} style={{background:WHITE,border:`1.5px solid ${isExpanded?"#86EFAC":BORDER}`,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                      {/* User row */}
                      <div style={{padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}} onClick={()=>setSelectedUser(isExpanded?null:u.id)}>
                        {/* Avatar */}
                        <div style={{width:44,height:44,borderRadius:"50%",background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:WHITE,flexShrink:0}}>
                          {u.name?.charAt(0)||"U"}
                        </div>
                        {/* Name + email */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:14,color:TEXT}}>{u.name||"—"}</div>
                          <div style={{color:MUTED,fontSize:12,marginTop:1}}>{u.email}</div>
                        </div>
                        {/* Tags */}
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {u.city&&<span style={{background:BG,border:`1px solid ${BORDER}`,color:MUTED,padding:"2px 8px",borderRadius:100,fontSize:11,fontWeight:500}}>{u.city}</span>}
                          {u.primarySkill&&<span style={{background:GREENBG,border:"1px solid #BBF7D0",color:"#15803D",padding:"2px 8px",borderRadius:100,fontSize:11,fontWeight:600}}>{u.primarySkill}</span>}
                          {u.currentCompany&&<span style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",padding:"2px 8px",borderRadius:100,fontSize:11,fontWeight:500}}>{u.currentCompany}</span>}
                        </div>
                        {/* Counters */}
                        <div style={{display:"flex",gap:10,flexShrink:0}}>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontWeight:700,color:"#8B5CF6",fontSize:16}}>{uPosts.length}</div>
                            <div style={{color:MUTED,fontSize:9,fontWeight:600}}>POSTS</div>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontWeight:700,color:"#3B82F6",fontSize:16}}>{uApps.length}</div>
                            <div style={{color:MUTED,fontSize:9,fontWeight:600}}>APPS</div>
                          </div>
                        </div>
                        <span style={{color:MUTED,fontSize:14}}>{isExpanded?"▲":"▼"}</span>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded&&(
                        <div style={{borderTop:`1px solid ${BORDER}`,background:BG,padding:"16px 18px"}}>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:16}}>
                            {[
                              ["Registered",fmt(u.registeredAt)],
                              ["Phone",u.phone||"—"],
                              ["PAN",u.pan||"—"],
                              ["Experience",u.experience||"—"],
                              ["Job Title",u.currentTitle||"—"],
                              ["Current CTC",u.currentCTC?`₹${u.currentCTC}L`:"—"],
                              ["Expected CTC",u.expectedCTC?`₹${u.expectedCTC}L`:"—"],
                              ["Notice Period",u.noticePeriod||"—"],
                              ["Job Type",u.jobType||"—"],
                              ["Status",u.status||"Active"],
                            ].map(([l,v])=>(
                              <div key={l} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 12px"}}>
                                <div style={{fontSize:10,color:MUTED,fontWeight:600,marginBottom:3,textTransform:"uppercase"}}>{l}</div>
                                <div style={{fontSize:13,color:TEXT,fontWeight:500,wordBreak:"break-all"}}>{v}</div>
                              </div>
                            ))}
                          </div>

                          {/* Skills */}
                          {(u.otherSkills?.length>0)&&(
                            <div style={{marginBottom:14}}>
                              <div style={{fontSize:11,color:MUTED,fontWeight:600,marginBottom:6,textTransform:"uppercase"}}>Other Skills</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                                {u.otherSkills.map(s=><span key={s} style={{background:BG,border:`1px solid ${BORDER}`,color:MUTED,padding:"3px 10px",borderRadius:100,fontSize:11}}>{s}</span>)}
                              </div>
                            </div>
                          )}

                          {/* Resume */}
                          {u.resumeURL&&(
                            <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                              <span style={{color:MUTED,fontSize:13}}>📄 Resume:</span>
                              <a href={u.resumeURL} target="_blank" rel="noreferrer" style={{background:GREEN,color:WHITE,padding:"6px 14px",borderRadius:7,fontSize:12,fontWeight:700,textDecoration:"none"}}>View Resume ↗</a>
                            </div>
                          )}

                          {/* User's posts */}
                          {uPosts.length>0&&(
                            <div style={{marginBottom:12}}>
                              <div style={{fontSize:11,color:MUTED,fontWeight:600,marginBottom:6,textTransform:"uppercase"}}>Referral Posts ({uPosts.length})</div>
                              {uPosts.map(p=>(
                                <div key={p.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <div>
                                    <div style={{fontWeight:600,fontSize:13,color:TEXT}}>{p.role}</div>
                                    <div style={{color:MUTED,fontSize:11,marginTop:2}}>{p.company} • {p.status}</div>
                                  </div>
                                  <span style={{background:p.status==="Active"?GREENBG:"#FEF2F2",border:`1px solid ${p.status==="Active"?"#BBF7D0":"#FECACA"}`,color:p.status==="Active"?"#15803D":"#DC2626",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:100}}>{p.status}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* User's applications */}
                          {uApps.length>0&&(
                            <div>
                              <div style={{fontSize:11,color:MUTED,fontWeight:600,marginBottom:6,textTransform:"uppercase"}}>Applications ({uApps.length})</div>
                              {uApps.map(a=>(
                                <div key={a.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <div>
                                    <div style={{fontWeight:600,fontSize:13,color:TEXT}}>{a.role}</div>
                                    <div style={{color:MUTED,fontSize:11,marginTop:2}}>{a.company}</div>
                                  </div>
                                  <span style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:100}}>{a.status}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Follow up notes area */}
                          <div style={{marginTop:14,background:GREENBG,border:"1px solid #BBF7D0",borderRadius:10,padding:"12px 14px"}}>
                            <div style={{color:"#15803D",fontWeight:700,fontSize:13,marginBottom:4}}>📞 Follow Up</div>
                            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                              <a href={`mailto:${u.email}`} style={{background:GREEN,color:WHITE,padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-block"}}>Email {u.name?.split(" ")[0]} →</a>
                              {u.phone&&<a href={`tel:${u.phone}`} style={{background:WHITE,border:`1px solid ${BORDER}`,color:PRIMARY,padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-block"}}>Call {u.phone}</a>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* POSTS TAB */}
        {tab==="posts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {posts.length===0?<div style={{textAlign:"center",padding:60,color:MUTED}}>No posts yet</div>:posts.map(p=>{
              const poster=users.find(u=>u.id===p.employeeId);
              const appCount=apps.filter(a=>a.referralPostId===p.id).length;
              return(
                <div key={p.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,color:TEXT,marginBottom:4}}>{p.role}</div>
                      <div style={{color:MUTED,fontSize:13}}>{p.company}</div>
                      {poster&&<div style={{color:MUTED,fontSize:12,marginTop:2}}>Posted by: <strong style={{color:PRIMARY}}>{poster.name}</strong> ({poster.email})</div>}
                    </div>
                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      <span style={{background:p.status==="Active"?GREENBG:"#FEF2F2",border:`1px solid ${p.status==="Active"?"#BBF7D0":"#FECACA"}`,color:p.status==="Active"?"#15803D":"#DC2626",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:100}}>{p.status}</span>
                      <span style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:100}}>{appCount} applied</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    {(p.skills||[]).map(s=><span key={s} style={{background:BG,border:`1px solid ${BORDER}`,color:MUTED,padding:"2px 10px",borderRadius:100,fontSize:11}}>{s}</span>)}
                  </div>
                  <div style={{display:"flex",gap:16,fontSize:12,color:MUTED}}>
                    {p.ctcMax>0&&<span>CTC: ₹{p.ctcMin}–{p.ctcMax}L</span>}
                    {p.expMax>0&&<span>Exp: {p.expMin}–{p.expMax} yrs</span>}
                    {p.slots&&<span>Slots: {p.slots}</span>}
                    {p.lastDate&&<span>Last: {p.lastDate}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {tab==="apps"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {apps.length===0?<div style={{textAlign:"center",padding:60,color:MUTED}}>No applications yet</div>:apps.map(a=>{
              const candidate=users.find(u=>u.id===a.candidateId);
              const employee=users.find(u=>u.id===a.employeeId);
              const statusColors={"Applied":"#3B82F6","Reviewing":"#F59E0B","Referred":"#8B5CF6","Shortlisted":GREEN,"Interviewing":"#F97316","Offered":GREEN,"Hired":GREEN,"Rejected":"#EF4444"};
              return(
                <div key={a.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:TEXT,marginBottom:4}}>{a.role} @ {a.company}</div>
                      <div style={{color:MUTED,fontSize:12}}>Candidate: <strong style={{color:PRIMARY}}>{candidate?.name||a.candidateName}</strong> ({candidate?.email||"—"})</div>
                      <div style={{color:MUTED,fontSize:12,marginTop:1}}>Employee: <strong style={{color:PRIMARY}}>{employee?.name||a.employeeName}</strong> ({employee?.email||"—"})</div>
                      <div style={{color:MUTED,fontSize:12,marginTop:1}}>Applied: {a.appliedAt?.toDate?.()?.toLocaleDateString()||"—"}</div>
                    </div>
                    <span style={{background:statusColors[a.status]+"18",border:`1px solid ${statusColors[a.status]||GREEN}44`,color:statusColors[a.status]||GREEN,fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:100,flexShrink:0}}>{a.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
