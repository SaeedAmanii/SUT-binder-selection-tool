/* PG Binder Optimization System — main app */
const { useState: useStateA } = React;

const TABS = [
  { id: "ref", label: "Reference" },
  { id: "viz", label: "3D Visualization" },
  { id: "opt", label: "Inverse Design" },
];

function practicalPgGrade(highTemp, lowTemp) {
  const highGrades = [46, 52, 58, 64, 70, 76, 82];
  const lowGrades = [10, 16, 22, 28, 34, 40, 46];
  const high = highGrades.filter((grade) => grade <= highTemp).pop() || highGrades[0];
  const lowMagnitude = Math.abs(lowTemp);
  const low = lowGrades.filter((grade) => grade <= lowMagnitude).pop() || lowGrades[0];
  return `PG ${high}\u2013${low}`;
}

function ReportPanel({ inputs, vals, continuousGrade, practicalGrade, optimizationResult }) {
  const optimizedGrade = optimizationResult && optimizationResult.feasible
    ? practicalPgGrade(optimizationResult.best.h, optimizationResult.best.l)
    : null;

  return (
    <section className="report-panel" id="report">
      <div className="report-actions">
        <button className="btn ghost" type="button" onClick={() => window.print()}>Print</button>
      </div>

      <div className="report-sheet">
        <header className="report-header">
          <img
            className="report-logo"
            src="sharif-university-logo.jpeg?v=2"
            alt="Sharif University of Technology"
          />
          <div className="report-title">
            <h2>SUT Binder Selection Tool</h2>
          </div>
        </header>

        <div className="report-summary">
          <div className="report-box">
            <h3>Inputs</h3>
            <dl>
              <dt>RAB - Reclaimed Asphalt Binder (%)</dt>
              <dd>{fmt(inputs.rab, 1)}</dd>
              <dt>TCR - Treated Crumb Rubber (%)</dt>
              <dd>{fmt(inputs.tcr, 1)}</dd>
              <dt>P - Waste Plastic (%)</dt>
              <dd>{fmt(inputs.p, 1)}</dd>
              <dt>Base Binder</dt>
              <dd>PG 58-22</dd>
            </dl>
          </div>

          <div className="report-box recommended">
            <h3>Results</h3>
            <div className="report-grade">{practicalGrade}</div>
            <dl>
              <dt>Continuous PG Grade</dt>
              <dd>{continuousGrade}</dd>
              <dt>Continuous High Temperature (°C)</dt>
              <dd>{fmt(vals.h, 1)}</dd>
              <dt>Continuous Intermediate Temperature (°C)</dt>
              <dd>{fmt(vals.i, 1)}</dd>
              <dt>Continuous Low Temperature (°C)</dt>
              <dd>{fmt(vals.l, 1)}</dd>
            </dl>
          </div>
        </div>

        {optimizationResult && optimizationResult.feasible && (
          <div className="report-box report-optimization">
            <h3>Inverse Design Result</h3>
            <div className="report-grade">{optimizedGrade}</div>
            <dl>
              <dt>Desired High Temperature (°C)</dt>
              <dd>{fmt(optimizationResult.targetH, 0)}</dd>
              <dt>Desired Low Temperature Magnitude (°C)</dt>
              <dd>{fmt(optimizationResult.targetL, 0)}</dd>
              <dt>Recommended RAB (%)</dt>
              <dd>{fmt(optimizationResult.best.rab, 1)}</dd>
              <dt>Recommended TCR (%)</dt>
              <dd>{fmt(optimizationResult.best.tcr, 1)}</dd>
              <dt>Recommended P (%)</dt>
              <dd>{fmt(optimizationResult.best.p, 1)}</dd>
              <dt>Continuous High Temperature (°C)</dt>
              <dd>{fmt(optimizationResult.best.h, 1)}</dd>
              <dt>Continuous Intermediate Temperature (°C)</dt>
              <dd>{fmt(optimizationResult.best.i, 1)}</dd>
              <dt>Continuous Low Temperature (°C)</dt>
              <dd>{fmt(optimizationResult.best.l, 1)}</dd>
              <dt>Objective Error</dt>
              <dd>{fmt(optimizationResult.err, 3)}</dd>
            </dl>
          </div>
        )}

        <footer className="report-footer">
          Developed by Saeed Amani - Ph.D. Candidate of Civil Engineering at Sharif University of Technology - saeed.amani@sharif.edu
        </footer>
      </div>
    </section>
  );
}

