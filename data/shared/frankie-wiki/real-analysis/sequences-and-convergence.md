# Sequences and Convergence

> Course sources: [Lecture 6](../raw/lectures/lecture-06.md), slides 18–25, 35–36

## Overview

A sequence lists points of a set in an order indexed by the natural numbers. In a metric space, convergence means that the sequence eventually enters every prescribed ball around its limit.

## Sequences and subsequences

A sequence in $X$ is a function from $\mathbb{N}$ to $X$, written as

$$
x_1,x_2,\ldots,
\qquad
(x_n)_{n=1}^{\infty},
\qquad
\text{or simply }(x_n).
$$

A subsequence is $(x_{n_i})$, where $(n_i)$ is a strictly increasing sequence in $\mathbb{N}$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 18.

## Convergence in a metric space

A sequence $(x_n)$ in $(X,d)$ converges to $x\in X$ if, for every $\epsilon>0$, there is an $N\in\mathbb{N}$ such that

$$
n\geq N\implies d(x_n,x)<\epsilon.
$$

The lecture writes this as $x_n\to x$ or $\lim_{n\to\infty}x_n=x$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 19.

The constant sequence $(1,1,\ldots)$ converges, as does $x_n=1/n$. The sequence

$$
(1,1/2,1,1/3,\ldots)
$$

does not settle near a single point because it continues to return to $1$ while another subsequence approaches $0$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 20.

## Uniqueness of limits

A sequence in a metric space has at most one limit. If $x_n\to x$ and $x_n\to y$ with $x\neq y$, set $r=d(x,y)>0$. For a sufficiently large common index $N$,

$$
d(x_N,x)<r/2
\qquad\text{and}\qquad
d(x_N,y)<r/2.
$$

The triangle inequality then gives

$$
d(x,y)\leq d(x,x_N)+d(x_N,y)<r,
$$

a contradiction.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 21.

## Convergent sequences are bounded

A sequence is bounded if its range $\{x_n:n\in\mathbb{N}\}$ is a bounded subset of the metric space. If $x_n\to x$, choose $N$ so that $d(x_n,x)<1$ for every $n\geq N$, and define the finite-head bound

$$
M=\max\{d(x_1,x),d(x_2,x),\ldots,d(x_N,x),1\}.
$$

Then $d(x_n,x)\leq M$ for every $n\in\mathbb{N}$.

**Wiki proof completion:** Since boundedness was defined using an open ball, the displayed bound places every term in $B_{M+1}(x)$. The finite maximum is independent of the running index $n$; convergence handles the tail, while the maximum handles the finitely many initial terms.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 22.

## Convergence and closure

For $S\subset X$, a point $x$ belongs to $\bar S$ if and only if there is a sequence $(x_n)\subset S$ such that $x_n\to x$. Therefore, $S$ is closed exactly when it contains the limit of every convergent sequence drawn from $S$.

The constant-sequence case is essential: if $x\in S$, then $x_n=x$ is already a sequence in $S$ converging to $x$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 23.

## Rules for real sequences

If $x_n\to x$ and $y_n\to y$, then

1. $x_n+y_n\to x+y$;
2. $cx_n\to cx$ for every $c\in\mathbb{R}$;
3. $x_ny_n\to xy$;
4. $1/x_n\to1/x$ if $x_n\neq0$ and $x\neq0$.

The lecture also states two order results:

1. if $0\leq x_n\leq y_n$ eventually and $y_n\to0$, then $x_n\to0$;
2. if $x_n\leq y_n$ eventually, $x_n\to x$, and $y_n\to y$, then $x\leq y$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 24.

## Monotone convergence in $\mathbb{R}$

Every bounded monotone sequence in $\mathbb{R}$ has a limit in $\mathbb{R}$. The lecture notes that this theorem can be proved using the least-upper-bound completeness axiom.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 25.

## Subsequences

If a sequence in a metric space converges, every subsequence converges to the same limit. In $\mathbb{R}^n$, every bounded sequence has a convergent subsequence by the Bolzano–Weierstrass theorem.

The lecture's single-bar notation $|x_n|$ on the $\mathbb{R}^n$ slides denotes the Euclidean norm, as on its metric-space example slide.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slides 35–36.

## Connections

- [Metric-space topology](metric-space-topology.md) uses sequences to characterize closure and closed sets.
- [Bounds, suprema, and completeness](bounds-suprema-and-completeness.md) supplies the least-upper-bound completeness used for bounded monotone real sequences.
- [Cauchy sequences and metric completeness](cauchy-sequences-and-metric-completeness.md) gives a convergence criterion stated without a known limit.
- [Compactness](compactness.md) is defined by the existence of convergent subsequences with limits in the set.
- [Continuity in metric spaces](continuity-in-metric-spaces.md) can be tested by the behavior of convergent sequences.
