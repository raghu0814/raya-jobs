export default function Badge({ children, color = "#22C55E" }) {
  return (
    <span style={{
      background: color + "18",
      border: `1px solid ${color}44`,
      color,
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 100,
      whiteSpace: "nowrap"
    }}>{children}</span>
  );
}
