/* PG Binder — shared UI components (exported to window) */
const { useState, useEffect, useRef } = React;

const METRIC_COLOR = { h: "var(--hi)", i: "var(--mid)", l: "var(--lo)" };

function fmt(v, d) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toFixed(d === undefined ? 2 : d);
}

/* Slider field with abbreviation + live value */
function SliderField({ vkey, abbr, full, unit, min, max, step, value, onChange }) {
  return (
    <div className="field">
      <div className="row">
        <span className="name">
          <span className="abbr">{abbr}</span>
          <span className="full">{full}{unit ? ` (${unit})` : ""}</span>
        </span>
        <span className="valbox">{fmt(value, 1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <div className="scale">
        <span>{min}</span>
        <span>{max}{unit ? ` ${unit}` : ""}</span>
      </div>
    </div>
  );
}

/* Live metric card (H / I / L) */
function MetricCard({ id, abbr, title, unit, value, primary, onClick }) {
  return (
    <div
      className={"metric" + (primary ? " primary" : "")}
      style={{ "--m": METRIC_COLOR[id] }}
      onClick={onClick}
      role="button"
      title={`Set ${title} as primary output`}
    >
      <span className="m-label">
        <span className="m-abbr"><span className="dot" />{abbr} · Continuous {title}</span>
        <span className="m-full">predicted grade</span>
      </span>
      <span style={{ textAlign: "right" }}>
        <span className="m-val">{fmt(value, 1)}</span>{" "}
        <span className="m-unit">{unit}</span>
      </span>
    </div>
  );
}

/* Card shell */
function Card({ eyebrow, title, right, children }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
          <h2>{title}</h2>
        </div>
        {right || null}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

Object.assign(window, {
  SliderField,
  MetricCard,
  Card,
  fmt,
  METRIC_COLOR,
});
