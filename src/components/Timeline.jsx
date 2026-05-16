const G="#C9A84C",S3="#1E1E1E",BR="#2A2A2A",MT="#666666",BG="#080808";

export default function Timeline({ status }) {
  const stages = ["Applied","Reviewing","Referred","Interviewing","Offered","Hired"];
  const idx = stages.indexOf(status);
  const rej = status === "Rejected";
  return (
    <div style={{ display:"flex", alignItems:"center", overflowX:"auto", padding:"4px 0 8px", margin:"10px 0" }}>
      {stages.map((s, i) => {
        const done = !rej && i < idx;
        const active = !rej && i === idx;
        return (
          <div key={s} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <div style={{
                width:24, height:24, borderRadius:"50%",
                background: rej&&i===0 ? "#EF444433" : done ? G : active ? `${G}22` : S3,
                border: `2px solid ${rej&&i===0 ? "#EF4444" : done ? G : active ? G : BR}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:9, color: done ? BG : active ? G : MT, fontWeight:700
              }}>
                {rej&&i===0 ? "✕" : done ? "✓" : i+1}
              </div>
              <span style={{ fontSize:7, color:active?G:MT, fontWeight:active?700:400, whiteSpace:"nowrap" }}>{s}</span>
            </div>
            {i < stages.length-1 && <div style={{ width:20, height:2, background:done?G:S3, margin:"0 2px", marginBottom:14, flexShrink:0 }}/>}
          </div>
        );
      })}
    </div>
  );
}
