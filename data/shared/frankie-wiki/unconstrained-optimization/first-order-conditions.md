# First-Order Conditions

> Course sources: [Lecture 3](../raw/lectures/lecture-03.md), slides 4, 20–24; [Lecture 4](../raw/lectures/lecture-04.md), slides 6–10, 18–21

## Overview

At an interior local maximum or minimum of a differentiable unconstrained problem, every first partial derivative must vanish. The resulting system identifies critical-point candidates but does not by itself classify them. With inequalities, inactive constraints force their multipliers to zero, while binding constraints may contribute multiplier-weighted gradients.

## Interior first-order condition

**Theorem 17.1.** Let $F\colon U\subset\mathbb{R}^n\to\mathbb{R}$ be $C^1$. If $\mathbf{x}^*$ is an interior local maximum or minimum of $F$, then

$$
\frac{\partial F}{\partial x_i}(\mathbf{x}^*)=0
\qquad
\text{for }i=1,\ldots,n.
$$

The lecture sketches a coordinatewise argument: holding all other coordinates fixed reduces the problem to a one-variable interior extremum. For a maximum the restricted function has a local maximum; for a minimum it has a local minimum.

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

For the two-variable inequality problem $g(\mathbf{x})\leq b$, Theorem 18.3 assumes $f,g$ are $C^1$ and the constraint gradient is nonzero if the constraint binds at the maximizer. The two cases are joined by

$$
\nabla f(\mathbf{x}^*)-\lambda^*\nabla g(\mathbf{x}^*)=\mathbf0,
\qquad
\lambda^*\bigl(g(\mathbf{x}^*)-b\bigr)=0,
\qquad
\lambda^*\geq0.
$$

If the inequality is inactive, complementary slackness gives $\lambda^*=0$, so the unconstrained zero-gradient condition returns. If it binds, a nonzero multiplier may balance the objective gradient against the constraint gradient. These Lecture 4 conditions are necessary candidate conditions under their stated qualifications, not classifications by themselves.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 6–10, 18–21.

## Worked economic example: discriminating monopolist

A monopolist sells in two separated markets with inverse demands $P_i=G_i(Q_i)$ and total cost $C(Q_1+Q_2)$. Profit is

$$
F(Q_1,Q_2)
=Q_1G_1(Q_1)+Q_2G_2(Q_2)-C(Q_1+Q_2).
$$

The lecture assumes positive output in each market and seeks an interior solution in the positive quadrant. The first-order conditions imply

$$
\frac{d(Q_1G_1(Q_1))}{dQ_1}
=
\frac{d(Q_2G_2(Q_2))}{dQ_2}
=
C'(Q_1+Q_2).
$$

Thus marginal revenue in each market equals the marginal cost of total output.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slides 20–21.

In the numerical example,

$$
G(Q_1)=50-5Q_1,
\qquad
G(Q_2)=100-10Q_2,
\qquad
C(Q)=90+20Q.
$$

The example writes $G(Q_1)$ and $G(Q_2)$ for the two market-specific inverse demands, rather than repeating the subscripts in $G_i$.

The profit function is

$$
F(Q_1,Q_2)=Q_1(50-5Q_1)+Q_2(100-10Q_2)-(90+20(Q_1+Q_2)).
$$

The first-order equations are

$$
\frac{\partial F}{\partial Q_1}=50-10Q_1-20=0,
\qquad
\frac{\partial F}{\partial Q_2}=100-20Q_2-20=0,
$$

so $Q_1=3$ and $Q_2=4$.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slides 22–23.

The Hessian has diagonal entries $-10$ and $-20$ and zero cross partials. Its leading principal minors at $(3,4)$ are $-10$ and $200$. The lecture concludes that $F$ is concave and $(3,4)$ is a maximizer.

**Wiki explanation of the global step:** The displayed profit function has this same Hessian at every point, so its negative-definiteness test holds throughout the positive quadrant, not only at $(3,4)$. This domain-wide curvature is what permits the [concavity-based global conclusion](concavity-convexity-and-global-optima.md); a Hessian test at a single point would only classify a local candidate.

**Course source:** [Lecture 3](../raw/lectures/lecture-03.md), slides 23–24.

## Connections

- [Maximizers and local extrema](maximizers-and-local-extrema.md) defines the points and feasible sets to which the conditions apply.
- The gradient is developed in [directional derivatives and gradient](../multivariable-calculus/directional-derivatives-and-gradient.md).
- [Lagrange multipliers for equality constraints](../constrained-optimization/lagrange-multipliers-for-equality-constraints.md) develops the equality-constrained stationarity system.
- [Kuhn–Tucker conditions](../constrained-optimization/kuhn-tucker-conditions.md) adds feasibility, multiplier signs, and complementary slackness for inequalities.
- The [Maximum Principle](../optimal-control/maximum-principle.md) applies the same interior-candidate logic pointwise to the Hamiltonian control choice while adding state and costate equations.
- [Second-order conditions](second-order-conditions.md) classifies the unconstrained candidates found here.
