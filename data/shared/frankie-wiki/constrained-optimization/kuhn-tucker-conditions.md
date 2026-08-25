# Kuhn–Tucker Conditions

> Course sources: [Lecture 4](../raw/lectures/lecture-04.md), slides 28–69; [Lecture 5](../raw/lectures/lecture-05.md), slides 9–11

## Overview

Inequality constraints introduce three features beyond equality-constrained stationarity: feasibility, a sign restriction on inequality multipliers, and complementary slackness between each multiplier and its constraint's slack. The lecture develops these conditions first for one inequality, then for several and mixed constraints, and finally rewrites them in the Kuhn–Tucker form for problems with nonnegative choice variables.

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 28–32.

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slide 33.

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

Under the NDCQ rank condition on the binding constraint gradients, Theorem 18.4 gives multipliers satisfying

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 42–44.

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

The multiplier is therefore the lecture's marginal value, or shadow price, of relaxing the corresponding bound. A nonbinding constraint has multiplier zero, so its first-order value effect is zero. The general parameterized formulas and worked calculations are collected in [envelope theorems](envelope-theorems.md).

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

Under the mixed NDCQ condition, Theorem 18.5 combines:

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 51–53.

## Minimization sign convention

For minimization problems, the lecture writes inequality constraints as

$$
g(\mathbf{x})\geq b
$$

rather than $g(\mathbf{x})\leq b$, and then follows the same multiplier steps. The sign convention must therefore be read together with whether the problem is a maximization or minimization problem.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slide 57.

## Kuhn–Tucker form with nonnegative variables

The lecture specializes to

$$
\begin{aligned}
\max\quad &f(x_1,\ldots,x_n)\\
\text{s.t.}\quad &g_j(\mathbf{x})\leq b_j,
\qquad j=1,\ldots,k,\\
&x_i\geq0,
\qquad i=1,\ldots,n.
\end{aligned}
$$

If the nonnegativity constraints are assigned multipliers $\nu_i\geq0$, the full Lagrangian is

$$
L(\mathbf{x},\boldsymbol\lambda,\boldsymbol\nu)
=f(\mathbf{x})
-\sum_{j=1}^k\lambda_j\bigl(g_j(\mathbf{x})-b_j\bigr)
+\sum_{i=1}^n\nu_ix_i.
$$

The lecture then defines the Kuhn–Tucker Lagrangian without the explicit $\nu_i$ terms:

$$
\widetilde L(\mathbf{x},\boldsymbol\lambda)
=f(\mathbf{x})
-\sum_{j=1}^k\lambda_j\bigl(g_j(\mathbf{x})-b_j\bigr).
$$

Because

$$
\frac{\partial L}{\partial x_i}
=
\frac{\partial\widetilde L}{\partial x_i}+\nu_i=0,
$$

nonnegativity and complementary slackness for $\nu_i$ become

$$
\frac{\partial\widetilde L}{\partial x_i}\leq0,
\qquad
x_i\frac{\partial\widetilde L}{\partial x_i}=0.
$$

For the original inequality constraints,

$$
\frac{\partial\widetilde L}{\partial\lambda_j}
=b_j-g_j(\mathbf{x})\geq0,
$$

and complementary slackness is

$$
\lambda_j
\frac{\partial\widetilde L}{\partial\lambda_j}=0.
$$

Thus the lecture's Kuhn–Tucker form is

$$
\begin{aligned}
\frac{\partial\widetilde L}{\partial x_i}&\leq0,
&
 x_i\frac{\partial\widetilde L}{\partial x_i}&=0,
\qquad i=1,\ldots,n,\\
\frac{\partial\widetilde L}{\partial\lambda_j}&\geq0,
&
 \lambda_j\frac{\partial\widetilde L}{\partial\lambda_j}&=0,
\qquad j=1,\ldots,k.
\end{aligned}
$$

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 61–65.

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

The inactive case gives $(x,y,\lambda)=(0,0,0)$. The binding case generates four boundary points, but two have $\lambda=-\tfrac12$ and are discarded for this maximization problem. Comparing the three admissible candidates establishes the two maximizers

$$
\left(\frac1{\sqrt2},\frac1{\sqrt2}\right)
\quad\text{and}\quad
\left(-\frac1{\sqrt2},-\frac1{\sqrt2}\right).
$$

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 34–37.

## Worked example: why the utility budget binds

Ignoring nonnegativity constraints, consider

$$
\begin{aligned}
\max\quad &U(x_1,x_2)\\
\text{s.t.}\quad &p_1x_1+p_2x_2\leq I.
\end{aligned}
$$

The lecture assumes the weaker displayed condition that, at every commodity bundle,

$$
\frac{\partial U}{\partial x_1}(x_1,x_2)>0
\quad\text{or}\quad
\frac{\partial U}{\partial x_2}(x_1,x_2)>0.
$$

It does not require both displayed marginal utilities to be positive. Stationarity gives

$$
\frac{\partial U}{\partial x_1}-\lambda p_1=0,
\qquad
\frac{\partial U}{\partial x_2}-\lambda p_2=0.
$$

If $\lambda=0$, both marginal utilities would be zero, contradicting the stated assumption. Hence $\lambda>0$, and complementary slackness implies

$$
p_1x_1+p_2x_2=I.
$$

Under this assumption, the budget inequality binds and may then be treated as an equality in the example.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 38–41.

