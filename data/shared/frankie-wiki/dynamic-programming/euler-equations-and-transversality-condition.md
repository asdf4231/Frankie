# Euler Equations and the Transversality Condition

> Course sources: [Lecture 8](../raw/lectures/lecture-08.md), slides 23, 30, 33, 36, 38–39, 54–61, 64, 73–75; [Lecture 9](../raw/lectures/lecture-09.md), slides 16–18, 24, 26–27, 41, 52–60

## Overview

Intertemporal first-order conditions require both local trade-off equations and boundary information. Lecture 8 gives a discrete-time Euler equation and transversality condition that are necessary and sufficient together under Theorem 6.10's assumptions. Lecture 9 gives continuous-time state, costate, control, and terminal conditions as necessary conditions, with separate concavity-based sufficiency results.

## Assumptions used in the lecture

The Euler-equation section assumes Assumptions 6.1–6.5.

1. **Assumption 6.1:** $G(x)$ is nonempty for every $x\in X$, and for every $x_0\in X$ and $\mathbf{x}\in\Phi(x_0)$,

   $$
   \lim_{n\to\infty}\sum_{t=0}^{n}\beta^t U(x_t,x_{t+1})
   $$

   exists and is finite.

2. **Assumption 6.2:** $X$ is a compact subset of $\mathbb R^K$; $G$ is nonempty-valued, compact-valued, and continuous; and $U:X_G\to\mathbb R$ is continuous, where

   $$
   X_G=\{(x,y)\in X\times X:y\in G(x)\}.
   $$

   Continuity of the correspondence $G$ is stated but not developed in these slides.

