# Kuhn–Tucker Conditions

> Course sources: [Lecture 4](../raw/lectures/lecture-04.md), slides 16–28, 30–32; [Lecture 5](../raw/lectures/lecture-05.md), slides 9–11

## Overview

Inequality constraints introduce three features beyond equality-constrained stationarity: feasibility, a sign restriction on inequality multipliers, and complementary slackness between each multiplier and its constraint's slack. The lecture develops these conditions first for one inequality, then for several inequalities and mixed equality–inequality constraints.

Theorems 18.3–18.5—and, in the equality-only case, Theorems 18.1–18.2—provide necessary candidate conditions under their stated differentiability and constraint-qualification assumptions. They are not general sufficiency theorems in this lecture. A worked example establishes an optimum only when its objective values are compared or the lecture supplies an equivalent completing argument.

## One inequality: binding and inactive cases

Consider

$$
\begin{aligned}
\max\quad &f(x,y)\\
\text{s.t.}\quad &g(x,y)\leq b.
\end{aligned}
$$

Use

$$
L(x,y,\lambda)=f(x,y)-\lambda\bigl(g(x,y)-b\bigr).
$$

There are two local cases at a maximizer:

- If the constraint binds, then $g(x,y)=b$, the objective and constraint gradients line up in the lecture's geometry, and $\lambda\geq0$.
- If the constraint is inactive, then $g(x,y)<b$. The point is locally unconstrained, so $\nabla f=\mathbf0$, and the Lagrangian reproduces this case by setting $\lambda=0$.

Both cases are summarized by complementary slackness:

$$
\lambda\bigl(g(x,y)-b\bigr)=0.
$$

Precisely, $\lambda=0$ or $g(x,y)-b=0$, and both may hold.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 16–20.

## Theorem 18.3

Suppose $f$ and $g$ are $C^1$, and $(x^*,y^*)$ maximizes $f$ on $g(x,y)\leq b$. If the constraint binds at the maximizer, also suppose that its gradient is nonzero there. Then a multiplier $\lambda^*$ exists such that

$$
\begin{aligned}
\frac{\partial L}{\partial x}(x^*,y^*,\lambda^*)&=0,\\
\frac{\partial L}{\partial y}(x^*,y^*,\lambda^*)&=0,\\
\lambda^*\bigl(g(x^*,y^*)-b\bigr)&=0,\\
\lambda^*&\geq0,\\
g(x^*,y^*)&\leq b.
\end{aligned}
$$

These are, respectively, stationarity, complementary slackness, multiplier nonnegativity, and primal feasibility.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slide 21.

## Several inequalities

For

$$
\begin{aligned}
\max\quad &f(\mathbf{x})\\
\text{s.t.}\quad &g_j(\mathbf{x})\leq b_j,
\qquad j=1,\ldots,k,
\end{aligned}
$$

form

$$
L(\mathbf{x},\boldsymbol\lambda)
=f(\mathbf{x})-
\sum_{j=1}^k\lambda_j\bigl(g_j(\mathbf{x})-b_j\bigr).
$$

At a local maximizer $\mathbf{x}^*$ satisfying the NDCQ rank condition on the binding constraint gradients, Theorem 18.4 gives multipliers satisfying

$$
\nabla_{\mathbf{x}}L(\mathbf{x}^*,\boldsymbol\lambda^*)=\mathbf0,
$$

$$
\lambda_j^*\bigl(g_j(\mathbf{x}^*)-b_j\bigr)=0,
\qquad j=1,\ldots,k,
$$

$$
\lambda_j^*\geq0,
\qquad
g_j(\mathbf{x}^*)\leq b_j.
$$

Inactive constraints have zero multipliers. A binding constraint may have a nonnegative multiplier, including zero.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 21, 26–28, 31.

## Sensitivity of the optimal value to inequality bounds

For parameterized constraints

$$
g_j(\mathbf{x})\leq a_j,
\qquad j=1,\ldots,k,
$$

Theorem 19.3 assumes that, near the reference parameter vector $\mathbf a^*$, the optimizer and multipliers are differentiable functions of $\mathbf a$, and that NDCQ holds at $\mathbf a^*$. It states

$$
\lambda_j^*(\mathbf a^*)
=
\frac{\partial}{\partial a_j}f(\mathbf{x}^*(\mathbf a^*)),
\qquad j=1,\ldots,k.
$$

The derivative follows the optimized value as $\mathbf a$ varies and is then evaluated at $\mathbf a^*$. NDCQ here is checked at the corresponding optimum's binding constraints. The multiplier is therefore the lecture's marginal value, or shadow price, of relaxing the corresponding bound. Under the theorem's differentiability assumptions, a nonbinding constraint has multiplier zero, so its first-order value effect is zero; this is not an unconditional claim about all finite changes. The general parameterized formulas and worked calculations are collected in [envelope theorems](envelope-theorems.md).

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 9–11.

