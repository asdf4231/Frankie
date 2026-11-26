export const DEFAULT_ALPHA = 0.5

export function capitalGrid([min, max]: readonly [number, number]) {
  return Array.from({ length: Math.round((max - min) * 100) + 1 }, (_, i) => (min * 100 + i) / 100)
}

// Applying the Bellman operator to a + b log(k) preserves this functional form.
export function iterateGrowthValue(alpha: number, beta: number, updates: number) {
  let a = 0
  let b = 0
  let share: number | null = null // V₀ is an initial guess, not a maximization.
  for (let n = 0; n < updates; n++) {
    const weight = beta * b
    share = weight / (1 + weight)
    // With V₀ = 0 the planner consumes all output; there is no continuation term.
    a = beta * a + Math.log1p(-share) + (share === 0 ? 0 : weight * Math.log(share))
    b = alpha * (1 + weight)
  }
  return { a, b, share }
}

export function exactGrowthValue(alpha: number, beta: number) {
  const share = alpha * beta
  const b = alpha / (1 - share)
  const a = (Math.log1p(-share) + beta * b * Math.log(share)) / (1 - beta)
  return { a, b, share }
}
