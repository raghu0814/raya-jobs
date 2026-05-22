const GREEN = "#22C55E";
export default function Loader({ text = "Loading..." }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#F8FAFC", gap:16 }}>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:`3px solid ${GREEN}`, animation:"spin 0.8s linear infinite" }}/>
      <span style={{ color:"#64748B", fontSize:14, fontWeight:500 }}>{text}</span>
    </div>
  );
}
