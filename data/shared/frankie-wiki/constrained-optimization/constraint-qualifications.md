# Constraint Qualifications

> Course sources: [Lecture 4](../raw/lectures/lecture-04.md), slides 7–14, 18–22, 26–28, 30–32; [Lecture 5](../raw/lectures/lecture-05.md), slides 25–27

## Overview

A constraint qualification is a regularity condition on the constraints at a candidate optimum. In Lecture 4, the relevant condition is that the gradients of the constraints that matter locally have full row rank. This rules out degeneracy in the constraint description and is an assumption in the multiplier theorems.

Constraint qualifications do not make the multiplier equations sufficient for an optimum. Theorems 18.1–18.5 use them to provide necessary conditions for candidates; classification still requires the additional reasoning or objective comparison supplied in a worked example. Lecture 5's Theorems 19.10–19.11 give necessary multiplier conditions without constraint qualifications by allowing the objective's multiplier to be zero.

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 7–10.

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 13–14.

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 18–21, 26–28.

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

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 30–32.

## Worked checks

In Example 18.4, the equality $h(x_1,x_2)=x_1+4x_2=16$ has gradient $(1,4)$ everywhere, so the single-equality qualification holds.

In Example 18.7, $g(x,y)=x^2+y^2\leq1$ has its only critical point at the origin. That point is not on the binding boundary $x^2+y^2=1$. Theorem 18.3 therefore imposes no nonzero-gradient requirement at the inactive origin, while every boundary candidate satisfies that requirement.

**Course source:** [Lecture 4](../raw/lectures/lecture-04.md), slides 11, 21–22.

## Conditions without constraint qualifications

Lecture 5 introduces an additional multiplier on the objective itself. The resulting necessary conditions allow a zero objective multiplier but rule out an entirely zero multiplier vector.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 25–27.

### One equality: Theorem 19.10

Let $f$ and $h$ be $C^1$ functions of two variables, and suppose $\mathbf{x}^*=(x_1^*,x_2^*)$ solves the problem of maximizing $f(x_1,x_2)$ subject to $h(x_1,x_2)=c$. Form

$$
L(x_1,x_2,\mu_0,\mu_1)
=\mu_0f(x_1,x_2)-\mu_1[h(x_1,x_2)-c].
$$

There exist multipliers satisfying

$$
(\mu_0^*,\mu_1^*)\neq(0,0),
\qquad \mu_0^*\in\{0,1\},
$$

and

$$
\begin{aligned}
\frac{\partial L}{\partial x_1}
&=\mu_0^*\frac{\partial f}{\partial x_1}(x_1^*,x_2^*)
-\mu_1^*\frac{\partial h}{\partial x_1}(x_1^*,x_2^*)=0,\\
\frac{\partial L}{\partial x_2}
&=\mu_0^*\frac{\partial f}{\partial x_2}(x_1^*,x_2^*)
-\mu_1^*\frac{\partial h}{\partial x_2}(x_1^*,x_2^*)=0,\\
\frac{\partial L}{\partial\mu_1}
&=c-h(x_1^*,x_2^*)=0.
\end{aligned}
$$

The source imposes no sign restriction on $\mu_1^*$. It does not impose $L_{\mu_0}=0$: the extra objective multiplier does not turn $f(x^*)=0$ into a constraint.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slide 26.

### Several inequalities: Theorem 19.11

Let $f,g_1,\ldots,g_k$ be $C^1$ functions of $n$ variables. Suppose $\mathbf{x}^*$ is a **local maximizer** of $f$ subject to $g_j(\mathbf{x})\leq b_j$, $j=1,\ldots,k$. Form

$$
L(\mathbf{x},\lambda_0,\lambda_1,\ldots,\lambda_k)
=\lambda_0f(\mathbf{x})-\sum_{j=1}^k\lambda_j[g_j(\mathbf{x})-b_j].
$$

Then there is a multiplier vector $\lambda^*=(\lambda_0^*,\lambda_1^*,\ldots,\lambda_k^*)$ satisfying all six conditions:

$$
\begin{aligned}
\nabla_{\mathbf{x}}L(\mathbf{x}^*,\lambda^*)
&=\lambda_0^*\nabla f(\mathbf{x}^*)
-\sum_{j=1}^k\lambda_j^*\nabla g_j(\mathbf{x}^*)=\mathbf0,\\
\lambda_j^*[g_j(\mathbf{x}^*)-b_j]&=0,\qquad j=1,\ldots,k,\\
\lambda_j^*&\geq0,\qquad j=1,\ldots,k,\\
g_j(\mathbf{x}^*)&\leq b_j,\qquad j=1,\ldots,k,\\
\lambda_0^*&\in\{0,1\},\\
(\lambda_0^*,\lambda_1^*,\ldots,\lambda_k^*)&\neq(0,0,\ldots,0).
\end{aligned}
$$

These are stationarity, complementary slackness, multiplier nonnegativity, feasibility, objective-multiplier normalization, and nontriviality. They remain necessary conditions, not a sufficiency test.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slide 27.

### Objective multiplier one versus zero

**Wiki synthesis:** With objective multiplier $1$, these systems have the ordinary equality-Lagrange or [Kuhn–Tucker](kuhn-tucker-conditions.md) form. With objective multiplier $0$ (the *abnormal* case in this wiki discussion), stationarity contains only constraint gradients. The nonzero-vector condition still forces at least one constraint multiplier to be nonzero. One cannot divide by the objective multiplier in this case or silently normalize it to $1$.

Under the relevant NDCQ, the zero case is excluded: for a single equality, $\mu_0^*=0$ and $\nabla h\neq0$ would force $\mu_1^*=0$. For inequalities, complementary slackness sets inactive multipliers to zero; linear independence of the binding gradients then makes zero-objective stationarity force all remaining multipliers to zero as well. Both contradict nontriviality. Without such a qualification, Theorems 19.10–19.11 allow objective multiplier $0$ and do not assert it must equal $1$.

**Course sources for this synthesis:** [Lecture 4](../raw/lectures/lecture-04.md), slides 10, 26–28 (qualified multiplier systems); [Lecture 5](../raw/lectures/lecture-05.md), slides 26–27 (generalized systems). The normalization comparison is wiki-supplied; the slides do not name these results.

## Connections

- [Lagrange multipliers for equality constraints](lagrange-multipliers-for-equality-constraints.md) uses the single-constraint and several-equality versions of NDCQ.
- [Kuhn–Tucker conditions](kuhn-tucker-conditions.md) applies the binding-gradient and mixed-constraint versions.
- [Jacobian derivative](../multivariable-calculus/jacobian-derivative.md) supplies the matrix whose row rank is tested.
- The [implicit function theorem](../multivariable-calculus/implicit-function-theorem.md) is another course result in which nonzero derivatives or an invertible derivative block serve as local regularity conditions, although its conclusion is about implicit local solutions rather than multiplier candidates.
- [Smooth dependence of constrained optima](smooth-dependence-of-constrained-optima.md) gives Theorem 19.9's nonsingularity condition and its NDCQ conclusion.
- [Envelope theorems](envelope-theorems.md) use NDCQ together with differentiable optimizing choices and multipliers for constrained value sensitivities.
