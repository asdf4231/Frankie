# Concavity, Convexity, and Global Optima

> Course sources: [Lecture 3](../raw/lectures/lecture-03.md), slide 19

## Overview

For a $C^2$ function on a convex open domain, concavity and convexity can be characterized by first-order inequalities or Hessian semidefiniteness. These properties turn stationary points into global optima.

## Concavity

**Theorem 17.8(a).** Let $F\colon U\to\mathbb{R}^1$ be $C^2$ on a convex open set $U\subset\mathbb{R}^n$. The following are equivalent:

1. $F$ is concave on $U$;
2. for all $\mathbf{x},\mathbf{y}\in U$,

   $$
   F(\mathbf{y})-F(\mathbf{x})
   \leq
   DF(\mathbf{x})(\mathbf{y}-\mathbf{x});
   $$

3. $D^2F(\mathbf{x})$ is negative semidefinite for every $\mathbf{x}\in U$.

**Theorem 17.8(c).** Under these hypotheses, if $F$ is concave and $DF(\mathbf{x}^*)=\mathbf0$ for some $\mathbf{x}^*\in U$, then $\mathbf{x}^*$ is a global maximum of $F$ on $U$.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 19.

## Convexity

**Theorem 17.8(b).** For a $C^2$ function $F\colon U\to\mathbb{R}^1$ on a convex open set $U\subset\mathbb{R}^n$, the corresponding equivalent conditions are:

1. $F$ is convex on $U$;
2. for all $\mathbf{x},\mathbf{y}\in U$,

   $$
   F(\mathbf{y})-F(\mathbf{x})
   \geq
   DF(\mathbf{x})(\mathbf{y}-\mathbf{x});
   $$

3. $D^2F(\mathbf{x})$ is positive semidefinite for every $\mathbf{x}\in U$.

**Theorem 17.8(d).** Under these hypotheses, if $F$ is convex and $DF(\mathbf{x}^*)=\mathbf0$ for some $\mathbf{x}^*\in U$, then $\mathbf{x}^*$ is a global minimum of $F$ on $U$.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 19.

## Connections

- [First-order conditions](first-order-conditions.md) supplies the stationary-point condition.
- [Second-order conditions](second-order-conditions.md) uses Hessian definiteness locally.
- [Quadratic forms and definiteness](../linear-algebra/quadratic-forms-and-definiteness.md) explains the semidefinite matrix conditions required here at every point of the domain.
- [Optimal-control sufficiency conditions](../optimal-control/optimal-control-sufficiency-conditions.md) use concavity of the Hamiltonian or maximized Hamiltonian to obtain global continuous-time optima.
- [Hessian matrix and mixed partials](../multivariable-calculus/hessian-and-mixed-partials.md) defines the Hessian.
