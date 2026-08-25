# Metric Spaces

> Course sources: [Lecture 6](../raw/lectures/lecture-06.md), slides 5–9

## Overview

A metric space equips a set with a distance function. The metric determines what it means for points to be close and supplies the balls, boundedness, convergence, continuity, completeness, and compactness used throughout the lecture.

## Metric and metric space

A **distance** or **metric** on a set $X$ is a function

$$
d\colon X\times X\to\mathbb{R}
$$

such that, for all $x,y,z\in X$,

1. $d(x,y)\geq0$, and $d(x,y)=0$ if and only if $x=y$;
2. $d(x,y)=d(y,x)$;
3. $d(x,y)\leq d(x,z)+d(z,y)$.

The third property is the triangle inequality. A **metric space** $(X,d)$ is a set together with a metric on it.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 6.

## Course examples

On $\mathbb{R}$, the usual metric is

$$
d(x,y)=|x-y|.
$$

On $\mathbb{R}^n$, the Euclidean metric is

$$
d(\bm{x},\bm{y})
=|\bm{x}-\bm{y}|
=\sqrt{(x_1-y_1)^2+\cdots+(x_n-y_n)^2}.
$$

On the set of bounded real-valued functions on $X$, the metric induced by the sup norm is

$$
d(f,g)=\|f-g\|_\infty
=\sup_{x\in X}|f(x)-g(x)|.
$$

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 7.

## Euclidean norm notation

Lecture 6 uses the single-bar notation $|\bm{x}-\bm{y}|$ for the Euclidean norm of a vector in $\mathbb{R}^n$. On the same slide, it uses double bars $\|f-g\|_\infty$ for the sup norm. This wiki preserves that course notation rather than silently replacing the Euclidean single bars by a different convention.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 7.

## Balls and boundedness

For $a\in X$ and $r>0$, the open ball centered at $a$ with radius $r$ is

$$
B_r(a)=\{x\in X:d(x,a)<r\}.
$$

A set $S\subset X$ is bounded if it lies in some open ball. The lecture also states that if $S$ is bounded, then for every $y\in X$ there is a $\rho>0$ such that

$$
S\subset B_\rho(y).
$$

Thus boundedness does not depend on which point is chosen as the center, although the required radius may change.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slides 8–9.

## Connections

- [Metric-space topology](metric-space-topology.md) develops balls, neighborhoods, interiors, boundaries, closures, and open and closed sets.
- [Sequences and convergence](sequences-and-convergence.md) defines convergence through the metric.
- [Cauchy sequences and metric completeness](cauchy-sequences-and-metric-completeness.md) uses distances between terms rather than a known limit.
- [Continuity in metric spaces](continuity-in-metric-spaces.md) compares input and output distances.
- [Bounded continuous functions](bounded-continuous-functions.md) uses a uniform metric on a function space.
