# Curves and Tangent Vectors

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slides 23–25

## Overview

A curve in Euclidean space is described by coordinate functions of a parameter. Differentiating those coordinates produces a velocity vector tangent to the curve.

## Parameterized curves

A curve in $\mathbb{R}^n$ is written as

$$
\mathbf{x}(t)=(x_1(t),x_2(t),\ldots,x_n(t)),
$$

where each coordinate function $x_i$ is continuous from $\mathbb{R}$ to $\mathbb{R}$ and $t$ is the parameter.

The line segment from $(0,0)$ to $(1,1)$ can be parameterized by

$$
x(t)=t,
\qquad
y(t)=t,
\qquad
0\leq t\leq1,
$$

or by

$$
x(t)=t^2,
\qquad
y(t)=t^2,
\qquad
0\leq t\leq1.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 23.

## Velocity and tangent vectors

The velocity vector is

$$
\mathbf{x}'(t)=(x_1'(t),\ldots,x_n'(t)).
$$

When $t$ represents time, $x_i'(t)$ is the instantaneous velocity of the $i$-th coordinate. At the point $\mathbf{x}_0=\mathbf{x}(t_0)$, the vector $\mathbf{x}'(t_0)$ is tangent to the curve.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 24.

## Regular curves

A curve is regular when each $x_i'(t)$ is continuous and

$$
\mathbf{x}'(t)
=(x_1'(t),\ldots,x_n'(t))
\neq(0,\ldots,0)
$$

for every $t$.

The lecture gives $x(t)=t^3$, $y(t)=t^2$ as a curve with a cusp at the origin.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 25.

## Connections

- The [chain rule](chain-rule.md) differentiates a function evaluated along a curve.
- A [directional derivative](directional-derivatives-and-gradient.md) evaluates a function along a line with a specified direction vector.
