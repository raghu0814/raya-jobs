import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase/config";
import NavBar from "../components/NavBar";

const G="#C9A84C",GL="#E8C96A",BG="#080808",S1="#0F0F0F",S2="#161616",S3="#1E1E1E",BR="#2A2A2A",MT="#666666",WT="#F0EDE6";

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

const Inp=({label,placeholder,type="text",value,onChange,maxLength})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} maxLength={maxLength}
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

function SkillSelector({skills,setSkills,exclude}){
  const [input,setInput]=useState("");
  const add=(s)=>{const v=s.trim();if(v&&!skills.includes(v))setSkills(p=>[...p,v]);};
  const handleKey=(e)=>{if(e.key==="Enter"&&input.trim()){add(input);setInput("");}};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>Other Skills</label>
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

export default function Register(){
  const nav=useNavigate();
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [resumeFile,setResumeFile]=useState(null);
  const [skills,setSkills]=useState([]);
  const [f,setF]=useState({
    name:"",phone:"",email:"",password:"",pan:"",city:"",
    exp:"",company:"",title:"",cCTC:"",eCTC:"",
    notice:"",pSkill:"",jobType:""
  });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const validatePAN=(pan)=>/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

  const checkPANExists=async(pan)=>{
    const q=query(collection(db,"users"),where("pan","==",pan));
    const snap=await getDocs(q);
    return !snap.empty;
  };

  const handleNext1=async()=>{
    if(!f.name||!f.email||!f.password||!f.pan||!f.city){setError("Please fill all required fields");return;}
    if(f.password.length<6){setError("Password must be at least 6 characters");return;}
    if(!validatePAN(f.pan)){setError("Invalid PAN format. Example: ABCDE1234F");return;}
    setLoading(true);setError("");
    try{
      const exists=await checkPANExists(f.pan);
      if(exists){setError("An account already exists with this PAN. One account per person only.");setLoading(false);return;}
      setStep(2);
    }catch(e){setError("Verification failed. Try again.");}
    finally{setLoading(false);}
  };

  const handleSubmit=async()=>{
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
        name:f.name,email:f.email,phone:f.phone,
        pan:f.pan,city:f.city,
        experience:f.exp,currentCompany:f.company,
        currentTitle:f.title,currentCTC:f.cCTC,
        expectedCTC:f.eCTC,noticePeriod:f.notice,
        primarySkill:f.pSkill,otherSkills:skills,
        jobType:f.jobType,resumeURL,
        plan:"free",status:"Active",
        registeredAt:serverTimestamp()
      });
      nav("/dashboard");
    }catch(e){
      setError(e.message.includes("email-already-in-use")?"Email already registered. Please login.":"Registration failed. Try again.");
    }finally{setLoading(false);}
  };

  const Prog=()=>(
    <div style={{display:"flex",gap:6,marginBottom:24}}>
      {[1,2,3].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?`linear-gradient(90deg,${G},${GL})`:S3}}/>)}
    </div>
  );

  return(
    <div style={{background:BG,minHeight:"100vh",color:WT,fontFamily:"'DM Sans',sans-serif",paddingBottom:40}}>
      <NavBar onBack={step>1?()=>{setStep(s=>s-1);setError("");}:()=>nav("/")} right={<span style={{color:MT,fontSize:12}}>Step {step}/3</span>}/>
      <div style={{maxWidth:480,margin:"32px auto",padding:"0 20px"}}>
        <Prog/>
        <div style={{background:S1,border:`1px solid ${BR}`,borderRadius:16,padding:28}}>
          {error&&<div style={{background:"#1A0A0A",border:"1px solid #EF444444",borderRadius:8,padding:"10px 14px",color:"#EF4444",fontSize:13,marginBottom:16,lineHeight:1.5}}>{error}</div>}

          {/* ── STEP 1 — Account Details ── */}
          {step===1&&<>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:4}}>Create Account</h2>
            <p style={{color:MT,fontSize:13,marginBottom:20}}>One account to find jobs and post referrals</p>
            <div style={{display:"grid",gap:14}}>
              <Inp label="Full Name *" placeholder="Your full name" value={f.name} onChange={e=>set("name",e.target.value)}/>
              <Inp label="Phone *" placeholder="+91 98765 43210" value={f.phone} onChange={e=>set("phone",e.target.value)}/>
              <Inp label="Email *" placeholder="you@email.com" type="email" value={f.email} onChange={e=>set("email",e.target.value)}/>
              <Inp label="Password *" placeholder="Min 6 characters" type="password" value={f.password} onChange={e=>set("password",e.target.value)}/>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>PAN Number *</label>
                <input placeholder="ABCDE1234F" value={f.pan}
                  onChange={e=>set("pan",e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
                  maxLength={10}
                  style={{background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"12px 14px",color:WT,fontSize:14,outline:"none",fontFamily:"inherit",letterSpacing:"3px"}}
                  onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BR}/>
                <span style={{fontSize:11,color:MT}}>🔒 Ensures one account per person. Format: ABCDE1234F</span>
              </div>
              <Sel label="City *" options={["Hyderabad","Bangalore","Pune","Mumbai","Chennai","Delhi","Noida","Other"]} value={f.city} onChange={e=>set("city",e.target.value)}/>
            </div>
            <button onClick={handleNext1} disabled={loading}
              style={{marginTop:20,width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"13px",borderRadius:8,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.7:1}}>
              {loading?"Verifying...":"Continue →"}
            </button>
            <div style={{textAlign:"center",marginTop:14}}>
              <span style={{color:MT,fontSize:13}}>Already have an account? </span>
              <span onClick={()=>nav("/login")} style={{color:G,fontWeight:700,fontSize:13,cursor:"pointer"}}>Login</span>
            </div>
          </>}

          {/* ── STEP 2 — Professional Info ── */}
          {step===2&&<>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:4}}>Professional Info</h2>
            <p style={{color:MT,fontSize:13,marginBottom:20}}>Helps us match you with the right referrals</p>
            <div style={{display:"grid",gap:14}}>
              <Inp label="Total Experience *" placeholder="e.g. 4 years" value={f.exp} onChange={e=>set("exp",e.target.value)}/>
              <Inp label="Current Company" placeholder="Cognizant, TCS, Amazon…" value={f.company} onChange={e=>set("company",e.target.value)}/>
              <Inp label="Current Job Title *" placeholder="Senior Java Developer" value={f.title} onChange={e=>set("title",e.target.value)}/>
              <Inp label="Current CTC (LPA)" placeholder="8" value={f.cCTC} onChange={e=>set("cCTC",e.target.value)}/>
              <Inp label="Expected CTC (LPA)" placeholder="14" value={f.eCTC} onChange={e=>set("eCTC",e.target.value)}/>
              <Sel label="Notice Period" options={["Immediate","15 Days","30 Days","60 Days","90 Days"]} value={f.notice} onChange={e=>set("notice",e.target.value)}/>
              <Sel label="Preferred Job Type" options={["Full Time","Remote","Hybrid","Contract"]} value={f.jobType} onChange={e=>set("jobType",e.target.value)}/>
            </div>
            <button onClick={()=>setStep(3)}
              style={{marginTop:20,width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"13px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Continue →
            </button>
          </>}

          {/* ── STEP 3 — Skills & Resume ── */}
          {step===3&&<>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:4}}>Skills & Resume</h2>
            <p style={{color:MT,fontSize:13,marginBottom:20}}>Add your skills and upload your resume</p>
            <div style={{display:"grid",gap:16}}>
              <Sel label="Primary Skill *" options={allSkills} value={f.pSkill} onChange={e=>set("pSkill",e.target.value)}/>
              <SkillSelector skills={skills} setSkills={setSkills} exclude={f.pSkill}/>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>Resume (PDF)</label>
                <label style={{border:`2px dashed ${resumeFile?G:BR}`,borderRadius:10,padding:20,textAlign:"center",cursor:"pointer",background:resumeFile?`${G}08`:"transparent"}}>
                  <input type="file" accept=".pdf" onChange={e=>setResumeFile(e.target.files[0])} style={{display:"none"}}/>
                  <div style={{fontSize:28,marginBottom:6}}>{resumeFile?"✅":"📄"}</div>
                  <div style={{color:resumeFile?G:WT,fontSize:14,fontWeight:600,marginBottom:4}}>{resumeFile?resumeFile.name:"Click to upload Resume"}</div>
                  <div style={{color:MT,fontSize:12}}>PDF only • Max 5MB</div>
                </label>
              </div>
              <div style={{background:`${G}08`,border:`1px solid ${G}22`,borderRadius:8,padding:"10px 14px",fontSize:12,color:MT,lineHeight:1.7}}>
                ✦ First 2 applications & 1 referral post free. Upgrade to ₹799 for unlimited everything.
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading}
              style={{marginTop:20,width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"13px",borderRadius:8,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.7:1}}>
              {loading?"Creating Account...":"Create My Account ✦"}
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}
