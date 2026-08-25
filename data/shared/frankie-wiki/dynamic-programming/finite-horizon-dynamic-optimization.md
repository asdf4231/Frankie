# Finite-Horizon Dynamic Optimization

> Course sources: [Lecture 7](../raw/lectures/lecture-07.md), slides 4–8, 19; [Lecture 8](../raw/lectures/lecture-08.md), slides 73–75

## Overview

A finite-horizon dynamic optimization problem chooses a feasible sequence over finitely many periods to maximize the sum of period payoffs. Lecture 7 presents both a state-to-state formulation and a more general control-state formulation, then motivates dynamic programming as a way to organize the problem stage by stage.

## State-to-state formulation

The first formulation chooses future states directly:

$$
\begin{aligned}
\sup_{\{x_t\}_{t=1}^{T}}\quad
&\sum_{t=0}^{T-1}F_t(x_t,x_{t+1})\\
\text{s.t.}\quad
&x_{t+1}\in\Gamma_t(x_t),
\qquad t=0,1,\ldots,T-1,\\
&x_0\text{ given}.
\end{aligned}
$$

Here:

- $x_t\in X$ is the state;
- $F_t\colon X\times X\to\mathbb{R}$ is the period-$t$ payoff;
- $\Gamma_t\colon X\rightrightarrows X$ is the feasible-state correspondence;
- $x_{t+1}\in\Gamma_t(x_t)$ means that tomorrow's state must be reachable from today's state.

The problem is written with $\sup$ because a maximizing feasible sequence need not be attained in the general formulation.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 4.

## Control-state formulation

The alternative formulation separates the control from the state transition:

$$
\begin{aligned}
\sup_{\{u_t\}_{t=0}^{T-1}}\quad
&\sum_{t=0}^{T-1}F_t(x_t,u_t)\\
\text{s.t.}\quad
&u_t\in G_t(x_t),\\
&x_{t+1}=f_t(x_t,u_t),\\
&x_0\text{ given}.
\end{aligned}
$$

The control $u_t\in U$ must belong to the feasible correspondence $G_t(x_t)$, while $f_t\colon X\times U\to X$ determines the next state. This formulation makes the distinction between choosing an action and inducing a state transition explicit.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 19.

## Example: cake eating

In the cake-eating example, $x_t$ is the cake remaining at the beginning of period $t$ and consumption is

$$
c_t=x_t-x_{t+1}.
$$

The problem is

$$
\max_{\{c_t\}}\sum_{t=0}^{T-1}\beta^t u(c_t)
$$

subject to

$$
x_{t+1}=x_t-c_t,
\qquad
0\leq c_t\leq x_t,
\qquad
x_0=\bar x.
$$

In state-to-state form,

$$
F_t(x_t,x_{t+1})=\beta^t u(x_t-x_{t+1}),
\qquad
\Gamma_t(x_t)=[0,x_t].
$$

The feasible correspondence therefore encodes both nonnegativity and the resource constraint. The example's intertemporal trade-off is between discounting, which makes delay costly, and concavity of $u$, which gives value to spreading consumption across periods.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slides 5–7.

## From a simultaneous system to stages

For the cake-eating constraints, a direct Lagrangian treatment introduces $T$ state variables and $2T$ multipliers. Its first-order system therefore has $3T$ unknowns, producing a large simultaneous system whose dimension grows with $T$. Lecture 7 motivates dynamic programming as a staged organization of this growing system.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 8.

## Terminal boundary condition

Lecture 8 considers a finite problem in which $x_0$ is given and the choice sequence includes

$$
(x_1,\ldots,x_{T+1}):
$$

$$
\begin{aligned}
&\max_{\{x_t\}_{t=1}^{T+1}}
\sum_{t=0}^{T}\beta^t U(x_t,x_{t+1})\\
\text{s.t.}\quad
&x_{t+1}\geq0.
\end{aligned}
$$

For $0\leq t\leq T-1$, an interior path satisfies the usual adjacent-period Euler equation. At $t=T$, complementary slackness gives

$$
x^*_{T+1}\geq0,
\qquad
\beta^T
\frac{\partial U(x^*_T,x^*_{T+1})}{\partial y}
 x^*_{T+1}=0.
$$

In the finite-horizon growth example,

$$
\frac{\partial U(x^*_T,x^*_{T+1})}{\partial y}
=-u'(c^*_T)<0,
$$

so $x^*_{T+1}=0$: no capital is left after the terminal date. Lecture 8 then uses this terminal condition as a heuristic route to the infinite-horizon transversality condition.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 73–75.

## Connections

- The [value function](value-function.md) records the best continuation value from a given date and state.
- The [Bellman equation](bellman-equation.md) decomposes the finite-horizon problem into current payoff and continuation value.
- The [dynamic programming principle and principle of optimality](dynamic-programming-principles.md) connect full-path optimality, optimal tails, and stagewise choices.
- [Kuhn–Tucker conditions](../constrained-optimization/kuhn-tucker-conditions.md) describe the inequality-constrained simultaneous approach used to motivate the recursive formulation and the terminal complementary-slackness condition.
- [Euler equations and the transversality condition](euler-equations-and-transversality-condition.md) explains how Lecture 8 interprets the infinite-horizon condition as a boundary condition at infinity.
- The [optimal growth model](optimal-growth-model.md) gives the terminal no-leftover-capital example.
