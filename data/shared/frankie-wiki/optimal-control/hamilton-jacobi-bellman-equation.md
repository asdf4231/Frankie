# Hamilton–Jacobi–Bellman Equation

> Course sources: [Lecture 10](../raw/lectures/lecture-10.md), slides 36–37, 39–50

## Overview

The Hamilton–Jacobi–Bellman (HJB) equation is the continuous-time recursive equation for a differentiable value function. It equates the loss of value from the passage of time to the best current flow payoff plus the value effect of the induced state change. Lecture 10 also uses it to interpret the costate and to derive the Maximum Principle heuristically.

## Continuous-time value function

For the infinite-horizon problem, the lecture defines

$$
V(t_0,x(t_0))
=
\sup
\int_{t_0}^{\infty}
f(t,x(t),y(t))\,dt,
$$

where the supremum is over admissible state-control pairs satisfying

$$
\dot x(t)=g(t,x(t),y(t))
$$

and the terminal lower bound

$$
\lim_{t\to\infty}b(t)x(t)\ge x_1.
$$

Thus $V(t_0,x(t_0))$ is the best continuation value from date $t_0$ and state $x(t_0)$.

**Course source:** [Lecture 10](../raw/lectures/lecture-10.md), slide 39.

## HJB equation

Theorem 7.10 assumes the hypotheses of the lecture's [infinite-horizon Maximum Principle](maximum-principle.md#infinite-horizon-necessary-conditions): $f$ and $g$ are continuously differentiable and the admissible problem has a piecewise-continuous interior optimal pair. If $V(t,x)$ is also differentiable in $(t,x)$, then

$$
-\frac{\partial V(t,x)}{\partial t}
=
\max_{y\in\mathcal Y}
\left\{
f(t,x,y)
+
\frac{\partial V(t,x)}{\partial x}
g(t,x,y)
\right\},
\qquad t\in\mathbb R_+.
$$

Along an optimal pair,

$$
\begin{aligned}
-V_t(t,\hat x(t))
&=
f(t,\hat x(t),\hat y(t))
+
V_x(t,\hat x(t))
g(t,\hat x(t),\hat y(t))\\
&=
\max_{y\in\mathcal Y}
\left\{
f(t,\hat x(t),y)
+
V_x(t,\hat x(t))g(t,\hat x(t),y)
\right\}.
\end{aligned}
$$

**Remark (separate from Theorem 7.10).** The HJB equation may admit multiple solutions. An appropriate asymptotic, growth, or transversality condition is generally needed to select the value-function solution. If the discounted continuation value vanishes, this condition may be

$$
\lim_{t\to\infty}V(t,x)=0.
$$

**Course source:** [Lecture 10](../raw/lectures/lecture-10.md), slides 41–43.

## Value change along the optimal path

**Wiki derivation:** Slide 44 states the final identity below; the intermediate chain-rule step uses the state equation:

$$
\frac{d}{dt}V(t,\hat x(t))
=
V_t(t,\hat x(t))
+
V_x(t,\hat x(t))
g(t,\hat x(t),\hat y(t)).
$$

Combining this identity with the HJB equation along the optimum gives

$$
f(t,\hat x(t),\hat y(t))
=
-\frac{d}{dt}V(t,\hat x(t)).
$$

The lecture interprets the right-hand side of HJB as current gain plus the benefit of increasing the state, while the left-hand side records the change in maximized value with calendar time.

**Course source:** [Lecture 10](../raw/lectures/lecture-10.md), slides 41, 43–44.

## From HJB to the Maximum Principle

Set the costate equal to the state derivative of the value function:

$$
\lambda(t)=V_x(t,\hat x(t)).
$$

The first-order condition in the HJB maximization gives

$$
H_y(t,\hat x(t),\hat y(t),\lambda(t))=0.
$$

Differentiating HJB with respect to $x$ and differentiating $\lambda(t)=V_x(t,\hat x(t))$ along the state path gives

$$
\dot\lambda(t)
=
-H_x(t,\hat x(t),\hat y(t),\lambda(t)).
$$

The lecture presents this as a heuristic derivation linking HJB to the state-costate system and making the costate's shadow-value interpretation explicit.

**Course source:** [Lecture 10](../raw/lectures/lecture-10.md), slides 45–47.

## Worked stationary discounted specialization

Suppose

$$
f(t,x,y)=e^{-\rho t}f(x,y)
$$

and the state equation is autonomous:

$$
g(t,x,y)=g(x,y).
$$

If a plan is optimal from $t=0$, its continuation from any $s>0$ is optimal from the reached state $x(s)=\hat x(s)$. Define

$$
v(x)=V(0,x).
$$

The lecture's stationary factorization along the optimal state path is

$$
V(t,\hat x(t))=e^{-\rho t}v(\hat x(t)).
$$

**Wiki derivation:** Substituting the stationary factorization into HJB and cancelling $e^{-\rho t}$ gives

$$
\rho v(\hat x(t))
=
\max_{y\in\mathcal Y}
\left\{
f(\hat x(t),y)
+
v'(\hat x(t))g(\hat x(t),y)
\right\}.
$$

At the maximizing control $\hat y(t)$,

$$
\rho v(\hat x(t))
=
f(\hat x(t),\hat y(t))
+
\dot v(\hat x(t)).
$$

The lecture interprets $v$ as an asset value, $f$ as its dividend, $\dot v$ as its capital gain or loss, and $\rho$ as the required rate of return. This is its “no-arbitrage asset value” interpretation of stationary HJB.

**Course source:** [Lecture 10](../raw/lectures/lecture-10.md), slides 36–37, 43, 48–50.

## Connections

- The [continuous-time value function](../dynamic-programming/value-function.md) is the unknown function in HJB.
- The continuous-time [principle of optimality](../dynamic-programming/dynamic-programming-principles.md) supplies the recursive logic behind the equation.
- The [Bellman equation](../dynamic-programming/bellman-equation.md) is the discrete-time recursive counterpart developed earlier in the course.
- The [Maximum Principle](maximum-principle.md) is linked by $\lambda(t)=V_x(t,\hat x(t))$ and the HJB control first-order condition.
- [Envelope theorems](../constrained-optimization/envelope-theorems.md) provide the course's earlier value-derivative and shadow-value logic.
