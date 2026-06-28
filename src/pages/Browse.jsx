import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import Loader from "../components/Loader";
import Badge from "../components/Badge";

const PRIMARY="#1A2E4A",GREEN="#22C55E",BG="#F8FAFC",WHITE="#FFFFFF",BORDER="#E2E8F0",TEXT="#0F172A",MUTED="#64748B",GREENBG="#F0FDF4";

function groupPosts(posts){
  const map={};
  for(const post of posts){
    const key=`${post.company}__${(post.role||"").toLowerCase().trim()}`;
    if(!map[key]) map[key]={key,company:post.company,role:post.role,skills:post.skills||[],ctcMin:post.ctcMin,ctcMax:post.ctcMax,expMin:post.expMin,expMax:post.expMax,city:post.city||"India",posts:[],totalSlots:0,description:post.description||""};
    map[key].posts.push(post);
    map[key].totalSlots+=(post.slots||1);
    map[key].ctcMin=Math.min(map[key].ctcMin||post.ctcMin||0,post.ctcMin||0);
    map[key].ctcMax=Math.max(map[key].ctcMax||post.ctcMax||0,post.ctcMax||0);
    for(const s of(post.skills||[])){if(!map[key].skills.includes(s))map[key].skills.push(s);}
    if(!map[key].description&&post.description) map[key].description=post.description;
  }
  return Object.values(map);
}

function pickBest(posts){return [...posts].sort((a,b)=>(b.slots||1)-(a.slots||1))[0];}

