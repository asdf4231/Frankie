# Chain Rule

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slides 26–30

## Overview

The chain rule differentiates a composition. The lecture presents a scalar function along a curve, a vector-valued function along a curve, and the general Jacobian product formula.

## Scalar function along a curve

Let $\mathbf{x}(t)=(x_1(t),\ldots,x_n(t))$ be a $C^1$ curve near $t_0$, and let $f$ be $C^1$ on a ball about $\mathbf{x}(t_0)$. For

$$
g(t)=f(x_1(t),\ldots,x_n(t)),
$$

the lecture states

$$
\frac{dg}{dt}(t_0)
=
\frac{\partial f}{\partial x_1}(\mathbf{x}(t_0))x_1'(t_0)
+
\cdots
+
\frac{\partial f}{\partial x_n}(\mathbf{x}(t_0))x_n'(t_0).
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 26.

## Example along a line

For

$$
f(x,y)=x^2+y^2,
\qquad
x(t)=t,
\qquad
y(t)=t,
$$

$g(t)=f(x(t),y(t))$ measures squared distance from the origin along the line. At $t=1$,

$$
g'(1)
=
\frac{\partial f}{\partial x}(1,1)
+
\frac{\partial f}{\partial y}(1,1)
=4.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 27.

## Vector-valued function along a curve

Let $F\colon\mathbb{R}^n\to\mathbb{R}^m$ and $\mathbf{a}\colon\mathbb{R}\to\mathbb{R}^n$ be $C^1$. For

$$
g(t)=F(\mathbf{a}(t)),
$$

each component satisfies

$$
g_i'(t)
=
\sum_{j=1}^n
\frac{\partial F_i}{\partial x_j}(a_1(t),\ldots,a_n(t))a_j'(t)
=
DF_i(\mathbf{a}(t))\cdot\mathbf{a}'(t).
$$

Together,

$$
g'(t)=DF(\mathbf{a}(t))\cdot\mathbf{a}'(t).
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 28.

## Demand-system exercise

The lecture asks how the demands

$$
Q_1=6p_1^{-2}p_2^{3/2}y,
\qquad
Q_2=4p_1p_2^{-1}y^2
$$

change at $t=3$ when

$$
p_1(t)=\sqrt{12t},
\qquad
p_2(t)=t^2,
\qquad
y(t)=t-1.
$$

No solution is displayed on the slide.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 29.

## General Jacobian form

Let $F\colon\mathbb{R}^n\to\mathbb{R}^m$ and $A\colon\mathbb{R}^s\to\mathbb{R}^n$ be $C^1$, with

$$
\mathbf{x^*}=A(\mathbf{s^*}).
$$

For $H=F\circ A$, the lecture states

$$
DH(\mathbf{s^*})
=
DF(\mathbf{x^*})\,DA(\mathbf{s^*}).
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 30.

## Connections

- [Curves and tangent vectors](curves-and-tangent-vectors.md) supplies the curve and velocity-vector language.
- The [Jacobian derivative](jacobian-derivative.md) supplies the derivative matrices in the general formula.
- [Directional derivatives and the gradient](directional-derivatives-and-gradient.md) apply the chain rule to a line through a point.
- [Envelope theorems](../constrained-optimization/envelope-theorems.md) concern parameter derivatives of objectives evaluated along optimizing choices.
