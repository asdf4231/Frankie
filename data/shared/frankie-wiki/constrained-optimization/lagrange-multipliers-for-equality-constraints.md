# Lagrange Multipliers for Equality Constraints

> Course sources: [Lecture 4](../raw/lectures/lecture-04.md), slides 6–14; [Lecture 5](../raw/lectures/lecture-05.md), slides 4–8

## Overview

For an equality-constrained optimum, the objective need not satisfy the unconstrained condition $\nabla f=\mathbf 0$. Under the lecture's constraint qualification, its gradient is instead a linear combination of the equality-constraint gradients. Lagrange multipliers record the coefficients in that combination and turn the constrained problem into a system of stationarity and feasibility equations.

Theorems 18.1 and 18.2 provide necessary conditions under their stated qualifications. Solving a Lagrange system does not by itself establish that a candidate is a maximum or minimum.

## One equality constraint in two variables

Consider

$$
\begin{aligned}
\max\quad &f(x_1,x_2) \\
\text{s.t.}\quad &h(x_1,x_2)=c.
\end{aligned}
$$

The lecture motivates the multiplier equations by tangency of the objective level set and constraint curve at a constrained maximum $\mathbf{x}^*$. In the slope-based case where both second-coordinate derivatives are nonzero, their slopes can be written as

$$
-\frac{\partial f/\partial x_1}{\partial f/\partial x_2}(\mathbf{x}^*)
\quad\text{and}\quad
-\frac{\partial h/\partial x_1}{\partial h/\partial x_2}(\mathbf{x}^*).
$$

The denominator-free statement is the general one:

$$
\nabla f(\mathbf{x}^*)=\mu\nabla h(\mathbf{x}^*).
$$

Componentwise, the candidate equations are

$$
\begin{aligned}
\frac{\partial f}{\partial x_1}(\mathbf{x}^*)
-\mu\frac{\partial h}{\partial x_1}(\mathbf{x}^*)&=0,\\
\frac{\partial f}{\partial x_2}(\mathbf{x}^*)
-\mu\frac{\partial h}{\partial x_2}(\mathbf{x}^*)&=0,\\
h(x_1^*,x_2^*)&=c.
\end{aligned}
$$

The lecture also expresses proportionality as the ratio equality

$$
\frac{\frac{\partial f}{\partial x_1}(\mathbf{x}^*)}
{\frac{\partial h}{\partial x_1}(\mathbf{x}^*)}
=
\frac{\frac{\partial f}{\partial x_2}(\mathbf{x}^*)}
{\frac{\partial h}{\partial x_2}(\mathbf{x}^*)}
=\mu.
$$

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 6–9.

## Theorem 18.1 and the Lagrangian

Suppose $\mathbf{x}^*=(x_1^*,x_2^*)$ solves the equality-constrained problem and is not a critical point of $h$, meaning that $\nabla h(\mathbf{x}^*)\neq\mathbf 0$. Then there is a real number $\mu^*$ such that $(x_1^*,x_2^*,\mu^*)$ is a critical point of

$$
L(x_1,x_2,\mu)
=f(x_1,x_2)-\mu\bigl(h(x_1,x_2)-c\bigr).
$$

Thus

$$
\frac{\partial L}{\partial x_1}=0,
\qquad
\frac{\partial L}{\partial x_2}=0,
\qquad
\frac{\partial L}{\partial\mu}=0
$$

at $(x_1^*,x_2^*,\mu^*)$. The last equation restores the original equality constraint.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 9–10.

## Several equality constraints

For

$$
\begin{aligned}
\max\quad &f(\mathbf{x}) \\
\text{s.t.}\quad &h_1(\mathbf{x})=a_1,\ldots,h_m(\mathbf{x})=a_m,
\end{aligned}
$$

write $\mathbf h=(h_1,\ldots,h_m)$. The lecture's nondegenerate constraint qualification requires

$$
\operatorname{rank}D\mathbf h(\mathbf{x}^*)=m.
$$

If $\mathbf{x}^*$ solves the problem and satisfies this qualification, Theorem 18.2 states that there is a multiplier vector

$$
\boldsymbol\mu^*=(\mu_1^*,\ldots,\mu_m^*)
$$

such that $(\mathbf{x}^*,\boldsymbol\mu^*)$ is a critical point of

