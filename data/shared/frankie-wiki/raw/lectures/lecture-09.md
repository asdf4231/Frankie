# Lecture 9 — Introduction to the Theory of Optimal Control

> Course: Dynamic Optimization
> Original: slides/lecture09-introduction_to_the_theory_of_optimal_control.tex
> PDF: slides/lecture09-introduction_to_the_theory_of_optimal_control.pdf
> Snapshot: v1
> PDF metadata: Title `Lecture 9: Introduction to the Theory of Optimal Control`; author `Junnan Zhang`; creator `LaTeX with Beamer class`; producer `pdfTeX-1.40.29`; 61 pages; PDF version 1.7; created and modified 2026-08-24 16:16:08 +08.
> Normalization notes: The exact course-defined macros `\RR`, `\X`, and `\Y` are expanded to $\mathbb{R}$, $\mathcal{X}$, and $\mathcal{Y}$ for Markdown rendering. Presentation-only Beamer syntax has otherwise been removed without correcting source wording or mathematics.

## L09-S01 — Lecture 9: Introduction to the Theory of Optimal Control

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Fall, 2026

## L09-S02 — Introduction to Continuous-Time Optimization

> PDF pages: 2

- This chapter presents a number of basic results in dynamic optimization in continuous time, particularly the so-called optimal control approach.
- Both dynamic optimization in discrete time and in continuous time are useful tools for macroeconomics and other areas of dynamic economic analysis.
- One approach is not superior to the other; instead, certain problems become simpler in discrete time while others are naturally formulated in continuous time.

## L09-S03 — Mathematical Challenges in Continuous-Time Optimization

> PDF pages: 3

- Continuous-time optimization introduces several new mathematical issues.
- This is largely because even with a finite horizon, the maximization is with respect to an infinite-dimensional object: we are maximizing over an entire function: $y : [t_0, t_1] \rightarrow \mathbb{R}$.

## L09-S04 — The Canonical Continuous-Time Optimization Problem

> PDF pages: 4

The canonical continuous-time optimization problem can be written as:

$$
\max_{x(t),y(t)} W(x(t), y(t)) \equiv \int_0^{t_1} f(t, x(t), y(t))dt
$$

subject to:

$$
\begin{aligned}
\dot{x}(t) &= G(t, x(t), y(t))\\
x(t) &\in \mathcal{X}(t), \quad y(t) \in \mathcal{Y}(t) \text{ for all } t\\
x(0) &= x_0
\end{aligned}
$$

where for each $t$, $x(t)$ and $y(t)$ are finite-dimensional vectors.

- For each $t$: $\mathcal{X}(t) \subset \mathbb{R}^{K_x}$ and $\mathcal{Y}(t) \subset \mathbb{R}^{K_y}$, where $K_x, K_y \in \mathbb{N}$.
- The vector $x$ denotes the **state variables**, which is governed by a system of differential equations, given the behavior of the vector of **control variables** $y$.
- The end of the planning horizon $t_1$ can be equal to infinity.

## L09-S05 — Outline

> PDF pages: 5
> Section: Variational Arguments

1. Variational Arguments
2. The Maximum Principle: A First Look
3. Infinite-Horizon Optimal Control
4. Discounted Infinite-Horizon Optimal Control

## L09-S06 — Special Case: One-Dimensional Problem

> PDF pages: 6
> Section: Variational Arguments

Consider the following special case where the horizon is finite and both the state and control variables are one dimensional:

$$
\max_{x(t),y(t),x_1} W(x(t), y(t)) \equiv \int_0^{t_1} f(t, x(t), y(t))dt
$$

subject to:

$$
\begin{aligned}
\dot{x}(t) &= g(t, x(t), y(t))\\
x(t) &\in \mathcal{X}, \quad y(t) \in \mathcal{Y} \text{ for all } t\\
x(0) &= x_0, \quad x(t_1) = x_1
\end{aligned}
$$

- The sets $\mathcal{X}(t)$ and $\mathcal{Y}(t)$ in the more general problem are now taken to be independent of time for simplicity. We assume that $\mathcal{X}$ and $\mathcal{Y}$ are nonempty and convex.
- Notice that there is also a terminal value constraint $x(t_1) = x_1$, but $x_1$ is included as an additional choice variable.

## L09-S07 — Admissible Pairs and Assumptions

> PDF pages: 7
> Section: Variational Arguments

- A pair of functions $(x(t), y(t))$ that satisfies the constraint and boundary conditions is referred to as an **admissible pair**.
- Throughout, as in the previous chapter, we suppose that the value of the objective function is finite. That is, $W(x(t), y(t)) < \infty$ for any admissible pair $(x(t), y(t))$.
- Let us first suppose that $t_1 < \infty$, so that we have a finite-horizon optimization problem.
- Assume that $f$ and $g$ are continuously differentiable.

## L09-S08 — Key Challenges in Characterizing Solutions

> PDF pages: 8
> Section: Variational Arguments

The challenge in characterizing the optimal solution to this problem lies in two features:

1. We are choosing a function $y : [0, t_1] \rightarrow \mathcal{Y}$ rather than a vector or a finite-dimensional object.
2. The constraint takes the form of a differential equation rather than a set of inequalities or equalities.

These features make it difficult for us to know what type of optimal policy to look for:

- $y$ may be a highly discontinuous function.
- It may also hit the boundary of the feasible set, thus corresponding to a corner solution.

## L09-S09 — The Variational Approach

> PDF pages: 9
> Section: Variational Arguments

Fortunately, in most economic problems

- There is enough structure to make solutions continuous functions.
- The Inada conditions ensure that solutions lie in the interior of the feasible set.

Then, it can be characterized by using variational arguments:

- First assume that there exists a continuous solution (function) $\hat{y}$ that lies everywhere in the interior of the set $\mathcal{Y}$.
- Then give necessary conditions

## L09-S10 — Formal Setup for Variational Approach

> PDF pages: 10
> Section: Variational Arguments

More formally, let us assume that $(\hat{x}(t), \hat{y}(t))$ is an admissible pair such that:

- $\hat{y}(\cdot)$ is continuous on $[0, t_1]$
- $(\hat{x}(t), \hat{y}(t)) \in \text{Int } \mathcal{X} \times \text{Int } \mathcal{Y}$

And that we have:

$$
W(\hat{x}(t), \hat{y}(t)) \geq W(x(t), y(t))
$$

for any other admissible pair $(x(t), y(t))$.

- Continuous and interior solution is a strong assumption
- When $y(t)$ is continuous, $\dot{x}(t)$ will also be continuous, and $x(t)$ is continuously differentiable.

## L09-S11 — Constructing Variations

> PDF pages: 11
> Section: Variational Arguments

