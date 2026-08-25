# First-Order Conditions

> Course sources: [Lecture 3](../raw/lectures/lecture-03.md), slides 4–5, 13–18; [Lecture 4](../raw/lectures/lecture-04.md), slides 11–15, 30–33

## Overview

At an interior local maximum or minimum of a differentiable unconstrained problem, every first partial derivative must vanish. The resulting system identifies critical-point candidates but does not by itself classify them. With inequalities, inactive constraints force their multipliers to zero, while binding constraints may contribute multiplier-weighted gradients.

## Interior first-order condition

**Theorem 17.1.** Let $F\colon U\subset\mathbb{R}^n\to\mathbb{R}$ be $C^1$. If $\mathbf{x}^*$ is an interior local maximum or minimum of $F$, then

$$
\frac{\partial F}{\partial x_i}(\mathbf{x}^*)=0
\qquad
\text{for }i=1,\ldots,n.
$$

The lecture proves this coordinatewise: holding all other coordinates fixed reduces the problem to a one-variable interior extremum. For a maximum the restricted function has a local maximum; for a minimum the same argument uses a local minimum.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 4.

## Transition to constrained stationarity

The unconstrained interior condition is

$$
\nabla f(\mathbf{x}^*)=\mathbf0.
$$

An equality constraint can prevent movement in arbitrary directions. Under the lecture's constraint qualification, the necessary candidate condition becomes proportional-gradient stationarity; for one equality,

$$
\nabla f(\mathbf{x}^*)-\mu^*\nabla h(\mathbf{x}^*)=\mathbf0.
$$

For an inequality $g(\mathbf{x})\leq b$, the two cases are joined by

$$
\nabla f(\mathbf{x}^*)-\lambda^*\nabla g(\mathbf{x}^*)=\mathbf0,
\qquad
\lambda^*\bigl(g(\mathbf{x}^*)-b\bigr)=0,
\qquad
\lambda^*\geq0.
$$

If the inequality is inactive, complementary slackness gives $\lambda^*=0$, so the unconstrained zero-gradient condition returns. If it binds, a nonzero multiplier may balance the objective gradient against the constraint gradient. These Lecture 4 conditions are necessary candidate conditions under their stated qualifications, not classifications by themselves.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 11–15, 30–33.

## Polynomial example

For

$$
F(x,y)=x^3-y^3+9xy,
$$

the first-order system is

$$
3x^2+9y=0,
\qquad
-3y^2+9x=0.
$$

Its solutions are $(0,0)$ and $(3,-3)$. These are candidates; the first-order conditions alone do not determine whether either point is a maximum or minimum.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 5.

## Worked economic example: discriminating monopolist

A monopolist sells in two separated markets with inverse demands $P_i=G_i(Q_i)$ and total cost $C(Q_1+Q_2)$. Profit is

$$
F(Q_1,Q_2)
=Q_1G_1(Q_1)+Q_2G_2(Q_2)-C(Q_1+Q_2).
$$

For an interior solution, the first-order conditions imply

$$
\frac{d(Q_1G_1(Q_1))}{dQ_1}
=
\frac{d(Q_2G_2(Q_2))}{dQ_2}
=
C'(Q_1+Q_2).
$$

Thus marginal revenue in each market equals the marginal cost of total output.

In the numerical example,

$$
G(Q_1)=50-5Q_1,
\qquad
G(Q_2)=100-10Q_2,
\qquad
C(Q)=90+20Q.
$$

The first-order equations give

$$
Q_1=3,
\qquad
Q_2=4.
$$

The Hessian has diagonal entries $-10$ and $-20$ and zero cross partials. The lecture concludes that $F$ is concave and $(3,4)$ is a maximizer.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slides 13–17.

## Worked example: least-squares line fitting

For observations $(x_i,y_i)$, least squares chooses the affine function $mx+b$ that minimizes the sum of squared vertical deviations

$$
S(m,b)=\sum_{i=1}^n(mx_i+b-y_i)^2.
$$

The first-order conditions are

$$
\frac{\partial S}{\partial m}
=
\sum_{i=1}^n2(mx_i+b-y_i)x_i
=0,
$$

$$
\frac{\partial S}{\partial b}
=
\sum_{i=1}^n2(mx_i+b-y_i)
=0.
$$

They produce the linear system

$$
\left(\sum_i x_i^2\right)m
+
\left(\sum_i x_i\right)b
=
\sum_i x_iy_i,
$$

$$
\left(\sum_i x_i\right)m+nb
=
\sum_i y_i.
$$

The lecture solves this system by Cramer's rule:

$$
m^*
=
\frac{
 n\sum_i x_iy_i
 -\left(\sum_i x_i\right)\left(\sum_i y_i\right)
}{
 n\sum_i x_i^2
 -\left(\sum_i x_i\right)^2
},
$$

$$
b^*
=
\frac{
 \left(\sum_i x_i^2\right)\left(\sum_i y_i\right)
 -\left(\sum_i x_i\right)\left(\sum_i x_iy_i\right)
}{
 n\sum_i x_i^2
 -\left(\sum_i x_i\right)^2
}.
$$

This is an application of first-order conditions rather than a separate optimization concept page.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slide 18.

## Connections

- [Maximizers and local extrema](maximizers-and-local-extrema.md) defines the points and feasible sets to which the conditions apply.
- The gradient is developed in [directional derivatives and gradient](../multivariable-calculus/directional-derivatives-and-gradient.md).
- [Lagrange multipliers for equality constraints](../constrained-optimization/lagrange-multipliers-for-equality-constraints.md) develops the equality-constrained stationarity system.
- [Kuhn–Tucker conditions](../constrained-optimization/kuhn-tucker-conditions.md) adds feasibility, multiplier signs, and complementary slackness for inequalities.
- The [Maximum Principle](../optimal-control/maximum-principle.md) applies the same interior-candidate logic pointwise to the Hamiltonian control choice while adding state and costate equations.
- [Second-order conditions](second-order-conditions.md) classifies the unconstrained candidates found here.
- [Linear, affine, and polynomial functions](../functions/linear-affine-and-polynomial-functions.md) supplies the affine form fitted in the least-squares example.
