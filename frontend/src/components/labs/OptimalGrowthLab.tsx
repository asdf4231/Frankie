import { useState } from 'react'
import MessageContent from '../MessageContent'
import LabMath from './LabMath'
import LabParameters from './LabParameters'
import LabPlot from './LabPlot'
import ParamControl from './ParamControl'
import { capitalGrid, DEFAULT_ALPHA } from './growthModel'

const CAPITAL_RANGE = [0.1, 3] as const
const CAPITAL = capitalGrid(CAPITAL_RANGE)
const DEFAULT_BETA = 0.9
const DEFAULT_INITIAL_CAPITAL = 1
const MAX_PERIODS = 20
const DATES = Array.from({ length: MAX_PERIODS + 1 }, (_, t) => t)

function solveGrowth(horizon: number, initialCapital: number, alpha: number, beta: number) {
  const infiniteShare = alpha * beta
  // shares[n - 1] is today's investment share with n decisions left, including today.
  const shares = [0]
  for (let n = 1; n < horizon; n++) shares.push(infiniteShare / (1 + infiniteShare - shares[n - 1]))

  const finitePath = [initialCapital]
  const infinitePath = [initialCapital]
  for (let t = 0; t < MAX_PERIODS; t++) {
    if (t < horizon) finitePath.push(shares[horizon - t - 1] * finitePath[t] ** alpha)
    infinitePath.push(infiniteShare * infinitePath[t] ** alpha)
  }
  return { finiteShare: shares[horizon - 1], infiniteShare, finitePath, infinitePath }
}

const MODEL = String.raw`
Capital depreciates fully, so investment today is capital tomorrow. Given initial capital $k_0$ and $H$ periods including today, the planner solves

$$
\begin{aligned}
\max\quad &\sum_{t=0}^{H-1}\beta^t\log c_t \\
\text{subject to}\quad &c_t+k_{t+1}=k_t^\alpha,\qquad 0<\alpha<1,\\
&c_t>0,\quad k_{t+1}\geq0.
\end{aligned}
$$

There is no terminal payoff. In the last period the planner consumes all output: $k_H=0$. With $n$ periods left, the optimal investment policy is $k'=s_n k^\alpha$. Working backward gives the investment shares

$$
s_1=0,\qquad s_{n+1}=\frac{q}{1+q-s_n},\qquad q=\alpha\beta.
$$

With no final period, the planner maximizes $\sum_{t=0}^{\infty}\beta^t\log c_t$ under the same resource constraint. The optimal policy is $k'=q k^\alpha$ at every date.
`

export default function OptimalGrowthLab() {
  const [horizon, setHorizon] = useState(1)
  const [initialCapital, setInitialCapital] = useState(DEFAULT_INITIAL_CAPITAL)
  const [beta, setBeta] = useState(DEFAULT_BETA)
  const [alpha, setAlpha] = useState(DEFAULT_ALPHA)
  const { finiteShare, infiniteShare, finitePath, infinitePath } = solveGrowth(horizon, initialCapital, alpha, beta)

  return (
    <div className="tools-layout dp-lab">
      <LabParameters onReset={() => { setHorizon(1); setInitialCapital(DEFAULT_INITIAL_CAPITAL); setBeta(DEFAULT_BETA); setAlpha(DEFAULT_ALPHA) }}>
        <ParamControl name="growth-horizon" label="Periods remaining today" min={1} max={MAX_PERIODS} step={1} decimals={0} value={horizon} onChange={setHorizon} />
        <ParamControl name="growth-initial-capital" label={<>Initial capital <LabMath tex="k_0" /></>} min={0.1} max={1} step={0.01} decimals={2} value={initialCapital} onChange={setInitialCapital} />
        <ParamControl name="growth-beta" label={<>Discount factor <LabMath tex={String.raw`\beta`} /></>} min={0.5} max={0.99} step={0.001} decimals={3} value={beta} onChange={setBeta} />
        <ParamControl name="growth-alpha" label={<>Output elasticity of capital <LabMath tex={String.raw`\alpha`} /></>} min={0.3} max={0.9} step={0.01} decimals={2} value={alpha} onChange={setAlpha} />
      </LabParameters>
      <div className="tools-main">
        <div className="chart-row">
          <section className="chart-card panel">
            <h2 className="panel-title">Investment policy today</h2>
            <LabPlot x={CAPITAL} height={310} xLabel="Current capital" yLabel="Investment" xRange={CAPITAL_RANGE}
              ariaLabel={`Optimal investment for each capital stock with ${horizon} periods remaining versus an infinite horizon`}
              series={[
                { name: 'Finite horizon', y: CAPITAL.map(k => finiteShare * k ** alpha), color: 0 },
                { name: 'Infinite horizon', y: CAPITAL.map(k => infiniteShare * k ** alpha), color: 1, dash: 'dash' },
                { name: 'Finite choice today', x: [initialCapital], y: [finitePath[1]], color: 0, showLegend: false, labelOnHover: true },
                { name: 'Infinite choice today', x: [initialCapital], y: [infinitePath[1]], color: 1, markerSymbol: 'circle-open', showLegend: false, labelOnHover: true },
              ]} />
          </section>
          <section className="chart-card panel">
            <h2 className="panel-title">Capital over time</h2>
            <LabPlot x={DATES} height={310} xLabel="Period" yLabel="Capital stock" xRange={[-1, MAX_PERIODS + 1]}
              ariaLabel={`Capital paths starting at ${initialCapital}; the finite path ends at zero at date ${horizon}`}
              series={[
                { name: 'Finite horizon', x: DATES.slice(0, horizon + 1), y: finitePath, color: 0 },
                { name: 'Infinite horizon', y: infinitePath, color: 1, dash: 'dash' },
                { name: 'Terminal capital', x: [horizon], y: [finitePath[horizon]], color: 0, showLegend: false, labelOnHover: true },
              ]} />
          </section>
        </div>
        <section className="tools-model" aria-labelledby="growth-model-title">
          <h2 id="growth-model-title" className="panel-title">Model and solution</h2>
          <MessageContent content={MODEL} />
        </section>
      </div>
    </div>
  )
}
