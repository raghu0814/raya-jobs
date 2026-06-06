import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase/config";
import NavBar from "../components/NavBar";

const PRIMARY="#1A2E4A",GREEN="#22C55E",BG="#F8FAFC",WHITE="#FFFFFF",BORDER="#E2E8F0",TEXT="#0F172A",MUTED="#64748B",GREENBG="#F0FDF4",BG2="#F8FAFC";

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

const Inp=({label,placeholder,type="text",value,onChange,hint})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:11,fontWeight:700,color:PRIMARY,letterSpacing:"0.5px"}}>{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"12px 14px",color:TEXT,fontSize:14,outline:"none",fontFamily:"inherit"}}
      onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
    {hint&&<span style={{fontSize:11,color:MUTED}}>{hint}</span>}
  </div>
);

const Sel=({label,options,value,onChange})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:11,fontWeight:700,color:PRIMARY,letterSpacing:"0.5px"}}>{label}</label>
    <select value={value} onChange={onChange}
      style={{background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"12px 14px",color:value?TEXT:MUTED,fontSize:14,outline:"none",fontFamily:"inherit",appearance:"none"}}
      onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}>
      <option value="">Select…</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

function SkillSelector({skills,setSkills,exclude}){
  const[input,setInput]=useState("");
  const add=(s)=>{const v=s.trim();if(v&&!skills.includes(v))setSkills(p=>[...p,v]);};
  const handleKey=(e)=>{if(e.key==="Enter"&&input.trim()){add(input);setInput("");}};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <label style={{fontSize:11,fontWeight:700,color:PRIMARY,letterSpacing:"0.5px"}}>Other Skills</label>
      {skills.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {skills.map(s=>(
            <span key={s} onClick={()=>setSkills(p=>p.filter(x=>x!==s))}
              style={{background:GREENBG,border:"1px solid #BBF7D0",color:"#15803D",padding:"4px 10px",borderRadius:100,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:500}}>
              {s} <span style={{fontSize:10,color:"#86EFAC"}}>✕</span>
            </span>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Type any skill and press Enter…"
          style={{flex:1,background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"10px 14px",color:TEXT,fontSize:13,outline:"none",fontFamily:"inherit"}}
          onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
        <button onClick={()=>{add(input);setInput("");}}
          style={{background:GREEN,border:"none",color:WHITE,padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {allSkills.filter(s=>!skills.includes(s)&&s!==exclude).map(s=>(
          <span key={s} onClick={()=>add(s)}
            style={{background:BG2,border:`1px solid ${BORDER}`,color:MUTED,padding:"4px 10px",borderRadius:100,fontSize:11,cursor:"pointer",fontWeight:500}}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── PROGRESS BAR — defined outside to avoid render error ──
const Prog=({step})=>(
  <div style={{display:"flex",gap:8,marginBottom:28}}>
    {[1,2,3].map(i=>(
      <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<step?"#86EFAC":i===step?GREEN:BORDER,transition:"background 0.3s"}}/>
    ))}
  </div>
);

export default function Register(){
  const nav=useNavigate();
  const[step,setStep]=useState(1);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[resumeFile,setResumeFile]=useState(null);
  const[skills,setSkills]=useState([]);
  const[f,setF]=useState({name:"",phone:"",email:"",password:"",pan:"",city:"",exp:"",company:"",title:"",cCTC:"",eCTC:"",notice:"",pSkill:"",jobType:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const validatePAN=(pan)=>/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

  const handleNext1=async()=>{
    if(!f.name||!f.email||!f.password||!f.pan||!f.city){setError("Please fill all required fields");return;}
    if(f.password.length<6){setError("Password must be at least 6 characters");return;}
    if(!validatePAN(f.pan)){setError("Invalid PAN format. Example: ABCDE1234F");return;}
    setLoading(true);setError("");
    try{
      const q=query(collection(db,"users"),where("pan","==",f.pan));
      const snap=await getDocs(q);
      if(!snap.empty){setError("An account already exists with this PAN. One account per person only.");setLoading(false);return;}
      setStep(2);
    }catch{setStep(2);}
    finally{setLoading(false);}
  };

  const handleNext2=()=>{
    if(!f.exp){setError("Please enter your total experience");return;}
    if(!f.title){setError("Please enter your current job title");return;}
    setError("");setStep(3);
  };

  const handleSubmit=async()=>{
    if(!f.pSkill){setError("Please select your primary skill");return;}
    setLoading(true);setError("");
    try{
      const cred=await createUserWithEmailAndPassword(auth,f.email,f.password);
      await updateProfile(cred.user,{displayName:f.name});
      let resumeURL="";
      if(resumeFile){
        const r=ref(storage,`resumes/${cred.user.uid}/${resumeFile.name}`);
        await uploadBytes(r,resumeFile);
        resumeURL=await getDownloadURL(r);
      }
      await setDoc(doc(db,"users",cred.user.uid),{
        name:f.name,email:f.email,phone:f.phone,pan:f.pan,city:f.city,
        experience:f.exp,currentCompany:f.company,currentTitle:f.title,
        currentCTC:f.cCTC,expectedCTC:f.eCTC,noticePeriod:f.notice,
        primarySkill:f.pSkill,otherSkills:skills,jobType:f.jobType,
        resumeURL,plan:"free",status:"Active",registeredAt:serverTimestamp()
      });
      nav("/dashboard");
    }catch(e){
      setError(e.message.includes("email-already-in-use")?"Email already registered. Please login.":"Registration failed. Try again.");
    }finally{setLoading(false);}
  };

  const stepLabels=["Account Details","Professional Info","Skills & Resume"];

  return(
    <div style={{background:BG,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif",paddingBottom:40}}>
      <NavBar onBack={step>1?()=>{setStep(s=>s-1);setError("");}:()=>nav("/")} right={<span style={{color:MUTED,fontSize:12,fontWeight:600}}>Step {step}/3</span>}/>
      <div style={{maxWidth:520,margin:"32px auto",padding:"0 20px"}}>
        <Prog step={step}/>
        {/* Step label */}
        <div style={{marginBottom:20}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:PRIMARY,marginBottom:4}}>{stepLabels[step-1]}</h2>
          <p style={{color:MUTED,fontSize:14}}>{step===1?"One account to find jobs and post referrals":step===2?"Helps us match you with the right referrals":"Add your skills and upload your resume"}</p>
        </div>

        <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:20,padding:28,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
          {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",color:"#DC2626",fontSize:13,marginBottom:20,lineHeight:1.5}}>{error}</div>}

          {/* STEP 1 */}
          {step===1&&<>
            <div style={{display:"grid",gap:16}}>
              <Inp label="Full Name *" placeholder="Your full name" value={f.name} onChange={e=>set("name",e.target.value)}/>
              <Inp label="Phone *" placeholder="+91 98765 43210" value={f.phone} onChange={e=>set("phone",e.target.value)}/>
              <Inp label="Email *" placeholder="you@email.com" type="email" value={f.email} onChange={e=>set("email",e.target.value)}/>
              <Inp label="Password *" placeholder="Min 6 characters" type="password" value={f.password} onChange={e=>set("password",e.target.value)}/>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:11,fontWeight:700,color:PRIMARY,letterSpacing:"0.5px"}}>PAN Number *</label>
                <input placeholder="ABCDE1234F" value={f.pan}
                  onChange={e=>set("pan",e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
                  maxLength={10}
                  style={{background:WHITE,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:"12px 14px",color:TEXT,fontSize:14,outline:"none",fontFamily:"inherit",letterSpacing:"3px"}}
                  onFocus={e=>e.target.style.borderColor=GREEN} onBlur={e=>e.target.style.borderColor=BORDER}/>
                <span style={{fontSize:11,color:MUTED}}>🔒 Ensures one account per person. Format: ABCDE1234F</span>
              </div>
              <Sel label="City *" options={["Hyderabad","Bangalore","Pune","Mumbai","Chennai","Delhi","Noida","Other"]} value={f.city} onChange={e=>set("city",e.target.value)}/>
            </div>
            <button onClick={handleNext1} disabled={loading}
              style={{marginTop:24,width:"100%",background:GREEN,border:"none",color:WHITE,padding:"13px",borderRadius:10,fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.7:1}}>
              {loading?"Verifying...":"Continue →"}
            </button>
            <div style={{textAlign:"center",marginTop:16}}>
              <span style={{color:MUTED,fontSize:14}}>Already have an account? </span>
              <span onClick={()=>nav("/login")} style={{color:GREEN,fontWeight:700,fontSize:14,cursor:"pointer"}}>Login</span>
            </div>
          </>}

          {/* STEP 2 */}
          {step===2&&<>
            <div style={{display:"grid",gap:16}}>
              <Inp label="Total Experience *" placeholder="e.g. 4 years" value={f.exp} onChange={e=>set("exp",e.target.value)}/>
              <Inp label="Current Company" placeholder="Cognizant, TCS, Amazon…" value={f.company} onChange={e=>set("company",e.target.value)}/>
              <Inp label="Current Job Title *" placeholder="Senior Java Developer" value={f.title} onChange={e=>set("title",e.target.value)}/>
              <Inp label="Current CTC (LPA)" placeholder="8" value={f.cCTC} onChange={e=>set("cCTC",e.target.value)}/>
              <Inp label="Expected CTC (LPA)" placeholder="14" value={f.eCTC} onChange={e=>set("eCTC",e.target.value)}/>
              <Sel label="Notice Period" options={["Immediate","15 Days","30 Days","60 Days","90 Days"]} value={f.notice} onChange={e=>set("notice",e.target.value)}/>
              <Sel label="Preferred Job Type" options={["Full Time","Remote","Hybrid","Contract"]} value={f.jobType} onChange={e=>set("jobType",e.target.value)}/>
            </div>
            <button onClick={handleNext2}
              style={{marginTop:24,width:"100%",background:GREEN,border:"none",color:WHITE,padding:"13px",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Continue →
            </button>
          </>}

          {/* STEP 3 */}
          {step===3&&<>
            <div style={{display:"grid",gap:18}}>
              <Sel label="Primary Skill *" options={allSkills} value={f.pSkill} onChange={e=>set("pSkill",e.target.value)}/>
              <SkillSelector skills={skills} setSkills={setSkills} exclude={f.pSkill}/>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:11,fontWeight:700,color:PRIMARY,letterSpacing:"0.5px"}}>Resume (PDF)</label>
                <label style={{border:`2px dashed ${resumeFile?"#86EFAC":BORDER}`,borderRadius:12,padding:24,textAlign:"center",cursor:"pointer",background:resumeFile?GREENBG:BG2,transition:"all 0.2s"}}>
                  <input type="file" accept=".pdf" onChange={e=>setResumeFile(e.target.files[0])} style={{display:"none"}}/>
                  <div style={{fontSize:28,marginBottom:8}}>{resumeFile?"✅":"📄"}</div>
                  <div style={{color:resumeFile?"#15803D":TEXT,fontSize:14,fontWeight:600,marginBottom:4}}>{resumeFile?resumeFile.name:"Click to upload Resume"}</div>
                  <div style={{color:MUTED,fontSize:12}}>PDF only • Max 5MB</div>
                </label>
              </div>
              <div style={{background:GREENBG,border:"1px solid #BBF7D0",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#15803D",lineHeight:1.7}}>
                ✦ First 2 applications & 1 referral post free. Upgrade to ₹799 for unlimited.
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading}
              style={{marginTop:24,width:"100%",background:GREEN,border:"none",color:WHITE,padding:"13px",borderRadius:10,fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.7:1}}>
              {loading?"Creating Account...":"Create My Account ✦"}
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}