function App() {
  const captureMode = new URLSearchParams(window.location.search).get("capture");
  const initialTab = ["ref", "viz", "opt"].includes(captureMode) ? captureMode : "ref";
  const [tab, setTab] = useStateA(initialTab);
  const [inputs, setInputs] = useStateA({ rab: 75, tcr: 8, p: 2 });
  const [primary, setPrimary] = useStateA("h");
  const [showReport, setShowReport] = useStateA(false);
  const [optimizationResult, setOptimizationResult] = useStateA(null);

  const vals = window.Model.getVals(inputs.rab, inputs.tcr, inputs.p);
  const pgGrade = `PG ${fmt(vals.h, 1)}\u2013${fmt(Math.abs(vals.l), 1)}`;
  const practicalGrade = practicalPgGrade(vals.h, vals.l);

  function setInput(key, v) { setInputs((s) => Object.assign({}, s, { [key]: v })); }

  return (
    <div className={"app" + (captureMode ? " capture-app" : "")}>
      {/* Masthead */}
      {!captureMode && <header className="masthead">
        <div className="brand">
          <img
            className="brand-logo"
            src="sharif-university-logo.jpeg?v=2"
            alt="Sharif University of Technology"
          />
          <div>
            <h1>SUT Binder Selection Tool</h1>
          </div>
        </div>
      </header>}

      <div className="grid">
        {/* Sidebar — inputs + live prediction */}
        {!captureMode && <aside className="sidebar">
          <Card title="Mix inputs">
            {Object.keys(window.Model.VARS).map((name) => {
              const v = window.Model.VARS[name];
              const meta = window.Model.ABBR.find((a) => a.term === name);
              return (
                <SliderField
                  key={name}
                  vkey={v.key}
                  abbr={name}
                  full={meta.full}
                  unit={meta.unit}
                  min={v.min}
                  max={v.max}
                  step={v.step}
                  value={inputs[v.key]}
                  onChange={(val) => setInput(v.key, val)}
                />
              );
            })}
          </Card>

          <Card title="Results">
            <div className="metrics">
              {window.Model.METRICS.map((m) => (
                <MetricCard
                  key={m.id}
                  id={m.id}
                  abbr={m.abbr}
                  title={m.title}
                  unit={m.unit}
                  value={vals[m.id]}
                  primary={primary === m.id}
                  onClick={() => setPrimary(m.id)}
                />
              ))}
            </div>
            <div className="pg-badge">
              <span className="pg-k">Continuous PG grade</span>
              <span className="pg-v"><span className="accent">{pgGrade}</span></span>
            </div>
            <div className="pg-badge practical">
              <span className="pg-k">PG Grade</span>
              <span className="pg-v"><span className="accent">{practicalGrade}</span></span>
            </div>
          </Card>
        </aside>}

        {/* Main work area */}
        <main className="card main-work" style={{ overflow: "hidden" }}>
          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                className="tab"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "viz" && <VisualizationPanel inputs={inputs} />}
          {tab === "opt" && (
            <OptimizerPanel
              autoRun={captureMode === "opt"}
              onResult={setOptimizationResult}
              onApply={(best) => {
                setInputs({ rab: best.rab, tcr: best.tcr, p: best.p });
                setTab("viz");
              }}
            />
          )}
          {tab === "ref" && <ReferencePanel />}
        </main>
      </div>

      {!captureMode && <div className="show-report-wrap">
        <button className="btn" type="button" onClick={() => setShowReport((v) => !v)}>
          {showReport ? "Hide Report" : "Show Report"}
        </button>
      </div>}

      {!captureMode && showReport && (
        <ReportPanel
          inputs={inputs}
          vals={vals}
          continuousGrade={pgGrade}
          practicalGrade={practicalGrade}
          optimizationResult={optimizationResult}
        />
      )}

      {!captureMode && <footer className="developer-footer">
        <span>Developed by <b>Saeed Amani</b></span>
        <span>Ph.D. Candidate of Civil Engineering at Sharif University of Technology</span>
        <a href="mailto:saeed.amani@sharif.edu">saeed.amani@sharif.edu</a>
      </footer>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
