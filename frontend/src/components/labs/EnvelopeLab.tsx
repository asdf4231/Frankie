import { useMemo, useState, type ReactNode } from 'react'
import Icon from '../Icon'
import MessageContent from '../MessageContent'
import LabMath from './LabMath'
import LabPlot, { type LabAnnotation, type LabSeries } from './LabPlot'
import ParamControl from './ParamControl'
import type { LabInfo } from './catalog'
import './EnvelopeLab.css'

const MULTIPLIER_DEFAULT = 0.3
const MULTIPLIER_DELTA_LIMIT = 1
const ENVELOPE_DEFAULT = 1
const CONSTRAINT_DEFAULT = 0.1
const CONSTRAINT_DELTA_LIMIT = 0.4

const sample = (min: number, max: number) => Array.from({ length: 101 }, (_, i) => min + (max - min) * i / 100)
const objective = (x: number, a: number) => -x * x + 2 * a * x + 4 * a * a
const fixed = (number: number, decimals = 2) => (Math.abs(number) < 0.5 * 10 ** -decimals ? 0 : number).toFixed(decimals)

const MULTIPLIER_MODEL = String.raw`
Lecture 5, Example 19.1. Let $f^*(a)$ denote the maximum value of

$$
\begin{aligned}
\max_{x_1,x_2}\quad &f(x_1,x_2)=x_1^2x_2\\
\text{subject to}\quad &h(x_1,x_2):=2x_1^2+x_2^2=a.
\end{aligned}
$$

The original bound is $a=3$; the slider sets $a=3+\Delta a$. The Lagrangian is

$$
L=f-\mu(h-a).
$$

At $a=3$, the positive maximizing pair is $x_1^*=x_2^*=1$, with multiplier $\mu^*=1/2$ and maximum $f^*(3)=1$. At a maximizer,

$$
\nabla f=\mu^*\nabla h,\qquad \frac{df^*}{da}=\mu^*.
$$

Thus $f^*(3+\Delta a)\approx1+\frac12\Delta a$. At $a=3.3$, the estimate is $1.15$; the exact maximum is $(1.1)^{3/2}\approx1.1537$.
`

const ENVELOPE_MODEL = String.raw`
Lecture 5, Example 19.4. The choice is $x\in\mathbb R$ and the parameter is $a\in\mathbb R$:

$$
\max_x\quad f(x,a)=-x^2+2ax+4a^2.
$$

The maximizing choice $x^*(a)$ satisfies $\partial f/\partial x=-2x+2a=0$. Since $\partial^2 f/\partial x^2=-2<0$, it is the unique maximum. Define the optimized value $f^*(a)$ by

$$
\begin{aligned}
x^*(a)&=a,\\
f^*(a)&:=f(x^*(a),a)=5a^2.
\end{aligned}
$$

The envelope theorem gives

$$
\begin{aligned}
\frac{df^*}{da}&=\frac{\partial f}{\partial a}(x^*(a),a)\\
&=2x^*(a)+8a=10a.
\end{aligned}
$$
`

const CONSTRAINT_MODEL = String.raw`
Lecture 5, Example 19.6. Let $f^*(a)$ denote the maximum value of

$$
\begin{aligned}
\max_{x,y}\quad &f(x,y)=xy\\
\text{subject to}\quad &g(x,y;a):=x^2+ay^2\leq1.
\end{aligned}
$$

The original problem has $a=1$; the slider sets $a=1+\Delta a$. With multiplier $\lambda\geq0$,

$$
L(x,y,\lambda;a)=xy-\lambda(x^2+ay^2-1).
$$

At $a=1$, the positive maximizing pair and its multiplier are

$$
x^*=y^*=\frac1{\sqrt2},\qquad \lambda^*=\frac12.
$$

The envelope theorem gives

$$
\left.\frac{df^*}{da}\right|_{a=1}
=\left.\frac{\partial L}{\partial a}\right|_*
=-\lambda^*(y^*)^2=-\frac14.
$$

Thus $f^*(1+\Delta a)\approx\frac12-\frac14\Delta a$. At $a=1.1$, the estimate is $0.475$; the exact maximum is $1/(2\sqrt{1.1})\approx0.4767$.
`

