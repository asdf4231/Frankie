import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import MessageContent from '../components/MessageContent'
import LabPlot from '../components/labs/LabPlot'
import { followRoute, routeHref, useRoute } from '../lib/router'
import './Tools.css'

type LabCard = {
  key: 'savings-lab'
  title: string
  description: string
  badge: string
}

type LabParams = {
  initialWealth: number
  income: number
  interest: number
  beta: number
  gamma: number
  periods: number
}

type Solution = {
  value: number
  consumption: number[]
  wealthPath: number[]
}

const DEFAULT_PARAMS: LabParams = {
  initialWealth: 30,
  income: 15,
  interest: 0.04,
  beta: 0.96,
  gamma: 1,
  periods: 10,
}

const CONTROLS: { key: keyof LabParams; label: string; min: number; max: number; step: number; decimals: number }[] = [
  { key: 'initialWealth', label: 'Initial wealth', min: 0, max: 100, step: 0.1, decimals: 1 },
  { key: 'income', label: 'Income per period', min: 1, max: 40, step: 0.1, decimals: 1 },
  { key: 'interest', label: 'Interest rate per period', min: 0, max: 0.12, step: 0.001, decimals: 3 },
  { key: 'beta', label: 'Discount factor β', min: 0.7, max: 0.999, step: 0.001, decimals: 3 },
  { key: 'gamma', label: 'Curvature γ', min: 0.5, max: 3, step: 0.01, decimals: 2 },
  { key: 'periods', label: 'Horizon (periods)', min: 1, max: 20, step: 1, decimals: 0 },
]

