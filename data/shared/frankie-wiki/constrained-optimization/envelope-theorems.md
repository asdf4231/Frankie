# Envelope Theorems

> Course sources: [Lecture 5](../raw/lectures/lecture-05.md), slides 4–21; [Lecture 8](../raw/lectures/lecture-08.md), slides 39, 57, 59, 64

## Overview

Envelope theorems describe how an optimized objective value changes when a parameter changes. Under the regularity assumptions stated in Lecture 5, the derivative can be computed from a multiplier when the parameter shifts a constraint bound, from the objective's direct parameter effect in an unconstrained problem, or from the Lagrangian's direct parameter effect in an equality-constrained problem.

In Theorems 19.4 and 19.5, the total derivative on the left follows the optimizer as the parameter changes, while the partial derivative on the right holds the optimizing choice fixed at its current value. The lecture presents the multiplier-sensitivity results as special cases of this envelope logic.

## Multipliers as right-hand-side sensitivities

### One equality constraint

For

$$
\begin{aligned}
\max\quad &f(x,y)\\
\text{s.t.}\quad &h(x,y)=a,
\end{aligned}
$$
let $(x^*(a),y^*(a))$ be the solution and let $\mu^*(a)$ be its multiplier. Theorem 19.1 assumes that $f$ and $h$ are $C^1$, that $x^*$, $y^*$, and $\mu^*$ are $C^1$ functions of $a$, and that NDCQ holds at $(x^*(a),y^*(a))$. Then

$$
\mu^*(a)
=
\frac{d}{da}f(x^*(a),y^*(a)).
$$

Thus the multiplier gives the marginal change in the optimized objective when the equality's right-hand side changes.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 4–5.

### Several equality constraints

Let $f,h_1,\ldots,h_m$ be $C^1$ on $\mathbb{R}^n$, and parameterize the constraints by

$$
h_j(\mathbf{x})=a_j,
\qquad j=1,\ldots,m.
$$

Theorem 19.2 assumes that the optimal choices $x_i^*(\mathbf a)$ and multipliers $\mu_j^*(\mathbf a)$ are differentiable functions of $\mathbf a=(a_1,\ldots,a_m)$ and that NDCQ holds. For each $j$,

$$
\mu_j^*(a_1,\ldots,a_m)
=
\frac{\partial}{\partial a_j}
 f\bigl(x_1^*(a_1,\ldots,a_m),\ldots,x_n^*(a_1,\ldots,a_m)\bigr).
$$

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slide 8.

### Several inequality constraints

For

$$
g_j(\mathbf{x})\leq a_j^*,
\qquad j=1,\ldots,k,
$$
Theorem 19.3 assumes that, as $\mathbf a$ varies near $\mathbf a^*$, the optimal choices and inequality multipliers are differentiable functions of $\mathbf a$, and that NDCQ holds at $\mathbf a^*$. It states

$$
\lambda_j^*(\mathbf a^*)
=
\frac{\partial}{\partial a_j}
 f\bigl(\mathbf{x}^*(\mathbf a^*)\bigr),
\qquad j=1,\ldots,k.
$$

The lecture calls $\lambda_j$ the *internal value* or *shadow price* when $a_j$ is the available amount of an input: it measures the marginal value of another unit of that input to the optimized objective.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 9–10.

## Worked examples: multiplier sensitivity

### Equality-bound approximation

In Example 19.1,

$$
f(x_1,x_2)=x_1^2x_2,
\qquad
2x_1^2+x_2^2=3,
$$

has the reported maximizer $(1,1)$, multiplier $\mu=0.5$, and optimal value $1$. Changing the bound from $3$ to $3.3$ gives the new reported solution

$$
x_1=x_2=\sqrt{1.1}
$$

and optimal value

$$
(1.1)^{3/2}\approx1.1537.
$$

The multiplier approximation predicts the change

$$
\Delta f^*\approx \mu\,\Delta a
=0.5(0.3)=0.15,
$$