$$
L(\mathbf{x},\boldsymbol\mu)
=f(\mathbf{x})-\sum_{j=1}^m\mu_j\bigl(h_j(\mathbf{x})-a_j\bigr).
$$

Equivalently, the necessary candidate system consists of

$$
\nabla f(\mathbf{x}^*)
-\sum_{j=1}^m\mu_j^*\nabla h_j(\mathbf{x}^*)
=\mathbf 0
$$

and

$$
h_j(\mathbf{x}^*)=a_j,
\qquad j=1,\ldots,m.
$$

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 10, 13–14.

## Sensitivity of the optimal value to equality bounds

For the parameterized constraint $h(x,y)=a$, Theorem 19.1 assumes that $f$ and $h$ are $C^1$, that the solution $(x^*(a),y^*(a))$ and multiplier $\mu^*(a)$ are $C^1$ functions of $a$, and that NDCQ holds at $(x^*(a),y^*(a))$. It then identifies the multiplier with the derivative of the optimized objective:

$$
\mu^*(a)
=
\frac{d}{da}f(x^*(a),y^*(a)).
$$

For several equalities $h_j(\mathbf{x})=a_j$, Theorem 19.2 assumes $f,h_1,\ldots,h_m$ are $C^1$ on $\mathbb R^n$, the optimizing choices and multipliers are differentiable functions of $\mathbf a$, and NDCQ holds. It gives

$$
\mu_j^*(\mathbf a)
=
\frac{\partial}{\partial a_j}f(\mathbf{x}^*(\mathbf a)),
\qquad j=1,\ldots,m,
$$

Thus a small change in one equality bound, with the others fixed, has the first-order approximation $\Delta f^*\approx\mu_j^*\Delta a_j$. This is a local value sensitivity, not the derivative of an individual optimizing choice. The broader parameterized results and worked bound-change example are organized in [envelope theorems](envelope-theorems.md).

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 4–8.

## Worked example: a linear utility constraint

For

$$
\begin{aligned}
\max\quad &f(x_1,x_2)=x_1x_2 \\
\text{s.t.}\quad &x_1+4x_2=16,
\end{aligned}
$$

$\nabla h=(1,4)$, so the constraint qualification holds everywhere. The Lagrangian is

$$
L=x_1x_2-\mu(x_1+4x_2-16),
$$

and its critical-point equations are

$$
\begin{aligned}
x_2-\mu&=0,\\
x_1-4\mu&=0,\\
x_1+4x_2-16&=0.
\end{aligned}
$$

They give the sole Lagrange-system candidate

$$
(x_1,x_2,\mu)=(8,2,2).
$$

The lecture presents $(8,2)$ as the only candidate at this stage; the equations alone are necessary rather than a general sufficiency test.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 11–12.

## Connections

- [Constraint qualifications](constraint-qualifications.md) explains the noncritical-point and full-row-rank assumptions used by Theorems 18.1 and 18.2, and Theorem 19.10's alternative allowing a zero objective multiplier without those qualifications.
- [Directional derivatives and gradient](../multivariable-calculus/directional-derivatives-and-gradient.md) supplies the gradient geometry behind the proportionality condition.
- [Jacobian derivative](../multivariable-calculus/jacobian-derivative.md) supplies the matrix $D\mathbf h$ used for several equality constraints.
- [Implicit function theorem](../multivariable-calculus/implicit-function-theorem.md) gives the course's earlier treatment of nonzero derivative and Jacobian-invertibility conditions for local implicit relationships.
- [First-order conditions](../unconstrained-optimization/first-order-conditions.md) gives the unconstrained interior condition that equality-constrained stationarity replaces.
- [Kuhn–Tucker conditions](kuhn-tucker-conditions.md) extends multiplier reasoning to inequalities, complementary slackness, and mixed constraints.
- [Envelope theorems](envelope-theorems.md) identify equality multipliers with right-hand-side sensitivities under the lecture's stated regularity assumptions.
- The [Maximum Principle](../optimal-control/maximum-principle.md) extends the multiplier analogy to a differential state constraint through the Hamiltonian and a time-varying costate.
- [Smooth dependence of constrained optima](smooth-dependence-of-constrained-optima.md) gives Theorem 19.9's condition for smooth choices and multipliers.
