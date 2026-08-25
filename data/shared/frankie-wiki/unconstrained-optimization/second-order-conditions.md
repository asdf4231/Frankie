# Second-Order Conditions

> Course sources: [Lecture 3](../raw/lectures/lecture-03.md), slides 6–11

## Overview

Second-order conditions use Hessian definiteness to classify critical points and to state necessary curvature properties at interior local extrema.

## Critical points and the Hessian

A point $\mathbf{x}^*$ is critical if

$$
DF(\mathbf{x}^*)=0.
$$

The Hessian $D^2F(\mathbf{x}^*)$ collects the second partial derivatives used to classify such a point.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 6.

## Sufficient conditions

**Theorem 17.2.** Let $F$ be $C^2$ on an open set and let $\mathbf{x}^*$ be a critical point.

- If $D^2F(\mathbf{x}^*)$ is negative definite and symmetric, then $\mathbf{x}^*$ is a strict local maximum.
- If $D^2F(\mathbf{x}^*)$ is positive definite and symmetric, then $\mathbf{x}^*$ is a strict local minimum.
- If $D^2F(\mathbf{x}^*)$ is indefinite, then $\mathbf{x}^*$ is neither a local maximum nor a local minimum.

An indefinite critical point is called a saddle point: it behaves as a minimum in some directions and a maximum in others. The lecture gives $F(x_1,x_2)=x_1^2-x_2^2$ as an example.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slides 7–8.

## Necessary conditions

At an interior local maximum of a $C^2$ function,

$$
DF(\mathbf{x}^*)=0
$$

and the Hessian is negative semidefinite. At an interior local minimum, the gradient is zero and the Hessian is positive semidefinite.

The lecture also states principal-minor conditions: all principal minors are nonnegative at a local minimum; at a local maximum, odd-order principal minors are nonpositive and even-order principal minors are nonnegative.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slides 9–10.

## Classification example

For

$$
F(x,y)=x^3-y^3+9xy,
$$

the critical points are $(0,0)$ and $(3,-3)$, and the Hessian is

$$
D^2F(x,y)
=
\begin{pmatrix}
F_{xx} & F_{xy}\\
F_{yx} & F_{yy}
\end{pmatrix}
=
\begin{pmatrix}
6x & 9\\
9 & -6y
\end{pmatrix}.
$$

At $(0,0)$, the determinant is $-81$, so the point is a saddle. At $(3,-3)$, the leading principal minors are $18$ and $243$, so the Hessian is positive definite and the point is a strict local minimum. It is not a global minimum because

$$
F(0,n)=-n^3\to-\infty.
$$

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 11.

## Connections

- [First-order conditions](first-order-conditions.md) identify the critical-point candidates.
- [Hessian matrix and mixed partials](../multivariable-calculus/hessian-and-mixed-partials.md) defines the derivative matrix used here.
- [Concavity, convexity, and global optima](concavity-convexity-and-global-optima.md) extends curvature conditions from one point to the whole domain.
- [Constrained second-order conditions](../constrained-optimization/constrained-second-order-conditions.md) restrict Lagrangian curvature tests to linearized feasible directions.