which is close to the actual increase $0.1537$.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 6–7.

### Binding and nonbinding inequalities

Example 19.2 begins from the reported maximizer

$$
x=y=z=\frac13,
\qquad xyz=\frac1{27},
$$

under $x+y+z\leq1$ and nonnegativity. The resource multiplier is $1/9$, while the three nonnegativity multipliers are zero.

When the resource bound falls from $1$ to $0.9$, the multiplier approximation gives

$$
\frac1{27}+\frac19\left(-\frac1{10}\right)
\approx0.0259,
$$

compared with the directly calculated new value $0.027$. By contrast, tightening the nonbinding constraint $x\geq0$ to $x\geq0.1$ leaves the old optimizer feasible and does not change the optimum; this is consistent with its zero multiplier.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slide 11.

## Unconstrained envelope theorem

Theorem 19.4 considers

$$
\max_{\mathbf{x}} f(\mathbf{x};a),
$$

where $f$ is $C^1$ in $\mathbf{x}\in\mathbb{R}^n$ and the scalar $a$. If $\mathbf{x}^*(a)$ is a solution and is a $C^1$ function of $a$, then

$$
\frac{d}{da}f(\mathbf{x}^*(a);a)
=
\frac{\partial}{\partial a}f(\mathbf{x}^*(a);a).
$$

The formula evaluates the objective's direct parameter derivative at the optimizer; it does not require first solving for the derivative of $\mathbf{x}^*(a)$.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 13–14.

## Worked examples: unconstrained envelopes

### A parameter that lowers the optimized objective

Example 19.3 studies

$$
\max_x\ f(x,a)
=
-a^3x^4+15x^3-e^ax^2+17
$$

near $a=1$. Under the existence and smooth-dependence statements made in the lecture,

$$
\frac{d}{da}f(x^*(a),a)
=
-3a^2x^{*4}-e^ax^{*2}<0.
$$

The lecture therefore concludes, without solving for $x^*(a)$, that the optimized value decreases as $a$ rises beyond $1$.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slide 15.

### Direct calculation and the envelope calculation

Example 19.4 considers

$$
\max_x\ f(x,a)=-x^2+2ax+4a^2.
$$

Stationarity gives $x^*(a)=a$, so direct substitution yields

$$
f(x^*(a),a)=5a^2
$$

and derivative $10a$. The envelope calculation reaches the same result from

$$
\frac{df^*}{da}
=
\frac{\partial f}{\partial a}(x^*(a),a)
=2x+8a
=10a.
$$

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slide 16.

### Production quality and profit

In Example 19.5, a fraction $\alpha$ of produced microchips works, working chips sell at price $p$, and cost is $c(y)$ with $c'(y)>0$ and $c''(y)>0$. The lecture writes optimal profit as

$$
\pi(p,\alpha)
=
\max_y\,[p\alpha y-c(y)]
$$

and states that the conditions on cost guarantee a nonzero profit-maximizing output $y^*(\alpha)$ that depends smoothly on $\alpha$. The envelope calculation is

$$
\frac{d\pi}{d\alpha}
=
\frac{\partial}{\partial\alpha}(p\alpha y-c(y))
=py>0.
$$

Thus the lecture concludes that an increase in production quality raises optimized profit.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 17–18.

## Equality-constrained envelope theorem

Theorem 19.5 lets $f,h_1,\ldots,h_k:\mathbb{R}^n\times\mathbb{R}\to\mathbb{R}$ be $C^1$ and considers maximizing $f(\mathbf{x};a)$ subject to

$$
h_1(\mathbf{x};a)=0,\ldots,h_k(\mathbf{x};a)=0.
$$

If the solution $\mathbf{x}^*(a)$ and multipliers $\mu_1(a),\ldots,\mu_k(a)$ are $C^1$ functions of $a$ and NDCQ holds, then

