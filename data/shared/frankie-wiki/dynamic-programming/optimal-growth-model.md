# Optimal Growth Model

> Course sources: [Lecture 8](../raw/lectures/lecture-08.md), slides 9, 26–29, 62–66, 74

## Overview

Lecture 8 uses an optimal growth model to illustrate the transformation from controls to next states, closed-form solution of a Bellman equation, and Euler-equation characterization of a policy function.

## General growth formulation

The infinite-horizon growth problem is

$$
\begin{aligned}
&\max_{\{k_t,c_t\}_{t=0}^{\infty}}
\sum_{t=0}^{\infty}\beta^t u(c_t)\\
\text{s.t.}\quad
&k_{t+1}=f(k_t)+(1-\delta)k_t-c_t,\\
&k_t\geq0,\qquad k_0>0.
\end{aligned}
$$

Eliminating consumption gives

$$
U(t,k_t,k_{t+1})
=
u\bigl(f(k_t)-k_{t+1}+(1-\delta)k_t\bigr)
$$

and, because $c_t\geq0$,

$$
G(t,k_t)
=
[0,f(k_t)+(1-\delta)k_t].
$$

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 9.

## Log utility, Cobb–Douglas production, and full depreciation

The specialized model is

$$
\begin{aligned}
\max_{\{k_t,c_t\}_{t=0}^{\infty}}
&\sum_{t=0}^{\infty}\beta^t\log c_t\\
\text{s.t.}\quad
&k_{t+1}=k_t^\alpha-c_t,\\
&k_0>0,
\end{aligned}
$$

with $\beta\in(0,1)$.

**Wiki assumptions for the displayed closed form:** Take $0<\alpha<1$. Together with $0<\beta<1$, this gives $0<\alpha\beta<1$, so the logarithms and the denominator $1-\alpha\beta$ used below are well defined. Lecture 8 states the displayed model and solution but does not separately give the range of $\alpha$ on these slides.

Writing current capital as $x$ and next-period capital as $y$, the Bellman equation is

$$
V(x)
=
\max_{y\geq0}
\{\log(x^\alpha-y)+\beta V(y)\}.
$$

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 26–27, 62–63.

## Closed-form value and policy

Conjecture

$$
V(x)=A+B\log x.
$$

The first-order condition for $y$ is

$$
-\frac{1}{x^\alpha-y}+\frac{\beta B}{y}=0,
$$

so initially

$$
y=\frac{\beta B}{1+\beta B}x^\alpha.
$$

Matching coefficients on $\log x$ in the Bellman equation gives

$$
B=\alpha+\alpha\beta B,
\qquad
B=\frac{\alpha}{1-\alpha\beta}.
$$

Substituting this value into the first-order solution yields

$$
y^*(x)=\alpha\beta x^\alpha.
$$

The constant term is

$$
A
=
\frac{1}{1-\beta}
\left[
\log(1-\alpha\beta)
+
\frac{\alpha\beta}{1-\alpha\beta}\log(\alpha\beta)
\right].
$$

Thus the closed-form value and policy are

$$
V(x)=A+\frac{\alpha}{1-\alpha\beta}\log x,
\qquad
\pi(x)=\alpha\beta x^\alpha.
$$

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 27–29.

## Euler-equation route

The first-order and envelope conditions are

$$
\frac{1}{x^\alpha-y}=\beta V'(y)
$$

and

$$
V'(x)
=
\frac{\alpha x^{\alpha-1}}{x^\alpha-y}.
$$

Using $y=\pi(x)$ gives

$$
\frac{1}{x^\alpha-\pi(x)}
=
\beta
\frac{\alpha\pi(x)^{\alpha-1}}
{\pi(x)^\alpha-\pi(\pi(x))}.
$$

Guessing $\pi(x)=ax^\alpha$ and substituting into this functional equation gives $a=\beta\alpha$. Hence

$$
k_{t+1}=\beta\alpha k_t^\alpha,
\qquad
c_t=(1-\beta\alpha)k_t^\alpha.
$$

The lecture states that $k_t$ converges to a steady state, which ensures the transversality condition, and concludes that $\pi(x)=\beta\alpha x^\alpha$ is the unique policy function by Corollary 6.1 and Theorem 6.10.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 64–66.

## Stated assumption check and source scope

Lecture 8 instructs the reader to show that this application satisfies Assumptions 6.1–6.5, but slides 62–66 do not display the compact state-space construction required by Assumption 6.2 or carry out those checks. This page therefore records the lecture's closed-form and Euler calculations without silently supplying the missing compact-domain argument.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 63.

## Finite terminal boundary

For the finite-horizon version with

$$
U(x_t,x_{t+1})
=
u(f(x_t)+(1-\delta)x_t-x_{t+1}),
$$

the last-period marginal effect is

$$
\frac{\partial U(x^*_T,x^*_{T+1})}{\partial y}
=-u'(c^*_T)<0.
$$

The terminal complementary-slackness condition therefore gives

$$
k^*_{T+1}=x^*_{T+1}=0.
$$

No capital is left after the end of the finite horizon.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 74.

## Connections

- [Infinite-horizon dynamic optimization](infinite-horizon-dynamic-optimization.md) supplies the stationary sequence and recursive formulations.
- The [Bellman equation](bellman-equation.md) is solved here by conjecturing a logarithmic value function.
- [Policy functions and correspondences](policy-functions-and-correspondences.md) explains why the explicit rule is a policy function rather than merely a correspondence.
- [Euler equations and the transversality condition](euler-equations-and-transversality-condition.md) provide the second solution route and the boundary condition at infinity.