function Parameters({ onReset, children }: { onReset: () => void; children: ReactNode }) {
  return (
    <section className="tools-panel panel" aria-labelledby="envelope-parameters-title">
      <div className="tools-panel-header">
        <h2 id="envelope-parameters-title" className="panel-title">Parameters</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>
          <Icon name="refresh" size={14} /> Reset
        </button>
      </div>
      {children}
    </section>
  )
}

function UnconstrainedExperiment({ a, onChange, onReset }: {
  a: number
  onChange: (a: number) => void
  onReset: () => void
}) {
  const maximum = objective(a, a)
  const slope = 10 * a
  const charts = useMemo(() => {
    // Include the exact optimizer so both curves pass through their marked points.
    const choices = [...new Set([...sample(-4, 4), a])].sort((x, y) => x - y)
    const parameters = [...new Set([...sample(-3, 3), a])].sort((x, y) => x - y)
    const functionSeries: LabSeries[] = [
      { name: 'Objective function', y: choices.map((x) => objective(x, a)), color: 0, showLegend: true },
      { name: 'Optimum', x: [a], y: [maximum], color: 0, showLegend: false, labelOnHover: true },
    ]
    const tangent = sample(-3, 3)
    const valueSeries: LabSeries[] = [
      { name: 'Maximum value', y: parameters.map((p) => objective(p, p)), color: 0, showLegend: true },
      { name: 'Tangent line', x: tangent, y: tangent.map((p) => maximum + slope * (p - a)), color: 1, dash: 'dash', width: 2.7, showLegend: true },
      { name: 'Maximum value', x: [a], y: [maximum], color: 0, showLegend: false, labelOnHover: true },
    ]
    return { choices, parameters, functionSeries, valueSeries }
  }, [a, maximum, slope])

  return (
    <>
      <Parameters onReset={onReset}>
        <ParamControl name="envelope-a" label={<>Parameter <LabMath tex="a" /></>} min={-3} max={3} step={0.01} decimals={2} value={a} onChange={onChange} />
      </Parameters>

      <div className="tools-main">
        <div className="chart-row">
          <section className="chart-card panel">
            <h2 className="panel-title">Objective function</h2>
            <LabPlot x={charts.choices} series={charts.functionSeries} height={310} xLabel={{ tex: 'x' }} yLabel={{ tex: 'f(x,a)' }} ariaLabel={`Objective at parameter a = ${fixed(a)}, with its maximum at x = ${fixed(a)}`} xRange={[-4, 4]} yRange={[-22, 50]} referenceLines={[{ x0: -4, y0: maximum, x1: 4, y1: maximum }]} />
          </section>
          <section className="chart-card panel">
            <h2 className="panel-title">Maximum value</h2>
            <LabPlot x={charts.parameters} series={charts.valueSeries} height={310} xLabel={{ tex: 'a' }} yLabel={{ tex: 'f^*(a)' }} ariaLabel={`Maximum value and tangent line at a = ${fixed(a)}`} xRange={[-3.2, 3.2]} yRange={[-22, 50]} referenceLines={[{ x0: -3.2, y0: maximum, x1: 3.2, y1: maximum }]} />
          </section>
        </div>

        <section className="tools-model" aria-labelledby="envelope-model-title">
          <h2 id="envelope-model-title" className="panel-title">Model and solution</h2>
          <MessageContent content={ENVELOPE_MODEL} />
        </section>
      </div>
    </>
  )
}

