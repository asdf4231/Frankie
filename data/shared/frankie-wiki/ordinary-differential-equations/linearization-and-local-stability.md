# Linearization and Local Stability

> Course sources: [Lecture 9](../raw/lectures/lecture-09.md), slides 20–22, 24–25

## Overview

Linearization approximates a nonlinear differential system near a steady state by its Jacobian matrix. Under the lecture's strict eigenvalue conditions, this determines local stability. It does not generally determine global behavior or settle zero-real-part cases.

## Constructing the linearization

Consider $\dot{\mathbf x}=F(\mathbf x)$ near a steady state $\mathbf x^*$ with $F(\mathbf x^*)=\mathbf0$. Assume $F$ is $C^1$ near that point and define the deviation

$$
\mathbf h(t)=\mathbf x(t)-\mathbf x^*.
$$

The lecture's Taylor expansion is

$$
\begin{aligned}
\dot{\mathbf h}(t)
&=F(\mathbf x^*+\mathbf h(t))\\
&=F(\mathbf x^*)+DF(\mathbf x^*)\mathbf h(t)+R(\mathbf h(t))\\
&=DF(\mathbf x^*)\mathbf h(t)+R(\mathbf h(t)),
\end{aligned}
$$

where

$$
\frac{\|R(\mathbf h)\|}{\|\mathbf h\|}\longrightarrow0
\quad\text{as }\mathbf h\longrightarrow\mathbf0.
$$

The **linearization** drops the remainder:

$$
\dot{\mathbf h}=DF(\mathbf x^*)\mathbf h.
$$

Here the [Jacobian](../multivariable-calculus/jacobian-derivative.md) is evaluated at the equilibrium and acts on deviations, not on the original state without its equilibrium shift.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 20.

## Nonlinear stability theorem

**Theorem 25.5.** Let $\mathbf y^*$ be a steady state of $\dot{\mathbf y}=F(\mathbf y)$ on $\mathbb R^n$, where $F:\mathbb R^n\to\mathbb R^n$ is $C^1$.

- If each eigenvalue of $DF(\mathbf y^*)$ is negative or has negative real part, $\mathbf y^*$ is asymptotically stable.
- If at least one eigenvalue is positive real or complex with positive real part, $\mathbf y^*$ is unstable.
- If there are zero or purely imaginary eigenvalues and none with positive real part, the test does not determine stability.

The Jacobian replaces the scalar derivative in the [one-dimensional stability test](phase-portraits-and-stability.md#the-scalar-derivative-test). The source compares the inconclusive case with an inconclusive second-derivative test in optimization.

**Local versus global:** These are conclusions about nearby solutions, as emphasized in slide 20. Do not transfer the global convergence conclusion of the [linear-system theorem](linear-systems.md#general-real-part-stability-conditions) to the nonlinear system. Nor does a zero-real-part eigenvalue establish nonlinear stability or instability when no eigenvalue has positive real part.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 20–21.

## Planar trace and determinant tests

Let $A$ be the Jacobian at a steady state of a planar system satisfying the preceding theorem's assumptions. The characteristic equation is

$$
r^2-(\operatorname{trace}A)r+\det A=0.
$$

The lecture gives these criteria:

| Conditions | Eigenvalues | Stability implication |
|---|---|---|
| $\det A<0$ | Real with opposite signs | Saddle configuration; unstable |
| $\det A>0$, $\operatorname{trace}A<0$ | Both have negative real part | Asymptotically stable |
| $\det A>0$, $\operatorname{trace}A>0$ | Both have positive real part | Unstable |

**Lecture explanation:** The roots have product $\det A$ and sum $\operatorname{trace}A$. Real roots with positive product have the same sign. A complex conjugate pair has common real part $\operatorname{trace}A/2$. A negative product gives real roots of opposite signs. The source identifies these as the criteria developed in Exercises 25.11 and 25.13.

**Wiki boundary check from the sourced characteristic equation:** The strict rows are not a complete classification. If $\det A>0$ and $\operatorname{trace}A=0$, the roots are purely imaginary and the nonlinear test is inconclusive. If $\det A=0$, the roots are $0$ and $\operatorname{trace}A$: a positive trace still gives instability through the positive eigenvalue, whereas a nonpositive trace leaves the nonlinear test inconclusive. A zero trace does not prevent the saddle conclusion when $\det A<0$.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 21–22. See [eigenvalues and eigenvectors](../linear-algebra/eigenvalues-and-eigenvectors.md) for the characteristic equation's linear-algebra foundation.

## Example 25.2: competing species

The lecture studies

$$
\dot x=x(4-x-y),\qquad \dot y=y(6-y-3x),
$$

with Jacobian

$$
D(f,g)(x,y)=
\begin{pmatrix}
4-2x-y&-x\\
-3y&6-2y-3x
\end{pmatrix}.
$$

Its equilibrium classifications are:

| Equilibrium | Eigenvalues | Stability |
|---|---|---|
| $(0,0)$ | $4,\ 6$ | Unstable |
| $(0,6)$ | $-2,\ -6$ | Asymptotically stable |
| $(4,0)$ | $-4,\ -6$ | Asymptotically stable |
| $(1,3)$ | Roots of $r^2+4r-6=0$ | Unstable: opposite signs |

At $(1,3)$, the product of the eigenvalues is $-6$, hence their signs are opposite.

**Wiki algebra connecting the table to the test:** Substituting $(1,3)$ into the sourced Jacobian gives

$$
D(f,g)(1,3)=\begin{pmatrix}-1&-1\\-9&-3\end{pmatrix},
\qquad \operatorname{trace}=-4,\quad \det=-6.
$$

These values recover the source's characteristic equation and saddle classification without an explicit quadratic-root calculation.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 22, 24.

### Isoclines and the separatrix

The isoclines are

$$
\begin{aligned}
\dot x=0 &: \quad x=0\ \text{or}\ 4-x-y=0,\\
\dot y=0 &: \quad y=0\ \text{or}\ 6-y-3x=0.
\end{aligned}
$$

Different initial populations can lead to convergence to $(0,6)$ or $(4,0)$. The dividing curve, or **separatrix**, consists of trajectories tending to $(1,3)$ and that equilibrium itself. An exogenous shock moving the system across the curve changes its long-run behavior.

The [raw slide and Figure 25.12](../raw/lectures/lecture-09.md#l09-s25--competing-species-phase-portrait) preserve the original crop, the added equilibrium labels, and the separatrix arrow.

These phase-portrait statements describe the example's global behavior, complementing the local Jacobian classifications above.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 25.

## Connections

- The [Jacobian derivative](../multivariable-calculus/jacobian-derivative.md) supplies the matrix of first partial derivatives.
- [Linear systems](linear-systems.md) explain exponential modes and the linear saddle's convergent line; that line must not silently replace a nonlinear separatrix.
- [Phase portraits and stability](phase-portraits-and-stability.md) describe the isocline-and-arrow procedure used to draw the competing-species portrait.
