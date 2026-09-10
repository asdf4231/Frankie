# Linear Systems

> Course sources: [Lecture 9](../raw/lectures/lecture-09.md), slides 12, 14, 16, 18–19

## Overview

A planar system determines two paths jointly. For a homogeneous linear system with distinct real eigenvalues, eigenvector coordinates reduce the problem to two scalar exponential equations. The lecture then uses eigenvalue signs and real parts to study stability.

## Planar initial-value setup

The general first-order planar system is

$$
\dot x=F(x,y,t),\qquad \dot y=G(x,y,t).
$$

A solution is a pair $x^*(t),y^*(t)$ satisfying both equations at every time in its domain. The general solution contains two independent parameters; an initial condition specifies both variables:

$$
x(t_0)=x_0,\qquad y(t_0)=y_0.
$$

The system is **autonomous** when $F$ and $G$ do not explicitly depend on $t$, the case emphasized in the lecture. Continuous right-hand sides give local existence; $C^1$ right-hand sides give uniqueness, as in the [scalar initial-value theorem](scalar-equations-and-initial-values.md#local-existence-and-uniqueness).

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 12.

## Solution with distinct real eigenvalues

**Theorem 25.1 (Two-Dimensional Case).** Suppose the $2\times2$ matrix $A$ has distinct real eigenvalues $r_1,r_2$ and corresponding eigenvectors $\mathbf v_1,\mathbf v_2$. The general solution of $\dot{\mathbf x}=A\mathbf x$ is

$$
\mathbf x(t)=c_1e^{r_1t}\mathbf v_1+c_2e^{r_2t}\mathbf v_2.
$$

**Lecture proof:** Eigenvectors for distinct eigenvalues are linearly independent. Set

$$
P=[\mathbf v_1\ \mathbf v_2],\qquad D=\operatorname{diag}(r_1,r_2).
$$

Then $AP=PD$, so changing coordinates gives

$$
\mathbf y=P^{-1}\mathbf x
\quad\Longrightarrow\quad
\dot{\mathbf y}=P^{-1}AP\mathbf y=D\mathbf y.
$$

Each coordinate therefore has solution $y_i(t)=c_ie^{r_it}$. Returning to $\mathbf x=P\mathbf y$ yields the theorem. The initial condition determines $c_1,c_2$.

**Wiki algebra for initial conditions:** Evaluating the sourced solution at $t_0$ gives

$$
\begin{pmatrix}c_1\\c_2\end{pmatrix}
=
\begin{pmatrix}e^{-r_1t_0}&0\\0&e^{-r_2t_0}\end{pmatrix}
P^{-1}\mathbf x(t_0).
$$

In particular, at $t_0=0$, the constants are the coordinates $P^{-1}\mathbf x(0)$.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 14. See [eigenvalues and eigenvectors](../linear-algebra/eigenvalues-and-eigenvectors.md) for their calculation.

## General real-part stability conditions

**Theorem 25.4 (Parts (a)–(b)).** The origin is always a steady state of $\dot{\mathbf x}=A\mathbf x$.

- If every eigenvalue of $A$ has negative real part, the origin is **globally asymptotically stable**: every solution tends to $\mathbf0$ as $t\to\infty$.
- If at least one eigenvalue has positive real part, the origin is **unstable**.

With distinct real eigenvalues, the terms $c_ie^{r_it}\mathbf v_i$ explain the result: negative rates decay, while a nonzero component with a positive rate grows without bound. For complex eigenvalues, the real part determines exponential growth or decay of oscillating terms.

These strict real-part tests differ from [nonlinear Jacobian tests](linearization-and-local-stability.md), whose conclusions concern local stability rather than convergence from every initial state.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 16.

## Saddles and convergent solutions

Suppose $r_1<0<r_2$. In

$$
\mathbf x(t)=c_1e^{r_1t}\mathbf v_1+c_2e^{r_2t}\mathbf v_2,
$$

the first component decays while any nonzero second component grows. A solution converges to the origin **if and only if** $c_2=0$, leaving

$$
\mathbf x(t)=c_1e^{r_1t}\mathbf v_1.
$$

The convergent paths lie on the line through the negative-eigenvalue eigenvector. This is the lecture's **saddle** geometry: some solutions converge although the equilibrium is unstable.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 19.

### Example 25.7

For

$$
\dot x=2x,\qquad \dot y=-2y,
$$

the lecture gives

$$
x(t)=c_1e^{2t},\qquad y(t)=c_2e^{-2t}.
$$

Away from the axes, eliminating time gives $xy=c_1c_2$, so the orbits are hyperbolas. On the $y$-axis the solution tends to the origin; if $c_1\ne0$, $|x(t)|\to\infty$ and the origin is unstable.

**Notation distinction:** In this example $c_1$ multiplies the growing mode. In the preceding general saddle notation, $c_2$ multiplies the growing mode because the eigenvalues are ordered $r_1<0<r_2$. The convergence condition must follow the mode, not the subscript alone.

The [raw slide and Figure 25.5](../raw/lectures/lecture-09.md#l09-s18--phase-portraits-a-linear-system) preserve the arrows and added axis labels.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 18–19.

## Connections

- [Eigenvalues and eigenvectors](../linear-algebra/eigenvalues-and-eigenvectors.md) provide the characteristic equation and solution directions.
- [Phase portraits and stability](phase-portraits-and-stability.md) define stability and interpret the solution curves geometrically.
- [Linearization and local stability](linearization-and-local-stability.md) use the Jacobian as the matrix of an approximating linear system.
- [Continuous-time optimal control problems](../optimal-control/continuous-time-optimal-control-problems.md) give the later state-control optimization framework; solving a differential system alone is not a sufficiency result for optimality.
