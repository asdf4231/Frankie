# Concavity, Convexity, and Global Optima

> Course sources: [Lecture 3](../raw/lectures/lecture-03.md), slide 12

## Overview

For a $C^2$ function on a convex open domain, concavity and convexity can be characterized by first-order inequalities or Hessian semidefiniteness. These properties turn stationary points into global optima.

## Concavity

For $F\colon U\to\mathbb{R}$ on a convex open set $U\subset\mathbb{R}^n$, the lecture states that the following are equivalent:

1. $F$ is concave on $U$;
2. for all $\mathbf{x},\mathbf{y}\in U$,

   $$
   F(\mathbf{y})-F(\mathbf{x})
   \leq
   DF(\mathbf{x})(\mathbf{y}-\mathbf{x});
   $$

3. $D^2F(\mathbf{x})$ is negative semidefinite for every $\mathbf{x}\in U$.

If $F$ is concave and $DF(\mathbf{x}^*)=0$, then $\mathbf{x}^*$ is a global maximum.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 12.

## Convexity

The corresponding equivalent conditions are:

1. $F$ is convex on $U$;
2. for all $\mathbf{x},\mathbf{y}\in U$,

   $$
   F(\mathbf{y})-F(\mathbf{x})
   \geq
   DF(\mathbf{x})(\mathbf{y}-\mathbf{x});
   $$

3. $D^2F(\mathbf{x})$ is positive semidefinite for every $\mathbf{x}\in U$.

If $F$ is convex and $DF(\mathbf{x}^*)=0$, then $\mathbf{x}^*$ is a global minimum.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 12.

## Connections

- [First-order conditions](first-order-conditions.md) supplies the stationary-point condition.
- [Second-order conditions](second-order-conditions.md) uses Hessian definiteness locally.
- [Optimal-control sufficiency conditions](../optimal-control/optimal-control-sufficiency-conditions.md) use concavity of the Hamiltonian or maximized Hamiltonian to obtain global continuous-time optima.
- [Hessian matrix and mixed partials](../multivariable-calculus/hessian-and-mixed-partials.md) defines the Hessian.
