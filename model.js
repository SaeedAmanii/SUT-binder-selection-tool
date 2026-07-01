/* =========================================================================
   PG Binder Optimization System — MODEL
   Faithful 1:1 port of the original Python model (untitled10.py).
   Equations, ranges and optimizer logic are UNCHANGED.
   ========================================================================= */
(function () {
  "use strict";

  // --- MODEL --------------------------------------------------------------
  // get_vals(rab, tcr, p) -> {h, i, l}
  function getVals(rab, tcr, p) {
    const h =
      0.14 * rab +
      0.28 * p +
      0.14 * Math.exp(p) -
      4.8e-3 * (rab * tcr - rab * p - tcr * p - p * p) +
      63;

    const i =
      (2.5e15 * (rab - tcr + p)) / (5.6e14 * rab + 4.6e15) -
      6.1e-5 * tcr * (rab + 8.1) * (rab + 9.3) +
      19;

    const l =
      -0.67 * tcr -
      0.23 * p * (p - 7.5) -
      0.89 * Math.exp(-rab) * (rab - p + 7.4) -
      19;

    return { h: h, i: i, l: l };
  }

  // numpy.linspace(start, stop, num)
  function linspace(start, stop, num) {
    const arr = new Array(num);
    if (num === 1) { arr[0] = start; return arr; }
    const step = (stop - start) / (num - 1);
    for (let k = 0; k < num; k++) arr[k] = start + step * k;
    return arr;
  }

  // Input variable definitions (ranges from the source code)
  const VARS = {
    RAB: { key: "rab", min: 0, max: 100, step: 0.5, range: [0, 100] },
    TCR: { key: "tcr", min: 0, max: 16, step: 0.5, range: [0, 16] },
    P:   { key: "p",   min: 0, max: 4,  step: 0.5, range: [0, 4] },
  };

  // Metric (output) definitions
  const METRICS = [
    { id: "h", abbr: "H", title: "High Temperature",         unit: "°C" },
    { id: "i", abbr: "I", title: "Intermediate Temperature", unit: "°C" },
    { id: "l", abbr: "L", title: "Low Temperature",          unit: "°C" },
  ];

  // Abbreviation glossary — every term shown in the UI is defined here.
  const ABBR = [
    { term: "PG",  full: "Performance Grade", note: "Asphalt binder grading: PG (High)–(|Low|), e.g. PG 70–22." },
    { term: "RAB", full: "Reclaimed Asphalt Binder", note: "Artificial RAP binder content.", unit: "%", range: [0, 100] },
    { term: "TCR", full: "Treated Crumb Rubber", note: "Recycled tire-rubber modifier content.", unit: "%", range: [0, 16] },
    { term: "P",   full: "Plastic", note: "Recycled-plastic modifier content.", unit: "%", range: [0, 4] },
    { term: "RAP", full: "Reclaimed Asphalt Pavement", note: "Source of reclaimed binder." },
    { term: "H",   full: "High Temperature", note: "Predicted high-temperature grade.", unit: "°C" },
    { term: "I",   full: "Intermediate Temperature", note: "Predicted intermediate-temperature grade.", unit: "°C" },
    { term: "L",   full: "Low Temperature", note: "Predicted low-temperature grade.", unit: "°C" },
  ];

  // Build a 3D surface for one metric over (xName, yName), holding the
  // third variable at fixedVal. Mirrors update_plot() in the source.
  function computeSurface(metricId, xName, yName, fixedVal) {
    const ranges = {
      RAB: linspace(0, 100, 20),
      TCR: linspace(0, 16, 20),
      P: linspace(0, 4, 20),
    };
    const xVals = ranges[xName];
    const yVals = ranges[yName];

    // Z[j][k] indexed by y (rows), x (cols) — Plotly surface convention.
    const Z = [];
    for (let j = 0; j < yVals.length; j++) {
      const row = [];
      for (let k = 0; k < xVals.length; k++) {
        const args = { RAB: null, TCR: null, P: null };
        args[xName] = xVals[k];
        args[yName] = yVals[j];
        for (const key in args) if (args[key] === null) args[key] = fixedVal;
        const v = getVals(args.RAB, args.TCR, args.P);
        row.push(v[metricId]);
      }
      Z.push(row);
    }
    return { x: xVals, y: yVals, z: Z };
  }

  // --- OPTIMIZATION CORE --------------------------------------------------
  // Faithful port of optimize_inputs(): Monte-Carlo random search with
  // hard PG constraints (h >= target_h, |l| >= target_l). Candidates are
  // sampled at the practical 0.5% increments used by the mix input controls.
  function optimizeInputs(targetH, targetL, nIter) {
    nIter = nIter || 25000;
    let best = null;
    let bestErr = 1e18;
    let foundFeasible = false;

    function randomStepValue(v) {
      const stepCount = Math.round((v.max - v.min) / v.step);
      return v.min + Math.floor(Math.random() * (stepCount + 1)) * v.step;
    }

    for (let n = 0; n < nIter; n++) {
      const rab = randomStepValue(VARS.RAB);
      const tcr = randomStepValue(VARS.TCR);
      const p = randomStepValue(VARS.P);

      const v = getVals(rab, tcr, p);
      const h = v.h, i = v.i, l = v.l;

      if (h < targetH) continue;          // HARD CONSTRAINT
      if (Math.abs(l) < targetL) continue; // HARD CONSTRAINT

      foundFeasible = true;

      const err = Math.pow(h - targetH, 2) + Math.pow(Math.abs(l) - targetL, 2);
      if (err < bestErr) {
        bestErr = err;
        best = { rab: rab, tcr: tcr, p: p, h: h, i: i, l: l };
      }
    }

    if (!foundFeasible) return { best: null, err: null };
    return { best: best, err: bestErr };
  }

  window.Model = {
    getVals: getVals,
    linspace: linspace,
    computeSurface: computeSurface,
    optimizeInputs: optimizeInputs,
    VARS: VARS,
    METRICS: METRICS,
    ABBR: ABBR,
  };
})();
