import { useNavigate } from "react-router-dom";
const PRIMARY="#1A2E4A",GREEN="#22C55E",BORDER="#E2E8F0",MUTED="#64748B";

export default function NavBar({ onBack, right }) {
  const navigate = useNavigate();
  return (
    <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BORDER}`,padding:"0 20px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      {onBack ? (
        <button onClick={onBack} style={{background:"none",border:`1px solid ${BORDER}`,color:MUTED,cursor:"pointer",fontSize:13,fontFamily:"inherit",padding:"6px 14px",borderRadius:8,fontWeight:500}}>← Back</button>
      ) : <div style={{width:80}}/>}
      <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>navigate("/")}>
        <div style={{width:32,height:32,borderRadius:9,background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤝</div>
        <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:18,color:PRIMARY}}>Rytaine Jobs</span>
      </div>
      <div style={{minWidth:80,display:"flex",justifyContent:"flex-end"}}>{right}</div>
    </nav>
  );
}
