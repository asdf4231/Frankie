import { useMemo, useState } from 'react'
import './Tools.css'

type ToolKey = 'savings-lab'

type ToolCard = {
  key: ToolKey
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
  dailyConsumption: number
  periods: number
}

type PathPoint = {
  period: number
  wealth: number
  consumption: number
  utility: number
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const utility = (consumption: number, gamma: number) => {
  const safe = Math.max(consumption, 1e-6)
  if (Math.abs(gamma - 1) < 1e-8) return Math.log(safe)
  return (Math.pow(safe, 1 - gamma) - 1) / (1 - gamma)
}

const buildPath = (params: LabParams) => {
  let wealth = params.initialWealth
  let totalUtility = 0
  const points: PathPoint[] = [{ period: 0, wealth, consumption: params.dailyConsumption, utility: 0 }]
  for (let period = 0; period < params.periods; period += 1) {
    const currentConsumption = Math.max(0, params.dailyConsumption)
    const perPeriodUtility = Math.pow(params.beta, period) * utility(currentConsumption, params.gamma)
    totalUtility += perPeriodUtility
    const nextWealth = Math.max(0, (wealth + params.income - currentConsumption) * (1 + params.interest))
    wealth = nextWealth
    points.push({
      period: period + 1,
      wealth,
      consumption: currentConsumption,
      utility: totalUtility,
    })
  }
  return {
    totalUtility,
    terminalWealth: wealth,
    points,
  }
}

const interpolate = (grid: number[], values: number[], x: number) => {
  if (x <= grid[0]) return values[0]
  if (x >= grid[grid.length - 1]) return values[values.length - 1]
  for (let i = 0; i < grid.length - 1; i += 1) {
    const left = grid[i]
    const right = grid[i + 1]
    if (x >= left && x <= right) {
      const ratio = (x - left) / (right - left || 1)
      return values[i] + (values[i + 1] - values[i]) * ratio
    }
  }
  return values[values.length - 1]
}

const computeValuePolicy = (params: LabParams) => {
  const maxWealth = Math.max(150, params.initialWealth + params.income * params.periods + 100)
  const gridSize = 48
  const grid = Array.from({ length: gridSize }, (_, index) => (index / (gridSize - 1)) * maxWealth)
  const valueMatrix: number[][] = Array.from({ length: params.periods + 1 }, () => new Array(gridSize).fill(0))
  const policyMatrix: number[][] = Array.from({ length: params.periods + 1 }, () => new Array(gridSize).fill(0))

  for (let period = params.periods - 1; period >= 0; period -= 1) {
    for (let wealthIndex = 0; wealthIndex < gridSize; wealthIndex += 1) {
      const wealth = grid[wealthIndex]
      let bestValue = -Infinity
      let bestConsumption = 0
      const maxConsumption = wealth + params.income + 20
      const candidateGrid = Array.from({ length: 60 }, (_, index) => (index / 59) * maxConsumption)
      for (const c of candidateGrid) {
        const nextWealth = Math.max(0, (wealth + params.income - c) * (1 + params.interest))
        const nextValue = interpolate(grid, valueMatrix[period + 1], clamp(nextWealth, grid[0], grid[grid.length - 1]))
        const candidateValue = utility(c, params.gamma) + params.beta * nextValue
        if (candidateValue > bestValue) {
          bestValue = candidateValue
          bestConsumption = c
        }
      }
      valueMatrix[period][wealthIndex] = bestValue
      policyMatrix[period][wealthIndex] = bestConsumption
    }
  }

  const valueCurve = grid.map((wealth, index) => ({ wealth, value: valueMatrix[0][index] }))
  const policyCurve = grid.map((wealth, index) => ({ wealth, policy: policyMatrix[0][index] }))
  return { valueCurve, policyCurve, grid, maxWealth }
}

const toSvgPath = (points: Array<{ x: number; y: number }>) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

const TOOL_CATALOG: ToolCard[] = [
  {
    key: 'savings-lab',
    title: 'Consumption & Savings Lab',
    description: 'Explore how income, interest, patience, and daily consumption shape wealth accumulation and utility over time.',
    badge: 'Core lab',
  },
]

function Tools() {
  const [selectedTool, setSelectedTool] = useState<ToolKey | null>(null)
  const [params, setParams] = useState<LabParams>({
    initialWealth: 30,
    income: 15,
    interest: 0.04,
    beta: 0.96,
    gamma: 1,
    dailyConsumption: 12,
    periods: 10,
  })

  const simulation = useMemo(() => buildPath(params), [params])
  const valuePolicy = useMemo(() => computeValuePolicy(params), [params])

  const updateParam = <K extends keyof LabParams>(key: K, value: LabParams[K]) => {
    setParams((current) => ({ ...current, [key]: value }))
  }

  const valueChart = useMemo(() => {
    const width = 360
    const height = 180
    const pad = 20
    const values = valuePolicy.valueCurve.map((point) => point.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const data = valuePolicy.valueCurve.map((point) => {
      const x = pad + ((point.wealth / valuePolicy.maxWealth) * (width - pad * 2))
      const y = height - pad - ((point.value - minValue) / (Math.max(maxValue - minValue, 1e-6) || 1) * (height - pad * 2))
      return { x, y }
    })
    return { width, height, pad, path: toSvgPath(data), points: data }
  }, [valuePolicy])

  const policyChart = useMemo(() => {
    const width = 360
    const height = 180
    const pad = 20
    const values = valuePolicy.policyCurve.map((point) => point.policy)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const data = valuePolicy.policyCurve.map((point) => {
      const x = pad + ((point.wealth / valuePolicy.maxWealth) * (width - pad * 2))
      const y = height - pad - ((point.policy - minValue) / (Math.max(maxValue - minValue, 1e-6) || 1) * (height - pad * 2))
      return { x, y }
    })
    return { width, height, pad, path: toSvgPath(data), points: data }
  }, [valuePolicy])

  const chartPath = useMemo(() => {
    const width = 360
    const height = 180
    const pad = 20
    const values = simulation.points.map((point) => point.wealth)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const data = simulation.points.map((point) => {
      const x = pad + ((point.period / Math.max(params.periods, 1)) * (width - pad * 2))
      const y = height - pad - ((point.wealth - minValue) / (Math.max(maxValue - minValue, 1e-6) || 1) * (height - pad * 2))
      return { x, y }
    })
    return { width, height, pad, path: toSvgPath(data), points: data }
  }, [params.periods, simulation])

  if (!selectedTool) {
    return (
      <section className="tools-page">
        <header className="tools-header">
          <div>
            <p className="eyebrow">Course tools</p>
            <h1>Choose a learning tool</h1>
          </div>
        </header>

        <div className="tool-catalog">
          {TOOL_CATALOG.map((tool) => (
            <button
              key={tool.key}
              type="button"
              className="tool-card"
              onClick={() => setSelectedTool(tool.key)}
            >
              <span className="tool-badge">{tool.badge}</span>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
              <span className="tool-action">Open tool →</span>
            </button>
          ))}

          <div className="tool-card placeholder-card">
            <span className="tool-badge muted">Coming soon</span>
            <h2>Scenario comparison</h2>
            <p>Compare different teaching scenarios and policy choices side by side.</p>
            <span className="tool-action muted">Planned</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="tools-page">
      <header className="tools-header">
        <div>
          <p className="eyebrow">Course tools</p>
          <h1>Consumption &amp; Savings Lab</h1>
        </div>
        <button type="button" className="secondary-button" onClick={() => setSelectedTool(null)}>
          ← Back to tools
        </button>
      </header>

      <div className="tools-layout">
        <aside className="tools-panel">
          <div className="control-group">
            <label>
              <span>Initial wealth</span>
              <input type="range" min="0" max="100" step="1" value={params.initialWealth} onChange={(event) => updateParam('initialWealth', Number(event.target.value))} />
              <strong>{params.initialWealth}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Income</span>
              <input type="range" min="0" max="40" step="1" value={params.income} onChange={(event) => updateParam('income', Number(event.target.value))} />
              <strong>{params.income}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Daily consumption</span>
              <input type="range" min="0" max="40" step="1" value={params.dailyConsumption} onChange={(event) => updateParam('dailyConsumption', Number(event.target.value))} />
              <strong>{params.dailyConsumption}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Interest rate</span>
              <input type="range" min="0" max="0.12" step="0.005" value={params.interest} onChange={(event) => updateParam('interest', Number(event.target.value))} />
              <strong>{params.interest.toFixed(3)}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Discount factor β</span>
              <input type="range" min="0.7" max="0.99" step="0.01" value={params.beta} onChange={(event) => updateParam('beta', Number(event.target.value))} />
              <strong>{params.beta.toFixed(2)}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Curvature γ</span>
              <input type="range" min="0.5" max="3" step="0.1" value={params.gamma} onChange={(event) => updateParam('gamma', Number(event.target.value))} />
              <strong>{params.gamma.toFixed(1)}</strong>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span>Periods</span>
              <input type="range" min="4" max="20" step="1" value={params.periods} onChange={(event) => updateParam('periods', Number(event.target.value))} />
              <strong>{params.periods}</strong>
            </label>
          </div>
        </aside>

        <div className="tools-main">
          <div className="stat-grid">
            <div className="stat-card">
              <span>Total utility</span>
              <strong>{simulation.totalUtility.toFixed(2)}</strong>
            </div>
            <div className="stat-card">
              <span>Terminal wealth</span>
              <strong>{simulation.terminalWealth.toFixed(2)}</strong>
            </div>
            <div className="stat-card">
              <span>Average saving</span>
              <strong>{((params.income - params.dailyConsumption) * 0.7).toFixed(2)}</strong>
            </div>
          </div>

          <div className="chart-card">
            <h2>Wealth path</h2>
            <svg viewBox={`0 0 ${chartPath.width} ${chartPath.height}`} className="chart-svg" role="img" aria-label="Wealth over time chart">
              <path d={chartPath.path} className="chart-line" />
            </svg>
          </div>

          <div className="chart-row">
            <div className="chart-card">
              <h2>Value function</h2>
              <svg viewBox={`0 0 ${valueChart.width} ${valueChart.height}`} className="chart-svg" role="img" aria-label="Value function">
                <path d={valueChart.path} className="chart-line accent" />
              </svg>
            </div>

            <div className="chart-card">
              <h2>Policy function</h2>
              <svg viewBox={`0 0 ${policyChart.width} ${policyChart.height}`} className="chart-svg" role="img" aria-label="Optimized policy function">
                <path d={policyChart.path} className="chart-line alt" />
              </svg>
            </div>
          </div>

          <div className="insight-box">
            <h3>Interpretation</h3>
            <p>
              Higher patience ({params.beta.toFixed(2)}) and lower curvature ({params.gamma.toFixed(1)}) tend to support smoother consumption and stronger saving. The value function rises with wealth, while the policy function shows how optimal consumption responds to a richer starting position.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ToolsPage() {
  return <Tools />
}
