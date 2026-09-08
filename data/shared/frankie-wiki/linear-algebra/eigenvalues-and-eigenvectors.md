# Eigenvalues and Eigenvectors

> Course sources: [Lecture 9](../raw/lectures/lecture-09.md), slide 13

## Overview

Eigenvalues and eigenvectors identify nonzero directions in which a matrix acts by scalar multiplication. The lecture introduces them as the linear-algebra prerequisite for solving planar differential equations and testing stability.

## Definition and calculation

A number $r$ is an **eigenvalue** of a square matrix $A$ if there is a nonzero vector $\mathbf v$ such that

$$
A\mathbf v=r\mathbf v.
$$

Such a vector is an **eigenvector corresponding to $r$**. To calculate them:

1. Solve the **characteristic equation** $\det(A-rI)=0$ for $r$.
2. For each eigenvalue, solve $(A-rI)\mathbf v=\mathbf0$ and choose a nonzero solution.

The zero vector does not qualify as an eigenvector.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 13.

## Two-dimensional characteristic equation

For

$$
A=\begin{pmatrix}a&b\\c&d\end{pmatrix},
$$

the characteristic polynomial is

$$
\det(A-rI)=r^2-(a+d)r+(ad-bc).
$$

Its roots satisfy

$$
r_1+r_2=\operatorname{trace}A=a+d,
\qquad r_1r_2=\det A=ad-bc.
$$

These identities permit stability tests based on the sum and product of the eigenvalues, rather than explicit root formulas.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 13; the resulting stability criteria are developed on the [linearization page](../ordinary-differential-equations/linearization-and-local-stability.md).

## Connections

- [Linear systems](../ordinary-differential-equations/linear-systems.md) use eigenvectors as solution directions and eigenvalues as exponential growth rates; the lecture's closed-form theorem assumes distinct real eigenvalues.
- [Linearization and local stability](../ordinary-differential-equations/linearization-and-local-stability.md) apply eigenvalue tests to a steady state's [Jacobian](../multivariable-calculus/jacobian-derivative.md).
