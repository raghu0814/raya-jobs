export default function Badge({ children, color = "#C9A84C" }) {
  return (
    <span style={{
      background: color + "18",
      border: `1px solid ${color}44`,
      color,
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 100
    }}>{children}</span>
  );
}
