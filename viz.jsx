/* PG Binder — 3D Visualization panel (Plotly interactive surfaces) */
const { useState: useStateV, useEffect: useEffectV, useRef: useRefV } = React;

const SCALE_BY_METRIC = { h: "Inferno", i: "Viridis", l: "YlGnBu" };

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function plotLayout(xName, yName, metric) {
  const ink = cssVar("--ink") || "#222";
  const faint = cssVar("--ink-faint") || "#999";
  const line = cssVar("--line") || "#ddd";
  const surface = cssVar("--surface") || "#fff";
  const axis = {
    backgroundcolor: surface,
    gridcolor: line,
    zerolinecolor: line,
    showbackground: true,
    color: faint,
    titlefont: { size: 12, color: faint, family: "IBM Plex Mono, monospace", weight: 700 },
    tickfont: { size: 9, color: faint, family: "IBM Plex Mono, monospace", weight: 700 },
  };
  return {
    autosize: true,
    margin: { l: 0, r: 0, t: 0, b: 0 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: ink, family: "IBM Plex Sans, sans-serif" },
    scene: {
      xaxis: Object.assign({ title: xName + " (%)" }, axis),
      yaxis: Object.assign({ title: yName + " (%)" }, axis),
      zaxis: Object.assign({ title: metric.abbr + " (" + metric.unit + ")" }, axis),
      camera: { eye: { x: 1.5, y: 1.5, z: 0.9 } },
      aspectmode: "cube",
    },
  };
}

function SurfacePlot({ metric, xName, yName, fixedVal, inputs }) {
  const ref = useRefV(null);

  useEffectV(() => {
    if (!ref.current || !window.Plotly) return;
    const surf = window.Model.computeSurface(metric.id, xName, yName, fixedVal);

    // Marker: current mix projected onto this surface (third var held at fixed)
    const xKey = window.Model.VARS[xName].key;
    const yKey = window.Model.VARS[yName].key;
    const args = { RAB: fixedVal, TCR: fixedVal, P: fixedVal };
    args[xName] = inputs[xKey];
    args[yName] = inputs[yKey];
    const mz = window.Model.getVals(args.RAB, args.TCR, args.P)[metric.id];

    const data = [
      {
        type: "surface",
        x: surf.x,
        y: surf.y,
        z: surf.z,
        colorscale: SCALE_BY_METRIC[metric.id],
        showscale: false,
        opacity: 0.97,
        contours: { z: { show: true, usecolormap: true, width: 1, project: { z: true } } },
        hovertemplate: xName + ": %{x:.1f}<br>" + yName + ": %{y:.1f}<br>" + metric.abbr + ": %{z:.2f}<extra></extra>",
      },
      {
        type: "scatter3d",
        mode: "markers",
        x: [inputs[xKey]],
        y: [inputs[yKey]],
        z: [mz],
        marker: { size: 5, color: cssVar("--ink"), symbol: "diamond", line: { width: 1 } },
        name: "current mix",
        hovertemplate: "current mix<br>" + metric.abbr + ": %{z:.2f}<extra></extra>",
      },
    ];

    window.Plotly.react(ref.current, data, plotLayout(xName, yName, metric), {
      displayModeBar: false,
      responsive: true,
    });
  }, [metric.id, xName, yName, fixedVal, inputs.rab, inputs.tcr, inputs.p]);

  return <div className="plot-div" ref={ref} />;
}

function VisualizationPanel({ inputs }) {
  const [xName, setXName] = useStateV("RAB");
  const [yName, setYName] = useStateV("TCR");
  const [fixedVal, setFixedVal] = useStateV(2);

  const varNames = ["RAB", "TCR", "P"];
  // The "fixed" variable is whichever axis isn't chosen
  const fixedVar = varNames.find((v) => v !== xName && v !== yName);

  function pickX(v) {
    setXName(v);
    if (v === yName) setYName(varNames.find((n) => n !== v && n !== xName) || varNames.find((n) => n !== v));
  }
  function pickY(v) {
    setYName(v);
    if (v === xName) setXName(varNames.find((n) => n !== v && n !== yName) || varNames.find((n) => n !== v));
  }

  return (
    <div className="panel">
      <p className="panel-intro">
        Interactive response surfaces for each predicted grade. Drag to rotate, scroll to zoom.
        Two mix variables sweep their full range; the third (<b>{fixedVar}</b>) is held at the fixed
        value. The diamond marks where the current mix from the left panel lands on each surface.
      </p>

      <div className="viz-controls">
        <div className="ctl">
          <label>X axis</label>
          <select className="num-input" value={xName} onChange={(e) => pickX(e.target.value)}>
            {varNames.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="ctl">
          <label>Y axis</label>
          <select className="num-input" value={yName} onChange={(e) => pickY(e.target.value)}>
            {varNames.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="ctl">
          <label>Fixed · {fixedVar}</label>
          <input
            className="num-input"
            type="number"
            step="0.5"
            value={fixedVal}
            onChange={(e) => setFixedVal(parseFloat(e.target.value) || 0)}
          />
          <span className="hint">held constant for {fixedVar}</span>
        </div>
      </div>

      <div className="plots">
        {window.Model.METRICS.map((m) => {
          const xKey = window.Model.VARS[xName].key;
          const yKey = window.Model.VARS[yName].key;
          const args = { RAB: fixedVal, TCR: fixedVal, P: fixedVal };
          args[xName] = inputs[xKey];
          args[yName] = inputs[yKey];
          const mz = window.Model.getVals(args.RAB, args.TCR, args.P)[m.id];
          return (
            <div className="plot-card" key={m.id} style={{ "--m": METRIC_COLOR[m.id] }}>
              <div className="plot-head">
                <span className="pt"><span style={{ width: 8, height: 8, borderRadius: 8, background: METRIC_COLOR[m.id], display: "inline-block" }} />{m.abbr} · {m.title}</span>
                <span className="pv">mix: {fmt(mz, 1)} {m.unit}</span>
              </div>
              <SurfacePlot
                metric={m}
                xName={xName}
                yName={yName}
                fixedVal={fixedVal}
                inputs={inputs}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { VisualizationPanel });
