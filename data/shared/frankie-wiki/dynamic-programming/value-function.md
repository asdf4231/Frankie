# Value Function

> Course sources: [Lecture 7](../raw/lectures/lecture-07.md), slides 11, 13, 20; [Lecture 8](../raw/lectures/lecture-08.md), slides 7–8, 12, 22–24, 31, 49–50; [Lecture 9](../raw/lectures/lecture-09.md), slides 39, 48–49

## Overview

A value function assigns to a current state the supremum of feasible continuation payoff. It may be indexed by date in a nonstationary, finite-horizon, or general continuous-time problem; in a stationary infinite-horizon problem, the time argument can be suppressed after discounting is separated.

## State-to-state definition

For the formulation in which future states are chosen directly,

$$
\begin{aligned}
V_t(x)
&:=\sup_{\{x_s\}_{s=t+1}^{T}}
\sum_{s=t}^{T-1}F_s(x_s,x_{s+1})\\
\text{s.t.}\quad
&x_{s+1}\in\Gamma_s(x_s),
\qquad s=t,\ldots,T-1,\\
&x_t=x.
\end{aligned}
$$

Thus $V_t(x)$ asks: starting at time $t$ in state $x$, what is the best continuation value available from periods $t$ through $T-1$? In particular, $V_0(x_0)$ is the value of the original finite-horizon problem.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 11.

## Control-state definition

When controls determine state transitions, the value function is

$$
\begin{aligned}
V_t(x)
&:=\sup_{\{u_s\}_{s=t}^{T-1}}
\sum_{s=t}^{T-1}F_s(x_s,u_s)\\
\text{s.t.}\quad
&u_s\in G_s(x_s),
\qquad s=t,\ldots,T-1,\\
&x_{s+1}=f_s(x_s,u_s),
\qquad s=t,\ldots,T-1,\\
&x_t=x.
\end{aligned}
$$

The transition equations are part of the continuation problem: a control sequence is evaluated together with the states it induces.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 20.

## Stationary infinite-horizon value

For the stationary sequence problem, let $\Phi(x)$ be the set of feasible infinite plans beginning at $x$ and define

$$
\bar U(\mathbf z)
=
\sum_{t=0}^{\infty}\beta^t U(z_t,z_{t+1}).
$$

The sequence value is

$$
V^*(x)
=
\sup_{\mathbf z\in\Phi(x)}\bar U(\mathbf z).
$$

Assumption 6.1 requires that the discounted-return limit exist and be finite for every feasible plan. Under that assumption, Theorem 6.1 identifies the sequence value with the solution $V$ of the stationary Bellman equation:

$$
V^*(x)=V(x).
$$

Under Assumptions 6.1 and 6.2, Theorem 6.3 further states that this Bellman solution is the unique bounded continuous value function and that an optimal plan exists from every initial state.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 12, 22–24, 31, 49–50.

## Continuous-time infinite-horizon value

For the continuous-time problem, the value from date $t_0$ and state $x(t_0)$ is

$$
V(t_0,x(t_0))
=
\sup_{(x(\cdot),y(\cdot))\text{ admissible from }(t_0,x(t_0))}
\int_{t_0}^{\infty}f(t,x(t),y(t))\,dt,
$$

subject to

$$
\dot x(t)=g(t,x(t),y(t))
$$

and the terminal lower bound

$$
\lim_{t\to\infty}b(t)x(t)\ge x_1.
$$

The value is at least the return from every admissible pair, and it equals the return from an optimal pair when the supremum is attained.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 39.

## Stationary discounted continuous-time value

Suppose the flow payoff has the form

$$
e^{-\rho t}f(x(t),y(t))
$$

and the state equation is autonomous. An optimal plan continued from any $s>0$ is evaluated from the reached state $x(s)=\hat x(s)$. Defining

$$
v(x)=V(0,x),
$$

the lecture writes along the optimal state path

$$
V(t,x(t))=e^{-\rho t}v(x(t)).
$$

Thus $v$ is the state-based value used after the calendar-time discount factor has been separated.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 48–49.

## Terminal convention and finite-horizon scope

Lecture 7 uses

$$
V_T(x)=0.
$$

There is no payoff after period $T-1$, so the last Bellman equation contains the period-$T-1$ payoff plus zero continuation value.

**Wiki assumptions:** Lecture 7 states that the feasibility correspondences are nonempty-valued but does not separately assume finite values. To support the supremum and $\epsilon$ proof without assuming attainment, this page works with nonempty admissible continuation sets and finite values.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 13.

## What the value function summarizes

The current state is the initial condition for the remaining problem. In a finite horizon, $V_{t+1}$ summarizes the payoff consequences after the next state or control choice. In a stationary discrete-time infinite horizon, the same function $V$ summarizes every continuation problem because the payoff and feasibility correspondence do not change with calendar time. In continuous time, $V(t,x)$ performs the same compression for an admissible future control path, and the stationary discounted representation separates calendar discounting from the state-only value $v(x)$. In every case, the earlier problem does not need to carry the entire future sequence explicitly.

## Connections

- [Finite-horizon dynamic optimization](finite-horizon-dynamic-optimization.md) gives the finite sequence problems whose continuation values are represented by $V_t$.
- [Infinite-horizon dynamic optimization](infinite-horizon-dynamic-optimization.md) defines the stationary sequence value $V^*$.
- The [Bellman equation](bellman-equation.md) relates current payoff to the appropriate continuation value, while the [Bellman operator](bellman-operator.md) gives the stationary fixed-point formulation.
- The [dynamic programming principles](dynamic-programming-principles.md) use continuation values to connect optimal paths, tails, and stage choices in discrete and continuous time.
- The [Hamilton–Jacobi–Bellman equation](../optimal-control/hamilton-jacobi-bellman-equation.md) is the continuous-time recursive equation for a differentiable value function.
- [Continuous-time optimal control problems](../optimal-control/continuous-time-optimal-control-problems.md) supply the admissible state-control paths over which the continuous-time value is taken.
- [Policy functions and correspondences](policy-functions-and-correspondences.md) explain how a value can be unique even when maximizing choices are not.
- [Bounds, suprema, and completeness](../real-analysis/bounds-suprema-and-completeness.md) distinguishes a supremum from an attained maximum.