- Take an arbitrary fixed continuous function $\eta(t)$ and let $\varepsilon \in \mathbb{R}$ be a real number. Then a variation of the function $\hat{y}(t)$ is defined by $y(t, \varepsilon) \equiv \hat{y}(t) + \varepsilon\eta(t)$.
- Let us also define $x(t, \varepsilon)$ as the path of the state variable corresponding to the path of control variable $y(t, \varepsilon)$ with $x(0, \varepsilon) = x_0$.
- Since $(\hat{x}(t), \hat{y}(t))$ is interior and continuous on a compact set, we can always find $\varepsilon \in [-\varepsilon_\eta, \varepsilon_\eta]$ such that $(x(t, \varepsilon), y(t, \varepsilon))$ is an admissible pair.

## L09-S12 — Optimality Condition

> PDF pages: 12
> Section: Variational Arguments

- Define:

  $$
  W(\varepsilon) \equiv W(x(t, \varepsilon), y(t, \varepsilon)) = \int_0^{t_1} f(t, x(t, \varepsilon), y(t, \varepsilon))dt
  $$

- Since $\hat{y}(t)$ is optimal , we have: $W(\varepsilon) \leq W(0) \text{ for all } \varepsilon \in [-\varepsilon_\eta, \varepsilon_\eta]$
- Rewrite the differential equation constraint: $g(t, x(t, \varepsilon), y(t, \varepsilon)) - \dot{x}(t, \varepsilon) = 0$ for all $t \in [0, t_1]$.
- Thus for any function $\lambda : [0, t_1] \rightarrow \mathbb{R}$, we have:

  $$
  \int_0^{t_1} \lambda(t)[g(t, x(t, \varepsilon), y(t, \varepsilon)) - \dot{x}(t, \varepsilon)] dt = 0
  $$

- Adding the constraint equation to the objective function yields:

  $$
  W(\varepsilon) = \int_0^{t_1} \{f(t, x(t, \varepsilon), y(t, \varepsilon)) + \lambda(t)[g(t, x(t, \varepsilon), y(t, \varepsilon)) - \dot{x}(t, \varepsilon)]\}dt
  $$

## L09-S13 — First-Order Necessary Condition

> PDF pages: 13
> Section: Variational Arguments

- We can integrate $\int_0^{t_1}\lambda(t) \dot x(t, \varepsilon) dt$ by part to obtain

  $$
  \int_0^{t_1}\lambda(t) \dot x(t, \varepsilon) dt = \lambda(t_1)x(t_1, \varepsilon) - \lambda(0)x_0 - \int_0^{t_1}\dot\lambda(t)x(t, \varepsilon)dt
  $$

- Substituting this back to $W(\varepsilon)$ and differentiating $W(\varepsilon)$ with respect to $\varepsilon$ gives:

  $$
  \begin{aligned}
  W'(\varepsilon) \equiv {}&\int_0^{t_1} [f_x(t, x(t, \varepsilon), y(t, \varepsilon)) + \lambda(t)g_x(t, x(t, \varepsilon), y(t, \varepsilon)) + \dot{\lambda}(t)]x_\varepsilon(t, \varepsilon)dt\\
  &+\int_0^{t_1} [f_y(t, x(t, \varepsilon), y(t, \varepsilon)) + \lambda(t)g_y(t, x(t, \varepsilon), y(t, \varepsilon))]\eta(t)dt - \lambda(t_1)x_\varepsilon(t_1, \varepsilon)
  \end{aligned}
  $$

- Consequently, optimality requires that:

  $$
  W'(0) = 0 \textbf{ for all } \eta(t)
  $$

## L09-S14 — First-Order Necessary Condition

> PDF pages: 14
> Section: Variational Arguments

