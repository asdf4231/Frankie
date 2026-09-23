import { useMemo, useState } from 'react'
import MessageContent from '../components/MessageContent'
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

type ChartPoint = { x: number; y: number }

function LineChart({ values, xLabel, title, zeroBaseline = false }: {
  values: ChartPoint[]
  xLabel: string
  title: string
  zeroBaseline?: boolean
}) {
  const width = 420
  const height = 245
  const left = 58
  const right = 14
  const top = 12
  const bottom = 48
  const lastX = values[values.length - 1].x
  const xMax = Math.max(1, lastX)
  const minValue = Math.min(...values.map((point) => point.y))
  const maxValue = Math.max(...values.map((point) => point.y))
  const padding = maxValue === minValue ? Math.max(0.5, maxValue * 0.05) : Math.max(0.005, (maxValue - minValue) * 0.1)
  const yMin = zeroBaseline ? 0 : Math.max(0, minValue - padding)
  const yMax = zeroBaseline ? Math.max(1, maxValue) : maxValue + padding
  const xPosition = (x: number) => left + (x / xMax) * (width - left - right)
  const yPosition = (y: number) => top + ((yMax - y) / (yMax - yMin)) * (height - top - bottom)
  const xTicks = [...new Set([0, Math.round(lastX / 2), lastX])]
  const yTicks = [yMin, (yMin + yMax) / 2, yMax]
  const yDecimals = [1, 2, 3].find((digits) => new Set(yTicks.map((tick) => tick.toFixed(digits))).size === yTicks.length) ?? 3
  const path = values.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xPosition(point.x)} ${yPosition(point.y)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={title}>
      {yTicks.map((tick, index) => (
        <g key={index}>
          <line x1={left} x2={width - right} y1={yPosition(tick)} y2={yPosition(tick)} className="chart-grid-line" />
          <text x={left - 8} y={yPosition(tick)} textAnchor="end" dominantBaseline="middle" className="chart-tick">{Number(tick.toFixed(yDecimals))}</text>
        </g>
      ))}
      <line x1={left} x2={left} y1={top} y2={height - bottom} className="chart-axis" />
      <line x1={left} x2={width - right} y1={height - bottom} y2={height - bottom} className="chart-axis" />
      {xTicks.map((tick, index) => (
        <g key={index}>
          <line x1={xPosition(tick)} x2={xPosition(tick)} y1={height - bottom} y2={height - bottom + 4} className="chart-axis" />
          <text x={xPosition(tick)} y={height - bottom + 18} textAnchor="middle" className="chart-tick">{tick}</text>
        </g>
      ))}
      <text x={left + (width - left - right) / 2} y={height - 5} textAnchor="middle" className="chart-label">{xLabel}</text>
      <path d={path} className="chart-line" />
      {values.length === 1 && <circle cx={xPosition(values[0].x)} cy={yPosition(values[0].y)} r="4" className="chart-point" />}
    </svg>
  )
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
  const [params, setParams] = useState<LabParams>({
    initialWealth: 30,
    income: 15,
    interest: 0.04,
    beta: 0.96,
    gamma: 1,
    periods: 10,
  })

  const simulation = useMemo(() => solve(params.initialWealth, params), [params])

  const updateParam = <K extends keyof LabParams>(key: K, value: LabParams[K]) => {
    setParams((current) => ({ ...current, [key]: value }))
  }

  const wealthPoints = simulation.wealthPath.map((wealth, period) => ({ x: period, y: wealth }))
  const consumptionPoints = simulation.consumption.map((consumption, period) => ({ x: period, y: consumption }))

  if (route.lab !== 'savings-lab') {
    return (
      <section className="tools-page">
        <header className="tools-header"><h1>Choose a Lab</h1></header>
        <div className="tool-catalog">
          {LABS.map((lab) => {
            const destination = { view: 'lab' as const, lab: lab.key, sidebarSearch: route.sidebarSearch }
            return (
              <a key={lab.key} className="tool-card" href={routeHref(destination)} onClick={(event) => followRoute(event, destination)}>
                <span className="tool-badge">{lab.badge}</span>
                <h2>{lab.title}</h2>
                <p>{lab.description}</p>
                <span className="tool-action">Open lab →</span>
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
        <a className="secondary-button" href={routeHref({ view: 'lab', sidebarSearch: route.sidebarSearch })} onClick={(event) => followRoute(event, { view: 'lab', sidebarSearch: route.sidebarSearch })}>
          ← Back to labs
        </a>
      </header>

      <div className="tools-layout">
        <aside className="tools-panel">
          <div className="control-group">
            <label>
              <span>Initial wealth</span>
              <input type="range" min="0" max="100" step="0.1" value={params.initialWealth} onChange={(event) => updateParam('initialWealth', Number(event.target.value))} />
              <strong>{params.initialWealth.toFixed(1)}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Income per period</span>
              <input type="range" min="1" max="40" step="0.1" value={params.income} onChange={(event) => updateParam('income', Number(event.target.value))} />
              <strong>{params.income.toFixed(1)}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Interest rate per period</span>
              <input type="range" min="0" max="0.12" step="0.001" value={params.interest} onChange={(event) => updateParam('interest', Number(event.target.value))} />
              <strong>{params.interest.toFixed(3)}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Discount factor β</span>
              <input type="range" min="0.7" max="0.999" step="0.001" value={params.beta} onChange={(event) => updateParam('beta', Number(event.target.value))} />
              <strong>{params.beta.toFixed(3)}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Curvature γ</span>
              <input type="range" min="0.5" max="3" step="0.01" value={params.gamma} onChange={(event) => updateParam('gamma', Number(event.target.value))} />
              <strong>{params.gamma.toFixed(2)}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Horizon (periods)</span>
              <input type="range" min="1" max="20" step="1" value={params.periods} onChange={(event) => updateParam('periods', Number(event.target.value))} />
              <strong>{params.periods}</strong>
            </label>
          </div>
        </aside>

        <div className="tools-main">
          <div className="chart-row">
            <div className="chart-card">
              <h2>Optimal wealth path</h2>
              <LineChart values={wealthPoints} xLabel="Date t" title="Optimal wealth path by date" zeroBaseline />
            </div>
            <div className="chart-card">
              <h2>Optimal consumption path</h2>
              <LineChart values={consumptionPoints} xLabel="Period t" title="Optimal consumption path by period" />
            </div>
          </div>
        </div>
      </div>

      <div className="insight-box">
        <h2>Model and solution</h2>
        <MessageContent content={MODEL_DESCRIPTION} />
      </div>
    </section>
  )
}

export default function ToolsPage() {
  return <Tools />
}
