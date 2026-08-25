# Total Derivative and Linear Approximation

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slides 13–16

## Overview

The lecture uses partial derivatives to approximate the change in a scalar-valued function when several inputs change together. The same approximation describes a tangent plane and the total differential.

## Two-variable approximation

For changes $\Delta x$ and $\Delta y$ around $(x^*,y^*)$, the lecture writes

$$
F(x^*+\Delta x,y^*+\Delta y)-F(x^*,y^*)
\approx
\frac{\partial F}{\partial x}(x^*,y^*)\Delta x
+
\frac{\partial F}{\partial y}(x^*,y^*)\Delta y.
$$

Equivalently,

$$
F(x^*+\Delta x,y^*+\Delta y)
\approx
F(x^*,y^*)
+
\frac{\partial F}{\partial x}(x^*,y^*)\Delta x
+
\frac{\partial F}{\partial y}(x^*,y^*)\Delta y.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slides 13–14.

## Tangent-plane representation

The tangent plane at $(x^*,y^*,F(x^*,y^*))$ is represented parametrically as

$$
(x^*,y^*,F(x^*,y^*))
+s\left(1,0,\frac{\partial F}{\partial x}(x^*,y^*)\right)
+t\left(0,1,\frac{\partial F}{\partial y}(x^*,y^*)\right).
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 14.

## Differentials

The symbols $dF$, $dx$, and $dy$ denote variations on the tangent plane. The total differential is

$$
dF
=
\frac{\partial F}{\partial x}(x^*,y^*)dx
+
\frac{\partial F}{\partial y}(x^*,y^*)dy.
$$

For $h=x^3\ln y$, the lecture gives

$$
dh=3x^2\ln y\,dx+\frac{x^3}{y}\,dy.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 15.

## Extension to $n$ variables

For $F(x_1,\ldots,x_n)$,

$$
dF
=
\frac{\partial F}{\partial x_1}(\mathbf{x^*})dx_1
+
\cdots
+
\frac{\partial F}{\partial x_n}(\mathbf{x^*})dx_n.
$$

With

$$
DF_{\mathbf{x^*}}
=
\left(
\frac{\partial F}{\partial x_1}(\mathbf{x^*}),
\ldots,
\frac{\partial F}{\partial x_n}(\mathbf{x^*})
\right)
$$

and $d\mathbf{x}=(dx_1,\ldots,dx_n)'$, this becomes

$$
dF=DF_{\mathbf{x^*}}\cdot d\mathbf{x}.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 16.

## Connections

- [Partial derivatives](partial-derivatives.md) supply the coefficients in the approximation.
- The [Jacobian derivative](jacobian-derivative.md) extends the derivative matrix to vector-valued functions.
- [Directional derivatives and the gradient](directional-derivatives-and-gradient.md) evaluate the derivative along a specified direction.
- [Envelope theorems](../constrained-optimization/envelope-theorems.md) compare the total derivative of an optimized value with a partial parameter derivative evaluated at the optimizer.
