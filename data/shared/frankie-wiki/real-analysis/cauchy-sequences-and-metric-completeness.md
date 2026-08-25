# Cauchy Sequences and Metric Completeness

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slide 38; [Lecture 6](../raw/lectures/lecture-06.md), slides 27–30, 35

## Overview

A Cauchy sequence has terms that eventually become arbitrarily close to one another, so its definition does not require knowing a candidate limit. A metric space is complete when every Cauchy sequence has a limit inside that space.

## Cauchy sequences

A sequence $(x_n)\subset X$ is Cauchy if, for every $\epsilon>0$, there is an $N\in\mathbb{N}$ such that

$$
m,n\geq N\implies d(x_m,x_n)<\epsilon.
$$

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 27.

Every Cauchy sequence is bounded, and every convergent sequence is Cauchy. The second implication explains why the Cauchy property is necessary for convergence, while completeness determines when it is sufficient.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 28.

## Metric completeness

A metric space $(X,d)$ is complete if every Cauchy sequence in $X$ has a limit in $X$. The lecture states that $\mathbb{R}^n$ with the Euclidean metric is complete.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 29.

## Complete subspaces and closed sets

Let $S\subset X$ carry the metric inherited from $X$.

1. If $(S,d)$ is complete, then $S$ is closed in $X$.
2. If $(X,d)$ is complete, then $S$ is closed in $X$ if and only if $(S,d)$ is complete.

The first statement uses the facts that a convergent sequence is Cauchy and that limits are unique. For the second, a Cauchy sequence in a closed subset $S$ converges in the complete ambient space $X$, and closedness keeps its limit in $S$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 30.

## A convergent subsequence pins down a Cauchy limit

If a Cauchy sequence $(x_n)$ has a subsequence $(x_{n_i})$ converging to $x$, then the full sequence converges to $x$.

For $\epsilon>0$, choose $N$ so that

$$
d(x_m,x_n)<\epsilon/2
\qquad\text{for all }m,n\geq N,
$$

and choose $M$ so that

$$
d(x_{n_i},x)<\epsilon/2
\qquad\text{for all }i\geq M.
$$

Choose one index $j\geq M$ with $n_j\geq N$. Then, for every $m\geq N$,

$$
d(x,x_m)
\leq d(x,x_{n_j})+d(x_{n_j},x_m)
<\epsilon.
$$

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 35.

## Two meanings of completeness in the course

Lecture 1's **least-upper-bound completeness** is an order property of $\mathbb{R}$: every nonempty real set bounded above has a supremum in $\mathbb{R}$. Lecture 6's **metric completeness** is a convergence property: every Cauchy sequence in a metric space converges to a point of that space.

These are different definitions and should not be conflated merely because both are called “completeness.” This wiki therefore uses the qualified names *least-upper-bound completeness* and *metric completeness* when the distinction matters.

**Course sources:** [Lecture 1](../raw/lectures/lecture-01.md), slide 38; [Lecture 6](../raw/lectures/lecture-06.md), slide 29.

## Connections

- [Bounds, suprema, and completeness](bounds-suprema-and-completeness.md) develops least-upper-bound completeness separately.
- [Sequences and convergence](sequences-and-convergence.md) defines limits, bounded sequences, and uniqueness of limits.
- [Metric-space topology](metric-space-topology.md) supplies the closed-set criterion for complete subspaces.
- The [contraction mapping theorem](contraction-mapping-theorem.md) requires a complete metric space.
- [Bounded continuous functions](bounded-continuous-functions.md) form a complete metric space under the lecture's stated assumptions.
