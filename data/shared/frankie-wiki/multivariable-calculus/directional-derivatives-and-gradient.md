# Directional Derivatives and Gradient

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slides 32–36; [Lecture 4](../raw/lectures/lecture-04.md), slides 12–15, 30–33

## Overview

A directional derivative measures the rate of change of a scalar-valued function along a specified direction. The gradient collects the relevant partial derivatives and points in the direction of most rapid increase under the lecture's stated conditions.

## Directional derivative

To evaluate $F$ at $\mathbf{x^*}$ in the direction $\mathbf{v}$, restrict the function to the line

$$
\mathbf{x}=\mathbf{x^*}+t\mathbf{v}
$$

and define

$$
g(t)=F(\mathbf{x^*}+t\mathbf{v}).
$$

Differentiating at $t=0$ gives

$$
\begin{aligned}
g'(0)
&=
\frac{\partial F}{\partial x_1}(\mathbf{x^*})v_1
+
\cdots
+
\frac{\partial F}{\partial x_n}(\mathbf{x^*})v_n\\
&=DF_{\mathbf{x^*}}\cdot\mathbf{v}
=
\frac{\partial F}{\partial v}(\mathbf{x^*})
=
D_vF(\mathbf{x^*}).
\end{aligned}
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slides 32–33.

## Gradient vector

The gradient is the column vector

$$
\nabla F(\mathbf{x^*})
=
\begin{pmatrix}
\frac{\partial F}{\partial x_1}(\mathbf{x^*})\\
\vdots\\
\frac{\partial F}{\partial x_n}(\mathbf{x^*})
\end{pmatrix}.
$$

For a unit vector $\mathbf{v}$, the product $DF_{\mathbf{x^*}}\cdot\mathbf{v}$ measures the rate of change from $\mathbf{x^*}$ in direction $\mathbf{v}$.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 34.

## Direction of most rapid increase

**Theorem 14.2.** Let $F\colon\mathbb{R}^n\to\mathbb{R}$ be $C^1$. At a point $\mathbf{x}$ where $\nabla F(\mathbf{x})\neq\mathbf{0}$, the gradient points in the direction in which $F$ increases most rapidly.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 35.

## Production example

For

$$
Q=F(K,L)=4K^{3/4}L^{1/4},
$$

the lecture computes

$$
\nabla F(10{,}000,625)
=
\begin{pmatrix}
1.5\\
8
\end{pmatrix}.
$$

It therefore gives the proportion $1.5$ to $8$ for adding $K$ and $L$ to increase production most rapidly.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slides 35–36.

## Connections

- [Partial derivatives](partial-derivatives.md) are the components of the gradient.
- The line restriction uses the [chain rule](chain-rule.md).
- The [total derivative and linear approximation](total-derivative-and-linear-approximation.md) provides the derivative row vector appearing in the dot product.
- [First-order conditions](../unconstrained-optimization/first-order-conditions.md) set the gradient equal to zero at an unconstrained interior local optimum.
- [Lagrange multipliers for equality constraints](../constrained-optimization/lagrange-multipliers-for-equality-constraints.md) replace zero-gradient stationarity by proportionality between the objective and equality-constraint gradients.
- [Kuhn–Tucker conditions](../constrained-optimization/kuhn-tucker-conditions.md) combine objective and active-inequality gradients with nonnegative multipliers and complementary slackness.