function MultiplierExperiment({ deltaA, onChange, onReset }: {
  deltaA: number
  onChange: (deltaA: number) => void
  onReset: () => void
}) {
  const a = 3 + deltaA
  const optimum = Math.sqrt(a / 3)
  const maximum = optimum ** 3
  const charts = useMemo(() => {
    const extent = 1.08 * Math.sqrt(3 + MULTIPLIER_DELTA_LIMIT)
    const angles = sample(0, Math.PI / 2)
    const ellipse = (bound: number) => ({
      x: angles.map((t) => Math.sqrt(bound / 2) * Math.cos(t)),
      y: angles.map((t) => Math.sqrt(bound) * Math.sin(t)),
    })
    const contour = (level: number) => {
      const x = [...new Set([...sample(Math.sqrt(level / extent), extent), optimum])]
        .filter((x) => x >= Math.sqrt(level / extent) && x <= extent).sort((x, y) => x - y)
      return { x, y: x.map((x) => level / x ** 2) }
    }
    const geometry: LabSeries[] = []
    const annotations: LabAnnotation[] = []
    const levels = [0.5, 1, 1.5].filter((level) => Math.abs(level - maximum) >= 1e-10)
    for (const [index, level] of levels.entries()) {
      geometry.push({ name: 'Level curves', ...contour(level), color: 0, opacity: 0.35, width: 1.1, showLegend: index === 0 })
      const x = 0.64 * extent
      annotations.push({ x, y: level / x ** 2, tex: `f=${level}`, color: 0, opacity: 0.7, xanchor: 'left', xshift: 8, yanchor: 'bottom', yshift: 0 })
    }
    // Equality constraints are curves, not shaded feasible interiors.
    geometry.push(
      { name: 'Initial constraint', ...ellipse(3), color: 'muted', dash: 'dash', opacity: 0.65, width: 1.4 },
      { name: 'Constraint', ...ellipse(a), color: 1 },
      { name: 'Optimal contour', ...contour(maximum), color: 0 },
      { name: 'Initial optimum', x: [1], y: [1], color: 'muted', markerSymbol: 'circle-open', showLegend: false, labelOnHover: true },
      { name: 'Optimum', x: [optimum], y: [optimum], color: 0, showLegend: false, labelOnHover: true },
    )
    const gradients = [
      { tex: String.raw`\nabla f`, x: 2 * optimum ** 2, y: optimum ** 2, color: 0 as const },
      { tex: String.raw`\nabla h`, x: 4 * optimum, y: 2 * optimum, color: 1 as const },
    ]
    // A common scale preserves the gradient-length ratio, which equals the multiplier.
    const scale = 0.6 * Math.min(
      (extent - optimum) / Math.max(...gradients.map((g) => g.x)),
      (extent - optimum) / Math.max(...gradients.map((g) => g.y)),
    )
    gradients.forEach((gradient, index) => {
      const x = optimum + scale * gradient.x
      const y = optimum + scale * gradient.y
      annotations.push(
        { x, y, ax: optimum, ay: optimum, text: '', color: gradient.color, opacity: 0.9 },
        { x, y, tex: gradient.tex, color: gradient.color, opacity: 0.9, xanchor: index === 0 ? 'right' : 'left', xshift: index === 0 ? -8 : 8, yanchor: index === 0 ? 'bottom' : 'top', yshift: index === 0 ? 8 : -8 },
      )
    })
    const parameters = [...new Set([...sample(3 - MULTIPLIER_DELTA_LIMIT, 3 + MULTIPLIER_DELTA_LIMIT), 3, a])].sort((x, y) => x - y)
    const tangent = sample(3 - MULTIPLIER_DELTA_LIMIT, 3 + MULTIPLIER_DELTA_LIMIT)
    const tangentValue = (p: number) => 1 + 0.5 * (p - 3)
    const values: LabSeries[] = [
      { name: 'Maximum value', y: parameters.map((p) => (p / 3) ** 1.5), color: 0 },
      { name: 'Tangent line', x: tangent, y: tangent.map(tangentValue), color: 1, dash: 'dash', width: 2.7 },
      { name: 'Initial maximum value', x: [3], y: [1], color: 'muted', markerSymbol: 'circle-open', showLegend: false, labelOnHover: true },
      { name: 'Linear approximation', x: [a], y: [tangentValue(a)], color: 1, showLegend: false, labelOnHover: true },
      { name: 'Maximum value', x: [a], y: [maximum], color: 0, showLegend: false, labelOnHover: true },
    ]
    return { geometry, annotations, parameters, values, extent }
  }, [a, optimum, maximum])

  return (
    <>
      <Parameters onReset={onReset}>
        <ParamControl name="multiplier-delta-a" label={<LabMath tex={String.raw`\Delta a`} />} min={-MULTIPLIER_DELTA_LIMIT} max={MULTIPLIER_DELTA_LIMIT} step={0.01} decimals={2} value={deltaA} onChange={onChange} />
      </Parameters>
      <div className="tools-main">
        <div className="chart-row">
          <section className="chart-card panel">
            <h2 className="panel-title">Constraints and objective contours</h2>
            <LabPlot x={[]} series={charts.geometry} annotations={charts.annotations} height={380} xLabel={{ tex: 'x_1' }} yLabel={{ tex: 'x_2' }} ariaLabel="Original and changed equality constraints, objective contours, and gradient arrows at the maximizing point, drawn on a common scale" xRange={[0, charts.extent]} yRange={[0, charts.extent]} equalAspect />
          </section>
          <section className="chart-card panel">
            <h2 className="panel-title">Maximum value</h2>
            <LabPlot x={charts.parameters} series={charts.values} height={380} xLabel={{ tex: 'a' }} yLabel={{ tex: 'f^*(a)' }} ariaLabel={`Maximum value and linear approximation at a = ${fixed(a)}, with the tangent line fixed at a = 3`} xRange={[3 - MULTIPLIER_DELTA_LIMIT - 0.05, 3 + MULTIPLIER_DELTA_LIMIT + 0.05]} yRange={[0.3, 1.7]} />
          </section>
        </div>
        <section className="tools-model" aria-labelledby="envelope-model-title">
          <h2 id="envelope-model-title" className="panel-title">Model and solution</h2>
          <MessageContent content={MULTIPLIER_MODEL} />
        </section>
      </div>
    </>
  )
}

