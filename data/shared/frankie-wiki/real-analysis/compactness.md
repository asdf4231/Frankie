# Compactness

> Course sources: [Lecture 6](../raw/lectures/lecture-06.md), slides 22, 35–39, 49

## Overview

In the lecture's metric-space treatment, compactness means that every sequence in a set has a subsequence converging to a point of that set. In $\mathbb{R}^n$, this is equivalent to being closed and bounded; for a general metric space, the lecture separately establishes that compact subsets are closed and bounded.

## Subsequences used in compactness arguments

If a sequence converges, every subsequence converges to the same limit. If a Cauchy sequence has a subsequence converging to $x$, then the full sequence converges to $x$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 35.

## Bolzano–Weierstrass and the Euclidean sequence criterion

Every bounded sequence in $\mathbb{R}^n$ has a convergent subsequence. The lecture emphasizes that this Bolzano–Weierstrass result does not hold in an arbitrary metric space.

Consequently, for $S\subset\mathbb{R}^n$, the following are equivalent:

1. $S$ is closed and bounded;
2. every sequence in $S$ has a subsequence converging to a limit in $S$.

For the boundedness direction, if $S$ were unbounded, one could choose $x_n\in S$ with

$$
|x_n|>n.
$$

Every subsequence would remain unbounded and therefore could not converge.

The lecture uses the single bars $|x_n|$ for the Euclidean norm on $\mathbb{R}^n$; this page preserves that notation.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 36.

## Compact sets

A subset $S$ of a metric space $(X,d)$ is compact if every sequence in $S$ has a subsequence that converges to a limit in $S$. The lecture notes that this definition is sequential compactness and that it is equivalent to compactness for metric spaces.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 37.

## Heine–Borel theorem

A subset of $\mathbb{R}^n$ is compact if and only if it is closed and bounded.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 37.

## Compact subsets of metric spaces are closed and bounded

If $S\subset X$ is compact, then it is closed in $X$. Indeed, if $(x_n)\subset S$ converges to $x\in X$, compactness gives a subsequence converging to a point of $S$. The subsequence also converges to $x$, and uniqueness of limits therefore puts $x$ in $S$.

**Wiki proof completion:** The lecture gives the contradiction strategy; the following construction supplies its omitted step. Suppose instead that $S$ is unbounded. Fix $a\in X$ and choose

$$
x_n\in S\setminus B_n(a)
$$

for every $n\in\mathbb{N}$, so $d(x_n,a)\geq n$. Compactness would give a convergent subsequence $(x_{n_j})$. Every convergent sequence is bounded, but

$$
d(x_{n_j},a)\geq n_j\geq j,
$$

so this subsequence is unbounded. The contradiction shows that $S$ is bounded.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slides 22, 38.

## Closed subsets of compact metric spaces

If $X$ is compact and $S\subset X$, then $S$ is compact if and only if $S$ is closed in $X$. Compactness implies closedness by the preceding result. Conversely, a sequence in a closed subset $S$ has a convergent subsequence in $X$, and closedness keeps the limit in $S$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 39.

## Continuous images and extrema

A continuous image of a compact set is compact. If the compact domain is nonempty and the function is real-valued, the function is bounded above and below and attains a maximum and a minimum.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 49.

## Connections

- [Sequences and convergence](sequences-and-convergence.md) supplies subsequences, bounded sequences, and uniqueness of limits.
- [Metric-space topology](metric-space-topology.md) supplies closedness and boundedness.
- [Continuity in metric spaces](continuity-in-metric-spaces.md) develops continuous images of compact sets.
- [Maximizers and local extrema](../unconstrained-optimization/maximizers-and-local-extrema.md) uses compactness to obtain global extrema on nonempty compact domains.
