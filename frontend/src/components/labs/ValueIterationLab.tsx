import { useState } from 'react'
import MessageContent from '../MessageContent'
import LabMath from './LabMath'
import LabParameters from './LabParameters'
import LabPlot from './LabPlot'
import ParamControl from './ParamControl'
import { capitalGrid, DEFAULT_ALPHA, exactGrowthValue, iterateGrowthValue } from './growthModel'

const CAPITAL_RANGE = [0.1, 5] as const
const CAPITAL = capitalGrid(CAPITAL_RANGE)
const DEFAULT_BETA = 0.75
const MAX_UPDATES = 40

const MODEL = String.raw`
In the optimal growth model (Example 6.4), output is $k^\alpha$, with $0<\alpha<1$. Capital depreciates fully, so investing $k'$ leaves $k^\alpha-k'$ for consumption. With log utility, start from $V_0(k)=0$ and apply the Bellman update

$$
V_{n+1}(k)=\max_{0\leq k'<k^\alpha}
\left\{\log(k^\alpha-k')+\beta V_n(k')\right\}.
$$

The exact value function is $V^*(k)=A+B\log k$ and the optimal investment policy is $k'=qk^\alpha$, where $q=\alpha\beta$ and

$$
B=\frac{\alpha}{1-q},\qquad A=\frac{\log(1-q)+\beta B\log q}{1-\beta}.
$$
`

export default function ValueIterationLab() {
  const [updates, setUpdates] = useState(0)
  const [beta, setBeta] = useState(DEFAULT_BETA)
  const [alpha, setAlpha] = useState(DEFAULT_ALPHA)
  const { a, b, share } = iterateGrowthValue(alpha, beta, updates)
  const exact = exactGrowthValue(alpha, beta)

  return (
    <div className="tools-layout dp-lab">
      <LabParameters onReset={() => { setUpdates(0); setBeta(DEFAULT_BETA); setAlpha(DEFAULT_ALPHA) }}>
        <ParamControl name="bellman-updates" label="Number of updates" min={0} max={MAX_UPDATES} step={1} decimals={0} value={updates} onChange={setUpdates} />
        <ParamControl name="bellman-beta" label={<>Discount factor <LabMath tex={String.raw`\beta`} /></>} min={0.5} max={0.99} step={0.001} decimals={3} value={beta} onChange={setBeta} />
        <ParamControl name="bellman-alpha" label={<>Output elasticity of capital <LabMath tex={String.raw`\alpha`} /></>} min={0.3} max={0.9} step={0.01} decimals={2} value={alpha} onChange={setAlpha} />
      </LabParameters>
      <div className="tools-main">
        <div className="chart-row">
          <section className="chart-card panel">
            <h2 className="panel-title">Value function</h2>
            <LabPlot x={CAPITAL} height={310} xLabel="Current capital" yLabel="Value"
              xRange={CAPITAL_RANGE}
              ariaLabel={`Value by capital stock: Bellman iteration ${updates} and the exact infinite-horizon value function`}
              series={[
                { name: `Iteration ${updates}`, y: CAPITAL.map(k => a + b * Math.log(k)), color: 0, labelOnHover: true },
                { name: 'Exact value function', y: CAPITAL.map(k => exact.a + exact.b * Math.log(k)), color: 1, dash: 'dash', labelOnHover: true },
              ]} />
          </section>
          <section className="chart-card panel">
            <h2 className="panel-title">Investment policy</h2>
            <LabPlot x={CAPITAL} height={310} xLabel="Current capital" yLabel="Next-period capital"
              xRange={CAPITAL_RANGE}
              ariaLabel={share === null ? 'Exact investment policy before the first Bellman update' : `Investment policy at iteration ${updates} and the exact infinite-horizon policy`}
              series={[
                ...(share === null ? [] : [{ name: `Iteration ${updates}`, y: CAPITAL.map(k => share * k ** alpha), labelOnHover: true }]),
                { name: 'Exact policy', y: CAPITAL.map(k => exact.share * k ** alpha), color: 1, dash: 'dash', showLegend: true, labelOnHover: true },
              ]} />
          </section>
        </div>
        <section className="tools-model" aria-labelledby="bellman-model-title">
          <h2 id="bellman-model-title" className="panel-title">Model and solution</h2>
          <MessageContent content={MODEL} />
        </section>
      </div>
    </div>
  )
}
