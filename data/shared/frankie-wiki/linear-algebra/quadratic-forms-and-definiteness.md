# Quadratic Forms and Definiteness

> Course sources: [Lecture 3](../raw/lectures/lecture-03.md), slides 6–12

## Overview

A quadratic form is a degree-two expression represented by a symmetric matrix. Definiteness describes its sign away from the origin. Principal-minor tests turn these sign conditions into determinant conditions and supply the matrix tools used in Hessian tests for optimization.

## Symmetric matrix representation

A quadratic form on $\mathbb{R}^k$ has the form

$$
Q(x_1,\ldots,x_k)=\sum_{i\leq j}a_{ij}x_ix_j
=\mathbf{x}^T A\mathbf{x},
$$

where

$$
A=\begin{pmatrix}
a_{11}&\frac12a_{12}&\cdots&\frac12a_{1k}\\
\frac12a_{12}&a_{22}&\cdots&\frac12a_{2k}\\
\vdots&\vdots&\ddots&\vdots\\
\frac12a_{1k}&\frac12a_{2k}&\cdots&a_{kk}
\end{pmatrix}.
$$

**Wiki explanation:** The off-diagonal coefficient is halved because the matrix product includes both $A_{ij}x_ix_j$ and $A_{ji}x_jx_i$. With $A_{ij}=A_{ji}=a_{ij}/2$, their sum is the single term $a_{ij}x_ix_j$ in the lecture's polynomial convention.

**Notation distinction:** On slide 6, $a_{ij}$ denotes a polynomial coefficient. In the principal-minor display on slide 8, $a_{ij}$ denotes a matrix entry instead. The halving rule applies when constructing the symmetric matrix from the polynomial coefficients, not when taking minors of a matrix already given.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slides 6, 8.

## Sign definitions

For a symmetric $n\times n$ matrix $A$, write $Q(\mathbf{x})=\mathbf{x}^T A\mathbf{x}$.

| Property | Sign condition | Lecture example |
|---|---|---|
| Positive definite | $Q(\mathbf{x})>0$ for every $\mathbf{x}\neq\mathbf0$ | $x_1^2+x_2^2$ |
| Negative definite | $Q(\mathbf{x})<0$ for every $\mathbf{x}\neq\mathbf0$ | $-x_1^2-x_2^2$ |
| Positive semidefinite | $Q(\mathbf{x})\geq0$ for every $\mathbf{x}\neq\mathbf0$ | $x_1^2+2x_1x_2+x_2^2$ |
| Negative semidefinite | $Q(\mathbf{x})\leq0$ for every $\mathbf{x}\neq\mathbf0$ | $-x_1^2-2x_1x_2-x_2^2$ |
| Indefinite | Positive at some vector and negative at another | $x_1^2-x_2^2$ |

The semidefinite inequalities are weak: positive definite forms are also positive semidefinite, and likewise for negative forms. Thus “semidefinite” does not by itself assert that the form vanishes at a nonzero vector.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 7.

## Principal versus leading principal minors

A $k$th-order **principal submatrix** retains the same $k$ row and column indices; its determinant is a $k$th-order **principal minor**. A **leading principal submatrix** retains the first $k$ rows and columns. Write $A_k$ for this upper-left block and $|A_k|$ for its determinant, as in Theorem 16.1.

For a $3\times3$ matrix, the leading principal minors are

$$
|a_{11}|,\qquad
\begin{vmatrix}a_{11}&a_{12}\\a_{21}&a_{22}\end{vmatrix},\qquad
\det A.
$$

**Notation clarification:** Here $|a_{11}|$ is the determinant of the $1\times1$ matrix $(a_{11})$, so it equals $a_{11}$; it is **not an absolute value**. Similarly, $|A_k|$ denotes a determinant and can be negative.

**Wiki illustration of the distinction:** For a $3\times3$ matrix, the first-order principal minors are $a_{11},a_{22},a_{33}$, but only $a_{11}$ is leading. The second-order principal minors retain index pairs $\{1,2\}$, $\{1,3\}$, or $\{2,3\}$; only the first of these is leading.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slides 8–9.

## Strict definiteness: leading principal minors

**Theorem 16.1.** For a symmetric $n\times n$ matrix $A$:

- (a) $A$ is positive definite if and only if all $n$ leading principal minors are strictly positive.
- (b) $A$ is negative definite if and only if their signs alternate:

  $$
  |A_1|<0,\quad |A_2|>0,\quad |A_3|<0,\quad\ldots,
  $$

  so the $k$th leading principal minor has sign $(-1)^k$.
- (c) The lecture identifies indefiniteness when the nonzero leading principal minors conflict with both sign patterns: a negative even-order leading principal minor, or two odd-order leading principal minors with opposite signs.

The slide warns that this test may fail to classify a matrix when some leading principal minor is zero while the nonzero ones fit one of the strict sign patterns. Failure of a strict-definiteness test alone should therefore not be read as a conclusion of indefiniteness.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 9.

## Semidefiniteness: all principal minors

**Theorem 16.2.** For a symmetric $n\times n$ matrix $A$:

- $A$ is positive semidefinite if and only if **every principal minor** is nonnegative.
- $A$ is negative semidefinite if and only if **every odd-order principal minor** is nonpositive and **every even-order principal minor** is nonnegative.

These conditions concern all principal minors, not merely the leading ones. Replacing the strict inequalities in Theorem 16.1 with weak inequalities on leading minors is not the test stated in Theorem 16.2.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 10.

## Diagonal matrices

For a diagonal matrix, the quadratic form is

$$
Q(\mathbf{x})=a_1x_1^2+\cdots+a_nx_n^2.
$$

- It is positive definite if and only if every $a_i>0$, and negative definite if and only if every $a_i<0$.
- It is positive semidefinite if and only if every $a_i\geq0$, and negative semidefinite if and only if every $a_i\leq0$.
- Coefficients of opposite signs make the form indefinite.
- A zero diagonal coefficient prevents strict definiteness.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 11.

## Optimality at the origin

The lecture connects definiteness with whether the origin is a maximum, a minimum, or neither for $Q$.

**Wiki derivation:** Since $Q(\mathbf0)=0$, comparing $Q(\mathbf{x})$ with zero gives the following global conclusions directly from the sign definitions:

| Property of $Q$ | Conclusion at $\mathbf0$ |
|---|---|
| Positive definite | Strict global minimum |
| Negative definite | Strict global maximum |
| Positive semidefinite | Global minimum, not necessarily strict |
| Negative semidefinite | Global maximum, not necessarily strict |
| Indefinite | Neither a global maximum nor a global minimum |

For the indefinite case, the origin is not a local extremum either: $Q(t\mathbf{x})=t^2Q(\mathbf{x})$, so vectors with each sign can be scaled arbitrarily close to the origin. These are comparisons for the quadratic form itself; applying curvature to a general objective uses the hypotheses of the [second-order conditions](../unconstrained-optimization/second-order-conditions.md).

**Course sources:** [Lecture 3](../raw/lectures/lecture-03.md), slides 6–7, 12.

## Connections

- The [Hessian matrix](../multivariable-calculus/hessian-and-mixed-partials.md) is the derivative matrix whose definiteness enters optimization tests.
- [Second-order conditions](../unconstrained-optimization/second-order-conditions.md) apply these matrix tests at critical points.
- [Concavity, convexity, and global optima](../unconstrained-optimization/concavity-convexity-and-global-optima.md) require Hessian semidefiniteness throughout a convex open domain.
- [Maximizers and local extrema](../unconstrained-optimization/maximizers-and-local-extrema.md) distinguishes the global, local, weak, and strict conclusions used here.
