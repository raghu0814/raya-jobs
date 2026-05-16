import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import Loader from "../components/Loader";
import Badge from "../components/Badge";

const G="#C9A84C",GL="#E8C96A",BG="#080808",S1="#0F0F0F",S2="#161616",S3="#1E1E1E",BR="#2A2A2A",MT="#666666",WT="#F0EDE6";

export default function Browse() {
  const nav = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("All");
  const [selected, setSelected] = useState(null);
  const [modalStep, setModalStep] = useState(1);
  const [applied, setApplied] = useState([]);
  const [applying, setApplying] = useState(false);

  useEffect(()=>{
    const fetch = async ()=>{
      try {
        const q = query(collection(db,"referralPosts"),where("status","==","Active"));
        const snap = await getDocs(q);
        setPosts(snap.docs.map(d=>({id:d.id,...d.data()})));
      } catch(e){ console.error(e); }
      finally{ setLoading(false); }
    };
    fetch();
  },[]);

  const handleApply = async (post)=>{
    if(!auth.currentUser){ nav("/login"); return; }
    setApplying(true);
    try {
      await addDoc(collection(db,"applications"),{
        candidateId:auth.currentUser.uid,
        candidateName:auth.currentUser.displayName,
        referralPostId:post.id,
        company:post.company, role:post.role,
        employeeId:post.employeeId,
        status:"Applied",
        appliedAt:serverTimestamp(),
        responseDeadline:new Date(Date.now()+7*24*60*60*1000)
      });
      setApplied(p=>[...p,post.id]);
      setModalStep(3);
    } catch(e){ console.error(e); }
    finally{ setApplying(false); }
  };

  const companies=["All",...new Set(posts.map(p=>p.company))];
  const filtered=posts.filter(p=>{
    const mCo=company==="All"||p.company===company;
    const mSe=search===""||p.role.toLowerCase().includes(search.toLowerCase())||p.company.toLowerCase().includes(search.toLowerCase())||(p.skills||[]).some(s=>s.toLowerCase().includes(search.toLowerCase()));
    return mCo&&mSe;
  });

  if(loading) return <Loader text="Loading referrals..."/>;

  return (
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
          {companies.map(c=>(
            <button key={c} onClick={()=>setCompany(c)} style={{background:company===c?`${G}22`:S2,border:`1px solid ${company===c?G:BR}`,color:company===c?G:MT,padding:"6px 14px",borderRadius:100,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{c}</button>
          ))}
        </div>
        <div style={{marginTop:8,fontSize:12,color:MT}}><span style={{color:G,fontWeight:700}}>{filtered.length}</span> referrals found</div>
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
            {filtered.map(r=>(
              <div key={r.id} onClick={()=>{setSelected(r);setModalStep(1);}}
                style={{background:S1,border:`1px solid ${applied.includes(r.id)?G+"44":BR}`,borderRadius:14,padding:18,cursor:"pointer",transition:"border-color 0.2s"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14,color:WT,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.role}</div>
                    <div style={{color:MT,fontSize:12}}>{r.company} • {r.city||"India"}</div>
                  </div>
                  {applied.includes(r.id)
                    ?<span style={{background:"#0A1F0A",border:"1px solid #1F5C1F",color:"#4ADE80",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:100,flexShrink:0}}>Applied ✓</span>
                    :<Badge color="#60A5FA">Active</Badge>
                  }
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {(r.skills||[]).slice(0,3).map(s=><span key={s} style={{background:S3,border:`1px solid ${BR}`,color:"#AAA",padding:"3px 10px",borderRadius:100,fontSize:11}}>{s}</span>)}
                  {(r.skills||[]).length>3&&<span style={{background:S3,border:`1px solid ${BR}`,color:MT,padding:"3px 10px",borderRadius:100,fontSize:11}}>+{r.skills.length-3}</span>}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:`1px solid ${BR}`}}>
                  <div style={{display:"flex",gap:14}}>
                    <div><div style={{color:MT,fontSize:9,marginBottom:2}}>SALARY</div><div style={{color:WT,fontWeight:700,fontSize:13}}>₹{r.ctcMin}–{r.ctcMax}L</div></div>
                    <div><div style={{color:MT,fontSize:9,marginBottom:2}}>EXP</div><div style={{color:WT,fontWeight:700,fontSize:13}}>{r.expMin}–{r.expMax} yrs</div></div>
                    <div><div style={{color:MT,fontSize:9,marginBottom:2}}>SLOTS</div><div style={{color:WT,fontWeight:700,fontSize:13}}>{r.slots}</div></div>
                  </div>
                  <div style={{background:`${G}15`,border:`1px solid ${G}33`,borderRadius:8,padding:"5px 10px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:G,fontWeight:700}}>BONUS</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:700,color:G}}>₹{r.bonusMin?Math.round(r.bonusMin/1000)+"k":"?"}</div>
                  </div>
                </div>
                <div style={{marginTop:10,fontSize:12,color:MT}}>Posted by <strong style={{color:"#AAA"}}>{r.employeeName}</strong> — {r.designation}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APPLY MODAL */}
      {selected&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"28px 24px 40px",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{width:40,height:4,background:BR,borderRadius:2,margin:"0 auto 20px"}}/>

            {modalStep===1&&<>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
                <div>
                  <div style={{fontSize:10,color:G,fontWeight:700,letterSpacing:"2px",marginBottom:4}}>APPLY VIA REFERRAL</div>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:WT}}>{selected.role}</h3>
                  <p style={{color:MT,fontSize:13,marginTop:4}}>{selected.company}</p>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:MT,cursor:"pointer",fontSize:20}}>✕</button>
              </div>
              {[["CTC",`₹${selected.ctcMin}–${selected.ctcMax} LPA`],["Experience",`${selected.expMin}–${selected.expMax} yrs`],["Slots",`${selected.slots} available`],["Posted by",selected.employeeName||"Employee"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${BR}`}}>
                  <span style={{color:MT,fontSize:13}}>{k}</span>
                  <span style={{color:WT,fontSize:13,fontWeight:600}}>{v}</span>
                </div>
              ))}
              <div style={{background:`${G}0A`,border:`1px solid ${G}22`,borderRadius:10,padding:"12px 14px",margin:"16px 0",fontSize:12,color:MT,lineHeight:1.7}}>
                Referred candidates are <strong style={{color:WT}}>5x more likely</strong> to get hired. Your profile goes directly to the employee who posted this.
              </div>
              {applied.includes(selected.id)
                ?<div style={{background:"#0A1F0A",border:"1px solid #1F5C1F",borderRadius:10,padding:"14px",textAlign:"center",color:"#4ADE80",fontWeight:700}}>✓ Already Applied</div>
                :<button onClick={()=>auth.currentUser?setModalStep(2):nav("/login")} style={{width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"14px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {auth.currentUser?"Apply Now ✦":"Login to Apply"}
                </button>
              }
            </>}

            {modalStep===2&&<>
              <div style={{textAlign:"center",marginBottom:20}}>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:WT,marginBottom:8}}>Confirm Application</h3>
                <p style={{color:MT,fontSize:13}}>Your profile will be sent directly to the employee</p>
              </div>
              <div style={{background:`${G}0A`,border:`1px solid ${G}22`,borderRadius:12,padding:20,marginBottom:20,textAlign:"center"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:700,color:G}}>₹799</div>
                <div style={{color:MT,fontSize:13,marginTop:4}}>3-month plan — unlimited applications</div>
                <div style={{color:MT,fontSize:12,marginTop:4}}>Or use your 2 free applications</div>
              </div>
              <button onClick={()=>handleApply(selected)} disabled={applying} style={{width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"14px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10,opacity:applying?0.7:1}}>
                {applying?"Applying...":"Apply Now"}
              </button>
              <button onClick={()=>setModalStep(1)} style={{width:"100%",background:"none",border:"none",color:MT,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Go Back</button>
            </>}

            {modalStep===3&&<>
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:52,marginBottom:14}}>🎉</div>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:8}}>Application Sent!</h3>
                <p style={{color:MT,fontSize:14,lineHeight:1.7,marginBottom:8}}>Your profile has been sent to <strong style={{color:WT}}>{selected.employeeName}</strong>.</p>
                <p style={{color:G,fontSize:13,fontWeight:600,marginBottom:24}}>You'll hear back within 7 days. ✦</p>
                <div style={{display:"grid",gap:10}}>
                  <button onClick={()=>{setSelected(null);nav("/dashboard");}} style={{background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"12px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Track Application →</button>
                  <button onClick={()=>setSelected(null)} style={{background:"none",border:`1px solid ${BR}`,color:MT,padding:"12px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Browse More</button>
                </div>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