$$
\frac{d}{da}f(\mathbf{x}^*(a);a)
=
\frac{\partial L}{\partial a}
\bigl(\mathbf{x}^*(a),\boldsymbol\mu(a);a\bigr).
$$

The parameter's direct effects through both the objective and the equality constraints are therefore collected in the Lagrangian partial derivative.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slide 19.

## Worked example: the lecture's binding-inequality calculation

Example 19.6 considers

$$
\begin{aligned}
\max\quad &xy\\
\text{s.t.}\quad &x^2+ay^2\leq1
\end{aligned}
$$

with

$$
L(x,y,\lambda;a)
=xy-\lambda(x^2+ay^2-1).
$$

At the original value $a=1$, the reported solution and multiplier are

$$
x=y=\frac1{\sqrt2},
\qquad
\lambda=\frac12.
$$

The lecture computes

$$
\frac{\partial L}{\partial a}
=-\lambda y^2
=-\frac14.
$$

For the change $\Delta a=0.1$, the predicted change in the optimal value is therefore approximately $-0.025$, taking it from $0.5$ to $0.475$. Direct calculation at $a=1.1$ gives

$$
x=\frac1{\sqrt2},
\qquad
y=\frac1{\sqrt{2.2}},
\qquad f^*\approx0.4767.
$$

Theorem 19.5 itself is stated for equality constraints. This worked example is recorded as the lecture's envelope calculation for an inequality that binds at the original optimum, not as a claim that Theorem 19.5 is stated as an inequality theorem.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 20–21.

## Dynamic-programming envelope condition

For the stationary Bellman equation

$$
V(x)
=
\max_{y\in G(x)}\{U(x,y)+\beta V(y)\},
$$

Theorem 6.6 assumes Assumptions 6.1, 6.2, 6.3, and 6.5, uses the policy function from Corollary 6.1, and requires

$$
x\in\operatorname{Int}X,
\qquad
\pi(x)\in\operatorname{Int}G(x).
$$

It then states the dynamic envelope formula

$$
DV(x)=D_xU(x,\pi(x)).
$$

In one dimension,

$$
V'(x)
=
\frac{\partial U(x,y^*)}{\partial x}.
$$

Combined with the Bellman first-order condition

$$
D_yU(x,y^*)+\beta DV(y^*)=0,
$$

this yields the policy-function Euler equation

$$
D_yU(x,\pi(x))
+
\beta D_xU(\pi(x),\pi(\pi(x)))
=0.
$$

In the optimal-growth application, the lecture uses the same envelope condition to write

$$
V'(x)
=
\frac{\alpha x^{\alpha-1}}{x^\alpha-y}.
$$

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 39, 57, 59, 64.

## Connections

- [Lagrange multipliers for equality constraints](lagrange-multipliers-for-equality-constraints.md) supplies the equality multiplier systems whose right-hand-side sensitivity is measured here.
- [Kuhn–Tucker conditions](kuhn-tucker-conditions.md) supplies inequality multipliers, feasibility, multiplier signs, and complementary slackness.
- [Constraint qualifications](constraint-qualifications.md) explains the NDCQ assumptions used in the multiplier and constrained envelope results.
- The [total derivative and linear approximation](../multivariable-calculus/total-derivative-and-linear-approximation.md) distinguishes the total change in the optimized value from a partial parameter effect.
- The [chain rule](../multivariable-calculus/chain-rule.md) supplies the derivative-of-a-composition framework behind following $f(\mathbf{x}^*(a);a)$ as $a$ changes.
- [Euler equations and the transversality condition](../dynamic-programming/euler-equations-and-transversality-condition.md) use the dynamic envelope condition to eliminate derivatives of the value function from the intertemporal first-order condition.
- The [Maximum Principle](../optimal-control/maximum-principle.md) interprets the costate as a dynamic shadow value, while the [Hamilton–Jacobi–Bellman equation](../optimal-control/hamilton-jacobi-bellman-equation.md) identifies it with $V_x$ in the lecture's differentiable treatment.
