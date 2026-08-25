# Maximum Principle

> Course sources: [Lecture 9](../raw/lectures/lecture-09.md), slides 10–28, 41–47, 52–58

## Overview

The Maximum Principle gives necessary conditions for the lecture's interior continuous or piecewise-continuous optimal-control solutions. It introduces a costate variable, requires the Hamiltonian to be maximized with respect to the control, and combines a state equation, a costate equation, and terminal or transversality conditions. These conditions locate candidates; concavity is needed for the lecture's separate sufficiency results.

## Hamiltonian and finite-horizon conditions

For the scalar problem with

$$
\dot x(t)=g(t,x(t),y(t)),
$$

the Hamiltonian is

$$
H(t,x,y,\lambda)
\equiv
f(t,x,y)+\lambda g(t,x,y).
$$

Suppose $f$ and $g$ are continuously differentiable and an optimal pair is continuous with

$$
(\hat x(t),\hat y(t))
\in
\operatorname{Int}\mathcal X
\times
\operatorname{Int}\mathcal Y.
$$

The lecture's simplified Maximum Principle gives a continuously differentiable costate $\lambda(t)$ satisfying

$$
\begin{aligned}
H_y(t,\hat x(t),\hat y(t),\lambda(t))&=0,\\
\dot\lambda(t)&=-H_x(t,\hat x(t),\hat y(t),\lambda(t)),\\
\dot x(t)&=H_\lambda(t,\hat x(t),\hat y(t),\lambda(t)),
\end{aligned}
$$

and the pointwise maximum condition

$$
H(t,\hat x(t),\hat y(t),\lambda(t))
\ge
H(t,\hat x(t),y,\lambda(t))
\qquad
\text{for every }y\in\mathcal Y.
$$

The equality $H_y=0$ is the interior first-order form of the maximum condition; the maximum condition itself is the stronger pointwise statement displayed by the lecture.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 10–16, 26–27.

## Terminal cases

The terminal condition depends on what is free or constrained at $t_1$.

| Terminal specification | Lecture condition |
|---|---|
| The terminal state $x_1=x(t_1)$ is freely chosen | $\lambda(t_1)=0$ |
| The terminal state is fixed at $x(t_1)=x_1$ | No terminal restriction on $\lambda(t_1)$ is added |
| A fixed lower bound $x(t_1)\ge x_1$ is imposed | $\lambda(t_1)\ge0$ and $\lambda(t_1)(x(t_1)-x_1)=0$ |

The inequality sign follows the lecture's convention of adding $\lambda(t)[g(t,x,y)-\dot x(t)]$ to a maximization objective. Thus the terminal multiplier is nonnegative for the fixed lower-bound constraint, and complementary slackness distinguishes a binding endpoint from a slack one.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 16–18, 24.

## Infinite-horizon necessary conditions

For the infinite-horizon problem with terminal lower bound

$$
\lim_{t\to\infty}b(t)x(t)\ge x_1,
$$

Theorem 7.9 assumes $f$ and $g$ are continuously differentiable and that there is a piecewise-continuous interior solution in

$$
\operatorname{Int}\mathcal X
\times
\operatorname{Int}\mathcal Y.
$$

The Hamiltonian maximum condition holds for $t\in\mathbb R_+$. At every date where the optimal control is continuous, the necessary conditions are

$$
H_y=0,
\qquad
\dot\lambda=-H_x,
\qquad
\dot x=H_\lambda,
$$

with $x(0)=x_0$ and the stated limiting lower bound. The theorem is therefore formulated for piecewise-continuous controls, while the derivative conditions are asserted away from their discontinuity points.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 36–42.

## Present-value and current-value forms

For the discounted problem

$$
\int_0^\infty e^{-\rho t}f(x(t),y(t))\,dt,
\qquad \rho>0,
$$

the present-value Hamiltonian and costate are

$$
H(t,x,y,\lambda)
=
e^{-\rho t}f(x,y)+\lambda g(t,x,y).
$$

Define the current-value costate and Hamiltonian by

$$
\mu(t)=e^{\rho t}\lambda(t),
$$

and

$$
\widehat H(t,x,y,\mu)
=
f(x,y)+\mu g(t,x,y).
$$

Theorem 7.13 assumes an interior piecewise-continuous optimal control and corresponding interior state, continuous differentiability of $f$ and $g$, existence and finiteness of $V(t,\hat x(t))$, differentiability of $V$ in $t$ and $x$ for sufficiently large $t$, and

