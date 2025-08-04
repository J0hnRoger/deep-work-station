import { useForestStore } from "../../hooks/useForestStore";

interface DebugInfoProps {
  debugMode: boolean;
}

export const DebugInfo = ({ debugMode }: DebugInfoProps) => {
  const { trees } = useForestStore();

  if (!debugMode) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontFamily: "monospace",
        fontSize: "12px",
        zIndex: 1000,
        minWidth: "200px",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Debug Info</h3>
      <div style={{ marginBottom: "10px" }}>
        <strong>Arbres: {trees.length}</strong>
      </div>
      {trees.map((t) => (
        <div key={t.id} style={{ marginBottom: "5px", fontSize: "11px" }}>
          <span style={{ color: "#ff6b6b" }}>ID: {t.id}</span>
          <br />
          <span style={{ color: "#4ecdc4" }}>
            Pos: ({t.position.x.toFixed(1)}, {t.position.y.toFixed(1)}, {t.position.z.toFixed(1)})
          </span>
        </div>
      ))}
      <div style={{ marginTop: "10px", fontSize: "10px", color: "#95a5a6" }}>
        <div>🟥 Point rouge = Position exacte</div>
        <div>🟨 Cube jaune = Zone de collision</div>
        <div>🔴🟢🔵 Axes = Orientation</div>
      </div>
    </div>
  );
}; 