- Evaluate $W'(\varepsilon)$ at $\varepsilon = 0$ to obtain:

  $$
  \begin{aligned}
  W'(0) \equiv {}&\int_0^{t_1} [f_x(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_x(t, \hat{x}(t), \hat{y}(t)) + \dot{\lambda}(t)]x_\varepsilon(t, 0)dt\\
  &+\int_0^{t_1} [f_y(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_y(t, \hat{x}(t), \hat{y}(t))]\eta(t)dt - \lambda(t_1)x_\varepsilon(t_1, 0)
  \end{aligned}
  $$

- Since it applies for any continuously differentiable $\lambda(t)$ function, let us consider the function $\lambda(t)$ that is a solution to the differential equation:

  $$
  \dot{\lambda}(t) = -[f_x(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_x(t, \hat{x}(t), \hat{y}(t))]
  $$

  with boundary condition $\lambda(t_1) = 0$. This equation has a solution when $f_x$ and $g_x$ are continuous.
- Defining $\lambda(t)$ in this way allows us to isolate the effect of variations in the control variable $y(t)$

## L09-S15 — First-Order Necessary Condition

> PDF pages: 15
> Section: Variational Arguments

- Since $\eta(t)$ is arbitrary, $\lambda(t)$ and $(\hat{x}(t), \hat{y}(t))$ need to be such that:

  $$
  f_y(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_y(t, \hat{x}(t), \hat{y}(t)) = 0 \text{ for all } t \in [0, t_1]
  $$

- Otherwise, there would exist some $\eta(t)$ that would make the following integral nonzero, contradicting optimality

  $$
  \int_0^{t_1} [f_y(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_y(t, \hat{x}(t), \hat{y}(t))]\eta(t)dt
  $$

- This argument establishes the necessary conditions for $(\hat{x}(t), \hat{y}(t))$ to be an interior continuous solution

## L09-S16 — Necessary Conditions: Free Terminal Value

> PDF pages: 16
> Section: Variational Arguments

**Theorem 7.1 (Necessary Conditions).** Consider the problem of maximizing

$$
\max_{x(t),y(t),x_1} W(x(t), y(t)) \equiv \int_0^{t_1} f(t, x(t), y(t))dt
$$

subject to $\dot{x}(t) = g(t, x(t), y(t))$ and $x(t) \in \mathcal{X}$, $y(t) \in \mathcal{Y}$ for all $t$, $x(0) = x_0$ and $x(t_1) = x_1$, with $f$ and $g$ continuously differentiable. Suppose that this problem has an interior continuous solution $(\hat{x}(t), \hat{y}(t)) \in \text{Int } \mathcal{X} \times \text{Int } \mathcal{Y}$. Then there exists a continuously differentiable costate function $\lambda(\cdot)$ defined on $t \in [0, t_1]$ such that the following are satisfied

1. $\dot{x}(t) = g(t, x(t), y(t))$
2. $\dot{\lambda}(t) = -[f_x(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_x(t, \hat{x}(t), \hat{y}(t))]$
3. $f_y(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_y(t, \hat{x}(t), \hat{y}(t)) = 0$
4. $\lambda(t_1) = 0$

## L09-S17 — The Transversality Condition

> PDF pages: 17
> Section: Variational Arguments

- The condition that $\lambda(t_1) = 0$ is the **transversality condition** of continuous-time optimization problems.
- It is naturally related to the transversality condition we encountered in the discrete-time case.
- Intuitively, this condition captures the fact that after the planning horizon, there is no value to having more (or less) $x$.

## L09-S18 — Alternative Formulation: Fixed Terminal Value

> PDF pages: 18
> Section: Variational Arguments

**Theorem 7.2 (Necessary Conditions II).** Consider the problem of maximizing

$$
\max_{x(t),y(t)} W(x(t), y(t)) \equiv \int_0^{t_1} f(t, x(t), y(t))dt
$$

subject to $\dot{x}(t) = g(t, x(t), y(t))$ and $x(t) \in \mathcal{X}$, $y(t) \in \mathcal{Y}$ for all $t$, $x(0) = x_0$ and $x(t_1) = x_1$, with $f$ and $g$ continuously differentiable. Suppose that this problem has an interior continuous solution $(\hat{x}(t), \hat{y}(t)) \in \text{Int } \mathcal{X} \times \text{Int } \mathcal{Y}$. Then there exists a continuously differentiable costate function $\lambda(\cdot)$ defined over $t \in [0, t_1]$ such that the following are satisfied:

1. $\dot{x}(t) = g(t, x(t), y(t))$
2. $\dot{\lambda}(t) = -[f_x(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_x(t, \hat{x}(t), \hat{y}(t))]$
3. $f_y(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_y(t, \hat{x}(t), \hat{y}(t)) = 0$

The transversality condition $\lambda(t_1) = 0$ is no longer present, but instead the terminal value of the state variable $x$ is specified as part of the constraints.

## L09-S19 — Example 7.1

> PDF pages: 19
> Section: Variational Arguments

Consider the utility-maximizing problem of a consumer living between two dates, 0 and 1:

$$
\begin{aligned}
\max_{[c(t),a(t)]_{t=0}^1} &\int_0^1 \exp(-\rho t)u(c(t))dt\\
\text{s.t. } \dot{a}(t) &= ra(t) + w - c(t)\\
a(t) &\geq 0
\end{aligned}
$$

with the initial value of $a(0) > 0$. In this problem:

- Assume $u : \mathbb{R}_+ \rightarrow \mathbb{R}$ is strictly increasing, continuously differentiable, and strictly concave
- Consumption is the control variable
- The asset holdings of the individual are the state variable

## L09-S20 — Example 7.1

> PDF pages: 20
> Section: Variational Arguments

- To be able to apply Theorem 7.2, we need a terminal condition for $a(t)$. The economics of the problem implies that $a(1) = 0$.
- Theorem 7.2 provides the following necessary conditions for an interior continuous solution: there exists a continuously differentiable costate variable $\lambda(t)$ that satisfies
  - a consumption Euler equation

    $$
    \exp(-\rho t)u'(\hat{c}(t)) = \lambda(t) \tag{7.14}
    $$

  - a differential equation

    $$
    \dot{\lambda}(t) = -r\lambda(t) \tag{7.15}
    $$

- Using (7.15) and differentiating the first-order condition (7.14) yields a differential equation in consumption.
- We can also integrate (7.15) to obtain $\lambda(t) = \lambda(0) \exp(-rt)$. Combining this equation with (7.14) yields the optimal consumption: $\hat{c}(t) = u'^{-1}[\lambda(0) \exp((\rho - r)t)]$

## L09-S21 — Example 7.1: Consumption Patterns

> PDF pages: 21
> Section: Variational Arguments

This equation implies different consumption patterns depending on the relationship between $\rho$ and $r$:

- When $\rho = r$, so that the discount factor and the rate of return on assets are equal, the individual will have a constant consumption profile.
- When $\rho > r$, the fact that $u'^{-1}$ is decreasing over time implies that consumption must be declining: a front-loaded consumption profile.
- When $\rho < r$, the opposite reasoning applies, and she chooses a back-loaded consumption profile.

## L09-S22 — Example 7.1: Determining Initial Consumption

> PDF pages: 22
> Section: Variational Arguments

- The only variable left to determine to completely characterize the consumption profile is the initial value of the costate variable (and thus the initial value of consumption).
- This comes from the observation that the individual will run down all her assets by the end of her planning horizon, that is, $a(1) = 0$.
- Using the consumption rule, we have:
  $\dot{a}(t) = ra(t) + w - u'^{-1}[\lambda(0) \exp((\rho - r)t)]$
- The initial value of the costate variable, $\lambda(0)$, then has to be chosen such that $a(1) = 0$.

## L09-S23 — Example 7.1: Applying Theorem 7.1?

> PDF pages: 23
> Section: Variational Arguments

- It may at first appear that Theorem 7.1 is more convenient to use than Theorem 7.2.
- The first-order necessary conditions still give: $\lambda(t) = \lambda(0) \exp(-rt)$. However, since $\lambda(1) = 0$, this equation holds only if $\lambda(t) = 0$ for all $t \in [0, 1]$.
- But $\exp(-\rho t)u'(\hat{c}(t)) = \lambda(t)$, which cannot be satisfied since $u' > 0$.
- Theorem 7.1 cannot be applied to this problem, because there is an additional constraint that $a(t) \geq 0$.

## L09-S24 — Inequality Terminal Constraints

> PDF pages: 24
> Section: Variational Arguments

**Theorem 7.3 (Necessary Conditions III).** Consider the problem of maximizing

$$
\max_{x(t),y(t)} W(x(t), y(t)) \equiv \int_0^{t_1} f(t, x(t), y(t))dt
$$

subject to $\dot{x}(t) = g(t, x(t), y(t))$, $(x(t), y(t)) \in \mathcal{X} \times \mathcal{Y}$ for all $t$, $x(0) = x_0$, and $x(t_1) \geq x_1$, with $f$ and $g$ continuously differentiable.

Suppose that this problem has an interior continuous solution $(\hat{x}(t), \hat{y}(t)) \in \text{Int } \mathcal{X} \times \text{Int } \mathcal{Y}$. Then there exists a continuously differentiable costate function $\lambda(\cdot)$ defined over $t \in [0, t_1]$ such that the following are satisfied

1. $\dot{x}(t) = g(t, x(t), y(t))$
2. $\dot{\lambda}(t) = -[f_x(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_x(t, \hat{x}(t), \hat{y}(t))]$
3. $f_y(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_y(t, \hat{x}(t), \hat{y}(t)) = 0$
4. $\lambda(t_1) \geq 0$
5. $\lambda(t_1)(x(t_1) - x_1) = 0$ \quad (*Complementary slackness condition*)

## L09-S25 — Outline

> PDF pages: 25
> Section: The Maximum Principle: A First Look

1. Variational Arguments
2. The Maximum Principle: A First Look
3. Infinite-Horizon Optimal Control
4. Discounted Infinite-Horizon Optimal Control

## L09-S26 — The Hamiltonian Function

> PDF pages: 26
> Section: The Maximum Principle: A First Look

- By analogy with the Lagrangian, we can express the results more economically by constructing the Hamiltonian:

  $$
  H(t, x(t), y(t), \lambda(t)) \equiv f(t, x(t), y(t)) + \lambda(t)g(t, x(t), y(t))
  $$

- We often write $H(t, x, y, \lambda)$ for the Hamiltonian to simplify notation
- Since $f$ and $g$ are continuously differentiable, so is $H$
- We denote the partial derivatives of the Hamiltonian with respect to $x(t)$, $y(t)$, and $\lambda(t)$ by $H_x$, $H_y$, and $H_\lambda$, respectively

## L09-S27 — Theorem 7.4: Simplified Maximum Principle (Part 1)

> PDF pages: 27
> Section: The Maximum Principle: A First Look

**Theorem 7.4 (Simplified Maximum Principle).** Consider the problem of maximizing

$$
\max_{x(t),y(t),x_1} W(x(t), y(t)) \equiv \int_0^{t_1} f(t, x(t), y(t))dt
$$

subject to $\dot{x}(t) = g(t, x(t), y(t))$ and $x(t) \in \mathcal{X}$, $y(t) \in \mathcal{Y}$ for all $t$, $x(0) = x_0$ and $x(t_1) = x_1$, with $f$ and $g$ continuously differentiable. Suppose that this problem has an interior continuous solution $(\hat{x}(t), \hat{y}(t)) \in \text{Int } \mathcal{X} \times \text{Int } \mathcal{Y}$. Then there exists a continuously differentiable function $\lambda(t)$ such that the optimal control $\hat{y}(t)$ and the corresponding path of the state variable $\hat{x}(t)$ satisfy the following necessary conditions:

$$
\begin{aligned}
H_y(t, \hat{x}(t), \hat{y}(t), \lambda(t)) &= 0\\
\dot{\lambda}(t) &= -H_x(t, \hat{x}(t), \hat{y}(t), \lambda(t))\\
\dot{x}(t) &= H_\lambda(t, \hat{x}(t), \hat{y}(t), \lambda(t))
\end{aligned}
$$

for all $t \in [0, t_1]$ with $x(0) = x_0$ and $\lambda(t_1) = 0$. Moreover, the Hamiltonian $H(t, x, y, \lambda)$ also satisfies the Maximum Principle that $H(t, \hat{x}(t), \hat{y}(t), \lambda(t)) \geq H(t, \hat{x}(t), y, \lambda(t))$ for all $y \in \mathcal{Y}$ for all $t \in [0, t_1]$.

## L09-S28 — Key Features of the Maximum Principle

> PDF pages: 28
> Section: The Maximum Principle: A First Look

1. As in the usual constrained maximization problems, a solution is characterized jointly with a set of "multipliers" $\lambda(t)$, and the optimal path of the control and state variables, $\hat{y}(t)$ and $\hat{x}(t)$
2. The costate variable $\lambda(t)$ is informative about the value of relaxing the constraint (at time $t$). In particular, $\lambda(t)$ is the value of an infinitesimal increase in $x(t)$ at time $t$
3. With this interpretation, it makes sense that $\lambda(t_1) = 0$ is part of the necessary conditions. After the planning horizon, there is no value to having more (or less) $x$. This is therefore the finite-horizon equivalent of the transversality condition in the previous chapter

## L09-S29 — Limitations of Necessary Conditions

> PDF pages: 29
> Section: The Maximum Principle: A First Look

- Theorem 7.4 gives necessary conditions for an interior continuous solution. However, we do not know whether such a solution exists
- Moreover, these necessary conditions may characterize a stationary point rather than a maximum or simply a local rather than a global maximum
- Sufficiency is again guaranteed by imposing concavity

## L09-S30 — Mangasarian's Sufficiency Conditions

> PDF pages: 30
> Section: The Maximum Principle: A First Look

**Theorem 7.5 (Mangasarian's Sufficiency Conditions).** Consider the same problem as above. Suppose that an interior continuous pair $(\hat{x}(t), \hat{y}(t)) \in \text{Int } \mathcal{X} \times \text{Int } \mathcal{Y}$ exists and satisfies the necessary conditions from Theorem 7.4. Suppose also that $\mathcal{X} \times \mathcal{Y}$ is a convex set and given the resulting costate variable $\lambda(t)$, $H(t, x, y, \lambda)$ is jointly concave in $(x, y) \in \mathcal{X} \times \mathcal{Y}$ for all $t \in [0, t_1]$. Then the pair $(\hat{x}(t), \hat{y}(t))$ achieves the global maximum of the objective function. Moreover, if $H(t, x, y, \lambda)$ is strictly concave in $(x, y)$ for all $t \in [0, t_1]$, then the pair $(\hat{x}(t), \hat{y}(t))$ is the unique solution.

## L09-S31 — Arrow's Sufficiency Conditions

> PDF pages: 31
> Section: The Maximum Principle: A First Look

Define the maximized Hamiltonian:

$$
M(t, x(t), \lambda(t)) \equiv \max_{y \in \mathcal{Y}} H(t, x(t), y, \lambda(t))
$$

**Theorem 7.6 (Arrow's Sufficiency Conditions).** Consider the problem as above and suppose that an interior continuous pair $(\hat{x}(t), \hat{y}(t)) \in \text{Int } \mathcal{X} \times \text{Int } \mathcal{Y}$ exists and satisfies the necessary conditions. Given the resulting costate variable $\lambda(t)$, if $\mathcal{X}$ is a convex set and $M(t, x, \lambda)$ is concave in $x \in \mathcal{X}$ for all $t \in [0, t_1]$, then $(\hat{x}(t), \hat{y}(t))$ achieves the global maximum of the objective function. Moreover, if $M(t, x, \lambda)$ is strictly concave in $x$ for all $t \in [0, t_1]$, then the pair $(\hat{x}(t), \hat{y}(t))$ is the unique solution.

Theorem 7.6 weakens the concavity condition in Theorem 7.5 that $H(t, x, y, \lambda)$ is jointly concave in $(x, y)$.

## L09-S32 — Implications of Sufficiency Results

> PDF pages: 32
> Section: The Maximum Principle: A First Look

- One difficulty is verifying the concavity conditions in Theorem 7.5 and Theorem 7.6
- Nevertheless, in many economically interesting situations, we can ascertain that the costate variable $\lambda(t)$ is everywhere nonnegative, for example, when $f_y(t, \hat{x}(t), \hat{y}(t)) > 0$ and $g_y(t, \hat{x}(t), \hat{y}(t)) < 0$
- Once we know that $\lambda(t)$ is nonnegative, $H = f + \lambda g$ is concave if $f$ and $g$ are both concave

## L09-S33 — Example

> PDF pages: 33
> Section: The Maximum Principle: A First Look

Solve the problem:

$$
\begin{aligned}
\max\quad &\int_0^T \left[1 - tx(t) - u^2(t)\right]dt\\
\text{s.t. } &\dot x(t) = u(t),\, x(0) = x_0 > 0,\, u(t) \in \mathbb{R}
\end{aligned}
$$

- The Hamiltonian is $H(t, x, u, \lambda) = 1 - tx - u^2 + \lambda u$, which is concave in $(x, u)$
- By the Maximum Principle, the following necessary conditions are satisfies:

  $$
  \begin{aligned}
  H_u &= -2\hat u(t) + \lambda(t) = 0\\
  \dot \lambda(t) &= - H_x = t,\, \lambda(T) = 0\\
  \dot x(t) &= u(t),\, x(0) = x_0
  \end{aligned}
  $$

- Solution satisfies: $\lambda(t) = t^2/2 - T^2/2$, $\hat u(t) = t^2/4 - T^2/4$, and $\hat x(t) = t^3/12 - T^2t/4 + x_0$

## L09-S34 — Outline

> PDF pages: 34
> Section: Infinite-Horizon Optimal Control

1. Variational Arguments
2. The Maximum Principle: A First Look
3. Infinite-Horizon Optimal Control
4. Discounted Infinite-Horizon Optimal Control

## L09-S35 — Infinite-Horizon Problems

> PDF pages: 35
> Section: Infinite-Horizon Optimal Control

- The results presented so far are most useful in developing an intuition for how dynamic optimization in continuous time works.
- Most economic problems---including almost all growth models---are more naturally formulated as infinite-horizon problems.
- In this section, we provide necessary and sufficient conditions for optimality in infinite-horizon optimal control problems.

## L09-S36 — Generalize the Terminal Value Constraint

> PDF pages: 36
> Section: Infinite-Horizon Optimal Control

- Throughout this chapter, let $b : \mathbb{R}_+ \to \mathbb{R}_+$, such that $\lim_{t \to \infty} b(t)$ exists and is finite.
- The terminal value condition is $\lim_{t \to \infty} b(t)x(t) \geq x_1$ for some $x_1 \in \mathbb{R}$.
- The special case where $b(t) \equiv 1$ gives us the terminal value constraint as $\lim_{t \to \infty} x(t) \geq x_1$ and is sufficient in many applications.

## L09-S37 — The Infinite-Horizon Optimal Control Problem

> PDF pages: 37
> Section: Infinite-Horizon Optimal Control

Using the same notation as above, the infinite-horizon optimal control problem is:

$$
\begin{aligned}
\max_{x(t),y(t)} W(x(t), y(t)) &\equiv \int_0^{\infty} f(t, x(t), y(t))dt \tag{7.32}\\
\text{subject to }\quad \dot{x}(t) &= g(t, x(t), y(t)), \tag{7.33}\\
x(t)\in \mathcal{X},\, y(t) \in \mathcal{Y} \text{ for all } t,\, x(0) &= x_0 \text{ and } \lim_{t \to \infty} b(t)x(t) \geq x_1. \tag{7.34}
\end{aligned}
$$

## L09-S38 — Key Differences from Finite-Horizon Case

> PDF pages: 38
> Section: Infinite-Horizon Optimal Control

- The main difference is that now time runs to infinity.
- This problem allows for an implicit choice over the endpoint $x_1$, since there is no terminal date. The last part of (7.34) imposes a lower bound on this endpoint.
- $\mathcal{X}$ and $\mathcal{Y}$ need not be bounded sets.
- An admissible pair $(x(t), y(t))$ is defined in the same way as above, except that $y(t)$ can now be a piecewise continuous function.

## L09-S39 — The Value Function

> PDF pages: 39
> Section: Infinite-Horizon Optimal Control

Define the value function, which is the analogue of the value function in discrete-time dynamic programming introduced in the previous chapter:

$$
V(t_0, x(t_0)) = \sup_{(x(t),y(t)) \in \mathcal{X} \times \mathcal{Y}} \int_{t_0}^{\infty} f(t, x(t), y(t))dt \tag{7.35}
$$

subject to $\dot{x}(t) = g(t, x(t), y(t))$ and $\lim_{t \to \infty} b(t)x(t) \geq x_1$.

- $V(t_0, x(t_0))$ gives the optimal value starting at time $t_0$ with state variable $x(t_0)$.
- $V(t_0, x(t_0)) \geq \int_{t_0}^{\infty} f(t, x(t), y(t))dt$ for any admissible pair $(x(t), y(t))$.
- When $(\hat{x}(t), \hat{y}(t))$ is optimal, then $V(t_0, x(t_0)) = \int_{t_0}^{\infty} f(t, \hat{x}(t), \hat{y}(t))dt$.

## L09-S40 — Principle of Optimality

> PDF pages: 40
> Section: Infinite-Horizon Optimal Control

**Lemma 7.1 (Principle of Optimality).** Suppose that the pair $(\hat{x}(t), \hat{y}(t))$ is a solution to (7.32) subject to (7.33) and (7.34), that is, it reaches the maximum value $V(t_0, x(t_0))$. Then

$$
\begin{aligned}
V(t_0, x(t_0)) &= \int_{t_0}^{t_1} f(t, \hat{x}(t), \hat{y}(t))dt + V(t_1, \hat{x}(t_1)) \tag{7.38}\\
&= \max_{y(t) \in \mathcal{Y}} \left\{ \int_{t_0}^{t_1} f(t, x(t), y(t))dt + V(t_1, x(t_1)) \right\}
\end{aligned}
$$

for all $t_1 \geq t_0$, where in the second equation the trajectory of $x(t)$ is given by $\dot x(t) = g(t, x(t), y(t))$.

- Analogous to the Principle of Optimality in dynamic programming
- Discounting is embedded in $f$

## L09-S41 — Infinite-Horizon Maximum Principle

> PDF pages: 41
> Section: Infinite-Horizon Optimal Control

**Theorem 7.9 (Infinite-Horizon Maximum Principle).** Suppose that the problem of maximizing (7.32) subject to (7.33) and (7.34), with $f$ and $g$ continuously differentiable, has a piecewise continuous interior solution $(\hat{x}(t), \hat{y}(t)) \in \text{Int } \mathcal{X} \times \text{Int } \mathcal{Y}$. Let $H(t, x(t), y(t), \lambda(t)) \equiv f(t, x(t), y(t)) + \lambda(t)g(t, x(t), y(t))$. Then given $(\hat{x}(t), \hat{y}(t))$, the Hamiltonian $H(t, x, y, \lambda)$ satisfies the Maximum Principle:

$$
H(t, \hat{x}(t), \hat{y}(t), \lambda(t)) \geq H(t, \hat{x}(t), y(t), \lambda(t))
$$

for all $y(t) \in \mathcal{Y}$ and for all $t \in \mathbb{R}_+$. Moreover, for all $t \in \mathbb{R}_+$ for which $\hat{y}(t)$ is continuous, the following necessary conditions are satisfied:

$$
H_y(t, \hat{x}(t), \hat{y}(t), \lambda(t)) = 0, \tag{7.39}
$$

$$
\dot{\lambda}(t) = -H_x(t, \hat{x}(t), \hat{y}(t), \lambda(t)), \tag{7.40}
$$

and

$$
\dot{x}(t) = H_\lambda(t, \hat{x}(t), \hat{y}(t), \lambda(t)), \text{ with } x(0) = x_0 \text{ and } \lim_{t \to \infty} b(t)x(t) \geq x_1. \tag{7.41}
$$

## L09-S42 — Remarks on Theorem 7.9

> PDF pages: 42
> Section: Infinite-Horizon Optimal Control

- Theorem 7.9 can be viewed as stronger than the theorems presented in the discrete time case, especially since it does not impose compactness-type conditions.
- Nevertheless, this theorem only applies when the maximization problem has a piecewise continuous solution $\hat{y}(t)$.
- Economic problems often have enough structure to ensure that $\hat{y}(t)$ is indeed a continuous function of $t$. Consequently, in most economic problems it is sufficient to focus on the necessary conditions (7.39)–(7.41).

## L09-S43 — Hamilton-Jacobi-Bellman Equation

> PDF pages: 43
> Section: Infinite-Horizon Optimal Control

**Theorem 7.10 (Hamilton-Jacobi-Bellman Equation).** Let $V(t, x)$ be as defined in (7.35), and suppose that the hypotheses in Theorem 7.9 hold. Then when $V(t, x)$ is differentiable in $(t, x)$, $V$ satisfies the HJB equation

$$
-\frac{\partial V(t, x)}{\partial t} = \max_{y \in \mathcal{Y}} \left\{ f(t, x, y) + \frac{\partial V(t, x)}{\partial x} g(t, x, y) \right\}.
$$

The optimal pair $(\hat{x}(t), \hat{y}(t))$ satisfies:

$$
\begin{aligned}
-\frac{\partial V(t, \hat{x}(t))}{\partial t} &= f(t, \hat{x}(t), \hat{y}(t)) + \frac{\partial V(t, \hat{x}(t))}{\partial x} g(t, \hat{x}(t), \hat{y}(t))\\
&= \max_{y \in \mathcal{Y}} \left\{f(t, \hat{x}(t), y) + \frac{\partial V(t, \hat{x}(t))}{\partial x} g(t, \hat{x}(t), y) \right\}
\end{aligned}
$$

for all $t \in \mathbb{R}_+$.

**Remark.** The HJB equation may admit multiple solutions. An appropriate asymptotic, growth, or transversality condition is generally needed to select the value-function solution. If the discounted continuation value vanishes, this condition may be $\lim_{t\to\infty}V(t,x)=0$.

## L09-S44 — Importance and Features of HJB Equation

> PDF pages: 44
> Section: Infinite-Horizon Optimal Control

- The HJB equation is a partial differential equation that is useful for providing an intuition for the Maximum Principle.
- This partial differential equation also has a similarity to the Euler equation derived in the context of discrete-time dynamic programming: the first term on the right-hand side corresponds to the current gain and the second term to the benefit of increasing the state.
- The left-hand side results from the fact that the maximized value can also change over time.
- The HJB equation implies that current gain is equal to the loss of value over time:

  $$
  f(t, \hat x(t), \hat y(t)) = -\frac{d}{dt}V(t, \hat x(t))
  $$

## L09-S45 — Heuristic Derivation of the Maximum Principle

> PDF pages: 45
> Section: Infinite-Horizon Optimal Control

We can use the HJB equation to derive the Maximum Principle by setting the costate to

$$
\lambda(t) = \frac{\partial V(t, \hat{x}(t))}{\partial x}
$$

- Then the first order condition for the HJB equation gives $H_y(t, \hat{x}(t), \hat{y}(t), \lambda(t)) = 0$
- Taking the derivative of both sides of the HJB equation with respect to $x$ gives

  $$
  - \frac{\partial^2 V(t, \hat x(t))}{\partial t \partial x} = f_x(t, \hat{x}(t), \hat{y}(t)) + \frac{\partial^2 V(t, \hat{x}(t))}{\partial x^2} g(t, \hat{x}(t), \hat{y}(t)) + \frac{\partial V(t, \hat{x}(t))}{\partial x} g_x(t, \hat{x}(t), \hat{y}(t))
  $$

- By the definition of $\lambda(t)$, we have

  $$
  \dot \lambda(t) = \frac{\partial^2 V(t, \hat x(t))}{\partial t \partial x} + \frac{\partial^2 V(t, \hat{x}(t))}{\partial x^2} g(t, \hat{x}(t), \hat{y}(t))
  $$

- Combining the above equations gives the costate equation

  $$
  \dot{\lambda}(t) = -H_x(t, \hat{x}(t), \hat{y}(t), \lambda(t))
  $$

## L09-S46 — Economic Intuition

> PDF pages: 46
> Section: Infinite-Horizon Optimal Control

- Since $\lambda(t) = \frac{\partial V(t, \hat{x}(t))}{\partial x}$, $\lambda(t)$ measures the impact (shadow value) of a small increase in $x$ on the optimal value of the program.
- Consider the problem of maximizing ($L$ can be thought of as the Lagrangian)

  $$
  \begin{aligned}
  \int_0^{t_1} L(t, \hat x(t), y(t), \lambda(t)) &\equiv \int_0^{t_1} \left[f(t, \hat{x}(t), y(t)) + \lambda(t)\left( g(t, \hat{x}(t), y(t)) - \dot x(t) \right)\right]dt\\
  &= \int_0^{t_1} \left[H(t, \hat{x}(t), y(t), \lambda(t)) - \lambda(t) \dot x(t)\right] dt
  \end{aligned}
  $$

  with respect to the entire function $y(t)$. The necessary condition is $H_y(t, \hat{x}(t), y(t), \lambda(t)) = 0$.
- The maximum principle implies that $f_y(t, \hat x(t), \hat y(t)) + \lambda(t) g_y(t, \hat x(t), \hat y(t)) = 0$: the marginal effect of a change in $y(t)$ on instantaneous payoff should counter-balance that on the value of stock.

## L09-S47 — Costate Equation Interpretation

> PDF pages: 47
> Section: Infinite-Horizon Optimal Control

- In order for the above explanation to make sense, $\lambda(t)$ must follow the costate equation,

  $$
  \begin{aligned}
  -\dot{\lambda}(t) &= H_x(t, \hat{x}(t), \hat{y}(t), \lambda(t))\\
  &= f_x(t, \hat{x}(t), \hat{y}(t)) + \lambda(t)g_x(t, \hat{x}(t), \hat{y}(t))
  \end{aligned}
  $$

- $\dot{\lambda}(t)$ is the appreciation rate in the stock variable $x(t)$
- A small increase in the state $x(t)$ changes the current flow return by $f_x(t, \hat{x}(t), \hat{y}(t))$ and also changes the value of the stock by $\lambda(t)g_x(t, \hat{x}(t), \hat{y}(t))$
- This gain should be equal to the depreciation in the value of the stock $-\dot{\lambda}(t)$ over time

## L09-S48 — Stationary HJB

> PDF pages: 48
> Section: Infinite-Horizon Optimal Control

Given its prominent role in dynamic economic analysis, it is useful to consider the simpler stationary version of the HJB equation:

- $f(t, x(t), y(t)) = \exp(-\rho t)f(x(t), y(t))$
- The law of motion of the state variable is given by an autonomous differential equation, that is, $g(t, x(t), y(t)) = g(x(t), y(t))$.

In this case, one can easily verify that if an admissible pair $(\hat{x}(t), \hat{y}(t))_{t \geq 0}$ is optimal starting at $t = 0$ with initial condition $x(0) = x_0$, then its continuation from any $s>0$ is optimal starting from the reached state $x(s)=\hat{x}(s)$.

## L09-S49 — Stationary HJB

> PDF pages: 49
> Section: Infinite-Horizon Optimal Control

- Let us define $v(x) \equiv V(0, x)$. Since $(\hat{x}(t), \hat{y}(t))$ is an optimal plan regardless of the starting date, we have

  $$
  V(t, x(t)) = \exp(-\rho t)v(x(t)) \text{ for all } t. \tag{7.43}
  $$

- Then by definition,

  $$
  \frac{\partial V(t, x(t))}{\partial t} = -\rho \exp(-\rho t)v(x(t)).
  $$

- Then we can derive the stationary form of the HJB equation

  $$
  \rho v(\hat{x}(t)) = f(\hat{x}(t), \hat{y}(t)) + \dot{v}(\hat{x}(t)). \tag{7.44}
  $$

This stationary HJB equation is widely used in dynamic economic analysis and can be interpreted as a ``no-arbitrage asset value equation''.

## L09-S50 — Economic Intuition of the Stationary HJB Equation

> PDF pages: 50
> Section: Infinite-Horizon Optimal Control

- The stationary form of the HJB equation is

  $$
  \rho v(\hat{x}(t)) = f(\hat{x}(t), \hat{y}(t)) + \dot{v}(\hat{x}(t)), \tag{7.48}
  $$

- We can think of $v$ as the value of an asset and $\rho$ as the required rate of return
  - Dividends are given by the flow payoff $f(\hat{x}(t), \hat{y}(t))$
  - Capital gains or losses are given by $\dot{v}$
- In equilibrium, the return on this asset is equal to the required rate of return $\rho$.
- The Maximum Principle (for stationary problems) requires that $v(x)$, and its rate of change, $\dot{v}(x)$, should be consistent with this no-arbitrage condition.

## L09-S51 — Outline

> PDF pages: 51
> Section: Discounted Infinite-Horizon Optimal Control

1. Variational Arguments
2. The Maximum Principle: A First Look
3. Infinite-Horizon Optimal Control
4. Discounted Infinite-Horizon Optimal Control

## L09-S52 — Problem Formulation

> PDF pages: 52
> Section: Discounted Infinite-Horizon Optimal Control

- Economically interesting problems often take a more specific form with exponential discounting:

  $$
  \max_{x(t),y(t)} W(x(t), y(t)) \equiv \int_0^\infty \exp(-\rho t)f(x(t), y(t))dt, \quad \text{with } \rho > 0 \tag{7.60}
  $$

  subject to

  $$
  \dot{x}(t) = g(t, x(t), y(t)) \tag{7.61}
  $$

  and

  $$
  \begin{aligned}
  x(t) &\in \text{Int } \mathcal{X}(t) \text{ and } y(t) \in \text{Int } \mathcal{Y}(t) \text{ for all } t,\\
  x(0) &= x_0, \text{ and } \lim_{t\to\infty} b(t)x(t) \geq x_1 \tag{7.62}
  \end{aligned}
  $$

- Assume positive discounting: $\rho > 0$
- Recall that $b : \mathbb{R}_+ \to \mathbb{R}_+$ and $\lim_{t\to\infty} b(t) < \infty$

## L09-S53 — Current-Value Hamiltonian

> PDF pages: 53
> Section: Discounted Infinite-Horizon Optimal Control

- The Hamiltonian in this case is:

  $$
  \begin{aligned}
  H(t, x(t), y(t), \lambda(t)) &= \exp(-\rho t)f(x(t), y(t)) + \lambda(t)g(t, x(t), y(t))\\
  &= \exp(-\rho t)[f(x(t), y(t)) + \mu(t)g(t, x(t), y(t))]
  \end{aligned}
  $$

  where the second line uses the definition

  $$
  \mu(t) \equiv \exp(\rho t)\lambda(t) \tag{7.63}
  $$

- We can work with the current-value Hamiltonian, defined as:

  $$
  \hat{H}(t, x(t), y(t), \mu(t)) \equiv f(x(t), y(t)) + \mu(t)g(t, x(t), y(t)) \tag{7.64}
  $$

- When $g(t, x(t), y(t))$ is also an autonomous differential equation of the form $g(x(t), y(t))$, we can simply write $\hat{H}(x(t), y(t), \mu(t))$

## L09-S54 — Assumptions

> PDF pages: 54
> Section: Discounted Infinite-Horizon Optimal Control

Throughout, $f$ and $g$ are continuously differentiable for all admissible $(x(t), y(t))$, with derivatives denoted $f_x$, $f_y$, $g_x$, and $g_y$.

**Assumption 7.1.** In the maximization of (7.60) subject to (7.61) and (7.62):

1. $f$ is weakly monotone in $x$ and $y$, and $g$ is weakly monotone in $(t, x, y)$
2. there exists $m > 0$ such that $|g_y(t, x(t), y(t))| \geq m$ for all $t$ and for all admissible pairs $(x(t), y(t))$
3. there exists $M < \infty$ such that $|f_y(x, y)| \leq M$ for all $x$ and $y$

## L09-S55 — Maximum Principle

> PDF pages: 55
> Section: Discounted Infinite-Horizon Optimal Control

**Theorem 7.13 (Maximum Principle for Discounted Infinite-Horizon Problems).** Suppose that the problem of maximizing (7.60) subject to (7.61) and (7.62), with $f$ and $g$ continuously differentiable, has an interior piecewise continuous optimal control $\hat{y}(t) \in \text{Int } \mathcal{Y}(t)$ with corresponding state variable $\hat{x}(t) \in \text{Int } \mathcal{X}(t)$. Suppose that the value function $V(t, \hat{x}(t))$ is differentiable in $x$ and $t$ for $t$ sufficiently large, that $V(t, \hat{x}(t))$ exists and is finite for all $t$, and that $\lim_{t\to\infty} \partial V(t, \hat{x}(t))/\partial t = 0$. Then except at points of discontinuity of $\hat{y}(t)$, the optimal control pair $(\hat{x}(t), \hat{y}(t))$ satisfies the following necessary conditions:

$$
\hat{H}_y(t, \hat{x}(t), \hat{y}(t), \mu(t)) = 0 \text{ for all } t \in \mathbb{R}_+ \tag{7.65}
$$

$$
\rho\mu(t) - \dot{\mu}(t) = \hat{H}_x(t, \hat{x}(t), \hat{y}(t), \mu(t)) \text{ for all } t \in \mathbb{R}_+ \tag{7.66}
$$

$$
\dot{x}(t) = \hat{H}_\mu(t, \hat{x}(t), \hat{y}(t), \mu(t)) \text{ for all } t \in \mathbb{R}_+, x(0) = x_0, \text{ and } \lim_{t\to\infty} b(t)x(t) \geq x_1 \tag{7.67}
$$

## L09-S56 — Maximum Principle

> PDF pages: 56
> Section: Discounted Infinite-Horizon Optimal Control

**Theorem 7.13 (Continued).** And the transversality condition

$$
\lim_{t\to\infty}[\exp(-\rho t)\hat{H}(t, \hat{x}(t), \hat{y}(t), \mu(t))] = 0 \tag{7.68}
$$

Moreover, suppose that Assumption 7.1 holds and that either $\lim_{t\to\infty} \hat{x}(t) = x^* \in \mathbb{R}$ or $\lim_{t\to\infty} \dot{x}(t)/\hat{x}(t) = \chi \in \mathbb{R}$. Then the transversality condition can be strengthened to

$$
\lim_{t\to\infty}[\exp(-\rho t)\mu(t)\hat{x}(t)] = 0 \tag{7.69}
$$

## L09-S57 — The Transversality Condition

> PDF pages: 57
> Section: Discounted Infinite-Horizon Optimal Control

- Notice that compared to the transversality condition in the finite-horizon case, there is the additional term $\exp(-\rho t)$ in (7.69). This is because the transversality condition applies to the original costate variable $\lambda(t)$: $\lim_{t\to\infty}[\lambda(t)x(t)] = 0$
- Note also that the stronger transversality condition takes the form

  $$
  \lim_{t\to\infty}[\exp(-\rho t)\mu(t)\hat{x}(t)] = 0
  $$

  not simply $\lim_{t\to\infty}[\exp(-\rho t)\mu(t)] = 0$.

## L09-S58 — Limitations

> PDF pages: 58
> Section: Discounted Infinite-Horizon Optimal Control

- It is important to emphasize that Theorem 7.13 only provides necessary conditions for interior continuous solutions (with $\lim_{t\to\infty}\hat{x}(t)=x^*$ or $\lim_{t\to\infty}\dot{x}(t)/\hat{x}(t)=\chi$).
- The next theorem shows that under the appropriate concavity conditions, (7.69) is also a sufficient transversality condition.
- It further shows that for such concave problems, Assumption 7.1 or the limiting conditions in Theorem 7.13 are no longer required.

## L09-S59 — Sufficiency Conditions

> PDF pages: 59
> Section: Discounted Infinite-Horizon Optimal Control

**Theorem 7.14 (Sufficiency Conditions for Discounted Infinite-Horizon Problems).** Consider the problem of maximizing (7.60) subject to (7.61) and (7.62), with $f$ and $g$ continuously differentiable. Suppose that some $\hat{y}(t)$ and the corresponding path of state variable $\hat{x}(t)$ satisfy the necessary conditions and the transversality condition (7.65)--(7.68). Given the resulting current-value costate variable $\mu(t)$, define $M(t, x, \mu) \equiv \max_{y(t)\in \mathcal{Y}(t)} \hat{H}(t, x, y, \mu)$. Suppose that

- $V(t, \hat{x}(t))$ exists and is finite for all $t$;
- for any admissible pair $(x(t), y(t))$, $\lim_{t\to\infty}[\exp(-\rho t)\mu(t)x(t)] \geq 0$;
- $\mathcal{X}(t)$ is convex and $M(t, x, \mu)$ is concave in $x \in \mathcal{X}(t)$ for all $t$.

Then the pair $(\hat{x}(t), \hat{y}(t))$ achieves the global maximum of (7.60). Moreover, if $M(t, x, \mu)$ is strictly concave in $x$, $(\hat{x}(t), \hat{y}(t))$ is the unique solution to (7.60).

## L09-S60 — Sufficiency Conditions

> PDF pages: 60
> Section: Discounted Infinite-Horizon Optimal Control

Theorem 7.14 is very useful and powerful. Given this result, the following strategy will be used in most problems:

1. Use the conditions in Theorem 7.13 to locate a candidate interior solution $(\hat{x}(t), \hat{y}(t))$ satisfying (7.65)--(7.68)
2. Then verify the concavity conditions of Theorem 7.14 and simply check that $\lim_{t\to\infty}[\exp(-\rho t)\mu(t)x(t)] \geq 0$ for other admissible pairs, with $\mu(t)$ associated with the candidate solution $(\hat{x}(t), \hat{y}(t))$
3. If these conditions are satisfied, we will have characterized a global maximum

## L09-S61 — Corollary 7.1: Continuity

> PDF pages: 61
> Section: Discounted Infinite-Horizon Optimal Control

**Corollary 7.1.** Suppose that the hypotheses in Theorem 7.14 are satisfied, $M(t, x, \mu)$ is strictly concave in $x$ for all $t$, and $\mathcal{Y}$ is compact. Then $\hat{y}(t)$ is a continuous function of $t$ on $\mathbb{R}_+$.
