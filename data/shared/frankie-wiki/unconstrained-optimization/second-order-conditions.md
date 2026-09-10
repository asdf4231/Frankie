# Second-Order Conditions

> Course sources: [Lecture 3](../raw/lectures/lecture-03.md), slides 14–18

## Overview

Second-order conditions use Hessian definiteness to classify critical points and to state necessary curvature properties at interior local extrema.

## Critical points and the Hessian

A point $\mathbf{x}^*$ is critical if

$$
DF(\mathbf{x}^*)=0.
$$

The [Hessian](../multivariable-calculus/hessian-and-mixed-partials.md) $D^2F(\mathbf{x}^*)$ collects the second partial derivatives used to classify such a point. Definitions of definiteness and determinant tests belong to [quadratic forms and definiteness](../linear-algebra/quadratic-forms-and-definiteness.md).

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 14.

## Sufficient conditions

**Theorem 17.2 (Sufficient Conditions).** Let $F\colon U\subset\mathbb{R}^n\to\mathbb{R}^1$ be $C^2$ on an open set $U$ and let $\mathbf{x}^*$ be a critical point.

- If $D^2F(\mathbf{x}^*)$ is negative definite and symmetric, then $\mathbf{x}^*$ is a strict local maximum.
- If $D^2F(\mathbf{x}^*)$ is positive definite and symmetric, then $\mathbf{x}^*$ is a strict local minimum.
- If $D^2F(\mathbf{x}^*)$ is indefinite, then $\mathbf{x}^*$ is neither a local maximum nor a local minimum.

An indefinite critical point is called a saddle point: it behaves as a minimum in some directions and a maximum in others. The lecture gives $F(x_1,x_2)=x_1^2-x_2^2$ as an example.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slides 15–16.

## Necessary conditions

**Theorem 17.6.** At an interior local maximum of a $C^2$ function $F\colon U\subset\mathbb{R}^n\to\mathbb{R}^1$,

$$
DF(\mathbf{x}^*)=0
$$

and the Hessian is negative semidefinite. At an interior local minimum, the gradient is zero and the Hessian is positive semidefinite.

**Theorem 17.7** expresses these necessary conditions in terms of minors. For a $C^2$ function at an interior local minimum, all first partials vanish and **all principal minors** of the Hessian are nonnegative. At an interior local maximum, all first partials vanish, **all odd-order principal minors** are nonpositive, and **all even-order principal minors** are nonnegative. These are not tests of leading minors alone.

The semidefinite conditions are necessary conditions, not the strict-definiteness sufficient conditions of Theorem 17.2. When only semidefiniteness is known, these stated results alone do not establish a local extremum.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slides 15, 17–18.

## Connections

- [First-order conditions](first-order-conditions.md) identify the critical-point candidates and work through the discriminating-monopolist example.
- [Quadratic forms and definiteness](../linear-algebra/quadratic-forms-and-definiteness.md) supplies symmetric-matrix sign definitions, leading-minor strict tests, and all-principal-minor semidefinite tests.
- [Hessian matrix and mixed partials](../multivariable-calculus/hessian-and-mixed-partials.md) defines the derivative matrix used here.
- [Concavity, convexity, and global optima](concavity-convexity-and-global-optima.md) extends curvature conditions from one point to the whole domain.
