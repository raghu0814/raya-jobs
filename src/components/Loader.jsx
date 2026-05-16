const G = "#C9A84C";
export default function Loader({ text = "Loading..." }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#080808", gap:16 }}>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #1E1E1E", borderTop:`3px solid ${G}`, animation:"spin 0.8s linear infinite" }}/>
      <span style={{ color:"#666", fontSize:14 }}>{text}</span>
    </div>
  );
}
