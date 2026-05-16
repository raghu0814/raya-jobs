import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase/config";
import NavBar from "../components/NavBar";

const G="#C9A84C",GL="#E8C96A",BG="#080808",S1="#0F0F0F",S2="#161616",S3="#1E1E1E",BR="#2A2A2A",MT="#666666",WT="#F0EDE6";
const allSkills=["Java","Python","React","Angular","Node.js","SAP","AWS","Azure","DevOps","SQL",".NET","Spring Boot","TypeScript","Kubernetes"];

const Inp=({label,placeholder,type="text",value,onChange})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"13px 14px",color:WT,fontSize:14,outline:"none",fontFamily:"inherit"}}
      onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BR}/>
  </div>
);

const Sel=({label,options,value,onChange})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>{label}</label>
    <select value={value} onChange={onChange} style={{background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"13px 14px",color:value?WT:MT,fontSize:14,outline:"none",fontFamily:"inherit",appearance:"none"}}>
      <option value="">Select…</option>
      {options.map(o=><option key={o} value={o} style={{background:S2}}>{o}</option>)}
    </select>
  </div>
);

export default function RegCandidate() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [f, setF] = useState({name:"",phone:"",email:"",password:"",city:"",exp:"",company:"",title:"",cCTC:"",eCTC:"",notice:"",pSkill:"",jobType:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const handleSubmit = async () => {
    if (!f.name||!f.email||!f.password||!f.pSkill) { setError("Please fill all required fields"); return; }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
      await updateProfile(cred.user, { displayName: f.name });
      let resumeURL = "";
      if (resumeFile) {
        const resumeRef = ref(storage, `resumes/${cred.user.uid}/${resumeFile.name}`);
        await uploadBytes(resumeRef, resumeFile);
        resumeURL = await getDownloadURL(resumeRef);
      }
      await setDoc(doc(db, "candidates", cred.user.uid), {
        name:f.name, phone:f.phone, email:f.email, city:f.city,
        experience:f.exp, currentCompany:f.company, currentTitle:f.title,
        currentCTC:f.cCTC, expectedCTC:f.eCTC, noticePeriod:f.notice,
        primarySkill:f.pSkill, otherSkills:skills, jobType:f.jobType,
        resumeURL, role:"candidate", status:"Active",
        registeredAt:serverTimestamp()
      });
      nav("/browse");
    } catch(e) {
      setError(e.message.includes("email-already-in-use") ? "Email already registered. Please login." : "Registration failed. Try again.");
    } finally { setLoading(false); }
  };

  const Prog=()=>(
    <div style={{display:"flex",gap:6,marginBottom:24}}>
      {[1,2,3].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?`linear-gradient(90deg,${G},${GL})`:S3}}/>)}
    </div>
  );

  return (
    <div style={{background:BG,minHeight:"100vh",color:WT,fontFamily:"'DM Sans',sans-serif"}}>
      <NavBar onBack={step>1?()=>setStep(s=>s-1):()=>nav("/")} right={<span style={{color:MT,fontSize:12}}>Step {step}/3</span>}/>
      <div style={{maxWidth:480,margin:"40px auto",padding:"0 20px"}}>
        <Prog/>
        <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:16,padding:32}}>
          {error&&<div style={{background:"#1A0A0A",border:"1px solid #EF444444",borderRadius:8,padding:"10px 14px",color:"#EF4444",fontSize:13,marginBottom:16}}>{error}</div>}

          {step===1&&<>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:4}}>Personal Details</h2>
            <p style={{color:MT,fontSize:13,marginBottom:22}}>Let's start with the basics</p>
            <div style={{display:"grid",gap:14}}>
              <Inp label="Full Name *" placeholder="Your full name" value={f.name} onChange={e=>set("name",e.target.value)}/>
              <Inp label="Phone *" placeholder="+91 98765 43210" value={f.phone} onChange={e=>set("phone",e.target.value)}/>
              <Inp label="Email *" placeholder="you@email.com" type="email" value={f.email} onChange={e=>set("email",e.target.value)}/>
              <Inp label="Password *" placeholder="Min 6 characters" type="password" value={f.password} onChange={e=>set("password",e.target.value)}/>
              <Sel label="City *" options={["Hyderabad","Bangalore","Pune","Mumbai","Chennai","Delhi","Other"]} value={f.city} onChange={e=>set("city",e.target.value)}/>
            </div>
            <button onClick={()=>setStep(2)} style={{marginTop:22,width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"13px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Continue →</button>
          </>}

          {step===2&&<>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:4}}>Professional Info</h2>
            <p style={{color:MT,fontSize:13,marginBottom:22}}>Your experience and current situation</p>
            <div style={{display:"grid",gap:14}}>
              <Inp label="Total Experience *" placeholder="e.g. 3 years" value={f.exp} onChange={e=>set("exp",e.target.value)}/>
              <Sel label="Notice Period *" options={["Immediate","15 Days","30 Days","60 Days","90 Days"]} value={f.notice} onChange={e=>set("notice",e.target.value)}/>
              <Inp label="Current Company" placeholder="Cognizant, TCS…" value={f.company} onChange={e=>set("company",e.target.value)}/>
              <Inp label="Current Job Title *" placeholder="Senior Java Developer" value={f.title} onChange={e=>set("title",e.target.value)}/>
              <Inp label="Current CTC (LPA) *" placeholder="6.5" value={f.cCTC} onChange={e=>set("cCTC",e.target.value)}/>
              <Inp label="Expected CTC (LPA) *" placeholder="9.0" value={f.eCTC} onChange={e=>set("eCTC",e.target.value)}/>
              <Sel label="Job Type *" options={["Full Time","Remote","Hybrid","Contract"]} value={f.jobType} onChange={e=>set("jobType",e.target.value)}/>
            </div>
            <button onClick={()=>setStep(3)} style={{marginTop:22,width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"13px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Continue →</button>
          </>}

          {step===3&&<>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:4}}>Skills & Resume</h2>
            <p style={{color:MT,fontSize:13,marginBottom:22}}>What you know and what you've built</p>
            <div style={{display:"grid",gap:14}}>
              <Sel label="Primary Skill *" options={allSkills} value={f.pSkill} onChange={e=>set("pSkill",e.target.value)}/>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>Other Skills</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
                  {skills.map(s=><span key={s} onClick={()=>setSkills(p=>p.filter(x=>x!==s))} style={{background:`${G}22`,border:`1px solid ${G}55`,color:G,padding:"4px 10px",borderRadius:100,fontSize:12,cursor:"pointer"}}>{s} ✕</span>)}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {allSkills.filter(s=>!skills.includes(s)&&s!==f.pSkill).map(s=><span key={s} onClick={()=>setSkills(p=>[...p,s])} style={{background:S3,border:`1px solid ${BR}`,color:MT,padding:"4px 10px",borderRadius:100,fontSize:12,cursor:"pointer"}}>{s}</span>)}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>Resume (PDF) *</label>
                <label style={{border:`2px dashed ${resumeFile?G:BR}`,borderRadius:10,padding:20,textAlign:"center",cursor:"pointer",background:resumeFile?`${G}08`:"transparent"}}>
                  <input type="file" accept=".pdf" onChange={e=>setResumeFile(e.target.files[0])} style={{display:"none"}}/>
                  <div style={{fontSize:28,marginBottom:6}}>{resumeFile?"✅":"📄"}</div>
                  <div style={{color:resumeFile?G:WT,fontSize:14,fontWeight:600}}>{resumeFile?resumeFile.name:"Click to upload Resume"}</div>
                  <div style={{color:MT,fontSize:12,marginTop:4}}>PDF only • Max 5MB</div>
                </label>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} style={{marginTop:22,width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"13px",borderRadius:8,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.7:1}}>
              {loading?"Creating Profile...":"Create Profile ✦"}
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}
