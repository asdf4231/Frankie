# Lagrange Multipliers for Equality Constraints

> Course sources: [Lecture 4](../raw/lectures/lecture-04.md), slides 11–26; [Lecture 5](../raw/lectures/lecture-05.md), slides 4–8

## Overview

For an equality-constrained optimum, the objective cannot generally satisfy the unconstrained condition $\nabla f=\mathbf 0$. Under the lecture's constraint qualification, its gradient is instead a linear combination of the equality-constraint gradients. Lagrange multipliers record the coefficients in that combination and turn the constrained problem into a system of stationarity and feasibility equations.

Theorems 18.1 and 18.2 provide necessary conditions for candidates under their stated qualifications. Solving a Lagrange system does not by itself establish that a candidate is a maximum or minimum; an example reaches that conclusion only when the objective values are compared or another argument in the lecture completes the classification.

## One equality constraint in two variables

Consider

$$
\begin{aligned}
\max\quad &f(x_1,x_2) \\
\text{s.t.}\quad &h(x_1,x_2)=c.
\end{aligned}
$$

At a regular constrained maximum $\mathbf{x}^*$, the objective level set and constraint curve are tangent. If the relevant second-coordinate derivatives are nonzero, their slopes can be written as

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

When both components of $\nabla h(\mathbf{x}^*)$ are nonzero, proportionality can also be expressed as the ratio equality

$$
\frac{\frac{\partial f}{\partial x_1}(\mathbf{x}^*)}
{\frac{\partial h}{\partial x_1}(\mathbf{x}^*)}
=
\frac{\frac{\partial f}{\partial x_2}(\mathbf{x}^*)}
{\frac{\partial h}{\partial x_2}(\mathbf{x}^*)}
=\mu.
$$

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 11–14.

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 14–15.

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

Under this qualification, Theorem 18.2 states that there is a multiplier vector

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 21–22.

## Sensitivity of the optimal value to equality bounds

For the parameterized constraint $h(x,y)=a$, Theorem 19.1 assumes that $f$ and $h$ are $C^1$, that the solution $(x^*(a),y^*(a))$ and multiplier $\mu^*(a)$ are $C^1$ functions of $a$, and that NDCQ holds at $(x^*(a),y^*(a))$. It then identifies the multiplier with the derivative of the optimized objective:

$$
\mu^*(a)
=
\frac{d}{da}f(x^*(a),y^*(a)).
$$

For several equalities $h_j(\mathbf{x})=a_j$, Theorem 19.2 similarly gives

$$
\mu_j^*(\mathbf a)
=
\frac{\partial}{\partial a_j}f(\mathbf{x}^*(\mathbf a)),
\qquad j=1,\ldots,m,
$$

under its stated differentiability and NDCQ assumptions. Thus a small change in an equality bound has the lecture's first-order approximation $\Delta f^*\approx\mu_j^*\Delta a_j$. The broader parameterized results are organized in [envelope theorems](envelope-theorems.md).

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 16–17.

## Worked example: comparing all equality-constrained candidates

For

$$
\begin{aligned}
\max\quad &f(x_1,x_2)=x_1^2x_2 \\
\text{s.t.}\quad &2x_1^2+x_2^2=3,
\end{aligned}
$$

the only critical point of the constraint function is $(0,0)$, which is not feasible. The candidate system generated by

$$
L=x_1^2x_2-\mu(2x_1^2+x_2^2-3)
$$

has six solutions in $(x_1,x_2,\mu)$:

$$
(0,\sqrt3,0),\quad(0,-\sqrt3,0),
$$

and

$$
(1,1,\tfrac12),\quad(-1,-1,-\tfrac12),\quad
(1,-1,-\tfrac12),\quad(-1,1,\tfrac12).
$$

The objective values are $1$, $-1$, or $0$. Comparing them establishes maxima at $(1,1)$ and $(-1,1)$, and minima at $(1,-1)$ and $(-1,-1)$.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 18–20.

## Worked example: two equality constraints

For

$$
\begin{aligned}
\max\quad &f(x,y,z)=xyz \\
\text{s.t.}\quad &x^2+y^2=1,\\
&x+z=1,
\end{aligned}
$$

the constraint Jacobian is

$$
D\mathbf h(x,y,z)=
\begin{pmatrix}
2x&2y&0\\
1&0&1
\end{pmatrix}.
$$

Its rank falls below $2$ only when $x=y=0$, which violates the first constraint, so every feasible point satisfies NDCQ. The Lagrangian equations include the candidate

$$
(x,y,z,\mu_1,\mu_2)=(1,0,0,0,0),
$$

whose objective value is $0$. The remaining candidates have

$$
x=\frac{-1\pm\sqrt{13}}{6},
\qquad
y=\pm\sqrt{1-x^2},
\qquad z=1-x.
$$

After evaluating the objective, the lecture reports the maximizer as approximately

$$
(x,y,z)=(-0.7676,-0.6409,1.7675).
$$

Here the objective comparison, not the multiplier equations alone, selects the reported maximizer.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 23–26.

## Connections

- [Constraint qualifications](constraint-qualifications.md) explains the noncritical-point and full-row-rank assumptions used by Theorems 18.1 and 18.2.
- [Directional derivatives and gradient](../multivariable-calculus/directional-derivatives-and-gradient.md) supplies the gradient geometry behind the proportionality condition.
- [Jacobian derivative](../multivariable-calculus/jacobian-derivative.md) supplies the matrix $D\mathbf h$ used for several equality constraints.
- [Implicit function theorem](../multivariable-calculus/implicit-function-theorem.md) gives the course's earlier treatment of nonzero derivative and Jacobian-invertibility conditions for local implicit relationships.
- [First-order conditions](../unconstrained-optimization/first-order-conditions.md) gives the unconstrained interior condition that equality-constrained stationarity replaces.
- [Kuhn–Tucker conditions](kuhn-tucker-conditions.md) extends multiplier reasoning to inequalities, complementary slackness, and nonnegative choice variables.
- [Envelope theorems](envelope-theorems.md) identify equality multipliers with right-hand-side sensitivities under the lecture's stated regularity assumptions.
- The [Maximum Principle](../optimal-control/maximum-principle.md) extends the multiplier analogy to a differential state constraint through the Hamiltonian and a time-varying costate.
- [Constrained second-order conditions](constrained-second-order-conditions.md) classify equality-constrained first-order candidates using Lagrangian curvature along linearized feasible directions.
