# Partial Derivatives

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slides 10–11

## Overview

A partial derivative measures how a multivariable function changes when one argument varies while all other arguments remain fixed.

## Definition

Consider

$$
y=f(x_1,x_2,\ldots,x_n).
$$

The partial derivative with respect to $x_i$ at $(x_1^0,\ldots,x_n^0)$ is

$$
\frac{\partial f}{\partial x_i}(x_1^0,\ldots,x_i^0,\ldots,x_n^0)
=
\lim_{h\to0}
\frac{
 f(x_1^0,\ldots,x_i^0+h,\ldots,x_n^0)
 -f(x_1^0,\ldots,x_i^0,\ldots,x_n^0)
}{h}.
$$

Only the $i$-th argument changes in this limit.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 10.

## Course example

The lecture gives the function

$$
f(x,y)=3x^2y^2+4xy^3+7y
$$

as a partial-derivative example, without displaying the resulting derivatives on the slide.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 11.

## Connections

- The [total derivative and linear approximation](total-derivative-and-linear-approximation.md) combine partial derivatives into a local linear change.
- The [Jacobian derivative](jacobian-derivative.md) arranges first partial derivatives into a matrix.
- [Directional derivatives and the gradient](directional-derivatives-and-gradient.md) combine partial derivatives with a direction vector.
- The [Hessian matrix and mixed partials](hessian-and-mixed-partials.md) collect second-order partial derivatives.
