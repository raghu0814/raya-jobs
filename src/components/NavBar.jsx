import { useNavigate } from "react-router-dom";
const G="#C9A84C",GL="#E8C96A",BR="#2A2A2A",MT="#666666";

export default function NavBar({ onBack, right }) {
  const navigate = useNavigate();
  return (
    <nav style={{
      position:"sticky", top:0, zIndex:100,
      background:"rgba(8,8,8,0.96)", backdropFilter:"blur(16px)",
      borderBottom:`1px solid ${BR}`,
      padding:"0 20px", height:60,
      display:"flex", alignItems:"center", justifyContent:"space-between"
    }}>
      {onBack
        ? <button onClick={onBack} style={{ background:"none", border:"none", color:MT, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>← Back</button>
        : <div style={{ width:60 }}/>
      }
      <span onClick={()=>navigate("/")} style={{
        fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:20, cursor:"pointer",
        background:`linear-gradient(135deg,${G},${GL})`,
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
      }}>RaYa Jobs</span>
      <div style={{ minWidth:60, display:"flex", justifyContent:"flex-end" }}>{right}</div>
    </nav>
  );
}
