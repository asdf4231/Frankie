# Bellman Equation

> Course sources: [Lecture 7](../raw/lectures/lecture-07.md), slides 13–15, 21, 23–28; [Lecture 8](../raw/lectures/lecture-08.md), slides 14–18, 24

## Overview

A Bellman equation expresses current value as the supremum of current payoff plus continuation value. In a finite-horizon problem it links date-indexed value functions and supports backward induction; in a stationary infinite-horizon problem it is a time-invariant functional equation for a fixed value function.

## State-to-state form

Use the terminal convention

$$
V_T(x)=0.
$$

**Wiki assumptions:** To make the lecture's supremum and $\epsilon$ proof valid, this page assumes that the admissible continuation set is nonempty and the value is finite. Then, for

$$
t=0,1,\ldots,T-1,
$$

the Bellman equation is

$$
V_t(x)
=
\sup_{x'\in\Gamma_t(x)}
\left\{
F_t(x,x')+V_{t+1}(x')
\right\}.
$$

The choice $x'$ is the next state. Its effect on all later dates is summarized by $V_{t+1}(x')$. The identity itself does not assume that an optimal sequence exists.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 13.

## Control-state form

For the formulation with controls and induced state transitions,

$$
V_t(x)
=
\sup_{u\in G_t(x)}
\left\{
F_t(x,u)+V_{t+1}\bigl(f_t(x,u)\bigr)
\right\},
\qquad
t=0,1,\ldots,T-1,
$$

again with $V_T=0$. The period-$t$ control must be feasible at $x$, and its continuation state is $f_t(x,u)$.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 21.

## Stationary infinite-horizon form

For the stationary sequence problem in Lecture 8, the Bellman equation is

$$
V(x)
=
\sup_{y\in G(x)}
\{U(x,y)+\beta V(y)\},
\qquad x\in X.
$$

The function $V$ appears on both sides because the continuation problem has the same stationary form after choosing the next state $y$. Lecture 8 distinguishes this recursive function $V$ from the sequence value $V^*$; under Assumption 6.1, Theorem 6.1 states that they coincide:

$$
V(x)=V^*(x).
$$

When the supremum is attained by a policy $\pi(x)$,

$$
V(x)=U(x,\pi(x))+\beta V(\pi(x)).
$$

The stationary equation is also the fixed-point equation for the [Bellman operator](bellman-operator.md).

**Notation reconciliation:** Lecture 7 writes the current payoff, feasible next-state correspondence, and next state as $F_t$, $\Gamma_t$, and $x'$. Lecture 8 uses $U$, $G$, and $y$ for the corresponding stationary objects. In both formulations, $x'$ or $y$ denotes the next state rather than a control.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 14–18, 24.

## Why the finite-horizon identity holds

Fix a date and state covered by the wiki assumptions above.

For the first inequality, every admissible full continuation beginning with $x_{t+1}$ has value no greater than $V_t(x)$. Taking the supremum first over the tail after $x_{t+1}$ and then over $x_{t+1}$ gives

