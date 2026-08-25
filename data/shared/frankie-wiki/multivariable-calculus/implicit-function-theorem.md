# Implicit Function Theorem

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slides 42–50; [Lecture 4](../raw/lectures/lecture-04.md), slides 12–15, 21–22

## Overview

An implicit equation may determine an endogenous variable locally even when it cannot be solved by an explicit formula. The implicit function theorem gives conditions for local existence, uniqueness, differentiability, and derivative formulas.

## Explicit and implicit functions

An explicit function writes the endogenous variable directly as

$$
y=f(x_1,x_2,\ldots,x_n).
$$

An implicit relation instead determines $y$ through an equation such as

$$
G(x_1,x_2,\ldots,x_n,y)=0.
$$

The lecture contrasts equations that can be solved explicitly with examples such as

$$
xy^2-3y-e^x=0
$$

and

$$
y^5-5xy+4x^2=0,
$$

for which an explicit solution may be unavailable.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slides 42–44.

## Local questions

Given $G(x,y)=c$ and a point $(x_0,y_0)$ satisfying $G(x_0,y_0)=c$, the lecture asks whether there is a continuous local function $y=y(x)$ such that

$$
G(x,y(x))=c,
\qquad
y(x_0)=y_0,
$$

and, if it is differentiable, how to compute $y'(x_0)$.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 45.

## Scalar implicit function theorem

**Theorem 15.1.** Let $G(x,y)$ be $C^1$ on a ball about $(x_0,y_0)\in\mathbb{R}^2$. Suppose

$$
G(x_0,y_0)=c
$$

and

$$
\frac{\partial G}{\partial y}(x_0,y_0)\neq0.
$$

Then there is a $C^1$ function $y=y(x)$ on an interval $I$ about $x_0$ such that

$$
G(x,y(x))\equiv c
$$

for all $x\in I$,

$$
y(x_0)=y_0,
$$

and

$$
y'(x_0)
=-
\frac{\frac{\partial G}{\partial x}(x_0,y_0)}
{\frac{\partial G}{\partial y}(x_0,y_0)}.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 46.

## Scalar examples

For

$$
G(x,y)=x^2-3xy+y^3-7=0
$$

at $(4,3)$, the lecture calculates

$$
G_x=-1,
\qquad
G_y=15,
\qquad
y'(x_0)=\frac{1}{15}.
$$

When $x$ changes from $4$ to $4.3$, the local approximation gives

$$
y_1\approx3+\frac{1}{15}(0.3)=3.02.
$$

For the circle $x^2+y^2=1$ near $(0,1)$, $G_y=2\neq0$ and

$$
y'(0)=0.
$$

The corresponding explicit branch is

$$
y(x)=\sqrt{1-x^2}.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slides 47–48.

## Several exogenous variables and one endogenous variable

**Theorem 15.2.** Let $G(x_1,\ldots,x_k,y)$ be $C^1$ near $(x_1^*,\ldots,x_k^*,y^*)$, with

$$
G(x_1^*,\ldots,x_k^*,y^*)=c
$$

and

$$
\frac{\partial G}{\partial y}(x_1^*,\ldots,x_k^*,y^*)\neq0.
$$

Then there is a $C^1$ function $y=y(x_1,\ldots,x_k)$ on an open ball $B$ about $(x_1^*,\ldots,x_k^*)$ such that

$$
G(x_1,\ldots,x_k,y(x_1,\ldots,x_k))\equiv c
$$

for every $(x_1,\ldots,x_k)\in B$,

$$
y(x_1^*,\ldots,x_k^*)=y^*,
$$

and

$$
\frac{\partial y}{\partial x_i}(x_1^*,\ldots,x_k^*)
=-
\frac{\frac{\partial G}{\partial x_i}(x_1^*,\ldots,x_k^*,y^*)}
{\frac{\partial G}{\partial y}(x_1^*,\ldots,x_k^*,y^*)}.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 49.

## General vector-valued form

Let $F$ be a $C^1$ mapping from an open set $E\subset\mathbb{R}^{m+n}$ to $\mathbb{R}^m$, with

$$
F(y^*,x^*)=c^*,
$$

where $y^*\in\mathbb{R}^m$ and $x^*\in\mathbb{R}^n$. Suppose

$$
\left(\frac{\partial F}{\partial y}\right)(y^*,x^*)
$$

is invertible. The lecture states that there are $\epsilon,\delta>0$ such that, for every $c\in B_\delta(c^*)$ and $x\in B_\delta(x^*)$, there is a unique $y\in B_\epsilon(y^*)$ satisfying

$$
F(y,x)=c.
$$

Writing this solution as $y=G(x,c)$, the function $G$ is $C^1$ and

$$
\left(\frac{\partial G}{\partial x}\right)(x^*,c^*)
=-
\left(\frac{\partial F}{\partial y}\right)^{-1}(y^*,x^*)
\left(\frac{\partial F}{\partial x}\right)(y^*,x^*).
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 50.

## Connections

- [Continuity in metric spaces](../real-analysis/continuity-in-metric-spaces.md) supplies the continuity concept used in the theorem's $C^1$ assumptions and local conclusions.
- [Partial derivatives](partial-derivatives.md) appear in the scalar derivative formulas.
- The [Jacobian derivative](jacobian-derivative.md) supplies the matrices in the vector-valued theorem.
- [Composition and invertibility](../functions/composition-and-invertibility.md) provides the invertibility language used in the general statement.
- [Lagrange multipliers for equality constraints](../constrained-optimization/lagrange-multipliers-for-equality-constraints.md) likewise require regular constraint derivatives, while expressing tangency by proportional gradients without relying on a particular slope denominator.
- [Constraint qualifications](../constrained-optimization/constraint-qualifications.md) develops the full-row-rank conditions used by the multiplier theorems.
