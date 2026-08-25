# Jacobian Derivative

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slides 18–21; [Lecture 4](../raw/lectures/lecture-04.md), slides 21–24, 43, 46, 52–54, 67

## Overview

For a function from $\mathbb{R}^n$ to $\mathbb{R}^m$, the Jacobian derivative collects the first partial derivatives of all component functions into an $m\times n$ matrix.

## Componentwise linear approximation

Let

$$
F=(f_1,f_2,\ldots,f_m)\colon\mathbb{R}^n\to\mathbb{R}^m.
$$

The lecture approximates the change in each component by

$$
f_i(\mathbf{x^*}+\Delta\mathbf{x})-f_i(\mathbf{x^*})
\approx
\frac{\partial f_i}{\partial x_1}(\mathbf{x^*})\Delta x_1
+
\cdots
+
\frac{\partial f_i}{\partial x_n}(\mathbf{x^*})\Delta x_n.
$$

Stacking the component approximations gives a matrix-vector expression for $F(\mathbf{x^*}+\Delta\mathbf{x})-F(\mathbf{x^*})$.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slides 18–19.

## Jacobian matrix

The Jacobian derivative of $F$ at $\mathbf{x^*}$ is

$$
DF(\mathbf{x^*})=F'(x^*)
=
\begin{pmatrix}
\frac{\partial f_1}{\partial x_1}(\mathbf{x^*}) & \cdots & \frac{\partial f_1}{\partial x_n}(\mathbf{x^*})\\
\vdots & \ddots & \vdots\\
\frac{\partial f_m}{\partial x_1}(\mathbf{x^*}) & \cdots & \frac{\partial f_m}{\partial x_n}(\mathbf{x^*})
\end{pmatrix}.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 20.

## Demand-system example

For

$$
Q_1=6p_1^{-2}p_2^{3/2}y,
\qquad
Q_2=4p_1p_2^{-1}y^2
$$

at $p_1^*=6$, $p_2^*=9$, and $y^*=2$, the lecture obtains

$$
dQ_1=-3dp_1+1.5dp_2+4.5dy,
$$

$$
dQ_2=\frac{16}{9}dp_1-\frac{32}{27}dp_2+\frac{32}{3}dy.
$$

If both prices rise by $0.1$ and income falls by $0.1$, then

$$
dQ_1=-0.6,
\qquad
dQ_2\approx-1.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 21.

## Connections

- The [total derivative and linear approximation](total-derivative-and-linear-approximation.md) gives the scalar-valued version of this construction.
- The [chain rule](chain-rule.md) composes Jacobian matrices.
- [Continuity in metric spaces](../real-analysis/continuity-in-metric-spaces.md) supplies the continuity concept appearing when Jacobians are assumed continuous in $C^1$ results.
- The [implicit function theorem](implicit-function-theorem.md) uses derivatives and invertibility conditions to solve locally for endogenous variables.
- [Constraint qualifications](../constrained-optimization/constraint-qualifications.md) test the row rank of Jacobians formed from equality constraints and binding inequalities.
- [Lagrange multipliers for equality constraints](../constrained-optimization/lagrange-multipliers-for-equality-constraints.md) use the constraint Jacobian in the several-equality multiplier theorem.
- [Constrained second-order conditions](../constrained-optimization/constrained-second-order-conditions.md) use constraint Jacobians to select the linearized feasible directions for Lagrangian curvature tests.
