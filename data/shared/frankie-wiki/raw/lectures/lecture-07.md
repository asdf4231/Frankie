# Lecture 7 — From Static to Dynamic Optimization

> Course: Dynamic Optimization
> Original: slides/lecture07-from_static_to_dynamic_optimization.tex
> PDF: slides/lecture07-from_static_to_dynamic_optimization.pdf
> Snapshot: v1
> PDF metadata: Title `Lecture 7: From Static to Dynamic Optimization`; author `Junnan Zhang`; creator `LaTeX with Beamer class`; producer `pdfTeX-1.40.29`; 28 pages; PDF version 1.7; created and modified 2026-08-23 02:06:50 +08.
> Normalization notes: The exact course-defined macro `\R` is expanded to $\mathbb{R}$ for Markdown rendering. Presentation-only Beamer syntax has otherwise been removed without correcting source wording or mathematics.

## L07-S01 — Lecture 7: From Static to Dynamic Optimization

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Fall, 2026

## L07-S02 — Overview

> PDF pages: 2

- Brief introduction to finite-horizon dynamic optimization in discrete time under certainty
- Introduce the Bellman equation and the Principle of Optimality

## L07-S03 — Outline

> PDF pages: 3
> Section: Problem Description

1. Problem Description
2. Recursive Formulation and Dynamic Programming
3. Alternative Formulation
4. Examples

## L07-S04 — Problem Description

> PDF pages: 4
> Section: Problem Description

A finite-horizon dynamic optimization problem

$$
\begin{aligned}
\sup_{\{x_t\}_{t=1}^{T}}\quad &\sum_{t=0}^{T-1}F_t(x_t,x_{t+1})\\
\text{s.t.}\quad
&x_{t+1}\in\Gamma_t(x_t)\text{ for all }t=0,1,\ldots,T-1\\
&x_0\text{ given}
\end{aligned}
$$

- $x_t\in X$ is the state variable (state vector)
- $F_t:X\times X\to\mathbb{R}$ is the instantaneous payoff function
- $\Gamma_t(x)$ is a non-empty set-valued mapping (correspondence): $\Gamma_t:X\rightrightarrows X$
- The constraint $x_{t+1}\in\Gamma_t(x_t)$ captures feasibility: tomorrow's state must be reachable from today's state
- We use $\sup$ instead of $\max$ because the maximum may not be attained in general settings

## L07-S05 — Example: Cake Eating Problem

> PDF pages: 5
> Section: Problem Description

- Finite time horizon: $t=0,1,\ldots,T$
- At $t=0$ the agent is given a complete cake with size $\bar x$
- Let $x_t$ denote the size of the cake at the beginning of each period, so that, in particular, $x_0=\bar x$
- After choosing to consume $c_t$ of the cake in period $t$ there is

  $$
  x_{t+1}=x_t-c_t
  $$

  left in period $t+1$
- Consuming quantity $c$ of the cake gives current utility $u(c)$

## L07-S06 — Example: Cake Eating Problem

> PDF pages: 6
> Section: Problem Description

- The agent's problem can be written as

  $$
  \max_{\{c_t\}}\sum_{t=0}^{T-1}\beta^t u(c_t)
  $$

  subject to

  $$
  x_{t+1}=x_t-c_t\quad 0\leq c_t\leq x_t,\quad x_0=\bar{x}
  $$

- Formulate this in the general framework:
  - $F_t(x_t,x_{t+1})=\beta^t u(x_t-x_{t+1})$
  - $\Gamma_t(x_t)=[0,x_t]$
  - We write $c_t=x_t-x_{t+1}$ in terms of the states
  - The feasible set $\Gamma_t(x_t)=[0,x_t]$ encodes both non-negativity and resource constraints

## L07-S07 — Example: Cake Eating Problem

> PDF pages: 7
> Section: Problem Description

The key trade-off in the cake-eating problem is:

- Delaying consumption is costly because of the discount factor
- But delaying some consumption is also attractive because $u$ is concave. The concavity of $u$ implies that the consumer gains value from consumption smoothing, which means spreading consumption out over time
- The optimal solution balances these opposing forces

## L07-S08 — Lagrangian Approach?

> PDF pages: 8
> Section: Problem Description