## Mixed equality and inequality constraints

For

$$
\begin{aligned}
\max\quad &f(\mathbf{x})\\
\text{s.t.}\quad &g_j(\mathbf{x})\leq b_j,
\qquad j=1,\ldots,k,\\
&h_\ell(\mathbf{x})=c_\ell,
\qquad \ell=1,\ldots,m,
\end{aligned}
$$

use

$$
L(\mathbf{x},\boldsymbol\lambda,\boldsymbol\mu)
=f(\mathbf{x})
-\sum_{j=1}^k\lambda_j\bigl(g_j(\mathbf{x})-b_j\bigr)
-\sum_{\ell=1}^m\mu_\ell\bigl(h_\ell(\mathbf{x})-c_\ell\bigr).
$$

Suppose $f,g_1,\ldots,g_k,h_1,\ldots,h_m$ are $C^1$ and $\mathbf{x}^*\in\mathbb R^n$ is a local maximizer on the constraint set. Under the mixed NDCQ condition, Theorem 18.5 gives multipliers satisfying:

$$
\nabla_{\mathbf{x}}L(\mathbf{x}^*,\boldsymbol\lambda^*,\boldsymbol\mu^*)
=\mathbf0,
$$

$$
\lambda_j^*\bigl(g_j(\mathbf{x}^*)-b_j\bigr)=0,
\quad
\lambda_j^*\geq0,
\quad
g_j(\mathbf{x}^*)\leq b_j,
$$

and

$$
h_\ell(\mathbf{x}^*)=c_\ell.
$$

The lecture imposes nonnegativity on the inequality multipliers $\lambda_j$; its stated conditions do not impose an analogous sign restriction on the equality multipliers $\mu_\ell$.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 30–32.

## Worked example: maximizing $xy$ on the unit disk

For

$$
\begin{aligned}
\max\quad &xy\\
\text{s.t.}\quad &x^2+y^2\leq1,
\end{aligned}
$$

the Lagrangian is

$$
L=xy-\lambda(x^2+y^2-1).
$$

The necessary system is

$$
\begin{aligned}
y-2\lambda x&=0,\\
x-2\lambda y&=0,\\
\lambda(x^2+y^2-1)&=0,\\
x^2+y^2&\leq1,\\
\lambda&\geq0.
\end{aligned}
$$

The case $\lambda=0$ gives $(x,y,\lambda)=(0,0,0)$, where the constraint is inactive. If $\lambda\neq0$, complementary slackness forces $x^2+y^2=1$.

**Wiki derivation:** In the nonzero-multiplier case, stationarity implies that if either coordinate were zero, both would be zero, contradicting the binding constraint. Thus $\lambda=y/(2x)=x/(2y)$, giving $x^2=y^2=1/2$.

The four boundary points have multipliers $+1/2$ for matching coordinate signs and $-1/2$ for opposite signs. The latter two are discarded for this maximization system. The admissible origin has objective $0$ and the two matching-sign points have objective $1/2$. The lecture identifies the two maximizers as

$$
\left(\frac1{\sqrt2},\frac1{\sqrt2}\right)
\quad\text{and}\quad
\left(-\frac1{\sqrt2},-\frac1{\sqrt2}\right).
$$

The lecture also identifies the opposite-sign boundary points as minimizers, with objective $-1/2$.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 22–25.

## Connections

- [Constraint qualifications](constraint-qualifications.md) states the active-gradient rank assumptions behind Theorems 18.3–18.5 and Theorem 19.11's necessary system without CQ. That system allows an objective multiplier of $0$ or $1$; only the $1$ case has the ordinary KKT normalization.
- [Lagrange multipliers for equality constraints](lagrange-multipliers-for-equality-constraints.md) covers the equality-only multiplier system.
- [Maximizers and local extrema](../unconstrained-optimization/maximizers-and-local-extrema.md) defines optimization relative to the feasible set built by the constraints.
- [First-order conditions](../unconstrained-optimization/first-order-conditions.md) gives the unconstrained stationarity condition recovered when every inequality is inactive.
- [Directional derivatives and gradient](../multivariable-calculus/directional-derivatives-and-gradient.md) supplies the gradient language used in stationarity.
- [Envelope theorems](envelope-theorems.md) interpret inequality multipliers as sensitivities of the optimized value to constraint bounds.
- The [Maximum Principle](../optimal-control/maximum-principle.md) uses an analogous sign and complementary-slackness condition for a fixed terminal lower bound.
