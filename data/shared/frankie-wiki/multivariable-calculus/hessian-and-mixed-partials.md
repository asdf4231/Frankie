# Hessian Matrix and Mixed Partials

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slides 38–40

## Overview

Mixed partial derivatives measure second-order changes across different variables. The Hessian arranges all second partial derivatives of a scalar-valued function into a matrix.

## Mixed partial derivatives and smoothness

For $y=f(x_1,\ldots,x_n)$, the derivatives

$$
\frac{\partial^2f}{\partial x_j\partial x_i},
\qquad i\neq j,
$$

are called cross or mixed partial derivatives.

The lecture uses $C^1$ for continuously differentiable functions and $C^2$ for twice continuously differentiable functions. If $f$ is $C^2$ on $\mathbb{R}^n$, it states

$$
\frac{\partial^2f}{\partial x_i\partial x_j}(\mathbf{x})
=
\frac{\partial^2f}{\partial x_j\partial x_i}(\mathbf{x}).
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 38.

## Hessian matrix

The Hessian at $\mathbf{x^*}$ is

$$
D^2f_{x^*}
=
\begin{pmatrix}
\frac{\partial^2f}{\partial x_1^2}(\mathbf{x^*}) & \cdots & \frac{\partial^2f}{\partial x_n\partial x_1}(\mathbf{x^*})\\
\vdots & \ddots & \vdots\\
\frac{\partial^2f}{\partial x_1\partial x_n}(\mathbf{x^*}) & \cdots & \frac{\partial^2f}{\partial x_n^2}(\mathbf{x^*})
\end{pmatrix}.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 39.

## Production-function example

For

$$
Q=4K^{3/4}L^{1/4},
$$

the first derivatives are

$$
\frac{\partial Q}{\partial K}=3K^{-1/4}L^{1/4},
\qquad
\frac{\partial Q}{\partial L}=K^{3/4}L^{-3/4}.
$$

The second derivatives displayed in the lecture are

$$
\frac{\partial^2Q}{\partial L\partial K}
=
\frac{\partial^2Q}{\partial K\partial L}
=
\frac{3}{4}K^{-1/4}L^{-3/4},
$$

$$
\frac{\partial^2Q}{\partial L^2}
=-\frac{3}{4}K^{3/4}L^{-7/4},
\qquad
\frac{\partial^2Q}{\partial K^2}
=-\frac{3}{4}K^{-5/4}L^{1/4}.
$$

The lecture identifies diminishing marginal productivity as an economic application.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slides 39–40.

## Connections

- [Partial derivatives](partial-derivatives.md) provides the first-order construction extended here.
- The [Jacobian derivative](jacobian-derivative.md) arranges first derivatives into a matrix, while the Hessian arranges second derivatives of a scalar-valued function.
- [Second-order conditions](../unconstrained-optimization/second-order-conditions.md) use Hessian definiteness to classify critical points.
- [Concavity, convexity, and global optima](../unconstrained-optimization/concavity-convexity-and-global-optima.md) use Hessian semidefiniteness over an entire domain.
- [Constrained second-order conditions](../constrained-optimization/constrained-second-order-conditions.md) use the Hessian of the Lagrangian and bordered Hessians to classify constrained candidates.