export default function Browse(){
  const nav=useNavigate();
  const[groups,setGroups]=useState([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState("");
  const[company,setCompany]=useState("All");
  const[skill,setSkill]=useState("All Skills");
  const[selected,setSelected]=useState(null);
  const[applying,setApplying]=useState(false);
  const[applied,setApplied]=useState(false);
  const[appliedKeys,setAppliedKeys]=useState(new Set());

  useEffect(()=>{
    const fetch=async()=>{
      try{
        const q=query(collection(db,"referralPosts"),where("status","==","Active"));
        const snap=await getDocs(q);
        const today=new Date();
        const posts=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>!p.lastDate||new Date(p.lastDate)>=today);
        setGroups(groupPosts(posts));
        if(auth.currentUser){
          const aSnap=await getDocs(query(collection(db,"applications"),where("candidateId","==",auth.currentUser.uid)));
          setAppliedKeys(new Set(aSnap.docs.map(d=>`${d.data().company}__${(d.data().role||"").toLowerCase().trim()}`)));
        }
      }catch(e){console.error(e);}
      finally{setLoading(false);}
    };
    fetch();
  },[]);

  const handleApply=async(group)=>{
    if(!auth.currentUser){nav("/login");return;}
    setApplying(true);
    try{
      const best=pickBest(group.posts);
      await addDoc(collection(db,"applications"),{
        candidateId:auth.currentUser.uid,
        candidateName:auth.currentUser.displayName,
        referralPostId:best.id,company:group.company,role:group.role,
        employeeId:best.employeeId,employeeName:best.employeeName,
        status:"Applied",appliedAt:serverTimestamp(),
        responseDeadline:new Date(Date.now()+7*24*60*60*1000),routedBy:"smart-match"
      });
      const key=`${group.company}__${(group.role||"").toLowerCase().trim()}`;
      setAppliedKeys(prev=>new Set([...prev,key]));
      setApplied(true);
    }catch(e){console.error(e);}
    finally{setApplying(false);}
  };

  const openModal=(group)=>{
    setSelected(group);
    setApplied(false);
  };

  const companies=["All",...new Set(groups.map(g=>g.company))];
  const allSkillsFilter=["All Skills",...new Set(groups.flatMap(g=>g.skills)).values()].sort();
  const filtered=groups.filter(g=>{
    const mCo=company==="All"||g.company===company;
    const mSk=skill==="All Skills"||g.skills.includes(skill);
    const mSe=search===""||g.role.toLowerCase().includes(search.toLowerCase())||g.company.toLowerCase().includes(search.toLowerCase())||g.skills.some(s=>s.toLowerCase().includes(search.toLowerCase()));
    return mCo&&mSk&&mSe;
  });
  const isApplied=g=>appliedKeys.has(`${g.company}__${(g.role||"").toLowerCase().trim()}`);

  if(loading) return <Loader text="Loading referrals..."/>;

  return(
    <div style={{background:BG,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BORDER}`,padding:"0 clamp(16px,4vw,32px)",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <button onClick={()=>nav("/")} style={{background:"none",border:`1px solid ${BORDER}`,color:MUTED,cursor:"pointer",fontSize:13,fontFamily:"inherit",padding:"6px 14px",borderRadius:8,fontWeight:500}}>← Home</button>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>nav("/")}>
          <div style={{width:30,height:30,borderRadius:8,background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤝</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:PRIMARY}}>RaYa Jobs</span>
        </div>
        <button onClick={()=>nav(auth.currentUser?"/dashboard":"/login")} style={{background:GREEN,border:"none",color:WHITE,padding:"8px 18px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          {auth.currentUser?"Dashboard →":"Login"}
        </button>
      </nav>

      {/* SEARCH */}
      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,padding:"14px clamp(16px,4vw,32px)",position:"sticky",top:64,zIndex:90,boxShadow:"0 1px 3px rgba(0,0,0,0.03)"}}>
        <div style={{position:"relative",marginBottom:12}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:MUTED,fontSize:16}}>🔍</span>
          <input placeholder="Search role, company or skill…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",background:BG,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"11px 14px 11px 42px",color:TEXT,fontSize:14,outline:"none",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
          <select value={company} onChange={e=>setCompany(e.target.value)}
            style={{background:BG,border:`1.5px solid ${BORDER}`,borderRadius:9,padding:"7px 14px",color:TEXT,fontSize:13,outline:"none",fontFamily:"inherit",cursor:"pointer",flexShrink:0,fontWeight:500}}>
            {companies.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={skill} onChange={e=>setSkill(e.target.value)}
            style={{background:BG,border:`1.5px solid ${BORDER}`,borderRadius:9,padding:"7px 14px",color:TEXT,fontSize:13,outline:"none",fontFamily:"inherit",cursor:"pointer",flexShrink:0,fontWeight:500}}>
            {allSkillsFilter.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{marginTop:10,fontSize:13,color:MUTED}}>
          <span style={{color:PRIMARY,fontWeight:700}}>{filtered.length}</span> roles found
          {appliedKeys.size>0&&<span style={{marginLeft:12,color:GREEN,fontWeight:600}}>✓ {appliedKeys.size} applied</span>}
        </div>
      </div>

      {/* SMART ROUTING BANNER */}
      <div style={{background:GREENBG,borderBottom:"1px solid #BBF7D0",padding:"10px clamp(16px,4vw,32px)",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:16,flexShrink:0}}>⚡</span>
        <p style={{fontSize:13,color:"#15803D",lineHeight:1.5,fontWeight:500}}>
          <strong>Smart Routing</strong> — One application per company role. Automatically routed to the employee with the most slots.
        </p>
      </div>

      {/* CARDS */}
      <div style={{padding:"24px clamp(16px,4vw,32px)",maxWidth:1100,margin:"0 auto"}}>
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"80px 0",color:MUTED}}>
            <div style={{fontSize:48,marginBottom:16}}>🔍</div>
            <div style={{fontSize:18,color:TEXT,fontWeight:600,marginBottom:8}}>No referrals found</div>
            <div style={{fontSize:14}}>Try a different search or check back soon</div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
            {filtered.map(group=>{
              const appliedGroup=isApplied(group);
              const empCount=group.posts.length;
              return(
                <div key={group.key} onClick={()=>openModal(group)}
                  style={{background:WHITE,border:`1.5px solid ${appliedGroup?"#86EFAC":BORDER}`,borderRadius:16,padding:20,cursor:"pointer",transition:"all 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.1)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)";}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:15,color:TEXT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{group.role}</div>
                      <div style={{color:MUTED,fontSize:13}}>{group.company} • {group.city}</div>
                    </div>
                    {appliedGroup
                      ?<span style={{background:GREENBG,border:"1px solid #86EFAC",color:"#15803D",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:100,flexShrink:0}}>Applied ✓</span>
                      :<Badge color="#3B82F6">Active</Badge>
                    }
                  </div>
                  {group.description&&(
                    <p style={{color:MUTED,fontSize:13,lineHeight:1.6,marginBottom:10,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                      {group.description}
                    </p>
                  )}
                  <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>👥</span>
                    <div style={{fontSize:13}}>
                      <span style={{color:"#15803D",fontWeight:700}}>{empCount} employee{empCount>1?"s":""}</span>
                      <span style={{color:MUTED}}> willing to refer • </span>
                      <span style={{color:"#15803D",fontWeight:700}}>{group.totalSlots} slot{group.totalSlots>1?"s":""}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                    {group.skills.slice(0,4).map(s=><span key={s} style={{background:BG,border:`1px solid ${BORDER}`,color:MUTED,padding:"3px 10px",borderRadius:100,fontSize:11,fontWeight:500}}>{s}</span>)}
                    {group.skills.length>4&&<span style={{background:BG,border:`1px solid ${BORDER}`,color:MUTED,padding:"3px 10px",borderRadius:100,fontSize:11}}>+{group.skills.length-4}</span>}
                  </div>
                  <div style={{display:"flex",gap:16,paddingTop:12,borderTop:`1px solid ${BORDER}`,alignItems:"center"}}>
                    {group.ctcMax>0&&<div><div style={{color:MUTED,fontSize:10,fontWeight:600,marginBottom:2}}>SALARY</div><div style={{color:TEXT,fontWeight:700,fontSize:13}}>₹{group.ctcMin}–{group.ctcMax}L</div></div>}
                    {group.expMax>0&&<div><div style={{color:MUTED,fontSize:10,fontWeight:600,marginBottom:2}}>EXP</div><div style={{color:TEXT,fontWeight:700,fontSize:13}}>{group.expMin}–{group.expMax} yrs</div></div>}
                    <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4,fontSize:12,color:MUTED}}>
                      <span style={{color:GREEN}}>⚡</span> Smart routed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* APPLY MODAL */}
      {selected&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}
          onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div style={{background:WHITE,borderRadius:20,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>

            {!applied?(
              <div style={{padding:"28px 24px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:11,color:GREEN,fontWeight:700,letterSpacing:"1px",marginBottom:6}}>APPLY VIA REFERRAL</div>
                    <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:PRIMARY}}>{selected.role}</h3>
                    <p style={{color:MUTED,fontSize:13,marginTop:4}}>{selected.company}</p>
                  </div>
                  <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:22,padding:4}}>✕</button>
                </div>

                {selected.description&&(
                  <div style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:13,color:TEXT,lineHeight:1.7}}>
                    {selected.description}
                  </div>
                )}

                <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
                  <div style={{color:"#15803D",fontWeight:700,fontSize:13,marginBottom:4}}>⚡ Smart Routing Active</div>
                  <div style={{color:MUTED,fontSize:13,lineHeight:1.6}}>
                    <strong style={{color:TEXT}}>{selected.posts.length} employee{selected.posts.length>1?"s":""}</strong> from {selected.company} can refer you. We'll send your profile to the one with the most slots.
                  </div>
                </div>

                {[
                  ["Company",selected.company],
                  ["Role",selected.role],
                  ...(selected.ctcMax>0?[["CTC",`₹${selected.ctcMin}–${selected.ctcMax} LPA`]]:[]),
                  ...(selected.expMax>0?[["Experience",`${selected.expMin}–${selected.expMax} years`]]:[]),
                  ["Total Slots",`${selected.totalSlots} available`],
                ].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${BORDER}`}}>
                    <span style={{color:MUTED,fontSize:13}}>{k}</span>
                    <span style={{color:TEXT,fontSize:13,fontWeight:600}}>{v}</span>
                  </div>
                ))}

                <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:10,padding:"12px 14px",margin:"16px 0",fontSize:13,color:"#15803D",lineHeight:1.7}}>
                  Referred candidates are <strong>5x more likely</strong> to get an interview than direct applicants.
                </div>

                {isApplied(selected)?(
                  <div style={{background:GREENBG,border:"1px solid #86EFAC",borderRadius:10,padding:"14px",textAlign:"center",color:"#15803D",fontWeight:700}}>
                    ✓ Already Applied to this role at {selected.company}
                  </div>
                ):(
                  <button
                    onClick={()=>auth.currentUser?handleApply(selected):nav("/login")}
                    disabled={applying}
                    style={{width:"100%",background:GREEN,border:"none",color:WHITE,padding:"14px",borderRadius:10,fontSize:15,fontWeight:700,cursor:applying?"not-allowed":"pointer",fontFamily:"inherit",opacity:applying?0.7:1,marginTop:4}}>
                    {applying?"Applying...":auth.currentUser?"Apply Now ✦":"Login to Apply"}
                  </button>
                )}
              </div>
            ):(
              <div style={{padding:"28px 24px",textAlign:"center"}}>
                <div style={{fontSize:52,marginBottom:14}}>🎉</div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:PRIMARY,marginBottom:8}}>Application Sent!</h3>
                <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:10,padding:"14px 16px",margin:"16px 0",textAlign:"left"}}>
                  <div style={{color:"#15803D",fontWeight:700,fontSize:13,marginBottom:6}}>⚡ Smart Routing Complete</div>
                  <div style={{color:MUTED,fontSize:13,lineHeight:1.7}}>
                    Your profile was sent to the best available employee at <strong style={{color:TEXT}}>{selected.company}</strong>. They will review and submit internally.
                  </div>
                </div>
                <div style={{display:"grid",gap:10,marginTop:16}}>
                  <button onClick={()=>{setSelected(null);nav("/dashboard");}} style={{background:GREEN,border:"none",color:WHITE,padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Track Application →</button>
                  <button onClick={()=>setSelected(null)} style={{background:"none",border:`1.5px solid ${BORDER}`,color:MUTED,padding:"12px",borderRadius:10,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Browse More Roles</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
