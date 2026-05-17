import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import Loader from "../components/Loader";
import Badge from "../components/Badge";

const G="#C9A84C",GL="#E8C96A",BG="#080808",S1="#0F0F0F",S2="#161616",S3="#1E1E1E",BR="#2A2A2A",MT="#666666",WT="#F0EDE6";

function groupPosts(posts){
  const map={};
  for(const post of posts){
    const key=`${post.company}__${(post.role||"").toLowerCase().trim()}`;
    if(!map[key]){
      map[key]={key,company:post.company,role:post.role,skills:post.skills||[],ctcMin:post.ctcMin,ctcMax:post.ctcMax,expMin:post.expMin,expMax:post.expMax,city:post.city||"India",posts:[],totalSlots:0};
    }
    map[key].posts.push(post);
    map[key].totalSlots+=(post.slots||1);
    map[key].ctcMin=Math.min(map[key].ctcMin||post.ctcMin||0,post.ctcMin||0);
    map[key].ctcMax=Math.max(map[key].ctcMax||post.ctcMax||0,post.ctcMax||0);
    for(const s of(post.skills||[])){if(!map[key].skills.includes(s))map[key].skills.push(s);}
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
  const[modalStep,setModalStep]=useState(1);
  const[applying,setApplying]=useState(false);
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
          const keys=new Set(aSnap.docs.map(d=>`${d.data().company}__${(d.data().role||"").toLowerCase().trim()}`));
          setAppliedKeys(keys);
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
        referralPostId:best.id,
        company:group.company,role:group.role,
        employeeId:best.employeeId,
        employeeName:best.employeeName,
        status:"Applied",
        appliedAt:serverTimestamp(),
        responseDeadline:new Date(Date.now()+7*24*60*60*1000),
        routedBy:"smart-match"
      });
      const key=`${group.company}__${(group.role||"").toLowerCase().trim()}`;
      setAppliedKeys(prev=>new Set([...prev,key]));
      setModalStep(3);
    }catch(e){console.error(e);}
    finally{setApplying(false);}
  };

  const companies=["All",...new Set(groups.map(g=>g.company)).values()];
  const allSkills=["All Skills",...new Set(groups.flatMap(g=>g.skills)).values()].sort();
  const filtered=groups.filter(g=>{
    const mCo=company==="All"||g.company===company;
    const mSk=skill==="All Skills"||g.skills.includes(skill);
    const mSe=search===""||g.role.toLowerCase().includes(search.toLowerCase())||g.company.toLowerCase().includes(search.toLowerCase())||g.skills.some(s=>s.toLowerCase().includes(search.toLowerCase()));
    return mCo&&mSk&&mSe;
  });

  const isApplied=g=>appliedKeys.has(`${g.company}__${(g.role||"").toLowerCase().trim()}`);

  if(loading) return <Loader text="Loading referrals..."/>;

  return(
    <div style={{background:BG,minHeight:"100vh",color:WT,fontFamily:"'DM Sans',sans-serif"}}>
      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(8,8,8,0.96)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BR}`,padding:"0 20px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>nav("/")} style={{background:"none",border:"none",color:MT,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Home</button>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,background:`linear-gradient(135deg,${G},${GL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>RaYa Jobs</span>
        <button onClick={()=>nav(auth.currentUser?"/dashboard":"/login")} style={{background:`${G}15`,border:`1px solid ${G}33`,color:G,padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          {auth.currentUser?"Dashboard":"Login"}
        </button>
      </nav>

      {/* SEARCH + FILTERS */}
      <div style={{background:S1,borderBottom:`1px solid ${BR}`,padding:"12px 20px",position:"sticky",top:60,zIndex:90}}>
        <div style={{position:"relative",marginBottom:10}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:MT}}>🔍</span>
          <input placeholder="Search role, company or skill…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"11px 14px 11px 38px",color:WT,fontSize:14,outline:"none",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BR}/>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
          <select value={company} onChange={e=>setCompany(e.target.value)}
            style={{background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"7px 12px",color:WT,fontSize:12,outline:"none",fontFamily:"inherit",appearance:"none",cursor:"pointer",flexShrink:0}}>
            {companies.map(c=><option key={c} value={c} style={{background:S2}}>{c}</option>)}
          </select>
          <select value={skill} onChange={e=>setSkill(e.target.value)}
            style={{background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"7px 12px",color:WT,fontSize:12,outline:"none",fontFamily:"inherit",appearance:"none",cursor:"pointer",flexShrink:0}}>
            {allSkills.map(s=><option key={s} value={s} style={{background:S2}}>{s}</option>)}
          </select>
        </div>
        <div style={{marginTop:8,fontSize:12,color:MT}}>
          <span style={{color:G,fontWeight:700}}>{filtered.length}</span> roles found
          {appliedKeys.size>0&&<span style={{marginLeft:10,color:"#4ADE80"}}>• {appliedKeys.size} applied</span>}
        </div>
      </div>

      {/* SMART ROUTING BANNER */}
      <div style={{background:`${G}08`,borderBottom:`1px solid ${G}22`,padding:"10px 20px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:16,flexShrink:0}}>⚡</span>
        <p style={{fontSize:12,color:MT,lineHeight:1.5}}>
          <strong style={{color:G}}>Smart Routing</strong> — When you apply, RaYa automatically connects you to the employee with the most referral slots. One application per company role.
        </p>
      </div>

      {/* CARDS */}
      <div style={{padding:"20px",maxWidth:1000,margin:"0 auto"}}>
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"80px 0",color:MT}}>
            <div style={{fontSize:40,marginBottom:12}}>🔍</div>
            <div style={{fontSize:16,color:WT,marginBottom:8}}>No referrals found</div>
            <div style={{fontSize:13}}>Try a different search or check back soon</div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
            {filtered.map(group=>{
              const applied=isApplied(group);
              const empCount=group.posts.length;
              return(
                <div key={group.key} onClick={()=>{setSelected(group);setModalStep(1);}}
                  style={{background:S1,border:`1px solid ${applied?G+"55":BR}`,borderRadius:14,padding:18,cursor:"pointer",transition:"border-color 0.2s,transform 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=applied?G+"88":G+"44";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=applied?G+"55":BR;e.currentTarget.style.transform="translateY(0)";}}>

                  {/* TOP */}
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:15,color:WT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{group.role}</div>
                      <div style={{color:MT,fontSize:12}}>{group.company} • {group.city}</div>
                    </div>
                    {applied
                      ?<span style={{background:"#0A1F0A",border:"1px solid #1F5C1F",color:"#4ADE80",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:100,flexShrink:0}}>Applied ✓</span>
                      :<Badge color="#60A5FA">Active</Badge>
                    }
                  </div>

                  {/* EMPLOYEE COUNT */}
                  <div style={{background:`${G}10`,border:`1px solid ${G}22`,borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>👥</span>
                    <div>
                      <span style={{color:G,fontWeight:700,fontSize:13}}>{empCount} employee{empCount>1?"s":""}</span>
                      <span style={{color:MT,fontSize:12}}> willing to refer • </span>
                      <span style={{color:G,fontWeight:700,fontSize:13}}>{group.totalSlots} slot{group.totalSlots>1?"s":""} available</span>
                    </div>
                  </div>

                  {/* SKILLS */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                    {group.skills.slice(0,4).map(s=><span key={s} style={{background:S3,border:`1px solid ${BR}`,color:"#AAA",padding:"3px 10px",borderRadius:100,fontSize:11}}>{s}</span>)}
                    {group.skills.length>4&&<span style={{background:S3,border:`1px solid ${BR}`,color:MT,padding:"3px 10px",borderRadius:100,fontSize:11}}>+{group.skills.length-4}</span>}
                  </div>

                  {/* BOTTOM - no bonus */}
                  <div style={{display:"flex",gap:16,paddingTop:10,borderTop:`1px solid ${BR}`}}>
                    {group.ctcMax>0&&<div><div style={{color:MT,fontSize:9,marginBottom:2}}>SALARY</div><div style={{color:WT,fontWeight:700,fontSize:13}}>₹{group.ctcMin}–{group.ctcMax}L</div></div>}
                    {group.expMax>0&&<div><div style={{color:MT,fontSize:9,marginBottom:2}}>EXP</div><div style={{color:WT,fontWeight:700,fontSize:13}}>{group.expMin}–{group.expMax} yrs</div></div>}
                  </div>

                  <div style={{marginTop:10,fontSize:11,color:MT,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{color:G}}>⚡</span> Smart routed to best available employee
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* APPLY MODAL */}
      {selected&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}
          onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"28px 24px 40px",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{width:40,height:4,background:BR,borderRadius:2,margin:"0 auto 20px"}}/>

            {/* STEP 1 */}
            {modalStep===1&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"2px",marginBottom:4}}>APPLY VIA REFERRAL</div>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:WT}}>{selected.role}</h3>
                  <p style={{color:MT,fontSize:13,marginTop:4}}>{selected.company}</p>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:MT,cursor:"pointer",fontSize:20}}>✕</button>
              </div>

              <div style={{background:`${G}10`,border:`1px solid ${G}33`,borderRadius:10,padding:"12px 14px",marginBottom:16}}>
                <div style={{color:G,fontWeight:700,fontSize:13,marginBottom:4}}>⚡ Smart Routing Active</div>
                <div style={{color:MT,fontSize:12,lineHeight:1.6}}>
                  <strong style={{color:WT}}>{selected.posts.length} employee{selected.posts.length>1?"s":""}</strong> from {selected.company} can refer you. Your profile goes to the one with the most available slots.
                </div>
              </div>

              {[
                ["Company",selected.company],
                ["Role",selected.role],
                ...(selected.ctcMax>0?[["CTC Range",`₹${selected.ctcMin}–${selected.ctcMax} LPA`]]:[]),
                ...(selected.expMax>0?[["Experience",`${selected.expMin}–${selected.expMax} years`]]:[]),
                ["Total Slots",`${selected.totalSlots} available`],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${BR}`}}>
                  <span style={{color:MT,fontSize:13}}>{k}</span>
                  <span style={{color:WT,fontSize:13,fontWeight:600}}>{v}</span>
                </div>
              ))}

              <div style={{background:`${G}0A`,border:`1px solid ${G}22`,borderRadius:10,padding:"12px 14px",margin:"16px 0",fontSize:12,color:MT,lineHeight:1.7}}>
                Referred candidates are <strong style={{color:WT}}>5x more likely</strong> to get an interview than direct applicants.
              </div>

              {isApplied(selected)
                ?<div style={{background:"#0A1F0A",border:"1px solid #1F5C1F",borderRadius:10,padding:"14px",textAlign:"center",color:"#4ADE80",fontWeight:700}}>✓ Already Applied to this role at {selected.company}</div>
                :<button onClick={()=>auth.currentUser?setModalStep(2):nav("/login")}
                  style={{width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:"#080808",padding:"14px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {auth.currentUser?"Apply Now ✦":"Login to Apply"}
                </button>
              }
            </>}

            {/* STEP 2 */}
            {modalStep===2&&<>
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"2px",marginBottom:8}}>CONFIRM APPLICATION</div>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:WT,marginBottom:6}}>Apply via Smart Routing</h3>
                <p style={{color:MT,fontSize:13}}>Your profile goes to the best matched employee at {selected.company}</p>
              </div>
              <div style={{background:`${G}0A`,border:`1px solid ${G}22`,borderRadius:12,padding:20,marginBottom:20,textAlign:"center"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:700,color:G}}>₹799</div>
                <div style={{color:MT,fontSize:13,marginTop:4}}>3-month unlimited plan</div>
                <div style={{color:MT,fontSize:11,marginTop:4}}>Unlimited applications • One per company role</div>
              </div>
              <button onClick={()=>handleApply(selected)} disabled={applying}
                style={{width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:"#080808",padding:"14px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10,opacity:applying?0.7:1}}>
                {applying?"Applying...":"Pay ₹799 & Apply"}
              </button>
              <button onClick={()=>setModalStep(1)} style={{width:"100%",background:"none",border:"none",color:MT,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Go Back</button>
            </>}

            {/* STEP 3 */}
            {modalStep===3&&<>
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:52,marginBottom:14}}>🎉</div>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:8}}>Application Sent!</h3>
                <div style={{background:`${G}10`,border:`1px solid ${G}33`,borderRadius:10,padding:"14px 16px",margin:"16px 0",textAlign:"left"}}>
                  <div style={{color:G,fontWeight:700,fontSize:13,marginBottom:6}}>⚡ Smart Routing Complete</div>
                  <div style={{color:MT,fontSize:12,lineHeight:1.7}}>Your profile was sent to the best available employee at <strong style={{color:WT}}>{selected.company}</strong>. They will review and submit internally.</div>
                </div>
                <p style={{color:G,fontSize:13,fontWeight:600,marginBottom:24}}>Guaranteed response within 7 days. ✦</p>
                <div style={{display:"grid",gap:10}}>
                  <button onClick={()=>{setSelected(null);nav("/dashboard");}}
                    style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:"#080808",padding:"12px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    Track Application →
                  </button>
                  <button onClick={()=>setSelected(null)}
                    style={{background:"none",border:`1px solid ${BR}`,color:MT,padding:"12px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                    Browse More Roles
                  </button>
                </div>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
