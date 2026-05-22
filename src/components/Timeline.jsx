const GREEN="#22C55E",PRIMARY="#1A2E4A",BORDER="#E2E8F0",MUTED="#94A3B8",WHITE="#FFFFFF";

export default function Timeline({ status }) {
  const stages = ["Applied","Reviewing","Referred","Interviewing","Offered","Hired"];
  const idx = stages.indexOf(status);
  const rej = status === "Rejected";
  return (
    <div style={{ display:"flex", alignItems:"center", overflowX:"auto", padding:"8px 0", margin:"10px 0" }}>
      {stages.map((s, i) => {
        const done = !rej && i < idx;
        const active = !rej && i === idx;
        return (
          <div key={s} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{
                width:26, height:26, borderRadius:"50%",
                background: rej&&i===0 ? "#FEE2E2" : done ? GREEN : active ? "#F0FDF4" : "#F1F5F9",
                border: `2px solid ${rej&&i===0 ? "#EF4444" : done ? GREEN : active ? GREEN : BORDER}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, color: done ? WHITE : active ? GREEN : MUTED, fontWeight:700
              }}>
                {rej&&i===0 ? "✕" : done ? "✓" : i+1}
              </div>
              <span style={{ fontSize:8, color:active?GREEN:MUTED, fontWeight:active?700:500, whiteSpace:"nowrap" }}>{s}</span>
            </div>
            {i < stages.length-1 && (
              <div style={{ width:22, height:2, background:done?GREEN:BORDER, margin:"0 2px", marginBottom:16, flexShrink:0 }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}