- In this example, the constraint $x_{t+1}\in\Gamma_t(x_t)$ can be written as $x_{t+1}\geq0$ and $x_{t+1}\leq x_t$
- The Lagrangian $L(x_1,x_2,\ldots,x_T,\lambda_1,\ldots,\lambda_T,\mu_1,\ldots,\mu_T)$
- We need to solve for $3T$ unknowns from the first order conditions: $T$ state variables and $2T$ multipliers
- As $T$ grows, this becomes a large simultaneous system whose dimension grows with $T$
- Dynamic programming offers a more efficient approach by breaking the problem into stages

## L07-S09 — Lagrangian Approach?

> PDF pages: 9
> Section: Problem Description

- Consider an example where $T=3$
- Adopt the CRRA utility function:

  $$
  u(c)=\frac{c^{1-\gamma}}{1-\gamma}\qquad(0<\gamma<1)
  $$

- CRRA = Constant Relative Risk Aversion; $\gamma$ measures the degree of risk aversion
- Higher $\gamma$ means stronger preference for consumption smoothing
- The case $\gamma=1$ corresponds to $u(c)=\ln(c)$ (logarithmic utility)
- Formulate the Lagrangian

## L07-S10 — Outline

> PDF pages: 10
> Section: Recursive Formulation and Dynamic Programming

1. Problem Description
2. Recursive Formulation and Dynamic Programming
3. Alternative Formulation
4. Examples

## L07-S11 — Dynamic Programming

> PDF pages: 11
> Section: Recursive Formulation and Dynamic Programming

- Given the recursive structure of this problem, we introduce the **value function** $V_t(x)$:

  $$
  \begin{aligned}
  V_t(x)&:=\sup_{\{x_s\}_{s=t+1}^{T}}\sum_{s=t}^{T-1}F_s(x_s,x_{s+1})\\
  \text{s.t.}\quad &x_{s+1}\in\Gamma_s(x_s)\text{ for all }s=t,\ldots,T-1\\
  &x_t=x
  \end{aligned}
  $$

- $V_t(x)$ gives the lifetime value at time $t$ if the state is $x_t=x$: “what is the best I can do from time $t$ onward, starting with state $x$?”
- This is the *value of the problem* viewed from period $t$ with initial condition $x_t=x$
- Note that $V_0(x_0)$ is the value of the original problem

## L07-S12 — Dynamic Programming Principle

> PDF pages: 12
> Section: Recursive Formulation and Dynamic Programming

**Dynamic Programming Principle.** If $(x_1,x_2,\ldots,x_T)$ is a solution to problem $V_0(x_0)$, then for any $t=1,2,\ldots,T-1$, $(x_{t+1},\ldots,x_T)$ is a solution to problem $V_t(x_t)$.

Intuition: an optimal path remains optimal from any point along it.

Proof by contradiction:

- Suppose that there is an admissible sequence $(z_{t+1},\ldots,z_T)$ that achieves higher value than $(x_{t+1},\ldots,x_T)$ at time $t$ when the state is $x_t$
- Show that $(x_0,x_1,\ldots,x_t,z_{t+1},\ldots,z_T)$ is admissible and achieves higher value of $V_0(x_0)$
- In other words, we could “splice” this better tail onto our path, improving overall value, contradicting optimality

## L07-S13 — Bellman Equation

> PDF pages: 13
> Section: Recursive Formulation and Dynamic Programming

**Bellman Equation.** For all $t=0,1,\ldots,T-1$, we have

