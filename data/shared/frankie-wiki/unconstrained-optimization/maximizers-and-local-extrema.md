# Maximizers and Local Extrema

> Course sources: [Lecture 3](../raw/lectures/lecture-03.md), slide 3; [Lecture 4](../raw/lectures/lecture-04.md), slides 4, 6–9, 29; [Lecture 6](../raw/lectures/lecture-06.md), slide 49; [Lecture 7](../raw/lectures/lecture-07.md), slides 4, 13, 23

## Overview

Optimization distinguishes global from local extrema and weak from strict comparisons over a feasible set. Constraints construct that feasible set before the objective is compared across its points.

## Feasible sets from constraints

Lecture 4's prototype combines inequalities and equalities. In the notation of that prototype, the feasible set can be collected as

$$
U=
\left\{
\mathbf{x}\in\mathbb{R}^n:
 g_j(\mathbf{x})\leq b_j\ \text{for }j=1,\ldots,k,
\quad
 h_\ell(\mathbf{x})=c_\ell\ \text{for }\ell=1,\ldots,m
\right\}.
$$

**Wiki construction:** The lecture displays the individual constraints; the set-builder expression simply collects those stated conditions into the set $U$ used by the extremum definitions on this page.

Nonnegativity conditions can be included in the same inequality format by writing $x_i\geq0$ as $-x_i\leq0$. Budget, resource, production, and equality conditions then determine which points are available for the global or local comparison.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 4, 6–9, 29.

## Maximizers

For $F\colon U\subset\mathbb{R}^n\to\mathbb{R}$, a point $\mathbf{x}^*$ is a maximizer on $U$ if

$$
F(\mathbf{x}^*)\geq F(\mathbf{x})
\quad\text{for all }\mathbf{x}\in U.
$$

It is a strict maximizer if the inequality is strict for every $\mathbf{x}\neq\mathbf{x}^*$ in $U$.

A local or relative maximizer satisfies the weak inequality on $B_r(\mathbf{x}^*)\cap U$ for some ball around $\mathbf{x}^*$. It is a strict local maximizer when the inequality is strict for all other feasible points in that neighborhood.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 3.

## Corresponding minimizer definitions

**Wiki counterpart:** The lecture subsequently uses minima. The corresponding definitions reverse the inequalities: a minimizer has $F(\mathbf{x}^*)\leq F(\mathbf{x})$, and a strict minimizer has $F(\mathbf{x}^*)<F(\mathbf{x})$ for every other feasible point. Local and strict-local minimizers impose these comparisons on $B_r(\mathbf{x}^*)\cap U$.

These definitions are the minimization counterparts of the maximizer definitions displayed in the lecture.

**Course source for the corresponding maximizer definitions:** [Lecture 3](../raw/lectures/lecture-03.md), slide 3.

## Existence on a nonempty compact domain

Let $f\colon K\subset X\to Y$ be continuous, where $X$ and $Y$ are metric spaces. If $K$ is nonempty and compact and $Y\subset\mathbb{R}$, then $f$ is bounded above and below and has both a maximum and a minimum. Thus there are points in $K$ that satisfy the global maximizer and minimizer definitions.

The lecture gives three examples showing what can fail on noncompact domains:

- $f(x)=1/x$ on $(0,1]$ is unbounded above;
- $f(x)=x$ on $[0,1)$ is bounded but has no maximizer;
- $f(x)=1/x$ on $[1,\infty)$ has no minimizer.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 49.

## Suprema and attained stage maxima in dynamic programming

Lecture 7 formulates the general finite-horizon problem and its Bellman equation with $\sup$ because a maximizing feasible sequence or stage choice need not be attained. The Bellman identity therefore does not by itself assume the existence of an optimal sequence.

In the cake-eating example, the lecture writes $\max$ because the stage objective is continuous on the compact feasible interval $[0,x_t]$. This is an attainment step: the recursive value identity can be stated with a supremum, while constructing an optimal policy requires the relevant stage suprema to be achieved.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slides 4, 13, 23.

## Connections

- [First-order conditions](first-order-conditions.md) give necessary derivative conditions for interior local maxima and minima and explain how that scope changes when constraints bind.
- [Lagrange multipliers for equality constraints](../constrained-optimization/lagrange-multipliers-for-equality-constraints.md) generate candidates when equalities restrict the feasible set.
- [Kuhn–Tucker conditions](../constrained-optimization/kuhn-tucker-conditions.md) add feasibility, multiplier signs, and complementary slackness for inequalities.
- [Second-order conditions](second-order-conditions.md) classify unconstrained critical points using the Hessian.
- [Compactness](../real-analysis/compactness.md) gives the domain property behind the existence result.
- [Continuity in metric spaces](../real-analysis/continuity-in-metric-spaces.md) states the continuous-image and extreme-value theorem used here.
- [Bounds, suprema, and completeness](../real-analysis/bounds-suprema-and-completeness.md) distinguishes a supremum from an attained maximum.
- The [finite-horizon Bellman equation](../dynamic-programming/bellman-equation.md) applies that distinction to recursive stage problems.