$$
\lim_{t\to\infty}V_t(t,\hat x(t))=0.
$$

Except at control discontinuities, its current-value necessary conditions are

$$
\widehat H_y=0,
$$

$$
\rho\mu(t)-\dot\mu(t)=\widehat H_x,
$$

and

$$
\dot x(t)=\widehat H_\mu,
$$

along with the initial and limiting endpoint restrictions. The stated transversality condition is

$$
\lim_{t\to\infty}
\left[e^{-\rho t}
\widehat H(t,\hat x(t),\hat y(t),\mu(t))\right]
=0.
$$

Under Assumption 7.1 and either $\hat x(t)\to x^*\in\mathbb R$ or $\dot x(t)/\hat x(t)\to\chi\in\mathbb R$, the lecture strengthens it to

$$
\lim_{t\to\infty}
\left[e^{-\rho t}\mu(t)\hat x(t)\right]
=0.
$$

The limiting-state conditions are used for this strengthening, not for all the necessary conditions.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 52–58.

## Costate as a shadow value

The lecture interprets $\lambda(t)$ as the value of an infinitesimal increase in the state at date $t$. In the differentiable value-function treatment,

$$
\lambda(t)
=
V_x(t,\hat x(t)).
$$

The control condition

$$
f_y+\lambda g_y=0
$$

balances the control's marginal effect on current flow payoff against its marginal effect on the value of the state. The costate equation

$$
-\dot\lambda
=
f_x+\lambda g_x
$$

tracks the current-flow and state-dynamics effects of an additional unit of the state.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 28, 45–47.

## Worked example: consumption with a state constraint

The lecture considers

$$
\begin{aligned}
\max_{[c(t),a(t)]_{t=0}^1}
&\int_0^1e^{-\rho t}u(c(t))\,dt,\\
\text{subject to}\qquad
\dot a(t)&=ra(t)+w-c(t),\\
a(t)&\ge0,
\end{aligned}
$$

where $a(0)>0$ and

$$
u:\mathbb R_+\to\mathbb R
$$

is strictly increasing, continuously differentiable, and strictly concave. Consumption is the control and assets are the state.

On an interior arc, the present-value Hamiltonian calculation gives

$$
e^{-\rho t}u'(\hat c(t))=\lambda(t),
$$

and

$$
\dot\lambda(t)=-r\lambda(t).
$$

Hence

$$
\lambda(t)=\lambda(0)e^{-rt}
$$

and

$$
\hat c(t)
=
u'^{-1}
\left[
\lambda(0)e^{(\rho-r)t}
\right].
$$

The terminal condition $a(1)=0$ is then used to choose $\lambda(0)$ through

$$
\dot a(t)
=
ra(t)+w-
u'^{-1}
\left[
\lambda(0)e^{(\rho-r)t}
\right].
$$

When $\rho=r$, the interior formula gives constant consumption; when $\rho>r$, consumption declines; when $\rho<r$, it rises.

**Wiki scope clarification:** This is only an interior-arc calculation. The constraint $a(t)\ge0$ is a state constraint and must be handled separately if it binds. Lecture 9 explicitly explains why the free-terminal theorem cannot be applied to this problem, but it does not supply a general theorem for state-constrained optimal control.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 19–24.

## Connections

- [First-order conditions](../unconstrained-optimization/first-order-conditions.md) explain the interior stationarity logic behind $H_y=0$.
- [Lagrange multipliers for equality constraints](../constrained-optimization/lagrange-multipliers-for-equality-constraints.md) provide the static multiplier analogy used to construct the Hamiltonian.
- [Kuhn–Tucker conditions](../constrained-optimization/kuhn-tucker-conditions.md) provide the sign and complementary-slackness pattern echoed by the terminal lower-bound condition.
- [Envelope theorems](../constrained-optimization/envelope-theorems.md) connect multipliers with marginal values; the costate has the corresponding dynamic shadow-value interpretation.
- [Optimal-control sufficiency conditions](optimal-control-sufficiency-conditions.md) state when a candidate satisfying these necessary conditions is globally optimal.
- The [Hamilton–Jacobi–Bellman equation](hamilton-jacobi-bellman-equation.md) links the costate to the state derivative of the value function.
- [Euler equations and the transversality condition](../dynamic-programming/euler-equations-and-transversality-condition.md) compare these continuous-time conditions with their discrete-time counterparts.