$$
V_t(x)=\sup_{x'\in\Gamma_t(x)}\left\{F_t(x,x')+V_{t+1}(x')\right\},
$$

where we use the terminal convention $V_T(x)=0$.

Interpretation: today's value = today's payoff + future value.

- Choose the next period state $x'$ to maximize: current return $F_t(x,x')$ plus continuation value $V_{t+1}(x')$
- This reduces a $T$-period problem to a sequence of 2-period problems
- $V_{t+1}(x')$ summarizes all future consequences of choosing $x'$ today
- Note that we do not assume the existence of an optimal sequence here

## L07-S14 — Bellman Equation: Proof Sketch

> PDF pages: 14
> Section: Recursive Formulation and Dynamic Programming

Fix $t=0,1,\ldots,T-1$ and a state $x$.

- First, we prove that

  $$
  V_t(x)\geq\sup_{x'\in\Gamma_t(x)}\left\{F_t(x,x')+V_{t+1}(x')\right\}
  $$

  1. For any admissible sequence $(x,x_{t+1},\ldots,x_T)$, show that

     $$
     V_t(x)\geq F_t(x,x_{t+1})+\sum_{s=t+1}^{T-1}F_s(x_s,x_{s+1})
     $$

  2. Taking the supremum over $(x_{t+2},\ldots,x_T)$ gives $V_t(x)\geq F_t(x,x_{t+1})+V_{t+1}(x_{t+1})$
  3. Taking the supremum again over $x_{t+1}$ proves the result

- Next, we prove that

  $$
  V_t(x)\leq\sup_{x'\in\Gamma_t(x)}\left\{F_t(x,x')+V_{t+1}(x')\right\}
  $$

  1. For any $\epsilon>0$, let $(x,x_{t+1},\ldots,x_T)$ be an admissible sequence such that

     $$
     V_t(x)\leq F_t(x,x_{t+1})+\sum_{s=t+1}^{T-1}F_s(x_s,x_{s+1})+\epsilon
     $$

  2. Show that $\sum_{s=t+1}^{T-1}F_s(x_s,x_{s+1})\leq V_{t+1}(x_{t+1})$
  3. Taking the supremum over $x_{t+1}$ and taking the limit as $\epsilon\to0$ completes the proof

## L07-S15 — Backward Induction

> PDF pages: 15
> Section: Recursive Formulation and Dynamic Programming

- Using the Bellman equation, we can compute the value function through backward induction.
- In the last period, $V_{T-1}(x)=\sup_{x'\in\Gamma_{T-1}(x)}F_{T-1}(x,x')$. This is a static optimization problem. Solving this problem gives: (1) the value at $T-1$ as a function of $x_{T-1}$, and (2) the optimal $x_T$ as a function of $x_{T-1}$.
- Then, for each $t=0,1,\ldots,T-2$, we can solve for $V_t(x)$ and obtain the optimal $x_{t+1}$ as a function of $x_t$:

  $$
  V_t(x)=\sup_{x'\in\Gamma_t(x)}\left\{F_t(x,x')+V_{t+1}(x')\right\}
  $$

- Given $x_0$, we can also obtain an admissible sequence by solving these Bellman equations.
- The question is: is this sequence our solution?

## L07-S16 — Principle of Optimality

> PDF pages: 16
> Section: Recursive Formulation and Dynamic Programming

**Principle of Optimality.** The sequence $(x_1,\ldots,x_T)$ is a solution to $V_0(x_0)$ if and only if for all $t=0,1,\ldots,T-1$, $x_{t+1}$ is a solution to

$$
\sup_{x'\in\Gamma_t(x_t)}\left\{F_t(x_t,x')+V_{t+1}(x')\right\},
$$

where $V_T=0$.

This is the characterization theorem: it tells us exactly when a sequence is optimal.

## L07-S17 — Principle of Optimality: Proof Sketch

> PDF pages: 17
> Section: Recursive Formulation and Dynamic Programming

Proof:

- Let $(x_1,\ldots,x_T)$ be a solution to $V_0(x_0)$. The dynamic programming principle implies that $V_t(x_t)=\sum_{s=t}^{T-1}F_s(x_s,x_{s+1})$ for all $t=0,1,\ldots,T-1$. By definition of the value function and Bellman equation:

  $$
  F_t(x_t,x_{t+1})+V_{t+1}(x_{t+1})=V_t(x_t)=\sup_{x'\in\Gamma_t(x_t)}\left\{F_t(x_t,x')+V_{t+1}(x')\right\}
  $$

- Let $x_{t+1}$ be a solution to $\sup_{x'\in\Gamma_t(x_t)}\left\{F_t(x_t,x')+V_{t+1}(x')\right\}$ for all $t=0,1,\ldots,T-1$. Using $V_T(x_T)=0$, iterating on the Bellman equation gives

  $$
  \begin{aligned}
  V_0(x_0)&=F_0(x_0,x_1)+V_1(x_1)\\
  &=F_0(x_0,x_1)+F_1(x_1,x_2)+V_2(x_2)\\
  &=\ldots=\sum_{t=0}^{T-1}F_t(x_t,x_{t+1}).
  \end{aligned}
  $$

## L07-S18 — Outline

> PDF pages: 18
> Section: Alternative Formulation

1. Problem Description
2. Recursive Formulation and Dynamic Programming
3. Alternative Formulation
4. Examples

## L07-S19 — Problem Description

> PDF pages: 19
> Section: Alternative Formulation

An alternative (more general) formulation

$$
\begin{aligned}
\sup_{\{u_t\}_{t=0}^{T-1}}\quad &\sum_{t=0}^{T-1}F_t(x_t,u_t)\\
\text{s.t.}\quad
&u_t\in G_t(x_t)\\
&x_{t+1}=f_t(x_t,u_t)\\
&x_0\text{ given}
\end{aligned}
$$

- $u_t\in U$ is the control variable
- $F_t:X\times U\to\mathbb{R}$ is the instantaneous payoff function
- $G_t(x)$ is the feasible correspondence: $G_t:X\rightrightarrows U$
- $f_t:X\times U\to X$ gives the next period state

## L07-S20 — Value Function

> PDF pages: 20
> Section: Alternative Formulation

The value function is

$$
\begin{aligned}
V_t(x)&:=\sup_{\{u_s\}_{s=t}^{T-1}}\sum_{s=t}^{T-1}F_s(x_s,u_s),\\
\text{s.t.}\quad &u_s\in G_s(x_s)\text{ for all }s=t,\ldots,T-1\\
&x_{s+1}=f_s(x_s,u_s)\text{ for all }s=t,\ldots,T-1\\
&x_t=x
\end{aligned}
$$

## L07-S21 — Dynamic Programming Theorems

> PDF pages: 21
> Section: Alternative Formulation

**Dynamic Programming Principle.** If a control sequence $(u_0,u_1,\ldots,u_{T-1})$ with induced states $(x_1,x_2,\ldots,x_T)$ is a solution to problem $V_0(x_0)$, then for any $t=1,2,\ldots,T-1$, $(u_t,\ldots,u_{T-1})$ is a solution to problem $V_t(x_t)$.

**Bellman Equation.** For all $t=0,1,\ldots,T-1$, we have

$$
V_t(x)=\sup_{u\in G_t(x)}\left\{F_t(x,u)+V_{t+1}(f_t(x,u))\right\}.
$$

**Principle of Optimality.** The control sequence $(u_0,\ldots,u_{T-1})$ with induced states $(x_1,x_2,\ldots,x_T)$ is a solution to $V_0(x_0)$ if and only if for all $t=0,1,\ldots,T-1$, $u_t$ is a solution to

$$
\sup_{u\in G_t(x_t)}\left\{F_t(x_t,u)+V_{t+1}(f_t(x_t,u))\right\},
$$

where $x_{t+1}=f_t(x_t,u_t)$.

## L07-S22 — Outline

> PDF pages: 22
> Section: Examples

1. Problem Description
2. Recursive Formulation and Dynamic Programming
3. Alternative Formulation
4. Examples

## L07-S23 — Cake Eating Problem

> PDF pages: 23
> Section: Examples

- Consider again the cake eating problem with CRRA utility and $T=3$
- The Bellman equation is

  $$
  V_t(x_t)=\max_{x_{t+1}\in[0,x_t]}\left\{\beta^t\frac{(x_t-x_{t+1})^{1-\gamma}}{1-\gamma}+V_{t+1}(x_{t+1})\right\}
  $$

- We use $\max$ here because the optimum exists (continuous function on compact set)
- Solve it via backward induction

## L07-S24 — Cake Eating Problem

> PDF pages: 24
> Section: Examples

- When $t=2$:

  $$
  V_2(x_2)=\max_{x_3\in[0,x_2]}\beta^2\frac{(x_2-x_3)^{1-\gamma}}{1-\gamma}=\beta^2\frac{x_2^{1-\gamma}}{1-\gamma}
  $$

  and the optimal policy is $x_3=0$: eat everything remaining (no reason to save)

- When $t=1$:

  $$
  \begin{aligned}
  V_1(x_1)&=\max_{x_2\in[0,x_1]}\left\{\beta\frac{(x_1-x_2)^{1-\gamma}}{1-\gamma}+\beta^2\frac{x_2^{1-\gamma}}{1-\gamma}\right\}\\
  &=\frac{x_1^{1-\gamma}}{1-\gamma}\frac{\beta}{(1+\beta^{\frac{1}{\gamma}})^{-\gamma}}
  \end{aligned}
  $$

  with $x_2=x_1/(1+\beta^{-\frac{1}{\gamma}})$

- When $t=0$:

  $$
  V_0(x_0)=\max_{x_1\in[0,x_0]}\left\{\frac{(x_0-x_1)^{1-\gamma}}{1-\gamma}+\frac{\beta}{(1+\beta^{\frac{1}{\gamma}})^{-\gamma}}\frac{x_1^{1-\gamma}}{1-\gamma}\right\}
  $$

  which can be solved although a bit tedious

## L07-S25 — Exercises

> PDF pages: 25
> Section: Examples

- Let $\Gamma_0(x_0):=[0,x_0^4+2x_0+3]$, $\Gamma_1(x_1):=\left[\frac{x_1}{2},x_1^2+x_1\right]$, and $\Gamma_2(x_2):=\left[0,\frac{x_2^2+4}{x_2^2}\right]$
- Define $f(x_1,x_0):=2x_1x_0-x_1^2+x_1$, $g(x_2,x_1):=-\frac{1}{2x_2}+x_2x_1-\frac{x_2^2}{2}$, $h(x_3,x_2):=\sqrt{x_3}-\frac{x_3x_2}{2}$
- Consider the following problem

  $$
  \begin{aligned}
  \sup_{x_1,x_2,x_3}\quad &\left\{f(x_1,x_0)+g(x_2,x_1)+h(x_3,x_2)\right\}\\
  \text{s.t.}\quad &x_i\in\Gamma_{i-1}(x_{i-1})\text{ for all }i=1,2,3\\
  &x_0\geq0\text{ given}
  \end{aligned}
  $$

- This is a 3-stage problem with state-dependent constraint sets
- The payoff functions and feasibility constraints have different functional forms at each stage

## L07-S26 — Exercise

> PDF pages: 26
> Section: Examples

Stage 3:

- Compute $V_2(x_2)$

  $$
  V_2(x_2)=\sup_{y\in\Gamma_2(x_2)}h(y,x_2)=\sup_{y\in\Gamma_2(x_2)}\left\{\sqrt{y}-\frac{yx_2}{2}\right\}
  $$

- First-order condition:

  $$
  \frac{d}{dy}\left(\sqrt{y}-\frac{yx_2}{2}\right)=\frac{1}{2\sqrt{y}}-\frac{x_2}{2}=0
  $$

- Solving:

  $$
  \frac{1}{2\sqrt{y}}=\frac{x_2}{2}\implies y^*=\frac{1}{x_2^2}
  $$

- Check second order condition: $-\frac{1}{4y^{3/2}}<0$, so this is indeed a maximum
- Since $y^*\in\Gamma_2(x_2)$, $V_2(x_2)={\frac{1}{2x_2}}$

## L07-S27 — Exercise

> PDF pages: 27
> Section: Examples

Stage 2:

- Compute $V_1(x_1)$:

  $$
  \begin{aligned}
  V_1(x_1)&=\sup_{y\in\Gamma_1(x_1)}\left\{g(y,x_1)+V_2(y)\right\}\\
  &=\sup_{y\in\Gamma_1(x_1)}\left\{-\frac{1}{2y}+yx_1-\frac{y^2}{2}+\frac{1}{2y}\right\}
  \end{aligned}
  $$

- First-order condition gives $y^*=x_1$
- Second-order condition is $-1<0$
- Check feasibility: $y^*=x_1$ must satisfy $\frac{x_1}{2}\leq x_1\leq x_1^2+x_1$, which holds for $x_1\geq0$
- The value function is $V_1(x_1)=x_1^2/2$

## L07-S28 — Exercise

> PDF pages: 28
> Section: Examples

Stage 1:

- Compute $V_0(x_0)$:

  $$
  V_0(x_0)=\sup_{y\in\Gamma_0(x_0)}\left\{2yx_0+y-\frac{y^2}{2}\right\}
  $$

- First-order condition gives $y^*=2x_0+1$
- Second-order condition: $-1<0$
- Check feasibility: $2x_0+1\in[0,x_0^4+2x_0+3]$
- The value function is $V_0(x_0)=2x_0^2+2x_0+1/2$

The optimal policy is:

$$
\left(2x_0+1,2x_0+1,\frac{1}{(2x_0+1)^2}\right)
$$
