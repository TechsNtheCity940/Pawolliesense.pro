import React, { useMemo, useState } from "react";

type Pt = { x: number; y: number };

// Convert pixel click coords to % coords inside the image box
function toPercent(xPx: number, yPx: number, w: number, h: number): Pt {
  const x = (xPx / w) * 100;
  const y = (yPx / h) * 100;
  return {
    x: Math.max(0, Math.min(100, +x.toFixed(2))),
    y: Math.max(0, Math.min(100, +y.toFixed(2))),
  };
}

export default function ConstellationMapper() {
  const IMG_SRC = useMemo(
    () => "/assets/constellation oli for game.png",
    []
  );

  const [points, setPoints] = useState<Pt[]>([]);
  const [edges, setEdges] = useState<Array<[number, number]>>([]);
  const [edgeStart, setEdgeStart] = useState<number | null>(null);

  function onImageClick(e: React.MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX - box.left;
    const yPx = e.clientY - box.top;

    const p = toPercent(xPx, yPx, box.width, box.height);
    setPoints((prev) => [...prev, p]);
  }

  function undoPoint() {
    setPoints((prev) => prev.slice(0, -1));
    setEdges((prev) => prev.filter(([a, b]) => a < points.length - 1 && b < points.length - 1));
    setEdgeStart(null);
  }

  function clearAll() {
    setPoints([]);
    setEdges([]);
    setEdgeStart(null);
  }

  function startEdge(i: number) {
    setEdgeStart(i);
  }

  function finishEdge(i: number) {
    if (edgeStart === null) return;
    if (edgeStart === i) return;
    const a = Math.min(edgeStart, i);
    const b = Math.max(edgeStart, i);

    // avoid duplicates
    const key = `${a}-${b}`;
    const exists = edges.some(([x, y]) => `${Math.min(x, y)}-${Math.max(x, y)}` === key);
    if (!exists) setEdges((prev) => [...prev, [a, b]]);
    setEdgeStart(null);
  }

  const exported = `const STAR_POINTS = ${JSON.stringify(points, null, 2)};\n\nconst LINE_EDGES = ${JSON.stringify(edges, null, 2)};`;

  return (
    <div className="card col-12" style={{ overflow: "hidden" }}>
      <h2 className="section-title">Constellation Mapper (Dev Tool)</h2>
      <p className="section-lede">
        Click the exact star locations on the Oli constellation image. Then copy the exported arrays
        into <code>StarConstellationGame.tsx</code>.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1000 / 700",
            borderRadius: 16,
            border: "1px solid rgba(80,120,160,.35)",
            overflow: "hidden",
            cursor: "crosshair",
            background: "#050611",
          }}
          onClick={onImageClick}
        >
          <img
            src={IMG_SRC}
            alt="Oli constellation mapping reference"
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", opacity: 0.9 }}
            draggable={false}
          />

          {/* overlay points */}
          {points.map((p, i) => (
            <button
              key={i}
              type="button"
              title={`Star ${i} (${p.x}%, ${p.y}%)`}
              onClick={(ev) => {
                ev.stopPropagation();
                // edge creation: first click selects start, second click completes edge
                if (edgeStart === null) startEdge(i);
                else finishEdge(i);
              }}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: "translate(-50%, -50%)",
                width: 14,
                height: 14,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.25)",
                background: edgeStart === i
                  ? "radial-gradient(circle at 30% 30%, #fff, #ffe8a8 40%, rgba(255,232,168,.0) 72%)"
                  : "radial-gradient(circle at 30% 30%, #fff, #c8f1ff 35%, #6acfff 70%, rgba(0,0,0,0) 72%)",
                boxShadow: "0 0 14px 4px rgba(115,210,255,.35)",
                cursor: "pointer",
              }}
            />
          ))}

          {/* overlay lines */}
          <svg
            viewBox="0 0 1000 700"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          >
            {edges.map(([a, b], idx) => {
              const p1 = points[a];
              const p2 = points[b];
              if (!p1 || !p2) return null;
              return (
                <line
                  key={idx}
                  x1={1000 * (p1.x / 100)}
                  y1={700 * (p1.y / 100)}
                  x2={1000 * (p2.x / 100)}
                  y2={700 * (p2.y / 100)}
                  stroke="rgba(159,232,255,.95)"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="cta secondary" onClick={undoPoint} disabled={points.length === 0}>
            Undo last star
          </button>
          <button type="button" className="cta secondary" onClick={clearAll} disabled={points.length === 0}>
            Clear all
          </button>
          <div className="mini" style={{ opacity: 0.9, alignSelf: "center" }}>
            Stars: <b>{points.length}</b> • Lines: <b>{edges.length}</b> •
            Edge mode: {edgeStart === null ? "click a star to start a line" : "now click another star to connect"}
          </div>
        </div>

        <div className="field">
          <label className="label">Export (copy/paste into StarConstellationGame.tsx)</label>
          <textarea
            readOnly
            value={exported}
            rows={10}
            style={{ width: "100%", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
          />
          <p className="help">
            Tip: You can map only stars first (no lines). Then connect stars by clicking one star, then another.
          </p>
        </div>
      </div>
    </div>
  );
}
