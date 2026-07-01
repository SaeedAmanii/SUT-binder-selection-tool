/* PG Binder — Reference panel (glossary + ranges) */
function ReferencePanel() {
  return (
    <div className="panel">
      <h3 className="section-title">About this tool</h3>
      <p className="about-tool">
        The SUT Binder Selection Tool was developed using the dataset generated in the study
        entitled “Performance-Based Framework for Selecting High-Recycled-Asphalt Binders Modified
        with Waste Plastic and Treated Crumb Rubber.” Based on a PG 58-22 base binder, the tool
        recommends the required percentages of waste plastic (P) and treated crumb rubber (TCR) for
        a specified reclaimed asphalt binder (RAB) content to achieve the desired performance grade
        (PG).
      </p>

      <h3 className="section-title">Abbreviations</h3>
      <p className="panel-intro" style={{ marginBottom: 14 }}>
        Every symbol used across the dashboard, defined. Inputs are mix components (% by weight);
        outputs are the predicted Performance Grade temperatures.
      </p>
      <div className="gloss">
        {window.Model.ABBR.map((a) => (
          <div className="gloss-item" key={a.term}>
            <span className="g-term">{a.term}</span>
            <span>
              <span className="g-full">{a.full}</span>
              <div className="g-note">{a.note}</div>
              {(a.unit || a.range) && (
                <div className="g-meta">
                  {a.unit ? `unit: ${a.unit}` : ""}
                  {a.unit && a.range ? "   ·   " : ""}
                  {a.range ? `range: ${a.range[0]}–${a.range[1]}` : ""}
                </div>
              )}
            </span>
          </div>
        ))}
      </div>

      <h3 className="section-title">Input ranges &amp; optimizer rules</h3>
      <div className="note-strip" style={{ marginBottom: 10 }}>
        <span>
          <b>Design space:</b> RAB ∈ [0, 100] %, TCR ∈ [0, 16] %, P ∈ [0, 4] %. The 3D surfaces
          sweep each variable across this range on a 20×20 grid.
        </span>
      </div>
      <div className="note-strip">
        <span>
          <b>Feasibility (inverse design):</b> a mix is feasible when it satisfies both hard
          constraints H ≥ target&nbsp;H and |L| ≥ target&nbsp;|L|. Among feasible candidates the
          optimizer minimises the objective error (H − target&nbsp;H)² + (|L| − target&nbsp;|L|)²
          over a Monte-Carlo random search.
        </span>
      </div>
    </div>
  );
}

Object.assign(window, { ReferencePanel });