3. **Assumption 6.3:** for every $\alpha\in(0,1)$ and $(x,y),(x',y')\in X_G$,

   $$
   U(\alpha x+(1-\alpha)x',\alpha y+(1-\alpha)y')
   \geq
   \alpha U(x,y)+(1-\alpha)U(x',y'),
   $$

   with strict inequality when $x\neq x'$. In addition, whenever $y\in G(x)$ and $y'\in G(x')$,

   $$
   \alpha y+(1-\alpha)y'
   \in
   G(\alpha x+(1-\alpha)x')
   $$

   for every $\alpha\in[0,1]$.

4. **Assumption 6.4:** for each $y\in X$, $U(\cdot,y)$ is strictly increasing in each of its first $K$ arguments, and $x\leq x'$ implies $G(x)\subset G(x')$.

5. **Assumption 6.5:** $U$ is continuously differentiable on the interior of $X_G$.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 23, 30, 33, 36, 38, 56.

## First-order and envelope conditions

For an interior optimal next state $y^*$ in

$$
V(x)=\max_{y\in G(x)}\{U(x,y)+\beta V(y)\},
$$

the first-order condition is

$$
D_yU(x,y^*)+\beta DV(y^*)=0.
$$

Under Assumptions 6.1, 6.2, 6.3, and 6.5, Theorem 6.6 states that if $x\in\operatorname{Int}X$ and $\pi(x)\in\operatorname{Int}G(x)$, then

$$
DV(x)=D_xU(x,\pi(x)).
$$

Substitution gives a functional equation in the policy function:

$$
D_yU(x,\pi(x))
+
\beta D_xU(\pi(x),\pi(\pi(x)))
=0.
$$

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 39, 56–57.

## Euler equation along a path

Writing adjacent dates explicitly gives

$$
D_yU(x^*_t,x^*_{t+1})
+
\beta D_xU(x^*_{t+1},x^*_{t+2})
=0.
$$

In one dimension,

$$
\frac{\partial U(x_t,x^*_{t+1})}{\partial y}
+
\beta
\frac{\partial U(x^*_{t+1},x^*_{t+2})}{\partial x}
=0.
$$

The lecture interprets this as balancing the current marginal effect of increasing the next state against the discounted effect on future returns.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 57–59.

## Transversality condition

The Euler equation alone is not sufficient for optimality. The lecture adds

$$
\lim_{t\to\infty}
\beta^t D_xU(x^*_t,x^*_{t+1})\cdot x^*_t
=0.
$$

In one dimension,

$$
\lim_{t\to\infty}
\beta^t
\frac{\partial U(x^*_t,x^*_{t+1})}{\partial x}
 x^*_t
=0.
$$

The lecture describes this condition as ruling out beneficial simultaneous changes in infinitely many choice variables and as preventing the marginal return times the state from growing asymptotically as fast as, or faster than, $1/\beta$.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 60.

## Necessary and sufficient characterization

**Theorem 6.10.** Let $X\subset\mathbb R^K_+$ and suppose Assumptions 6.1–6.5 hold. A sequence $\{x^*_t\}_{t=0}^{\infty}$ satisfying

$$
x^*_{t+1}\in\operatorname{Int}G(x^*_t),
\qquad t=0,1,\ldots,
$$

is optimal for Problem 6.2 given $x_0$ if and only if it satisfies both

$$
D_yU(x^*_t,x^*_{t+1})
+
\beta D_xU(x^*_{t+1},x^*_{t+2})
=0
$$

and

$$
\lim_{t\to\infty}
\beta^t D_xU(x^*_t,x^*_{t+1})\cdot x^*_t
=0.
$$

Under those assumptions, the Euler equations and transversality condition are necessary and sufficient together.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 61.

## Finite-horizon boundary heuristic

For the finite problem that chooses $(x_1,\ldots,x_{T+1})$ with $x_0$ given, the terminal nonnegativity condition gives

$$
x^*_{T+1}\geq0,
\qquad
\beta^T
\frac{\partial U(x^*_T,x^*_{T+1})}{\partial y}
 x^*_{T+1}=0.
$$

Lecture 8 heuristically takes the infinite-horizon limit of this terminal condition and uses the Euler equation to obtain the transversality condition, calling it a boundary condition at infinity.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 73–75.

## Continuous-time finite-horizon conditions

For

$$
H(t,x,y,\lambda)=f(t,x,y)+\lambda g(t,x,y),
$$

the continuous-time interior necessary conditions are

$$
H_y(t,\hat x(t),\hat y(t),\lambda(t))=0,
$$

$$
\dot\lambda(t)=-H_x(t,\hat x(t),\hat y(t),\lambda(t)),
$$

and

$$
\dot x(t)=H_\lambda(t,\hat x(t),\hat y(t),\lambda(t)).
$$

The terminal condition depends on the endpoint specification:

| Continuous-time terminal case | Boundary condition |
|---|---|
| $x(t_1)$ is freely chosen | $\lambda(t_1)=0$ |
| $x(t_1)=x_1$ is fixed | No terminal restriction on $\lambda(t_1)$ is added |
| A fixed lower bound $x(t_1)\ge x_1$ is imposed | $\lambda(t_1)\ge0$ and $\lambda(t_1)(x(t_1)-x_1)=0$ |

The sign in the last row follows Lecture 9's convention of adding $\lambda(t)[g(t,x,y)-\dot x(t)]$ to a maximization objective. The sign restriction and complementary slackness must therefore be read together with that convention.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 16–18, 24, 26–27.

## Discrete/continuous and finite/infinite comparison

**Wiki comparison:** The table reorganizes the sourced frameworks without making their assumptions interchangeable.

| Framework | Local intertemporal conditions | Boundary condition and logical scope |
|---|---|---|
| Discrete time, finite horizon | Finite adjacent-state first-order system | Lecture 8's terminal nonnegativity heuristic gives $x^*_{T+1}\ge0$ and $\beta^T U_y(x^*_T,x^*_{T+1})x^*_{T+1}=0$. |
| Discrete time, infinite horizon | Euler equation $D_yU(x^*_t,x^*_{t+1})+\beta D_xU(x^*_{t+1},x^*_{t+2})=0$ | Under Assumptions 6.1–6.5 and interior feasibility, this Euler equation plus the discrete transversality condition is necessary and sufficient. |
| Continuous time, finite horizon | Hamiltonian control stationarity, costate equation, and state equation | The endpoint may be free, fixed, or subject to a fixed lower bound; the corresponding zero, unrestricted, or sign-and-slackness condition is necessary for the lecture's interior continuous solutions. |
| Continuous time, infinite horizon | Present-value or current-value Maximum Principle; derivative conditions hold away from discontinuities of a piecewise-continuous optimal control | The discounted theorem states (7.68); under Assumption 7.1 and either limiting-state condition, it strengthens transversality to (7.69). These are necessary conditions; global sufficiency is supplied separately by Theorem 7.14's concavity and limiting-inequality assumptions. |

For the discounted continuous-time formulation, the two transversality expressions are

$$
\lim_{t\to\infty}
\left[e^{-\rho t}\widehat H(t,\hat x(t),\hat y(t),\mu(t))\right]
=0
\tag{7.68}
$$

and, under the additional assumptions stated above,

$$
\lim_{t\to\infty}
\left[e^{-\rho t}\mu(t)\hat x(t)\right]
=0.
\tag{7.69}
$$

The limiting-state conditions are associated specifically with strengthening (7.68) to (7.69), not with all of the continuous-time necessary conditions.

**Course sources:** [Lecture 8](../raw/lectures/lecture-08.md), slides 57–61, 73–75; [Lecture 9](../raw/lectures/lecture-09.md), slides 41, 52–60.

## Connections

- The [dynamic envelope theorem](../constrained-optimization/envelope-theorems.md) supplies $DV(x)=D_xU(x,\pi(x))$ under the stated dynamic-programming assumptions.
- [Policy functions and correspondences](policy-functions-and-correspondences.md) explain the policy $\pi$ appearing in the functional Euler equation.
- [Finite-horizon dynamic optimization](finite-horizon-dynamic-optimization.md) records the terminal boundary condition used in the lecture's heuristic.
- The [optimal growth model](optimal-growth-model.md) and [optimal savings and debt limits](optimal-savings-and-debt-limits.md) apply the discrete-time Euler equation to concrete problems.
- The [Maximum Principle](../optimal-control/maximum-principle.md) gives the continuous-time state, costate, control, and transversality conditions compared here.
- [Optimal-control sufficiency conditions](../optimal-control/optimal-control-sufficiency-conditions.md) state the concavity assumptions that turn a continuous-time candidate into a global optimum.
