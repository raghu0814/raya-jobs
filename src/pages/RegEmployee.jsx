import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import NavBar from "../components/NavBar";

const G="#C9A84C",GL="#E8C96A",BG="#080808",S1="#0F0F0F",S2="#161616",S3="#1E1E1E",BR="#2A2A2A",MT="#666666",WT="#F0EDE6";
const BONUS={"Amazon":{min:75000,max:100000},"Microsoft":{min:100000,max:150000},"Google":{min:150000,max:200000},"Swiggy":{min:75000,max:120000},"Cognizant":{min:30000,max:50000},"Infosys":{min:30000,max:50000},"Wipro":{min:25000,max:45000},"TCS":{min:25000,max:40000},"Accenture":{min:35000,max:55000},"HCL":{min:25000,max:40000}};

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

export default function RegEmployee() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({name:"",email:"",password:"",company:"",designation:"",phone:"",city:""});
  const [j, setJ] = useState({role:"",skills:"",expMin:"",expMax:"",ctcMin:"",ctcMax:"",slots:"",lastDate:"",desc:"",plan:"free"});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const sj=(k,v)=>setJ(p=>({...p,[k]:v}));
  const bonus=BONUS[f.company]||{min:25000,max:75000};

  const handleSubmit = async () => {
    if (!f.name||!f.email||!f.password||!j.role) { setError("Please fill all required fields"); return; }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
      await updateProfile(cred.user, { displayName: f.name });
      await setDoc(doc(db, "employees", cred.user.uid), {
        name:f.name, email:f.email, phone:f.phone,
        company:f.company, designation:f.designation, city:f.city,
        role:"employee", verified:false, registeredAt:serverTimestamp()
      });
      await addDoc(collection(db, "referralPosts"), {
        employeeId:cred.user.uid, employeeName:f.name,
        company:f.company, designation:f.designation,
        role:j.role, skills:j.skills.split(",").map(s=>s.trim()).filter(Boolean),
        expMin:Number(j.expMin)||0, expMax:Number(j.expMax)||0,
        ctcMin:Number(j.ctcMin)||0, ctcMax:Number(j.ctcMax)||0,
        slots:Number(j.slots)||1, description:j.desc,
        bonusMin:bonus.min, bonusMax:bonus.max,
        plan:j.plan, status:"Active", lastDate:j.lastDate,
        postedAt:serverTimestamp()
      });
      nav("/dashboard-employee");
    } catch(e) {
      setError(e.message.includes("email-already-in-use")?"Email already registered. Please login.":"Registration failed. Try again.");
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
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:4}}>Your Details</h2>
            <p style={{color:MT,fontSize:13,marginBottom:16}}>Verify your employment to post referrals</p>
            <div style={{background:`${G}0A`,border:`1px solid ${G}22`,borderRadius:10,padding:"12px 14px",marginBottom:18,display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:20}}>💰</span>
              <div>
                <div style={{color:G,fontWeight:700,fontSize:13}}>Earn ₹{(bonus.min/1000).toFixed(0)}k–₹{(bonus.max/1000).toFixed(0)}k</div>
                <div style={{color:MT,fontSize:11}}>Referral bonus when candidate joins</div>
              </div>
            </div>
            <div style={{display:"grid",gap:14}}>
              <Inp label="Full Name *" placeholder="Your name" value={f.name} onChange={e=>sf("name",e.target.value)}/>
              <Inp label="Company Email *" placeholder="you@company.com" type="email" value={f.email} onChange={e=>sf("email",e.target.value)}/>
              <Inp label="Password *" placeholder="Min 6 characters" type="password" value={f.password} onChange={e=>sf("password",e.target.value)}/>
              <Inp label="Company Name *" placeholder="Amazon, TCS, Cognizant…" value={f.company} onChange={e=>sf("company",e.target.value)}/>
              <Inp label="Your Designation *" placeholder="Senior Developer" value={f.designation} onChange={e=>sf("designation",e.target.value)}/>
              <Inp label="Phone *" placeholder="+91 98765 43210" value={f.phone} onChange={e=>sf("phone",e.target.value)}/>
              <Sel label="City *" options={["Hyderabad","Bangalore","Pune","Mumbai","Chennai","Delhi","Other"]} value={f.city} onChange={e=>sf("city",e.target.value)}/>
            </div>
            <button onClick={()=>setStep(2)} style={{marginTop:22,width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"13px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Continue →</button>
          </>}

          {step===2&&<>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:4}}>The Open Role</h2>
            <p style={{color:MT,fontSize:13,marginBottom:22}}>Details of the role you can refer for</p>
            <div style={{display:"grid",gap:14}}>
              <Inp label="Job Title *" placeholder="Senior Java Developer" value={j.role} onChange={e=>sj("role",e.target.value)}/>
              <Inp label="Skills (comma separated) *" placeholder="Java, Spring Boot, AWS" value={j.skills} onChange={e=>sj("skills",e.target.value)}/>
              <Inp label="Min Experience (yrs)" placeholder="3" value={j.expMin} onChange={e=>sj("expMin",e.target.value)}/>
              <Inp label="Max Experience (yrs)" placeholder="7" value={j.expMax} onChange={e=>sj("expMax",e.target.value)}/>
              <Inp label="CTC Min (LPA)" placeholder="8" value={j.ctcMin} onChange={e=>sj("ctcMin",e.target.value)}/>
              <Inp label="CTC Max (LPA)" placeholder="14" value={j.ctcMax} onChange={e=>sj("ctcMax",e.target.value)}/>
              <Inp label="Referral Slots" placeholder="2" value={j.slots} onChange={e=>sj("slots",e.target.value)}/>
              <Inp label="Last Date" type="date" value={j.lastDate} onChange={e=>sj("lastDate",e.target.value)}/>
            </div>
            <button onClick={()=>setStep(3)} style={{marginTop:22,width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"13px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Continue →</button>
          </>}

          {step===3&&<>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:WT,marginBottom:4}}>Final Step</h2>
            <p style={{color:MT,fontSize:13,marginBottom:22}}>Description and plan</p>
            <div style={{display:"grid",gap:14}}>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase"}}>Job Description</label>
                <textarea placeholder="Describe the role…" value={j.desc} onChange={e=>sj("desc",e.target.value)} rows={4}
                  style={{background:S2,border:`1px solid ${BR}`,borderRadius:8,padding:"12px 14px",color:WT,fontSize:14,outline:"none",fontFamily:"inherit",resize:"vertical"}}/>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:G,letterSpacing:"2px",textTransform:"uppercase",display:"block",marginBottom:10}}>Choose Plan</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[{id:"free",price:"₹0",detail:"1 referral post"},{id:"pro",price:"₹999",detail:"15 posts / 3 months"}].map(p=>(
                    <div key={p.id} onClick={()=>sj("plan",p.id)} style={{background:j.plan===p.id?`${G}15`:S2,border:`1.5px solid ${j.plan===p.id?G:BR}`,borderRadius:10,padding:16,cursor:"pointer"}}>
                      {p.id==="pro"&&<div style={{fontSize:9,color:G,fontWeight:700,letterSpacing:"1px",marginBottom:4}}>BEST VALUE</div>}
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:j.plan===p.id?G:WT}}>{p.price}</div>
                      <div style={{color:MT,fontSize:12,marginTop:3}}>{p.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} style={{marginTop:22,width:"100%",background:`linear-gradient(135deg,${G},${GL})`,border:"none",color:BG,padding:"13px",borderRadius:8,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.7:1}}>
              {loading?"Posting Referral...":"Post Referral ✦"}
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}
