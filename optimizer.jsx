/* PG Binder — Inverse-Design Optimizer panel */
const { useState: useStateO, useEffect: useEffectO } = React;

function OptimizerPanel({ onApply, onResult, autoRun }) {
  const [targetH, setTargetH] = useStateO(70);
  const [targetL, setTargetL] = useStateO(10);
  const [nIter, setNIter] = useStateO(25000);
  const [running, setRunning] = useStateO(false);
  const [result, setResult] = useStateO(null); // {best, err} | {feasible:false}

  function run() {
    setRunning(true);
    setResult(null);
    // defer so the spinner paints before the (synchronous) search runs
    setTimeout(() => {
      const out = window.Model.optimizeInputs(Number(targetH), Number(targetL), Number(nIter));
      if (!out.best) {
        setResult({ feasible: false });
        if (onResult) onResult({ feasible: false, targetH: Number(targetH), targetL: Number(targetL), nIter: Number(nIter) });
      } else {
        const nextResult = {
          feasible: true,
          best: out.best,
          err: out.err,
          targetH: Number(targetH),
          targetL: Number(targetL),
          nIter: Number(nIter),
        };
        setResult(nextResult);
        if (onResult) onResult(nextResult);
      }
      setRunning(false);
    }, 30);
  }

  useEffectO(() => {
    if (autoRun) run();
  }, []);

  return (
    <div className="panel">
      <p className="panel-intro">
        Inverse design — instead of predicting grades from a mix, search the design space for a
        mix that <b>meets target grades</b>. A Monte-Carlo search samples random
        RAB / TCR / P combinations and keeps the feasible candidate closest to the targets, subject
        to the hard PG constraints H&nbsp;≥&nbsp;target&nbsp;H and |L|&nbsp;≥&nbsp;target&nbsp;|L|.
      </p>

      <div className="opt-grid">
        <div className="card" style={{ boxShadow: "none" }}>
          <div className="card-body">
            <div className="field" style={{ marginBottom: 16 }}>
              <div className="row">
                <span className="name"><span className="abbr">Desired H</span><span className="full">High temp, ≥ (°C)</span></span>
              </div>
              <input className="num-input" type="number" step="1" value={targetH}
                     onChange={(e) => setTargetH(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 16 }}>
              <div className="row">
                <span className="name"><span className="abbr">Desired |L|</span><span className="full">Low temp magnitude, ≥ (°C)</span></span>
              </div>
              <input className="num-input" type="number" step="1" value={targetL}
                     onChange={(e) => setTargetL(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 18 }}>
              <div className="row">
                <span className="name"><span className="abbr">Iterations</span><span className="full">random samples</span></span>
              </div>
              <input className="num-input" type="number" step="1000" value={nIter}
                     onChange={(e) => setNIter(e.target.value)} />
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ width: "100%", justifyContent: "center" }}>
              {running ? "Searching…" : "Optimize"}
            </button>
          </div>
        </div>

        <div className="opt-result">
          {!result && !running && (
            <div className="opt-empty">
              Set target grades and run the search.<br />
              Results appear here with the feasible mix design.
            </div>
          )}
          {running && <div className="opt-empty">Sampling {Number(nIter).toLocaleString()} candidate mixes…</div>}

          {result && result.feasible === false && (
            <div>
              <span className="status-tag bad"><span className="dot" />NOT FEASIBLE</span>
              <p style={{ marginTop: 14, color: "var(--ink-soft)", fontSize: 13.5 }}>
                No mix in the design space satisfies both constraints. Try lowering the target H
                or target |L|, or increasing iterations.
              </p>
            </div>
          )}

          {result && result.feasible && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="status-tag ok"><span className="dot" />FEASIBLE DESIGN FOUND</span>
                <button className="btn ghost" style={{ padding: "7px 14px", fontSize: 13 }}
                        onClick={() => onApply(result.best)}>
                  Load mix into inputs →
                </button>
              </div>
              <table className="kv-table">
                <tbody>
                  <tr><td>RAB — Reclaimed Asphalt Binder (%)</td><td>{fmt(result.best.rab, 1)}</td></tr>
                  <tr><td>TCR — Treated Crumb Rubber (%)</td><td>{fmt(result.best.tcr, 1)}</td></tr>
                  <tr><td>P — Plastic (%)</td><td>{fmt(result.best.p, 1)}</td></tr>
                  <tr className="grp"><td>H — High Temperature (°C)</td><td>{fmt(result.best.h, 2)} <span className="ckmark">≥ {targetH} ✓</span></td></tr>
                  <tr><td>I — Intermediate Temperature (°C)</td><td>{fmt(result.best.i, 2)}</td></tr>
                  <tr><td>|L| — Low Temperature (°C)</td><td>{fmt(Math.abs(result.best.l), 2)} <span className="ckmark">≥ {targetL} ✓</span></td></tr>
                  <tr className="grp"><td>Objective error</td><td>{fmt(result.err, 3)}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OptimizerPanel });
