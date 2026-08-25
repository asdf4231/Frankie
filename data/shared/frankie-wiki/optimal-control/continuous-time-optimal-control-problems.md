# Continuous-Time Optimal Control Problems

> Course sources: [Lecture 9](../raw/lectures/lecture-09.md), slides 2–8, 35–38, 52

## Overview

A continuous-time optimal control problem chooses an entire control path while the state path is tied to it by a differential equation. The horizon may be finite or infinite, and admissibility combines the state equation, pointwise feasibility, and initial and terminal restrictions.

## Canonical formulation

The lecture writes the general problem as

$$
\max_{x(t),y(t)}
W(x(t),y(t))
\equiv
\int_0^{t_1} f(t,x(t),y(t))\,dt
$$

subject to

$$
\begin{aligned}
\dot x(t)&=G(t,x(t),y(t)),\\
x(t)&\in\mathcal X(t),
\qquad y(t)\in\mathcal Y(t),\\
x(0)&=x_0.
\end{aligned}
$$

For each date, the state and control are finite-dimensional vectors, with

$$
\mathcal X(t)\subset\mathbb R^{K_x},
\qquad
\mathcal Y(t)\subset\mathbb R^{K_y}.
$$

The state vector $x$ is governed by the differential equation once the control vector $y$ is specified. The terminal date $t_1$ may be finite or infinite.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 3–4.

## Why the choice problem is infinite-dimensional

Even with a finite horizon, the object being selected is a function such as

$$
y:[t_0,t_1]\to\mathbb R,
$$

not merely a finite vector. The lecture also emphasizes that a feasible control may be discontinuous or may reach the boundary of its feasible set, while the state equation is a differential rather than an algebraic constraint.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 3, 8.

## Admissible pairs and finite-horizon regularity

In the scalar finite-horizon specialization,

$$
\dot x(t)=g(t,x(t),y(t)),
\qquad
x(t)\in\mathcal X,
\qquad
y(t)\in\mathcal Y,
$$

with $x(0)=x_0$. The lecture calls $(x(t),y(t))$ an **admissible pair** when it satisfies the dynamic constraint and boundary conditions. It assumes that the objective is finite for every admissible pair, takes $\mathcal X$ and $\mathcal Y$ to be nonempty and convex in the finite-horizon discussion, and assumes $f$ and $g$ are continuously differentiable.

The variational argument then studies a strong special case: a continuous optimal pair whose state and control lie in

$$
\operatorname{Int}\mathcal X\times\operatorname{Int}\mathcal Y.
$$

These interior and continuity restrictions support small variations; they are not claims that all optimal controls have this form.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 6–10.

## Infinite-horizon formulation

For the infinite-horizon problem, the lecture uses

$$
\begin{aligned}
\max_{x(t),y(t)}\quad
&W(x(t),y(t))
\equiv
\int_0^\infty f(t,x(t),y(t))\,dt,\\
\text{subject to}\quad
&\dot x(t)=g(t,x(t),y(t)),\\
&x(t)\in\mathcal X,
\quad y(t)\in\mathcal Y,
\quad x(0)=x_0,\\
&\lim_{t\to\infty}b(t)x(t)\ge x_1,
\end{aligned}
$$

where

$$
b:\mathbb R_+\to\mathbb R_+,
\qquad
\lim_{t\to\infty}b(t)<\infty.
$$

Here $x_1$ is a lower bound on the limiting endpoint expression. The sets $\mathcal X$ and $\mathcal Y$ need not be bounded, and an admissible control may be piecewise continuous. The special case $b(t)\equiv1$ gives the lower bound $\lim_{t\to\infty}x(t)\ge x_1$.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 35–38.

## Discounted infinite-horizon class

A prominent specialization is

$$
\max_{x(t),y(t)}
\int_0^\infty e^{-\rho t}f(x(t),y(t))\,dt,
\qquad \rho>0,
$$

subject to the state equation and the course's interior and terminal restrictions. The discount factor is explicit here; in the earlier general value and principle-of-optimality formulas, any discounting is embedded in the flow function $f(t,x,y)$.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 40, 52.

## Connections

- The [Maximum Principle](maximum-principle.md) gives necessary state, costate, and control conditions for the lecture's interior solutions.
- [Optimal-control sufficiency conditions](optimal-control-sufficiency-conditions.md) explain when concavity promotes a candidate satisfying the necessary conditions to a global optimum.
- The [Hamilton–Jacobi–Bellman equation](hamilton-jacobi-bellman-equation.md) represents the continuous-time value problem recursively.
- The continuous-time [value function](../dynamic-programming/value-function.md) records the best admissible continuation payoff from a date and state.
