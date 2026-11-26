/** Lab metadata, kept apart from the lab views so the shell can name a lab without loading Plotly. */
export type LabKey = 'savings-lab' | 'envelope-lab' | 'optimal-growth-lab' | 'value-iteration-lab'

export interface LabInfo {
  key: LabKey
  title: string
  description: string
  topic: string
}

export const LABS: readonly LabInfo[] = [
  {
    key: 'envelope-lab',
    title: 'Envelope Theorem Lab',
    description: 'Multipliers and envelope theorems in Lecture 5, Examples 19.1, 19.4, and 19.6.',
    topic: 'Constrained Optimization · Lecture 5',
  },
  {
    key: 'savings-lab',
    title: 'Consumption & Savings Lab',
    description: 'Explore how wealth, income, interest rates, and preferences shape optimal consumption and saving.',
    topic: 'Dynamic Programming',
  },
  {
    key: 'optimal-growth-lab',
    title: 'Optimal Growth: Finite vs. Infinite Horizon',
    description: 'With the same capital today, how does optimal investment change as the final period moves further away?',
    topic: 'Dynamic Programming · Lectures 7–8',
  },
  {
    key: 'value-iteration-lab',
    title: 'Bellman Value Iteration',
    description: 'Compare the value function and investment policy at each Bellman update with their exact solutions.',
    topic: 'Dynamic Programming · Lecture 8',
  },
]

export const findLab = (key: string | undefined) => LABS.find((lab) => lab.key === key)