function ConstrainedExperiment({ deltaA, onChange, onReset }: {
  deltaA: number
  onChange: (deltaA: number) => void
  onReset: () => void
}) {
  const a = 1 + deltaA
  const optimumX = Math.SQRT1_2
  const optimumY = 1 / Math.sqrt(2 * a)
  const optimizedValue = optimumX * optimumY
  const charts = useMemo(() => {
    const angles = sample(0, Math.PI / 2)
    const ellipse = (a: number) => ({
      x: angles.map((t) => Math.cos(t)),
      y: angles.map((t) => Math.sin(t) / Math.sqrt(a)),
    })
    // Keep the axes fixed as the constraint changes from its baseline at a = 1.
    const extent = 1.08 / Math.sqrt(1 - CONSTRAINT_DELTA_LIMIT)
    const contour = (level: number) => {
      const x = [...new Set([...sample(level / extent, extent), optimumX])]
        .filter((x) => x >= level / extent && x <= extent).sort((x, y) => x - y)
      return { x, y: x.map((x) => level / x) }
    }
    const feasible: LabSeries[] = [
      { name: 'Feasible region', ...ellipse(a), color: 1, fill: 'tozeroy', mode: 'none', showLegend: false, hover: false },
    ]
    const annotations: LabAnnotation[] = []
    const levels = [0.25, 0.5, 0.75].filter((level) => Math.abs(level - optimizedValue) >= 1e-10)
    for (const [index, level] of levels.entries()) {
      feasible.push({ name: 'Level curves', ...contour(level), color: 0, opacity: 0.35, width: 1.1, showLegend: index === 0 })
      const x = 0.5 / (0.4 * extent)
      annotations.push({ x, y: level / x, tex: `f=${level}`, color: 0, opacity: 0.7, xanchor: 'left', xshift: 14, yanchor: 'middle', yshift: 5 })
    }
    feasible.push(
      { name: 'Initial constraint', ...ellipse(1), color: 'muted', dash: 'dash', opacity: 0.65, width: 1.4 },
      { name: 'Constraint', ...ellipse(a), color: 1 },
      { name: 'Optimal contour', ...contour(optimizedValue), color: 0 },
      { name: 'Initial optimum', x: [Math.SQRT1_2], y: [Math.SQRT1_2], color: 'muted', markerSymbol: 'circle-open', showLegend: false, labelOnHover: true },
      { name: 'Optimum', x: [optimumX], y: [optimumY], color: 0, showLegend: false, labelOnHover: true },
    )
    const parameters = [...new Set([...sample(1 - CONSTRAINT_DELTA_LIMIT, 1 + CONSTRAINT_DELTA_LIMIT), 1, a])].sort((x, y) => x - y)
    const tangent = sample(1 - CONSTRAINT_DELTA_LIMIT, 1 + CONSTRAINT_DELTA_LIMIT)
    const tangentValue = (p: number) => 0.5 - 0.25 * (p - 1)
    const values: LabSeries[] = [
      { name: 'Maximum value', y: parameters.map((p) => 1 / (2 * Math.sqrt(p))), color: 0 },
      { name: 'Tangent line', x: tangent, y: tangent.map(tangentValue), color: 1, dash: 'dash', width: 2.7 },
      { name: 'Initial maximum value', x: [1], y: [0.5], color: 'muted', markerSymbol: 'circle-open', showLegend: false, labelOnHover: true },
      { name: 'Linear approximation', x: [a], y: [tangentValue(a)], color: 1, showLegend: false, labelOnHover: true },
      { name: 'Maximum value', x: [a], y: [optimizedValue], color: 0, showLegend: false, labelOnHover: true },
    ]
    return { feasible, annotations, parameters, values, extent }
  }, [a, optimizedValue, optimumX, optimumY])

  return (
    <>
      <Parameters onReset={onReset}>
        <ParamControl name="constraint-delta-a" label={<LabMath tex={String.raw`\Delta a`} />} min={-CONSTRAINT_DELTA_LIMIT} max={CONSTRAINT_DELTA_LIMIT} step={0.01} decimals={2} value={deltaA} onChange={onChange} />
      </Parameters>

      <div className="tools-main">
        <div className="chart-row">
          <section className="chart-card panel">
            <h2 className="panel-title">Constraints and objective contours</h2>
            <LabPlot x={[]} series={charts.feasible} annotations={charts.annotations} height={380} xLabel={{ tex: 'x' }} yLabel={{ tex: 'y' }} ariaLabel="Initial and current constraints, objective contours, and their maximizing points; the shaded region is feasible after the change" xRange={[0, charts.extent]} yRange={[0, charts.extent]} equalAspect />
          </section>
          <section className="chart-card panel">
            <h2 className="panel-title">Maximum value</h2>
            <LabPlot x={charts.parameters} series={charts.values} height={380} xLabel={{ tex: 'a' }} yLabel={{ tex: 'f^*(a)' }} ariaLabel={`Maximum value and linear approximation at a = ${fixed(a)}, with the tangent line fixed at a = 1`} xRange={[1 - CONSTRAINT_DELTA_LIMIT - 0.02, 1 + CONSTRAINT_DELTA_LIMIT + 0.02]} yRange={[0.2, 0.7]} />
          </section>
        </div>

        <section className="tools-model" aria-labelledby="envelope-model-title">
          <h2 id="envelope-model-title" className="panel-title">Model and solution</h2>
          <MessageContent content={CONSTRAINT_MODEL} />
        </section>
      </div>
    </>
  )
}

