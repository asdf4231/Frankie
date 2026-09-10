# Smooth Dependence of Constrained Optima

> Course sources: [Lecture 5](../raw/lectures/lecture-05.md), slide 23

## Overview

The sensitivity and envelope results assume differentiable choices and multipliers. Theorem 19.9 gives a nonsingularity condition for smooth dependence in equality-constrained problems and relates it to NDCQ.

## Theorem 19.9

Consider maximizing $f(x;a)$ subject to

$$
h_1(x;a)=0,\quad h_2(x;a)=0,\quad\ldots,\quad h_k(x;a)=0.
$$

Let $x^*(a)$ be the solution of the parameterized constrained maximization problem and let $\mu^*(a)$ be the corresponding Lagrange multiplier. The lecture states that if the Hessian matrix of the Lagrangian is nonsingular at

$$
(x^*(a_0),\mu^*(a_0);a_0),
$$

then:

1. $x^*(a)$ and $\mu^*(a)$ are $C^1$ functions of $a$ at $a=a_0$; and
2. NDCQ holds at $(x^*(a_0),\mu^*(a_0);a_0)$.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slide 23.

## Connections

- [Envelope theorems](envelope-theorems.md) and [equality multiplier sensitivity](lagrange-multipliers-for-equality-constraints.md) require differentiable optimizing choices and multipliers.
- The [implicit function theorem](../multivariable-calculus/implicit-function-theorem.md) studies smooth dependence in systems of equations.
- [Constraint qualifications](constraint-qualifications.md) defines NDCQ and contrasts necessary multiplier conditions with and without it.
- The [Hessian matrix](../multivariable-calculus/hessian-and-mixed-partials.md) collects second partial derivatives.
