# Constraint Qualifications

> Course sources: [Lecture 4](../raw/lectures/lecture-04.md), slides 12–15, 21–24, 30–33, 42–46, 51–54, 67

## Overview

A constraint qualification is a regularity condition on the constraints at a candidate optimum. In Lecture 4, the relevant condition is that the gradients of the constraints that matter locally have full row rank. This rules out degeneracy in the constraint description and is an assumption in the multiplier theorems.

Constraint qualifications do not make the multiplier equations sufficient for an optimum. Theorems 18.1–18.5 use them to provide necessary conditions for candidates; classification still requires the additional reasoning or objective comparison supplied in a worked example.

## One equality constraint

For a single equality

$$
h(x_1,x_2)=c,
$$

the lecture requires that the candidate $\mathbf{x}^*$ not be a critical point of $h$:

$$
\nabla h(\mathbf{x}^*)\neq\mathbf 0.
$$

Equivalently, at least one of

$$
\frac{\partial h}{\partial x_1}(\mathbf{x}^*),
\qquad
\frac{\partial h}{\partial x_2}(\mathbf{x}^*)
$$

is nonzero. This is the qualification used in Theorem 18.1. It also clarifies why a slope formula may fail even though the general proportional-gradient statement remains the appropriate formulation: a particular slope ratio needs its own denominator to be nonzero, whereas the qualification only requires that the gradient as a whole not vanish.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 12–15.

## Several equality constraints

Let

$$
\mathbf h=(h_1,\ldots,h_m).
$$

The lecture calls $\mathbf{x}^*$ a critical point of $\mathbf h$ when

$$
\operatorname{rank}D\mathbf h(\mathbf{x}^*)<m.
$$

The nondegenerate constraint qualification (NDCQ) is therefore

$$
\operatorname{rank}D\mathbf h(\mathbf{x}^*)=m.
$$

Because the rows of $D\mathbf h$ are the equality-constraint gradients, this says that those gradients are linearly independent. It is the qualification used in Theorem 18.2.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 21–22.

## Inequality constraints: test only the binding rows

For inequalities

$$
g_j(\mathbf{x})\leq b_j,
\qquad j=1,\ldots,k,
$$

a constraint is binding at $\mathbf{x}^*$ when

$$
g_j(\mathbf{x}^*)=b_j.
$$

If the first $k_0$ constraints are binding and the rest are inactive, Theorem 18.4 assumes that the binding-gradient matrix has rank $k_0$:

$$
\operatorname{rank}
\begin{pmatrix}
\nabla g_1(\mathbf{x}^*)^\top\\
\vdots\\
\nabla g_{k_0}(\mathbf{x}^*)^\top
\end{pmatrix}
=k_0.
$$

Inactive constraints are not included in this rank test. For one inequality, Theorem 18.3 requires a nonzero constraint gradient only when the constraint binds at the maximizer.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 30–33, 42–44.

## Mixed equality and inequality constraints

For

$$
\begin{aligned}
g_j(\mathbf{x})&\leq b_j,\qquad j=1,\ldots,k,\\
h_\ell(\mathbf{x})&=c_\ell,\qquad \ell=1,\ldots,m,
\end{aligned}
$$

suppose the first $k_0$ inequalities bind. Theorem 18.5 stacks the gradients of those binding inequalities with the gradients of every equality constraint. NDCQ requires

$$
\operatorname{rank}
\begin{pmatrix}
\nabla g_1(\mathbf{x}^*)^\top\\
\vdots\\
\nabla g_{k_0}(\mathbf{x}^*)^\top\\
\nabla h_1(\mathbf{x}^*)^\top\\
\vdots\\
\nabla h_m(\mathbf{x}^*)^\top
\end{pmatrix}
=k_0+m.
$$

Thus every equality is always part of the local rank test, while only active inequalities are included.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 51–53.

## Worked checks

### Two equalities

In the problem

$$
x^2+y^2=1,
\qquad
x+z=1,
$$

the constraint Jacobian is

$$
D\mathbf h(x,y,z)=
\begin{pmatrix}
2x&2y&0\\
1&0&1
\end{pmatrix}.
$$

It has rank below $2$ only when $x=y=0$, but such a point violates $x^2+y^2=1$. Therefore all feasible points satisfy NDCQ.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 23–24.

### A simplex with nonnegativity constraints

For

$$
x+y+z\leq1,
\qquad x\geq0,
\qquad y\geq0,
\qquad z\geq0,
$$

the inequalities are written in the lecture's $\leq$ convention, giving constraint-gradient rows

$$
\begin{pmatrix}
1&1&1\\
-1&0&0\\
0&-1&0\\
0&0&-1
\end{pmatrix}.
$$

Every subset of at most three rows is linearly independent. All four constraints cannot bind simultaneously: binding nonnegativity would require $x=y=z=0$, while binding the resource constraint would require $x+y+z=1$. Hence the active rows satisfy NDCQ at every solution candidate.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 45–46.

### One equality plus nonnegativity

For

$$
x^2+y^2=4,
\qquad x\geq0,
\qquad y\geq0,
$$

the equality gradient vanishes only at the origin, which is infeasible. If either nonnegativity constraint binds, the corresponding candidate is $(2,0)$ or $(0,2)$, and the resulting $2\times2$ constraint Jacobian has rank two. The lecture therefore concludes that NDCQ holds at the candidates considered.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slide 54.

### A two-variable inequality problem

For

$$
2x+2y\leq1,
\qquad x\geq0,
\qquad y\geq0,
$$

the constraint-gradient matrix is

$$
\begin{pmatrix}
2&2\\
-1&0\\
0&-1
\end{pmatrix}.
$$

At most two constraints can bind simultaneously, and every $2\times2$ submatrix has rank two. Therefore NDCQ holds at every solution candidate.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slide 67.

## Connections

- [Lagrange multipliers for equality constraints](lagrange-multipliers-for-equality-constraints.md) uses the single-constraint and several-equality versions of NDCQ.
- [Kuhn–Tucker conditions](kuhn-tucker-conditions.md) applies the binding-gradient and mixed-constraint versions.
- [Jacobian derivative](../multivariable-calculus/jacobian-derivative.md) supplies the matrix whose row rank is tested.
- The [implicit function theorem](../multivariable-calculus/implicit-function-theorem.md) is another course result in which nonzero derivatives or an invertible derivative block serve as local regularity conditions, although its conclusion is about implicit local solutions rather than multiplier candidates.
- See [constrained second-order conditions](constrained-second-order-conditions.md) for the Lecture 5 curvature tests.