export default function EnvelopeLab({ lab }: { lab: LabInfo }) {
  const [experiment, setExperiment] = useState<'19.1' | '19.4' | '19.6'>('19.4')
  const [multiplierDelta, setMultiplierDelta] = useState(MULTIPLIER_DEFAULT)
  const [envelope, setEnvelope] = useState(ENVELOPE_DEFAULT)
  const [constraintDelta, setConstraintDelta] = useState(CONSTRAINT_DEFAULT)

  return (
    <div className="envelope-lab">
      <header className="page-header envelope-header">
        <p className="tool-card-topic">{lab.topic}</p>
        <div className="envelope-title-row">
          <h1 className="page-title">{lab.title}</h1>
          <div className="segmented envelope-experiments" role="group" aria-label="Envelope theorem examples">
            <button type="button" aria-pressed={experiment === '19.1'} onClick={() => setExperiment('19.1')}>Multiplier</button>
            <button type="button" aria-pressed={experiment === '19.4'} onClick={() => setExperiment('19.4')}>Unconstrained</button>
            <button type="button" aria-pressed={experiment === '19.6'} onClick={() => setExperiment('19.6')}>Constrained</button>
          </div>
        </div>
      </header>
      <div className="tools-layout">
        {experiment === '19.1' && <MultiplierExperiment deltaA={multiplierDelta} onChange={setMultiplierDelta} onReset={() => setMultiplierDelta(MULTIPLIER_DEFAULT)} />}
        {experiment === '19.4' && <UnconstrainedExperiment a={envelope} onChange={setEnvelope} onReset={() => setEnvelope(ENVELOPE_DEFAULT)} />}
        {experiment === '19.6' && <ConstrainedExperiment deltaA={constraintDelta} onChange={setConstraintDelta} onReset={() => setConstraintDelta(CONSTRAINT_DEFAULT)} />}
      </div>
    </div>
  )
}