function ParamControl({ name, label, min, max, step, decimals, value, onChange }: {
  name: keyof LabParams
  label: string
  min: number
  max: number
  step: number
  decimals: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="control-group">
      <div className="control-heading">
        <label htmlFor={`lab-${name}`}>{label}</label>
        <span className="control-value">{value.toFixed(decimals)}</span>
      </div>
      <input
        className="control-slider"
        id={`lab-${name}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

const utility = (consumption: number, gamma: number) => {
  if (Math.abs(gamma - 1) < 1e-8) return Math.log(consumption)
  return (Math.pow(consumption, 1 - gamma) - 1) / (1 - gamma)
}

// For each possible first period m with zero next-period wealth, solve the Euler
// equation in closed form up to m; after that, consume income and hold zero wealth.
const solve = (initialWealth: number, params: LabParams): Solution => {
  const R = 1 + params.interest
  const growth = Math.pow(params.beta * R, 1 / params.gamma)
  let incomeAnnuity = 0
  let consumptionAnnuity = 0
  let discount = 1
  let growthPower = 1
  let best: Solution | null = null

  for (let m = 1; m <= params.periods; m += 1) {
    incomeAnnuity += discount
    consumptionAnnuity += discount * growthPower
    const firstConsumption = (initialWealth + params.income * incomeAnnuity) / consumptionAnnuity
    const consumption: number[] = []
    const wealthPath = [initialWealth]
    let wealth = initialWealth
    let value = 0
    let betaPower = 1
    let consumptionGrowth = 1
    let feasible = true

    for (let t = 0; t < params.periods; t += 1) {
      const c = t < m ? firstConsumption * consumptionGrowth : params.income
      const nextWealth = R * (wealth + params.income - c)
      if (nextWealth < -1e-9 * (initialWealth + params.income * params.periods)) {
        feasible = false
        break
      }
      consumption.push(c)
      value += betaPower * utility(c, params.gamma)
      wealth = t + 1 === m ? 0 : Math.max(0, nextWealth) // remove round-off at the binding date
      wealthPath.push(wealth)
      betaPower *= params.beta
      consumptionGrowth *= growth
    }

    if (feasible && (!best || value > best.value)) {
      best = { value, consumption, wealthPath }
    }
    discount /= R
    growthPower *= growth
  }

  // Spending all current resources immediately is always feasible (income is positive).
  return best!
}

const MODEL_DESCRIPTION = String.raw`
With initial wealth $w_0$, constant income $y$, and gross return $R=1+r$, choose consumption to solve

$$
\max_{\{c_t\}_{t=0}^{T-1}}\sum_{t=0}^{T-1}\beta^t u(c_t),\qquad
u(c)=\begin{cases}\log c,&\gamma=1,\\[4pt]\dfrac{c^{1-\gamma}-1}{1-\gamma},&\gamma\ne1.\end{cases}
$$

subject to

$$
w_{t+1}=R(w_t+y-c_t),\qquad w_t\geq0,\qquad 0<c_t\leq w_t+y.
$$

There is no bequest value, so $w_T=0$ at the optimum. While savings remain positive, the Euler equation gives

$$
u'(c_t)=\beta R u'(c_{t+1}),\qquad c_{t+1}=(\beta R)^{1/\gamma}c_t.
$$

If savings reach zero before $T$, consumption equals income $y$ thereafter.
`

const LABS: LabCard[] = [
  {
    key: 'savings-lab',
    title: 'Consumption & Savings Lab',
    description: 'Explore how wealth, income, interest rates, and preferences shape optimal consumption and saving.',
    badge: 'Dynamic Programming',
  },
]

function Tools() {
  const route = useRoute()
  const [params, setParams] = useState<LabParams>(DEFAULT_PARAMS)

  const simulation = useMemo(() => solve(params.initialWealth, params), [params])

  const updateParam = <K extends keyof LabParams>(key: K, value: LabParams[K]) => {
    setParams((current) => ({ ...current, [key]: value }))
  }

  const wealthPeriods = useMemo(() => simulation.wealthPath.map((_, period) => period), [simulation])
  const consumptionPeriods = useMemo(() => simulation.consumption.map((_, period) => period), [simulation])
  const wealthSeries = useMemo(() => [{ name: 'Wealth', y: simulation.wealthPath }], [simulation])
  const consumptionSeries = useMemo(() => [{ name: 'Consumption', y: simulation.consumption }], [simulation])

  if (route.lab !== 'savings-lab') {
    return (
      <section className="tools-page">
        <header className="tools-header"><h1>Labs</h1></header>
        <div className="tool-catalog">
          {LABS.map((lab) => {
            const destination = { view: 'lab' as const, lab: lab.key, sidebarSearch: route.sidebarSearch }
            return (
              <a key={lab.key} className="tool-card panel" href={routeHref(destination)} onClick={(event) => followRoute(event, destination)}>
                <span className="badge badge-accent">{lab.badge}</span>
                <h2>{lab.title}</h2>
                <p>{lab.description}</p>
                <span className="tool-action">Open lab <Icon name="chevron-right" size={16} /></span>
              </a>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <section className="tools-page">
      <header className="tools-header">
        <h1>Consumption &amp; Savings Lab</h1>
        <a className="btn tools-back" href={routeHref({ view: 'lab', sidebarSearch: route.sidebarSearch })} onClick={(event) => followRoute(event, { view: 'lab', sidebarSearch: route.sidebarSearch })}>
          <Icon name="chevron-left" size={16} /> Back to labs
        </a>
      </header>

      <div className="tools-layout">
        <aside className="tools-panel panel">
          <div className="tools-panel-header">
            <h2>Parameters</h2>
            <button type="button" className="btn btn-sm" onClick={() => setParams({ ...DEFAULT_PARAMS })}>
              <Icon name="refresh" size={14} /> Reset
            </button>
          </div>
          {CONTROLS.map((control) => (
            <ParamControl
              key={control.key}
              name={control.key}
              label={control.label}
              min={control.min}
              max={control.max}
              step={control.step}
              decimals={control.decimals}
              value={params[control.key]}
              onChange={(value) => updateParam(control.key, value)}
            />
          ))}
        </aside>

        <div className="tools-main">
          <div className="chart-row">
            <div className="chart-card">
              <h2>Optimal wealth path</h2>
              <LabPlot x={wealthPeriods} series={wealthSeries} xLabel="Period t" yLabel="Wealth" ariaLabel="Optimal wealth path by period" zeroBaseline />
            </div>
            <div className="chart-card">
              <h2>Optimal consumption path</h2>
              <LabPlot x={consumptionPeriods} series={consumptionSeries} xLabel="Period t" yLabel="Consumption" ariaLabel="Optimal consumption path by period" />
            </div>
          </div>
          <div className="insight-box panel">
            <h2>Model and solution</h2>
            <MessageContent content={MODEL_DESCRIPTION} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ToolsPage() {
  return <Tools />
}
