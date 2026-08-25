# Linear, Affine, and Polynomial Functions

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slides 6–7

## Overview

The lecture distinguishes linear transformations, affine functions, monomials, and polynomials as important forms of functions between Euclidean spaces.

## Linear transformations

A function $f\colon\mathbb{R}^k\to\mathbb{R}^m$ is linear if it preserves addition and scalar multiplication:

$$
f(x+y)=f(x)+f(y),
\qquad
f(rx)=rf(x)
$$

for all $x,y\in\mathbb{R}^k$ and $r\in\mathbb{R}$.

For a scalar-valued linear function $f\colon\mathbb{R}^k\to\mathbb{R}$, the lecture states that there is a vector $a\in\mathbb{R}^k$ such that

$$
f(x)=a\cdot x.
$$

For a linear function $f\colon\mathbb{R}^k\to\mathbb{R}^m$, there is an $m\times k$ matrix $A$ such that

$$
f(x)=Ax.
$$

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 6.

## Monomials and polynomials

A scalar-valued function is a monomial when it has the form

$$
f(x_1,\ldots,x_k)=cx_1^{a_1}x_2^{a_2}\cdots x_k^{a_k}.
$$

The degree of the monomial is $\sum_i a_i$. A polynomial is a finite sum of monomials, and its degree is the highest degree among those monomials.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 7.

## Affine functions

An affine function has the form

$$
f(x)=Ax+b.
$$

The lecture describes it as a polynomial of degree $1$.

**Course source:** [Lecture 2](../raw/lectures/lecture-02.md), slide 7.

## Connections

- [Functions, images, and inverse images](functions-images-and-inverse-images.md) provides the general language of mappings between sets.
- The matrix representation of linear maps connects to the [Jacobian derivative](../multivariable-calculus/jacobian-derivative.md).