$$
V_t(x)
\geq
\sup_{x'\in\Gamma_t(x)}
\left\{F_t(x,x')+V_{t+1}(x')\right\}.
$$

For the reverse inequality, finiteness and nonemptiness allow an admissible sequence within $\epsilon>0$ of $V_t(x)$. Its tail payoff is bounded above by the corresponding continuation value, so

$$
V_t(x)
\leq
\sup_{x'\in\Gamma_t(x)}
\left\{F_t(x,x')+V_{t+1}(x')\right\}
+\epsilon.
$$

Letting $\epsilon\to0$ gives the reverse inequality and hence equality.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 14.

## Backward induction

At the last decision date,

$$
V_{T-1}(x)
=
\sup_{x'\in\Gamma_{T-1}(x)}F_{T-1}(x,x'),
$$

because $V_T=0$. This is a static optimization problem. Once $V_{T-1}$ is known, substitute it into the equation for $V_{T-2}$ and continue backward until $V_0$ is obtained. If the stage suprema are attained, the stage solutions also give choices as functions of the current state.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 15.

## Supremum versus attained maximum

The general equation uses $\sup$ because the best value need not be attained. Lecture 8 makes the same distinction for stationary policies: an optimizing control may fail to exist, and several controls may attain the same value. In the finite-horizon cake-eating example, the lecture writes $\max$ because the stage objective is continuous on the compact feasible interval $[0,x_t]$. Thus the recursive value identity and the existence or uniqueness of a stage optimizer are distinct issues.

**Course sources:** [Lecture 7](../raw/lectures/lecture-07.md), slides 13, 23; [Lecture 8](../raw/lectures/lecture-08.md), slide 17.

## Example: cake eating

**Wiki assumptions for the displayed endpoint formulas:** Take $0<\gamma<1$ so utility is finite at zero consumption, and take $0<\beta\leq1$ so the fractional powers of $\beta$ used in the backward solution are defined.

For $T=3$, the Bellman equation is

$$
V_t(x_t)
=
\max_{x_{t+1}\in[0,x_t]}
\left\{
\beta^t\frac{(x_t-x_{t+1})^{1-\gamma}}{1-\gamma}
+V_{t+1}(x_{t+1})
\right\}.
$$

At $t=2$, the terminal continuation value is $V_3=0$, so

$$
V_2(x_2)
=
\max_{x_3\in[0,x_2]}
\beta^2\frac{(x_2-x_3)^{1-\gamma}}{1-\gamma}
=
\beta^2\frac{x_2^{1-\gamma}}{1-\gamma},
$$

with $x_3=0$. The earlier equations then use the value functions already computed at later dates.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slides 23–24.

## Example: a three-stage exercise

**Wiki domain and classification derivation:** The displayed expressions require the positive-state qualifications below. On those relevant intervals, the stage objectives are globally strictly concave, so each feasible first-order solution is the unique global stage maximum. Starting from $x_0\geq0$, the resulting policy keeps the intermediate states positive:

$$
V_2(x_2)=\frac{1}{2x_2},
\qquad
x_3^*=\frac{1}{x_2^2},
\qquad
x_2>0,
$$

$$
V_1(x_1)=\frac{x_1^2}{2},
\qquad
x_2^*=x_1,
\qquad
x_1>0,
$$

and

$$
V_0(x_0)=2x_0^2+2x_0+\frac12,
\qquad
x_1^*=2x_0+1.
$$

The resulting policy is

$$
\left(
2x_0+1,
2x_0+1,
\frac{1}{(2x_0+1)^2}
\right),
$$

whose states are positive when $x_0\geq0$. This exercise illustrates the recursion; it is not the definition of the Bellman equation.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slides 25–28.

## Connections

- The [value function](value-function.md) supplies the continuation term in the equation.
- The [dynamic programming principles](dynamic-programming-principles.md) connect the recursion to optimal tails and stagewise characterization of an optimal path in finite and infinite horizons.
- [Infinite-horizon dynamic optimization](infinite-horizon-dynamic-optimization.md) gives the stationary sequence problem represented by the equation.
- The [Bellman operator](bellman-operator.md) expresses the stationary equation as a fixed-point problem.
- The [Hamilton–Jacobi–Bellman equation](../optimal-control/hamilton-jacobi-bellman-equation.md) is the continuous-time recursive counterpart developed in Lecture 9.
- [Policy functions and correspondences](policy-functions-and-correspondences.md) distinguish nonattainment, multiple maximizers, and a single-valued policy.
- [Bounds, suprema, and completeness](../real-analysis/bounds-suprema-and-completeness.md) supplies the supremum and $\epsilon$ language used in the finite-horizon proof.
- [Maximizers and local extrema](../unconstrained-optimization/maximizers-and-local-extrema.md), [continuity](../real-analysis/continuity-in-metric-spaces.md), and [compactness](../real-analysis/compactness.md) explain when a displayed stage supremum can be written as a maximum.
- [First-order conditions](../unconstrained-optimization/first-order-conditions.md) and [second-order conditions](../unconstrained-optimization/second-order-conditions.md) provide local candidate tests used in the exercise; the lecture's global strict-concavity conclusions establish the global stage maxima on the relevant intervals.