## Worked example: several inequalities and a completed comparison

For

$$
\begin{aligned}
\max\quad &xyz\\
\text{s.t.}\quad &x+y+z\leq1,\\
&x,y,z\geq0,
\end{aligned}
$$

the multiplier equations imply that when the resource multiplier is positive, all three variables are positive, the nonnegativity multipliers vanish, and

$$
yz=xz=xy.
$$

Together with the binding resource constraint, this gives

$$
x=y=z=\frac13,
\qquad
\lambda_1=\frac19.
$$

The lecture compares the objective with the zero-output candidates and uses

$$
f\left(\frac13,\frac13,\frac13\right)=\frac1{27}>0
$$

to establish $(1/3,1/3,1/3)$ as the constrained maximizer.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 45–49.

## Worked example: mixed constraints

For

$$
\begin{aligned}
\max\quad &x-y^2\\
\text{s.t.}\quad &x^2+y^2=4,\\
&x,y\geq0,
\end{aligned}
$$

the lecture uses

$$
L=x-y^2-\mu(x^2+y^2-4)+\lambda_1x+\lambda_2y.
$$

The candidate analysis forces $x>0$, hence $\lambda_1=0$, and then complementary slackness gives $y=\lambda_2=0$. Feasibility and stationarity yield

$$
(x,y,\mu,\lambda_1,\lambda_2)
=(2,0,\tfrac14,0,0).
$$

The lecture reports this tuple as the solution after its case analysis. Because the example does not display an objective-value comparison, the multiplier calculation itself is recorded here as candidate identification rather than a general sufficiency argument.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 54–56.

## Worked example: minimization convention

For

$$
\begin{aligned}
\min\quad &2y-x^2\\
\text{s.t.}\quad &x^2+y^2\leq1,\\
&x,y\geq0,
\end{aligned}
$$

the first inequality is rewritten as

$$
-x^2-y^2\geq-1.
$$

With

$$
L=2y-x^2-\lambda_1(-x^2-y^2+1)-\lambda_2x-\lambda_3y,
$$

the $y$-stationarity condition is

$$
\frac{\partial L}{\partial y}
=2+2\lambda_1y-\lambda_3=0.
$$

The case $x=0$ gives objective value $0$, while $x=1$, $y=0$ gives $-1$. The lecture therefore concludes that $(1,0)$ is the minimizer.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 57–60.

## Worked example: Kuhn–Tucker utility conditions

For utility maximization with $x_1,x_2\geq0$ and budget inequality $p_1x_1+p_2x_2\leq I$,

$$
\widetilde L(x_1,x_2,\lambda)
=U(x_1,x_2)-\lambda(p_1x_1+p_2x_2-I).
$$

The lecture's conditions are

$$
\frac{\partial U}{\partial x_1}-\lambda p_1\leq0,
\qquad
\frac{\partial U}{\partial x_2}-\lambda p_2\leq0,
$$

$$
x_1\left(\frac{\partial U}{\partial x_1}-\lambda p_1\right)=0,
\qquad
x_2\left(\frac{\partial U}{\partial x_2}-\lambda p_2\right)=0,
$$

and

$$
\frac{\partial\widetilde L}{\partial\lambda}
=I-p_1x_1-p_2x_2\geq0,
\qquad
\lambda\frac{\partial\widetilde L}{\partial\lambda}=0.
$$

These conditions allow a zero consumption choice to have a strictly negative $x_i$-derivative of $\widetilde L$, while a positive choice requires the corresponding derivative to be zero.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slide 66.

## Worked example: candidate comparison under nonnegativity

For

$$
\begin{aligned}
\max\quad &x^2+x+4y^2\\
\text{s.t.}\quad &2x+2y\leq1,\\
&x,y\geq0,
\end{aligned}
$$

the lecture obtains three candidates:

$$
(0,0.5,2,3,0),
\qquad
(0.5,0,1,0,2),
\qquad
(0.3,0.2,0.8,0,0),
$$

where each tuple is $(x,y,\lambda_1,\lambda_2,\lambda_3)$. Comparing their objective values establishes the constrained maximum at

$$
(x,y)=(0,0.5).
$$

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 67–69.

## Connections

- [Constraint qualifications](constraint-qualifications.md) states the active-gradient rank assumptions behind Theorems 18.3–18.5.
- [Lagrange multipliers for equality constraints](lagrange-multipliers-for-equality-constraints.md) covers the equality-only multiplier system.
- [Maximizers and local extrema](../unconstrained-optimization/maximizers-and-local-extrema.md) defines optimization relative to the feasible set built by the constraints.
- [First-order conditions](../unconstrained-optimization/first-order-conditions.md) gives the unconstrained stationarity condition recovered when every inequality is inactive.
- [Directional derivatives and gradient](../multivariable-calculus/directional-derivatives-and-gradient.md) supplies the gradient language used in stationarity.
- [Envelope theorems](envelope-theorems.md) interpret inequality multipliers as sensitivities of the optimized value to constraint bounds.
- The [Maximum Principle](../optimal-control/maximum-principle.md) uses an analogous sign and complementary-slackness condition for a fixed terminal lower bound; its state-constrained consumption example is only an interior-arc calculation.
- [Constrained second-order conditions](constrained-second-order-conditions.md) add Lagrangian curvature tests after the complete mixed Kuhn–Tucker system is satisfied.
