import { useState, useRef } from "react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');
`;

/* ── CSUS Brand Colors ─────────────────────────────── */
const C = {
  green:      "#043927",
  greenLight: "#065f43",
  greenMid:   "#0a7a58",
  greenPale:  "rgba(4, 57, 39, 0.35)",
  gold:       "#c4b581",
  goldBright: "#d4c78f",
  goldDim:    "#aa985e",
  goldPale:   "rgba(196, 181, 129, 0.15)",
  goldGlow:   "rgba(196, 181, 129, 0.25)",
  bg1:        "#05120d",
  bg2:        "#071a13",
  bg3:        "#0a2219",
  text:       "#e8e4d9",
  textDim:    "rgba(232, 228, 217, 0.5)",
  textFaint:  "rgba(232, 228, 217, 0.25)",
  border:     "rgba(196, 181, 129, 0.1)",
  borderHi:   "rgba(196, 181, 129, 0.25)",
};

const Fraction = (() => {
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a;
  }
  class F {
    constructor(num, den = 1) {
      if (typeof num === "string") {
        if (num.includes("/")) {
          const [n, d] = num.split("/").map(Number);
          num = n; den = d;
        } else {
          num = Number(num); den = 1;
        }
      }
      if (den < 0) { num = -num; den = -den; }
      const g = gcd(Math.abs(num), Math.abs(den));
      this.num = num / g;
      this.den = den / g;
    }
    add(o) { return new F(this.num * o.den + o.num * this.den, this.den * o.den); }
    sub(o) { return new F(this.num * o.den - o.num * this.den, this.den * o.den); }
    mul(o) { return new F(this.num * o.num, this.den * o.den); }
    div(o) { return new F(this.num * o.den, this.den * o.num); }
    eq(n) { return this.num === n && this.den === 1; }
    isZero() { return this.num === 0; }
    neg() { return new F(-this.num, this.den); }
    toString() {
      if (this.den === 1) return `${this.num}`;
      return `${this.num}/${this.den}`;
    }
    clone() { return new F(this.num, this.den); }
  }
  return F;
})();

function deepCloneMatrix(m) {
  return m.map(r => r.map(v => v.clone()));
}

function runRowReduction(inputMatrix) {
  let matrix = inputMatrix.map(r => r.map(v => new Fraction(v)));
  const steps = [];
  const rows = matrix.length;
  const cols = matrix[0].length;

  steps.push({ matrix: deepCloneMatrix(matrix), label: "Original Matrix", phase: "start", op: null });

  let pivotRow = 0;
  for (let col = 0; col < cols; col++) {
    if (pivotRow >= rows) break;
    let nonzeroRow = null;
    for (let r = pivotRow; r < rows; r++) {
      if (!matrix[r][col].isZero()) { nonzeroRow = r; break; }
    }
    if (nonzeroRow === null) continue;

    if (nonzeroRow !== pivotRow) {
      [matrix[pivotRow], matrix[nonzeroRow]] = [matrix[nonzeroRow], matrix[pivotRow]];
      steps.push({
        matrix: deepCloneMatrix(matrix),
        label: `Swap R${pivotRow + 1} ↔ R${nonzeroRow + 1}`,
        phase: "forward", op: "swap", rows: [pivotRow, nonzeroRow]
      });
    }
    for (let r = pivotRow + 1; r < rows; r++) {
      if (!matrix[r][col].isZero()) {
        const factor = matrix[r][col].div(matrix[pivotRow][col]);
        for (let c = 0; c < cols; c++) {
          matrix[r][c] = matrix[r][c].sub(factor.mul(matrix[pivotRow][c]));
        }
        steps.push({
          matrix: deepCloneMatrix(matrix),
          label: `R${r + 1} = R${r + 1} − (${factor}) · R${pivotRow + 1}`,
          phase: "forward", op: "eliminate", rows: [r, pivotRow]
        });
      }
    }
    pivotRow++;
  }

  steps.push({ matrix: deepCloneMatrix(matrix), label: "Echelon Form", phase: "mid", op: null });

  const pivots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!matrix[r][c].isZero()) { pivots.push([r, c]); break; }
    }
  }
  for (let i = pivots.length - 1; i >= 0; i--) {
    const [pr, pc] = pivots[i];
    const pv = matrix[pr][pc];
    if (!pv.eq(1)) {
      for (let c = 0; c < cols; c++) matrix[pr][c] = matrix[pr][c].div(pv);
      const recip = new Fraction(pv.den, pv.num);
      steps.push({
        matrix: deepCloneMatrix(matrix),
        label: `R${pr + 1} = (${recip}) · R${pr + 1}`,
        phase: "backward", op: "scale", rows: [pr]
      });
    }
    for (let r = pr - 1; r >= 0; r--) {
      if (!matrix[r][pc].isZero()) {
        const factor = matrix[r][pc];
        for (let c = 0; c < cols; c++) matrix[r][c] = matrix[r][c].sub(factor.mul(matrix[pr][c]));
        steps.push({
          matrix: deepCloneMatrix(matrix),
          label: `R${r + 1} = R${r + 1} − (${factor}) · R${pr + 1}`,
          phase: "backward", op: "eliminate", rows: [r, pr]
        });
      }
    }
  }

  steps.push({ matrix: deepCloneMatrix(matrix), label: "Reduced Echelon Form (RREF)", phase: "end", op: null });
  return steps;
}

function MatrixCell({ value, highlight, pivotHighlight }) {
  const bg = pivotHighlight ? C.goldGlow : highlight ? "rgba(4, 57, 39, 0.3)" : "transparent";
  const border = pivotHighlight
    ? `1px solid ${C.gold}`
    : highlight ? `1px solid ${C.greenMid}` : `1px solid rgba(196,181,129,0.06)`;
  const color = pivotHighlight ? C.goldBright
    : highlight ? "#5dbd9a"
    : value === "0" ? C.textFaint : C.text;

  return (
    <td style={{
      padding: "10px 16px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 15, fontWeight: pivotHighlight ? 700 : 500,
      textAlign: "center",
      background: bg, border, borderRadius: 6, color,
      transition: "all 0.3s ease", minWidth: 52,
    }}>
      {value}
    </td>
  );
}

function MatrixDisplay({ matrix, highlightRows, phase }) {
  const isPivot = (r, c) => {
    if (matrix[r][c].isZero()) return false;
    let leading = -1;
    for (let cc = 0; cc < matrix[0].length; cc++) {
      if (!matrix[r][cc].isZero()) { leading = cc; break; }
    }
    if (leading !== c) return false;
    if (phase === "end" || phase === "mid") {
      for (let rr = 0; rr < matrix.length; rr++) {
        if (rr !== r && !matrix[rr][c].isZero()) return false;
      }
    }
    return true;
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 4, alignSelf: "stretch",
        background: `linear-gradient(180deg, ${C.green}, ${C.gold})`,
        borderRadius: 4, marginRight: 4,
      }} />
      <table style={{ borderCollapse: "separate", borderSpacing: 4 }}>
        <tbody>
          {matrix.map((row, r) => (
            <tr key={r}>
              {row.map((val, c) => (
                <MatrixCell
                  key={c} value={val.toString()}
                  highlight={highlightRows && highlightRows.includes(r)}
                  pivotHighlight={(phase === "end" || phase === "mid") && isPivot(r, c)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{
        width: 4, alignSelf: "stretch",
        background: `linear-gradient(180deg, ${C.gold}, ${C.green})`,
        borderRadius: 4, marginLeft: 4,
      }} />
    </div>
  );
}

function PhaseBadge({ phase }) {
  const config = {
    start:    { label: "INPUT",          bg: "rgba(232,228,217,0.08)", color: C.textDim,    border: "rgba(232,228,217,0.15)" },
    forward:  { label: "FORWARD PHASE",  bg: "rgba(4,57,39,0.25)",    color: "#5dbd9a",    border: "rgba(4,57,39,0.5)" },
    mid:      { label: "ECHELON ✓",      bg: C.goldPale,              color: C.gold,        border: C.borderHi },
    backward: { label: "BACKWARD PHASE", bg: "rgba(196,181,129,0.08)",color: C.goldDim,    border: "rgba(196,181,129,0.2)" },
    end:      { label: "RREF ✓",         bg: "rgba(4,57,39,0.3)",     color: "#6dd4a8",    border: "rgba(4,57,39,0.6)" },
  };
  const c = config[phase] || config.start;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px",
      fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
      fontFamily: "'Outfit', sans-serif",
      color: c.color, background: c.bg,
      border: `1px solid ${c.border}`, borderRadius: 999,
      textTransform: "uppercase",
    }}>
      {c.label}
    </span>
  );
}

function StepCard({ step, index }) {
  const isBookend = step.phase === "start" || step.phase === "mid" || step.phase === "end";
  return (
    <div style={{
      background: isBookend
        ? `linear-gradient(135deg, ${C.bg3}, ${C.bg1})`
        : `rgba(5, 18, 13, 0.7)`,
      border: isBookend ? `1px solid rgba(196,181,129,0.15)` : `1px solid ${C.border}`,
      borderRadius: 16, padding: "24px 28px",
      backdropFilter: "blur(10px)",
      animation: "fadeSlideIn 0.4s ease forwards",
      animationDelay: `${index * 0.05}s`, opacity: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {!isBookend && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: C.textFaint, fontWeight: 600, minWidth: 32,
          }}>
            {String(index).padStart(2, "0")}
          </span>
        )}
        <PhaseBadge phase={step.phase} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13, color: isBookend ? C.text : C.textDim,
          fontWeight: isBookend ? 600 : 400,
        }}>
          {step.label}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", overflowX: "auto", padding: "4px 0" }}>
        <MatrixDisplay matrix={step.matrix} highlightRows={step.rows} phase={step.phase} />
      </div>
    </div>
  );
}

const PRESETS = [
  { name: "3×4 System", rows: 3, cols: 4, data: [[1,2,4,5],[2,4,5,4],[4,5,4,2]] },
  { name: "4×5 System", rows: 4, cols: 5, data: [[1,0,-9,0,4],[0,1,3,0,-1],[0,0,0,2,4],[0,0,0,3,3]] },
  { name: "3×5 System", rows: 3, cols: 5, data: [[1,5,-2,0,-7],[-3,1,9,-5,9],[4,-8,-1,7,0]] },
  { name: "Needs Swaps", rows: 3, cols: 3, data: [[0,0,2],[0,3,6],[1,4,7]] },
];

export default function App() {
  const [rowCount, setRowCount] = useState(3);
  const [colCount, setColCount] = useState(4);
  const [cells, setCells] = useState(() => {
    const m = [];
    for (let r = 0; r < 3; r++) m.push(Array(4).fill(""));
    return m;
  });
  const [steps, setSteps] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  const resizeMatrix = (r, c) => {
    setRowCount(r); setColCount(c);
    const m = [];
    for (let i = 0; i < r; i++) {
      const row = [];
      for (let j = 0; j < c; j++) row.push(cells[i] && cells[i][j] !== undefined ? cells[i][j] : "");
      m.push(row);
    }
    setCells(m);
  };

  const updateCell = (r, c, val) => {
    const next = cells.map(row => [...row]);
    next[r][c] = val;
    setCells(next);
  };

  const loadPreset = (preset) => {
    setRowCount(preset.rows); setColCount(preset.cols);
    setCells(preset.data.map(row => row.map(String)));
    setSteps(null); setError("");
  };

  const solve = () => {
    setError("");
    try {
      const parsed = cells.map((row, r) =>
        row.map((val, c) => {
          const v = val.trim();
          if (v === "") throw new Error(`Empty cell at row ${r + 1}, col ${c + 1}`);
          if (v.includes("/")) {
            const parts = v.split("/");
            if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1]) || Number(parts[1]) === 0)
              throw new Error(`Invalid fraction "${v}" at row ${r + 1}, col ${c + 1}`);
          } else if (isNaN(Number(v))) {
            throw new Error(`Invalid number "${v}" at row ${r + 1}, col ${c + 1}`);
          }
          return v;
        })
      );
      const result = runRowReduction(parsed);
      setSteps(result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) { setError(e.message); }
  };

  const clear = () => {
    setCells(Array.from({ length: rowCount }, () => Array(colCount).fill("")));
    setSteps(null); setError("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${C.bg1} 0%, ${C.bg2} 40%, ${C.bg1} 100%)`,
      color: C.text, fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{FONTS}{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus { outline: none; border-color: ${C.gold} !important; box-shadow: 0 0 0 2px rgba(196,181,129,0.2) !important; }
        input::placeholder { color: ${C.textFaint}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(196,181,129,0.15); border-radius: 3px; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "48px 24px 32px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
            border: `2px solid ${C.gold}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: C.gold,
            fontFamily: "'JetBrains Mono', monospace",
          }}>R</div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, margin: 0,
            background: `linear-gradient(135deg, ${C.goldBright}, ${C.goldDim})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: -0.5,
          }}>
            Row Reduction
          </h1>
        </div>
        <p style={{ color: C.textFaint, fontSize: 14, margin: 0, fontWeight: 400 }}>
          Step-by-step row reduction to Reduced Echelon Form
        </p>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 64px" }}>
        {/* Size + Presets */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: C.textFaint, fontWeight: 500 }}>SIZE</span>
          {[
            { label: "Rows", value: rowCount, set: (v) => resizeMatrix(v, colCount), min: 1, max: 8 },
            { label: "Cols", value: colCount, set: (v) => resizeMatrix(rowCount, v), min: 1, max: 8 },
          ].map(({ label, value, set, min, max }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
              <button onClick={() => value > min && set(value - 1)} style={{
                width: 28, height: 28, borderRadius: 8,
                background: "rgba(196,181,129,0.06)", border: `1px solid ${C.border}`,
                color: C.textDim, cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace",
              }}>−</button>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600,
                color: C.gold, minWidth: 20, textAlign: "center",
              }}>{value}</span>
              <button onClick={() => value < max && set(value + 1)} style={{
                width: 28, height: 28, borderRadius: 8,
                background: "rgba(196,181,129,0.06)", border: `1px solid ${C.border}`,
                color: C.textDim, cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace",
              }}>+</button>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PRESETS.map((p, i) => (
              <button key={i} onClick={() => loadPreset(p)} style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                background: "rgba(196,181,129,0.05)", border: `1px solid ${C.border}`,
                color: C.textDim, cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.target.style.background = C.goldPale; e.target.style.color = C.gold; e.target.style.borderColor = C.borderHi; }}
                onMouseLeave={e => { e.target.style.background = "rgba(196,181,129,0.05)"; e.target.style.color = C.textDim; e.target.style.borderColor = C.border; }}
              >{p.name}</button>
            ))}
          </div>
        </div>

        {/* Matrix input */}
        <div style={{
          background: C.bg3, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: 24, marginBottom: 20,
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "separate", borderSpacing: 6, margin: "0 auto" }}>
              <thead>
                <tr>
                  {Array.from({ length: colCount }, (_, c) => (
                    <th key={c} style={{
                      fontSize: 10, fontWeight: 600, color: C.textFaint,
                      fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, paddingBottom: 6,
                    }}>C{c + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cells.map((row, r) => (
                  <tr key={r}>
                    {row.map((val, c) => (
                      <td key={c}>
                        <input
                          type="text" value={val}
                          onChange={(e) => updateCell(r, c, e.target.value)}
                          placeholder="0"
                          style={{
                            width: 64, height: 42, textAlign: "center", borderRadius: 8,
                            background: "rgba(196,181,129,0.04)",
                            border: `1px solid ${C.border}`,
                            color: C.text, fontSize: 15,
                            fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                            transition: "all 0.2s",
                          }}
                        />
                      </td>
                    ))}
                    <td style={{
                      fontSize: 10, fontWeight: 600, color: C.textFaint,
                      fontFamily: "'JetBrains Mono', monospace", paddingLeft: 8,
                    }}>R{r + 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(220, 70, 70, 0.12)", border: "1px solid rgba(220,70,70,0.3)",
            borderRadius: 12, padding: "12px 16px", marginBottom: 20,
            color: "#f0a0a0", fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
          }}>{error}</div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
          <button onClick={solve} style={{
            flex: 1, padding: "14px 24px", borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
            color: C.gold, fontSize: 15, fontWeight: 700,
            fontFamily: "'Outfit', sans-serif", cursor: "pointer",
            letterSpacing: 0.3, transition: "all 0.2s",
            boxShadow: `0 4px 24px rgba(4, 57, 39, 0.4), inset 0 1px 0 rgba(196,181,129,0.15)`,
          }}
            onMouseEnter={e => e.target.style.boxShadow = `0 4px 32px rgba(4,57,39,0.6), inset 0 1px 0 rgba(196,181,129,0.25)`}
            onMouseLeave={e => e.target.style.boxShadow = `0 4px 24px rgba(4,57,39,0.4), inset 0 1px 0 rgba(196,181,129,0.15)`}
          >Reduce →</button>
          <button onClick={clear} style={{
            padding: "14px 24px", borderRadius: 12,
            background: "rgba(196,181,129,0.05)",
            border: `1px solid ${C.border}`,
            color: C.textDim, fontSize: 15, fontWeight: 500,
            fontFamily: "'Outfit', sans-serif", cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.target.style.background = "rgba(196,181,129,0.1)"; e.target.style.color = C.gold; }}
            onMouseLeave={e => { e.target.style.background = "rgba(196,181,129,0.05)"; e.target.style.color = C.textDim; }}
          >Clear</button>
        </div>

        {/* Steps */}
        {steps && (
          <div ref={resultRef}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ height: 1, flex: 1, background: C.borderHi }} />
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 2,
                color: C.goldDim, fontFamily: "'Outfit', sans-serif",
              }}>SOLUTION — {steps.length - 2} OPERATIONS</span>
              <div style={{ height: 1, flex: 1, background: C.borderHi }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {steps.map((step, i) => (
                <StepCard key={i} step={step} index={i} />
              ))}
            </div>

            {/* Legend */}
            <div style={{
              marginTop: 32, padding: "20px 24px", borderRadius: 14,
              background: "rgba(196,181,129,0.03)", border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: C.textFaint, marginBottom: 12 }}>
                ALGORITHM REFERENCE
              </div>
              <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ color: "#5dbd9a" }}>Forward:</span> Steps 1–4 → Echelon Form<br/>
                <span style={{ color: C.goldDim }}>Backward:</span> Step 5 (scale pivots to 1, eliminate above) → RREF<br/>
                <span style={{ color: C.gold }}>●</span> Highlighted cells = pivot positions
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}