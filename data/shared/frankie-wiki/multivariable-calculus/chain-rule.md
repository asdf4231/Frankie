# Chain Rule

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slide 17

## Overview

The chain rule differentiates a composition by multiplying Jacobian matrices. Scalar and vector-valued functions along curves are special cases of the general formula.

## General Jacobian form

**General Chain Rule (Theorem 14.4).** Let $F\colon\mathbb{R}^n\to\mathbb{R}^m$ and $A\colon\mathbb{R}^s\to\mathbb{R}^n$ be $C^1$, with

$$
\mathbf{x^*}=A(\mathbf{s^*}).
$$

For $H=F\circ A\colon\mathbb{R}^s\to\mathbb{R}^m$, the lecture states

$$
DH(\mathbf{s^*})
=
DF(\mathbf{x^*})\cdot DA(\mathbf{s^*}).
$$

The factors have dimensions $m\times n$ and $n\times s$, respectively, so the product has dimensions $m\times s$.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 17.

## Specializations along a curve

**Wiki specializations:** Setting $s=1$ in Theorem 14.4 gives the vector-valued curve formula. With $C^1$ maps $\mathbf{a}\colon\mathbb{R}\to\mathbb{R}^n$ and $F\colon\mathbb{R}^n\to\mathbb{R}^m$, write $g(t)=F(\mathbf{a}(t))$. Then

$$
g'(t)=DF(\mathbf{a}(t))\cdot\mathbf{a}'(t),
\qquad
g_i'(t)=\sum_{j=1}^n\frac{\partial F_i}{\partial x_j}(\mathbf{a}(t))a_j'(t).
$$

Taking also $m=1$, and writing the scalar function as $f$ and the curve as $\mathbf{x}(t)$, gives

$$
\frac{d}{dt}f(\mathbf{x}(t))
=\sum_{j=1}^n\frac{\partial f}{\partial x_j}(\mathbf{x}(t))x_j'(t).
$$

Both formulas retain the theorem's $C^1$ assumptions; they are specializations supplied here, not separately stated results in the current lecture.

**Course source for the specializations:** [Lecture 2](../raw/lectures/lecture-02.md), slide 17.

## Connections

- [Curves and tangent vectors](curves-and-tangent-vectors.md) supplies the curve and velocity-vector language.
- The [Jacobian derivative](jacobian-derivative.md) supplies the derivative matrices in the general formula.
- [Directional derivatives and the gradient](directional-derivatives-and-gradient.md) apply the chain rule to a line through a point.
- [Envelope theorems](../constrained-optimization/envelope-theorems.md) concern parameter derivatives of objectives evaluated along optimizing choices.
