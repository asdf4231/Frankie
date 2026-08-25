# Lecture 8 — Infinite-Horizon Optimization and Dynamic Programming

> Course: Dynamic Optimization
> Original: slides/lecture08-infinite_horizon_optimization_and_dynamic_programming.tex
> PDF: slides/lecture08-infinite_horizon_optimization_and_dynamic_programming.pdf
> Snapshot: v1
> PDF metadata: Title `Lecture 8: Infinite-Horizon Optimization and Dynamic Programming`; author `Junnan Zhang`; creator `LaTeX with Beamer class`; producer `pdfTeX-1.40.29`; 75 pages; PDF version 1.7; created and modified 2026-08-23 13:58:03 +08.
> Normalization notes: The exact course-defined macros `\R` and `\Z` are expanded to $\mathbb{R}$ and $\mathbb{Z}$ for Markdown rendering. Presentation-only Beamer syntax has otherwise been removed without correcting source wording or mathematics.

## L08-S01 — Lecture 8: Infinite-Horizon Optimization and Dynamic Programming

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Fall, 2026

## L08-S02 — Chapter Overview

> PDF pages: 2

- Brief introduction to infinite-horizon optimization in discrete time under certainty
- Main purpose: introduce the theory and techniques of dynamic programming

## L08-S03 — Chapter Structure

> PDF pages: 3

The material is presented in four parts:

1. Introduces the problem and provides theoretical results necessary for applications of stationary dynamic programming techniques
2. Additional mathematical tools
3. Applications

## L08-S04 — Outline

> PDF pages: 4
> Section: Problem Description

1. Problem Description
2. Stationary Dynamic Programming
3. Stationary Dynamic Programming Results
4. The Contraction Mapping Theorem
5. Proofs of Main Theorems
6. Applications of Stationary Dynamic Programming
   - Euler Equation
   - Dynamic Programming vs Sequence Problem

## L08-S05 — Discrete-Time Infinite-Horizon Optimization

> PDF pages: 5
> Section: Problem Description

The canonical discrete-time infinite-horizon optimization program:

$$
\begin{aligned}
&\sup_{\{x_t,y_t\}_{t=0}^{\infty}} \sum_{t=0}^{\infty} \beta^t \tilde{U}(t, x_t, y_t)\\
\text{s.t. }
&y_t \in \tilde{G}(t, x_t) \text{ for all } t \geq 0\\
&x_{t+1} = \tilde{f}(t, x_t, y_t) \text{ for all } t \geq 0\\
&x_0 \text{ given}
\end{aligned}
$$

- $\beta \in [0,1)$ is the discount factor
- $x_t \in X \subset \mathbb{R}^{K_x}$ and $y_t \in Y \subset \mathbb{R}^{K_y}$ for some $K_x, K_y \geq 1$
- $x_t$: state variables (state vector)
- $y_t$: control variables (control vector)
- $\tilde{U}: \mathbb{Z}_+ \times X \times Y \to \mathbb{R}$ is the instantaneous payoff function
- $\tilde{G}(t,x)$ is a set-valued mapping (correspondence): $\tilde{G}: \mathbb{Z}_+ \times X \rightrightarrows Y$

## L08-S06 — Constraints and Evolution

> PDF pages: 6
> Section: Problem Description

- First constraint: $y_t \in \tilde{G}(t, x_t)$ specifies what values of control vector $y_t$ are allowed, given state $x_t$ at time $t$
- Evolution equation: $\tilde{f}: \mathbb{Z}_+ \times X \times Y \to X$ specifies evolution of state vector as function of last period's state and control vectors
- This formulation highlights distinction between state and control variables
- Often more convenient to work with transformation to eliminate $y_t$

## L08-S07 — Problem 6.1: Transformed Formulation

> PDF pages: 7
> Section: Problem Description

$$
\begin{aligned}
V^*(0, x_0) &= \sup_{\{x_t\}_{t=0}^{\infty}}
\sum_{t=0}^{\infty} \beta^t U(t, x_t, x_{t+1})\\
\text{s.t. } &x_{t+1} \in G(t, x_t) \text{ for all } t \geq 0\\
&x_0 \text{ given}
\end{aligned}
$$

- $x_t \in X \subset \mathbb{R}^K$ (now $K = K_x$)
- $x_t$ corresponds to state vector, $x_{t+1}$ plays role of control vector at time $t$
- $U: \mathbb{Z}_+ \times X \times X \to \mathbb{R}$ is instantaneous payoff function
- $G: \mathbb{Z}_+ \times X \rightrightarrows X$ specifies constraint correspondence

## L08-S08 — Value Function

> PDF pages: 8
> Section: Problem Description

- $V^*: \mathbb{Z}_+ \times X \to \mathbb{R}$ is the **value function**, which specifies supremum (highest possible value) that objective function can reach starting with some $x_t$ at time $t$
- When maximal value is attained by sequence $\{x^*_{t+1}\}_{t=0}^{\infty} \in X^{\infty}$, we refer to this as a **solution** or an **optimal plan**
- Objective: characterize optimal plan $\{x^*_{t+1}\}_{t=0}^{\infty}$ and value function $V^*(0, x_0)$
- Here, $X^{\infty}$ is countable infinite product of set $X$. If $X$ is bounded, then $X^{\infty} \subset \ell^{\infty}$, where $\ell^{\infty}$ is the vector space of infinite sequences that are bounded with the sup norm $\|\cdot\|_{\infty}$ (or simply $\|\cdot\|$)

## L08-S09 — Example 6.1: Optimal Growth Problem

> PDF pages: 9
> Section: Problem Description

Consider an optimal growth problem:

$$
\begin{aligned}
&\max_{\{k_t,c_t\}_{t=0}^{\infty}} \sum_{t=0}^{\infty} \beta^t u(c_t)\\
\text{s.t. } &k_{t+1} = f(k_t) + (1-\delta)k_t - c_t\\
&k_t \geq 0, \text{ given } k_0 > 0, \text{ and } u: \mathbb{R}_+ \to \mathbb{R}
\end{aligned}
$$

Let $x_t = k_t$ and $x_{t+1} = k_{t+1}$. The objective function can be written as:

$$
\max_{\{k_t\}_{t=0}^{\infty}} \sum_{t=0}^{\infty} \beta^t u(f(k_t) - k_{t+1} + (1-\delta)k_t)
$$

subject to $k_t \geq 0$. This is special case of Problem 6.1 with:

- $U(t, k_t, k_{t+1}) = u(f(k_t) - k_{t+1} + (1-\delta)k_t)$
- Constraint correspondence $G(t, k_t) = [0, f(k_t) + (1-\delta)k_t]$ (since $c_t \geq 0$)

## L08-S10 — Stationarity Feature

> PDF pages: 10
> Section: Problem Description

- Notable feature emphasized by Example 6.1: $U$ and $G$ do not explicitly depend on time
- This feature is fairly common in economics and many interesting problems can be formulated in **stationary form**
- Stationary problem involves:
  - Objective function that is a discounted sum
  - $U$ and $G$ functions that do not explicitly depend on time

## L08-S11 — Outline

> PDF pages: 11
> Section: Stationary Dynamic Programming

1. Problem Description
2. Stationary Dynamic Programming
3. Stationary Dynamic Programming Results
4. The Contraction Mapping Theorem
5. Proofs of Main Theorems
6. Applications of Stationary Dynamic Programming
   - Euler Equation
   - Dynamic Programming vs Sequence Problem

## L08-S12 — Stationary Dynamic Programming

> PDF pages: 12
> Section: Stationary Dynamic Programming

Consider the stationary form of Problem 6.1.

**Problem 6.2**:

$$
\begin{aligned}
V^*(x_0) &= \sup_{\{x_t\}_{t=0}^{\infty}} \sum_{t=0}^{\infty} \beta^t U(x_t, x_{t+1})\\
\text{s.t. } &x_{t+1} \in G(x_t) \text{ for all } t \geq 0\\
&x_0 \text{ given}
\end{aligned}
$$

- Constraint correspondence: $G: X \rightrightarrows X$
- Instantaneous payoff functions: $U: X \times X \to \mathbb{R}$
- Value function without time argument: $V^*(x_0)$

## L08-S13 — Sequence vs. Functional Equation

> PDF pages: 13
> Section: Stationary Dynamic Programming

- Problem 6.2 corresponds to the **sequence problem**: involves choosing infinite sequence $\{x_t\}_{t=0}^{\infty} \in X^{\infty}$
- Sequence problems sometimes have nice features, but solutions often difficult to characterize analytically and numerically
- Basic idea of dynamic programming: turn sequence problem into **functional equation**
- Transform problem into one of finding a function rather than a sequence

## L08-S14 — The Bellman Equation

> PDF pages: 14
> Section: Stationary Dynamic Programming

**Problem 6.3**:

$$
V(x) = \sup_{y \in G(x)} \{U(x,y) + \beta V(y)\}, \quad \text{for all } x \in X
$$

where $V: X \to \mathbb{R}$.

- This functional equation is also called the **“Bellman equation”** after Richard Bellman
- Instead of explicitly choosing a sequence $\{x_t\}_{t=0}^{\infty}$, we choose a **policy** $y \in G(x) \subset X$ for given $x \in X$
- Since $U(\cdot,\cdot)$ does not depend on time, no reason for policy to be time-dependent either
- Use $V$ for function defined in Problem 6.3 and $V^*$ for function defined in Problem 6.2

## L08-S15 — Economic Interpretation

> PDF pages: 15
> Section: Stationary Dynamic Programming

$$
V(x) = \sup_{y \in G(x)} \{U(x,y) + \beta V(y)\}, \quad \text{for all } x \in X
$$

- This is a **“recursive formulation”**: function $V(x)$ appears on both left- and right-hand sides, defined recursively
- In many cases, solution to Problem 6.3 is simpler to characterize analytically than the corresponding solution to sequence problem
- Question: when are the two problems equivalent?

## L08-S16 — Natural Derivation of the Bellman Equation

> PDF pages: 16
> Section: Stationary Dynamic Programming

Suppose Problem 6.2 has maximum starting at $x_0$ attained by optimal sequence $\{x^*_t\}_{t=0}^{\infty}$ with $x^*_0 = x_0$. Under weak technical conditions:

$$
\begin{aligned}
V^*(x_0) &= \sum_{t=0}^{\infty} \beta^t U(x^*_t, x^*_{t+1})\\
&= U(x_0, x^*_1) + \beta \sum_{s=0}^{\infty} \beta^s U(x^*_{s+1}, x^*_{s+2})\\
&= U(x_0, x^*_1) + \beta V^*(x^*_1)
\end{aligned}
$$

This encapsulates the basic idea of dynamic programming: **Principle of Optimality**, which states that optimal plan can be broken into two parts:

1. What is optimal today
2. The optimal continuation path

## L08-S17 — Optimal Policy

> PDF pages: 17
> Section: Stationary Dynamic Programming

$$
V(x) = \sup_{y \in G(x)} \{U(x,y) + \beta V(y)\}, \quad \text{for all } x \in X
$$

- Solution can be represented by a time invariant **policy function** (or policy mapping) $\pi: X \to X$ that determines which value of $x_{t+1}$ to choose for given state variable $x_t$
- Two complications:
  1. Control reaching optimal value may not exist (reason for “sup” notation)
  2. Solution may involve policy **correspondence** $\Pi: X \rightrightarrows X$ (more than one maximizer)
- Ignore these complications for now

## L08-S18 — Characterizing Policy Function

> PDF pages: 18
> Section: Stationary Dynamic Programming

Once value function $V$ is determined, policy function is straightforward to characterize.

If the optimal policy is given by $\pi(x)$, then:

$$
V(x) = U(x, \pi(x)) + \beta V(\pi(x)) \quad \text{for all } x \in X
$$

- This equation follows from the fact that $\pi(x)$ is the optimal policy
- When $y = \pi(x)$, the right-hand side of the Bellman equation reaches maximal value $V(x)$
- This is one way of determining the policy function

## L08-S19 — Usefulness of Recursive Formulation

> PDF pages: 19
> Section: Stationary Dynamic Programming

- There are powerful tools that establish existence of solution and some of its properties
- Next section: present results on relationship between solution to the sequence problem (Problem 6.2) and the recursive formulation (Problem 6.3)
- Establish results on concavity, monotonicity, and differentiability of the value function

## L08-S20 — Outline

> PDF pages: 20
> Section: Stationary Dynamic Programming Results

1. Problem Description
2. Stationary Dynamic Programming
3. Stationary Dynamic Programming Results
4. The Contraction Mapping Theorem
5. Proofs of Main Theorems
6. Applications of Stationary Dynamic Programming
   - Euler Equation
   - Dynamic Programming vs Sequence Problem

## L08-S21 — Stationary Dynamic Programming Theorems

> PDF pages: 21
> Section: Stationary Dynamic Programming Results

Main purpose:

- Ensure sequence $\{x^*_t\}_{t=0}^{\infty} \in X^{\infty}$ that attains supremum in Problem 6.2 satisfies recursive equation of dynamic programming

  $$
  V(x^*_t) = U(x^*_t, x^*_{t+1}) + \beta V(x^*_{t+1}), \quad \text{for all } t = 0, 1, \ldots
  $$

- The solution to the Bellman equation is also a solution to Problem 6.2
- In other words, establish equivalence results between solutions to Problems 6.2 and 6.3

## L08-S22 — Feasible Sequences

> PDF pages: 22
> Section: Stationary Dynamic Programming Results

Define set of feasible sequences or plans starting with initial value $x_t$:

$$
\Phi(x_t) = \{\{x_{s}\}_{s=t}^{\infty} : x_{s+1} \in G(x_s) \text{ for } s = t, t+1, \ldots\}
$$

- Intuitively, $\Phi(x_t)$ is the set of feasible choices of vectors starting from $x_t$
- Denote typical element of $\Phi(x_0)$ by $\mathbf{x} = (x_0, x_{1}, \ldots) \in \Phi(x_0)$
- Want sequence to satisfy:

  $$
  V(x^*_t) = U(x^*_t, x^*_{t+1}) + \beta V(x^*_{t+1}) \text{ for all } t = 0,1,\ldots
  $$

## L08-S23 — Basic Assumptions

> PDF pages: 23
> Section: Stationary Dynamic Programming Results

**Assumption 6.1.** $G(x)$ is nonempty for all $x \in X$; and for all $x_0 \in X$ and $\mathbf{x} \in \Phi(x_0)$,

$$
\lim_{n \to \infty} \sum_{t=0}^n \beta^t U(x_t, x_{t+1}) \text{ exists and is finite}
$$

- Assumption stronger than necessary for theory: for much of dynamic programming theory, it is sufficient that the limit exists
- But in economic applications, we are not interested in optimization problems where agents achieve infinite value

## L08-S24 — Equivalence of Values

> PDF pages: 24
> Section: Stationary Dynamic Programming Results

**Theorem 6.1 (Equivalence of Values).** Suppose Assumption 6.1 holds. Then for any $x \in X$, any solution $V^*(x)$ to Problem 6.2 is also a solution to Problem 6.3. Moreover, any solution $V(x)$ to Problem 6.3 is also a solution to Problem 6.2, so that $V^*(x) = V(x)$ for all $x \in X$.

- Under Assumption 6.1, both sequence problem and recursive formulation achieve the same value
- Fundamental result that justifies the dynamic programming approach

## L08-S25 — Principle of Optimality

> PDF pages: 25
> Section: Stationary Dynamic Programming Results

**Theorem 6.2 (Principle of Optimality).** Suppose Assumption 6.1 holds. Let $\mathbf{x}^* \in \Phi(x_0)$ be a feasible plan that attains $V^*(x_0)$ in Problem 6.2. Then

$$
\tag{6.3}
V^*(x^*_t) = U(x^*_t, x^*_{t+1}) + \beta V^*(x^*_{t+1})
$$

for $t = 0, 1, \ldots$, with $x^*_0 = x_0$.

Moreover, if any $\mathbf{x}^* \in \Phi(x_0)$ satisfies equation (6.3), then it attains the optimal value in Problem 6.2.

- If any feasible plan satisfies the Bellman equation, then it attains optimal value
- We can go from solution of the Bellman equation to solution of the sequence problem and vice versa

## L08-S26 — Example: Optimal Growth

> PDF pages: 26
> Section: Stationary Dynamic Programming Results

**Example 6.4:** Consider an optimal growth model with log preferences, Cobb-Douglas technology, and full depreciation:

$$
\begin{aligned}
\max_{\{k_t,c_t\}_{t=0}^{\infty}} &\sum_{t=0}^{\infty} \beta^t \log c_t \\
\text{s.t. } &k_{t+1} = k_t^{\alpha} - c_t \\
&k_0 > 0
\end{aligned}
$$

where $\beta \in (0,1)$, $k$ is capital-labor ratio, and the resource constraint follows from the production function $K^{\alpha}L^{1-\alpha}$ in per capita terms.

## L08-S27 — Closed-Form Solution

> PDF pages: 27
> Section: Stationary Dynamic Programming Results

We solve the Bellman equation

$$
V(x) = \max_{y\ge 0} \{\log(x^\alpha - y) + \beta V(y)\}.
$$

Standard approach for log–Cobb–Douglas:

- Conjecture that the value function is logarithmic:

  $$
  V(x) = A + B\log x.
  $$

- Use the Bellman equation to solve for unknown constants $(A,B)$.
- Obtain closed-form policy and value functions.

## L08-S28 — Closed-Form Solution

> PDF pages: 28
> Section: Stationary Dynamic Programming Results

- Guess:

  $$
  V(x)=A+B\log x.
  $$

- Bellman equation:

  $$
  A + B\log x=
  \max_{y}
  \left\{
  \log(x^\alpha - y) + \beta\left[A + B\log y \right]
  \right\}.
  $$

- FOC w.r.t. $y$:

  $$
  -\frac{1}{x^\alpha - y} + \frac{\beta B}{y} = 0
  \implies y = \frac{\beta B}{1+\beta B}x^\alpha.
  $$

  Using $B=\frac{\alpha}{1-\alpha\beta}$ gives $y=\alpha\beta x^\alpha$.

- Optimal next-period capital:

  $$
  k_{t+1} = y^*(x) = \alpha\beta x^\alpha.
  $$

## L08-S29 — Closed-Form Solution

> PDF pages: 29
> Section: Stationary Dynamic Programming Results

- Substitute $y^*(x)=\alpha\beta x^\alpha$ into Bellman equation:

  $$
  \begin{aligned}
  A+B\log x &= \log\left((1-\alpha\beta)x^\alpha\right) +
  \beta\left[ A + B\log(\alpha\beta x^\alpha) \right]\\
  &= \log(1-\alpha\beta) + \alpha\log x + \beta A + \beta
  B\left(\log(\alpha\beta)+\alpha\log x\right).
  \end{aligned}
  $$

- Match coefficients on $\log x$:

  $$
  B = \alpha + \beta B \alpha \implies
  B = \frac{\alpha}{1-\alpha\beta}
  $$

- Match constant terms:

  $$
  A = \log(1-\alpha\beta) + \beta A + \beta B\log(\alpha\beta).
  $$

  Solve:

  $$
  A=\frac{1}{1-\beta}\left[ \log(1-\alpha\beta) +
  \frac{\alpha\beta}{1-\alpha\beta}\log(\alpha\beta) \right].
  $$

## L08-S30 — Continuity and Compactness Assumptions

> PDF pages: 30
> Section: Stationary Dynamic Programming Results

**Assumption 6.2.** $X$ is a compact subset of $\mathbb{R}^K$, $G$ is nonempty-valued, compact-valued, and continuous. Moreover, $U: X_G \to \mathbb{R}$ is continuous, where $X_G = \{(x,y) \in X \times X : y \in G(x)\}$.

- Most restrictive: the state space is compact
- Since $X$ is compact and $G(x)$ is compact-valued, $X_G$ is also compact
- Continuous function on compact domain: $U$ is bounded

## L08-S31 — Existence of Solutions

> PDF pages: 31
> Section: Stationary Dynamic Programming Results

**Theorem 6.3 (Existence of Solutions).** Suppose that Assumptions 6.1 and 6.2 hold. Then there exists a unique continuous and bounded function $V: X \to \mathbb{R}$ that satisfies the Bellman equation. Moreover, for any $x_0 \in X$, an optimal plan $\mathbf{x}^* \in \Phi(x_0)$ exists.

Two major results:

1. **Existence and uniqueness** of the value function
2. **Existence** of an optimal plan

Combined with Theorem 6.1: optimal policy function achieving supremum $V^*$ in Problem 6.2 exists and $V^*$ is continuous and bounded.

## L08-S32 — Non-uniqueness of Optimal Plans

> PDF pages: 32
> Section: Stationary Dynamic Programming Results

- Optimal plan in Problem 6.2 (or 6.3) may not be unique, even though the value function is unique: for example, when two alternative feasible sequences achieve same maximal value
- As in static optimization problems, non-uniqueness because of the lack of strict concavity of objective function
- When we include a concavity assumption, uniqueness of optimal plan is guaranteed

## L08-S33 — Concavity Assumption

> PDF pages: 33
> Section: Stationary Dynamic Programming Results

**Assumption 6.3.** $U$ is concave; that is, for any $\alpha \in (0,1)$ and any $(x,y), (x',y') \in X_G$:

$$
U(\alpha x + (1-\alpha)x', \alpha y + (1-\alpha)y') \geq \alpha
U(x,y) + (1-\alpha)U(x',y')
$$

and the inequality is strict if $x \neq x'$.

In addition, $G$ is convex in the sense that for any $\alpha \in [0,1]$, and $x, x', y, y' \in X$ such that $y \in G(x)$ and $y' \in G(x')$:

$$
\alpha y + (1-\alpha)y' \in G(\alpha x + (1-\alpha)x').
$$

## L08-S34 — Concavity of Value Function

> PDF pages: 34
> Section: Stationary Dynamic Programming Results

**Theorem 6.4 (Concavity of the Value Function).** Suppose that Assumptions 6.1, 6.2, and 6.3 hold. Then the unique $V: X \to \mathbb{R}$ that satisfies the Bellman equation is strictly concave.

- If Assumption 6.3 relaxed so that $U$ is concave (without additional requirement for $x \neq x'$), then a weaker version applies and implies $V$ is concave
- Important for uniqueness of optimal plans

## L08-S35 — Unique Optimal Plan and Policy Function

> PDF pages: 35
> Section: Stationary Dynamic Programming Results

**Corollary 6.1.** Suppose Assumptions 6.1, 6.2, and 6.3 hold. Then there exists a unique optimal plan $x^* \in \Phi(x_0)$ for any $x_0 \in X$. Moreover, the optimal plan can be expressed as:

$$
x^*_{t+1} = \pi(x^*_t)
$$

where $\pi: X \to X$ is a continuous policy function.

- The policy correspondence becomes a function, not just a correspondence.
- The policy function is continuous.

## L08-S36 — Monotonicity Assumption

> PDF pages: 36
> Section: Stationary Dynamic Programming Results

**Assumption 6.4.** For each $y \in X$, $U(\cdot, y)$ is strictly increasing in each of its first $K$ arguments, and $G$ is monotone in the sense that $x \leq x'$ implies $G(x) \subset G(x')$.

- Ensures payoff function increasing in state variables
- Larger values of state variables attractive from viewpoint of relaxing constraints
- Natural in economic applications where “more is better”

## L08-S37 — Monotonicity of Value Function

> PDF pages: 37
> Section: Stationary Dynamic Programming Results

**Theorem 6.5 (Monotonicity).** Suppose Assumptions 6.1, 6.2, and 6.4 hold, and let $V: X \to \mathbb{R}$ be the unique solution to the Bellman equation. Then $V$ is strictly increasing in all of its arguments.

- Consistent with monotonic preferences
- Useful for comparative statics analysis
- In growth models, higher capital stock always increases value function

## L08-S38 — Differentiability Assumption

> PDF pages: 38
> Section: Stationary Dynamic Programming Results

**Assumption 6.5.** $U$ is continuously differentiable on the interior of its domain $X_G$.

- Common in most economic models
- Enables us to work with first-order necessary conditions

## L08-S39 — Differentiability and Envelope Theorem

> PDF pages: 39
> Section: Stationary Dynamic Programming Results

**Theorem 6.6 (Differentiability).** Suppose Assumptions 6.1, 6.2, 6.3, and 6.5 hold. Let $\pi(\cdot)$ be the policy function from Corollary 6.1, and assume $x \in \text{Int }X$ and $\pi(x) \in \text{Int }G(x)$. Then $V(\cdot)$ is differentiable at $x$, with gradient:

$$
DV(x) = D_x U(x, \pi(x))
$$

- Allows us to use differential calculus on the Bellman equation
- Enables derivation of Euler equations

## L08-S40 — Summary

> PDF pages: 40
> Section: Stationary Dynamic Programming Results

Given these assumptions, the following results are established:

1. **Theorem 6.1:** Equivalence of Values
2. **Theorem 6.2:** Principle of Optimality
3. **Theorem 6.3:** Existence of Solutions
4. **Theorem 6.4:** Concavity of Value Function
5. **Theorem 6.5:** Monotonicity of Value Function
6. **Theorem 6.6:** Differentiability of Value Function and the Envelope Theorem

## L08-S41 — Outline

> PDF pages: 41
> Section: The Contraction Mapping Theorem

1. Problem Description
2. Stationary Dynamic Programming
3. Stationary Dynamic Programming Results
4. The Contraction Mapping Theorem
5. Proofs of Main Theorems
6. Applications of Stationary Dynamic Programming
   - Euler Equation
   - Dynamic Programming vs Sequence Problem

## L08-S42 — Definition

> PDF pages: 42
> Section: The Contraction Mapping Theorem

**Metric Space:** $(S,d)$ where $S$ is a space and $d$ is a distance metric

**Operators:** Mappings $T: S \to S$

**Definition 6.1 (Contraction Mapping).** Let $(S,d)$ be a metric space and $T: S \to S$ be an operator. If for some $\beta \in (0,1)$:

$$
d(Tz_1, Tz_2) \leq \beta d(z_1, z_2) \text{ for all } z_1, z_2 \in S
$$

then $T$ is a contraction mapping (with modulus $\beta$).

**Intuition:** Contraction mappings bring elements uniformly closer together.

## L08-S43 — Contraction: Example

> PDF pages: 43
> Section: The Contraction Mapping Theorem

**Example 6.2:** On interval $S = [a,b]$ with usual metric $d(z_1,z_2) = |z_1 - z_2|$:
$T$ is a contraction if:

$$
\frac{|Tz_1 - Tz_2|}{|z_1 - z_2|} \leq \beta < 1 \text{ for all } z_1 \neq z_2
$$

This means $T$ has slope less than 1 everywhere.

## L08-S44 — The Contraction Mapping Theorem

> PDF pages: 44
> Section: The Contraction Mapping Theorem

**Definition 6.2 (Fixed Point).** A fixed point of $T$ is any element $\hat{z} \in S$ satisfying $T\hat{z} = \hat{z}$.

**Theorem 6.7 (Contraction Mapping Theorem).** Let $(S,d)$ be a complete metric space and suppose $T: S \to S$ is a contraction. Then $T$ has a unique fixed point $\hat{z}$; that is, there exists a unique $\hat{z} \in S$ such that:

$$
T\hat{z} = \hat{z}.
$$

Moreover, $T^nz \to \hat{z}$ as $n \to \infty$ for any $z \in S$.

- Simple conditions that guarantee existence, uniqueness, and convergence
- Applies to infinite-dimensional function spaces
- Foundation of dynamic programming theory

## L08-S45 — Applications of Contraction Mappings

> PDF pages: 45
> Section: The Contraction Mapping Theorem

**Theorem 6.8.** Let $(S,d)$ be complete and $T: S \to S$ be a contraction with fixed point $\hat{z}$.

1. If $S'$ is a closed subset of $S$ and $T(S') \subseteq S'$, then $\hat{z} \in S'$
2. If $T(S') \subseteq S'' \subseteq S'$, then $\hat{z} \in S''$

- If we start in a closed set that maps to itself, fixed point is in that set
- Enables proving properties like strict concavity or monotonicity

## L08-S46 — Blackwell's Sufficient Conditions

> PDF pages: 46
> Section: The Contraction Mapping Theorem

Checking contraction property directly is often difficult. Blackwell provides easier conditions:

**Theorem 6.9 (Blackwell's Conditions).** Let $X \subseteq \mathbb{R}^K$ and $B(X)$ be the space of bounded functions $f: X \to \mathbb{R}$ equipped with the sup norm. If $T: B(X) \to B(X)$ satisfies:

1. Monotonicity: For any $f, g \in B(X)$, $f(x) \leq g(x)$ for all $x$ implies $(Tf)(x) \leq (Tg)(x)$ for all $x \in X$; and
2. Discounting: $\exists \beta \in (0,1)$ such that

   $$
   [T(f + c)](x) \leq (Tf)(x) + \beta c
   $$

   for all $f \in B(X)$, $c \geq 0$, and $x \in X$.

Then $T$ is a contraction with modulus $\beta$ on $B(X)$.

## L08-S47 — Applying Blackwell's Conditions to Dynamic Programming

> PDF pages: 47
> Section: The Contraction Mapping Theorem

For the Bellman operator:

$$
TV(x) = \max_{y \in G(x)} \{U(x,y) + \beta V(y)\}
$$

- Checking Monotonicity: If $V_1(x) \leq V_2(x)$ for all $x$, then:

  $$
  TV_1(x) = \max_{y \in G(x)} \{U(x,y) + \beta V_1(y)\} \leq \max_{y
  \in G(x)} \{U(x,y) + \beta V_2(y)\} = TV_2(x)
  $$

- Checking Discounting:

  $$
  \begin{aligned}
  T(V + c)(x) &= \max_{y \in G(x)} \{U(x,y) + \beta(V(y) + c)\}\\
  &= \max_{y \in G(x)} \{U(x,y) + \beta V(y)\} + \beta c\\
  &= TV(x) + \beta c
  \end{aligned}
  $$

## L08-S48 — Outline

> PDF pages: 48
> Section: Proofs of Main Theorems

1. Problem Description
2. Stationary Dynamic Programming
3. Stationary Dynamic Programming Results
4. The Contraction Mapping Theorem
5. Proofs of Main Theorems
6. Applications of Stationary Dynamic Programming
   - Euler Equation
   - Dynamic Programming vs Sequence Problem

## L08-S49 — Key Lemma: Separating Returns

> PDF pages: 49
> Section: Proofs of Main Theorems

For a feasible infinite sequence $x = (x_0, x_{1}, \ldots) \in \Phi(x_0)$, define

$$
\bar{U}(x) \equiv \sum_{t=0}^{\infty} \beta^t U(x_t, x_{t+1})
$$

**Lemma 6.1.** Suppose Assumption 6.1 holds. For any $x_0 \in X$ and $x \in \Phi(x_0)$:

$$
\bar{U}(x) = U(x_0, x_{1}) + \beta \bar{U}(x')
$$

where $x' = (x_{1}, x_{2}, \ldots)$.

## L08-S50 — Proof Sketch: Theorem 6.1 (Equivalence)

> PDF pages: 50
> Section: Proofs of Main Theorems

Goal: Show $V^*(x) = V(x)$ where:

- $V^*(x) = \sup_{\mathbf{z} \in \Phi(x)} \bar{U}(\mathbf{z})$ (Problem 6.2)
- $V(x) = \sup_{y \in G(x)} \{U(x,y) + \beta V(y)\}$ (Problem 6.3)

Idea: Use Lemma 6.1 and the definition of supremum. (Read pp. 195--197 of the textbook.)

## L08-S51 — Proof Sketch: Theorem 6.2 (Principle of Optimality)

> PDF pages: 51
> Section: Proofs of Main Theorems

- Let $x^*$ attain $V^*(x_0)$ in Problem 6.2. Our goal is to show that

  $$
  V^*(x^*_t) = U(x^*_t, x^*_{t+1}) + \beta V^*(x^*_{t+1})
  $$

  Proof idea: show that $(x^*_t, x^*_{t+1}, \ldots)$ is optimal starting from $x^*_t$ using Lemma 6.1 and induction

- Suppose $x^*$ satisfies the Bellman equation. We want to show that it is optimal.

  Proof idea: iterating on the Bellman equation.

## L08-S52 — Two Proofs of Theorem 6.3 (Existence)

> PDF pages: 52
> Section: Proofs of Main Theorems

**Version 1 (Sequence problem under compact $X$):**

- Basic idea: show that the objective function is continuous on a compact set, and therefore attains a maximum
- Treat the objective function as continuous on $X^\infty$
- Show that the constraint set is a compact subset of $X^\infty$

**Version 2 (Contraction Mapping):**

- Define Bellman operator $T$ on space $C(X)$ of continuous functions
- Show $T$ satisfies Blackwell's conditions
- Apply Contraction Mapping Theorem: unique fixed point exists
- Fixed point is solution to recursive problem

## L08-S53 — Outline

> PDF pages: 53
> Section: Applications of Stationary Dynamic Programming

1. Problem Description
2. Stationary Dynamic Programming
3. Stationary Dynamic Programming Results
4. The Contraction Mapping Theorem
5. Proofs of Main Theorems
6. Applications of Stationary Dynamic Programming
   - Euler Equation
   - Dynamic Programming vs Sequence Problem

## L08-S54 — Applications

> PDF pages: 54
> Section: Applications of Stationary Dynamic Programming

- We show how dynamic programming can be applied to a range of problems
- **Main Result**: Theorem 6.10 shows how dynamic first-order conditions (Euler equations) together with the transversality condition are sufficient to characterize solutions

## L08-S55 — Outline

> PDF pages: 55
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

1. Problem Description
2. Stationary Dynamic Programming
3. Stationary Dynamic Programming Results
4. The Contraction Mapping Theorem
5. Proofs of Main Theorems
6. Applications of Stationary Dynamic Programming
   - Euler Equation
   - Dynamic Programming vs Sequence Problem

## L08-S56 — The Functional Equation

> PDF pages: 56
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

Consider the functional equation corresponding to Problem 6.3:

$$
V(x) = \max_{y \in G(x)} \{U(x,y) + \beta V(y)\} \quad \text{for all } x \in X
$$

Throughout, we assume Assumptions 6.1–6.5 hold.

- From Theorem 6.4: maximization problem is strictly concave
- From Theorem 6.6: maximand is differentiable
- For interior solutions $y \in \text{Int } G(x)$: first-order conditions are necessary and sufficient

## L08-S57 — The Euler Equations

> PDF pages: 57
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

For optimal solutions, we can characterize them by the **Euler equations**:

$$
D_y U(x, y^*) + \beta DV(y^*) = 0
$$

- Use the Envelope Theorem for dynamic programming by differentiating the functional equation with respect to state vector $x$:

  $$
  DV(x) = D_x U(x, y^*)
  $$

- Substituting it into the Euler equation gives

  $$
  D_y U(x, \pi(x)) + \beta D_x U(\pi(x), \pi(\pi(x))) = 0
  $$

This is a **functional equation** in the unknown function $\pi(.)$ and characterizes the optimal policy function.

## L08-S58 — One-Dimensional Case

> PDF pages: 58
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

When both $x$ and $y$ are real numbers, the Euler equation becomes:

$$
\frac{\partial U(x, y^*)}{\partial y} + \beta V'(y^*) = 0
$$

Sum of marginal gain today from increasing $y$ plus discounted marginal gain from increasing $y$ on future returns must equal zero

## L08-S59 — Envelope Condition - One Dimensional

> PDF pages: 59
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

The one-dimensional Envelope Condition gives:

$$
V'(x) = \frac{\partial U(x, y^*)}{\partial x}
$$

Combining with the Euler equation:

$$
\frac{\partial U(x, \pi(x))}{\partial y} + \beta \frac{\partial U(\pi(x), \pi(\pi(x)))}{\partial x} = 0
$$

With time arguments explicitly:

$$
\frac{\partial U(x_t, x^*_{t+1})}{\partial y} + \beta \frac{\partial
U(x^*_{t+1}, x^*_{t+2})}{\partial x} = 0
$$

## L08-S60 — The Transversality Condition

> PDF pages: 60
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

- Euler equation is **not sufficient** for optimality. We also need the transversality condition.
- The transversality condition ensures that there are no beneficial simultaneous changes in an infinite number of choice variables.
- **General case**:

  $$
  \lim_{t \to \infty} \beta^t D_x U(x^*_t, x^*_{t+1}) \cdot x^*_t = 0
  $$

- **One-dimensional case**:

  $$
  \lim_{t \to \infty} \beta^t \frac{\partial U(x^*_t,
  x^*_{t+1})}{\partial x} \cdot x^*_t = 0
  $$

- The transversality condition requires that the marginal return from state variable $x$ times the value of this state variable does not increase asymptotically at rate faster than or equal to $1/\beta$.

## L08-S61 — Main Theorem

> PDF pages: 61
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

**Theorem 6.10 (Euler Equations and Transversality Condition).** Let $X \subset \mathbb{R}^K_+$ and suppose Assumptions 6.1–6.5 hold. Then a sequence $\{x^*_t\}_{t=0}^{\infty}$ such that $x^*_{t+1} \in \text{Int } G(x^*_t)$, $t = 0,1,\ldots$, is optimal for Problem 6.2 given $x_0$ if and only if it satisfies:

$$
\begin{aligned}
&D_y U(x^*_t, x^*_{t+1}) + \beta D_x U(x^*_{t+1}, x^*_{t+2}) = 0 \\
&\lim_{t \to \infty} \beta^t D_x U(x^*_t, x^*_{t+1}) \cdot x^*_t = 0
\end{aligned}
$$

The Euler equations together with the transversality condition are **necessary and sufficient**, under those assumptions.

## L08-S62 — Example: Optimal Growth

> PDF pages: 62
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

**Example 6.4:** Consider an optimal growth model with log preferences, Cobb-Douglas technology, and full depreciation:

$$
\begin{aligned}
\max_{\{k_t,c_t\}_{t=0}^{\infty}} &\sum_{t=0}^{\infty} \beta^t \log c_t \\
\text{s.t. } &k_{t+1} = k_t^{\alpha} - c_t \\
&k_0 > 0
\end{aligned}
$$

where $\beta \in (0,1)$, $k$ is capital-labor ratio, and the resource constraint follows from the production function $K^{\alpha}L^{1-\alpha}$ in per capita terms.

## L08-S63 — Recursive Formulation

> PDF pages: 63
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

Write down the Bellman equation

$$
V(x) = \max_{y \geq 0} \{\log(x^{\alpha} - y) + \beta V(y)\}
$$

where $x$ is today's capital stock and $y$ is tomorrow's capital stock.

- Previously, we used guess and verify to solve the value function.
- Show that the problem satisfies Assumptions 6.1--6.5, so Theorems 6.1--6.6 apply. Then we can also use the Euler equation.

## L08-S64 — Applying Euler Equations

> PDF pages: 64
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

- Since $V(.)$ is differentiable, the first-order condition is

  $$
  \frac{1}{x^{\alpha} - y} = \beta V'(y)
  $$

- Envelope Condition:

  $$
  V'(x) = \frac{\alpha x^{\alpha-1}}{x^{\alpha} - y}
  $$

- Combining using $y = \pi(x)$:

  $$
  \frac{1}{x^{\alpha} - \pi(x)} = \beta \frac{\alpha
  \pi(x)^{\alpha-1}}{\pi(x)^{\alpha} - \pi(\pi(x))}
  $$

This is a functional equation in a single function $\pi(x)$.

## L08-S65 — Guess-and-Verify Solution

> PDF pages: 65
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

- There are no straightforward ways to solve functional equations, but guess-and-verify often works.
- Let us conjecture that $\pi(x) = ax^{\alpha}$
- Substituting into the Euler equation:

  $$
  \frac{1}{x^{\alpha} - ax^{\alpha}} = \beta \frac{\alpha
  a^{\alpha-1} x^{\alpha(\alpha-1)}}{a^{\alpha} x^{\alpha^2} -
  a^{1+\alpha} x^{\alpha^2}} = \frac{\beta}{a}
  \frac{\alpha}{x^{\alpha} - ax^{\alpha}}
  $$

  which implies $a = \beta\alpha$ satisfies the equation.

## L08-S66 — Complete Solution

> PDF pages: 66
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

- The policy function is: $\pi(x) = \beta\alpha x^{\alpha}$
- Law of motion: $k_{t+1} = \beta\alpha k_t^{\alpha}$
- Optimal consumption: $c_t = (1-\beta\alpha)k_t^{\alpha}$
- Capital-labor ratio $k_t$ converges to steady state $k^*$, which ensures transversality condition
- By Corollary 6.1 and Theorem 6.10: $\pi(x) = \beta\alpha x^{\alpha}$ is the unique policy function

## L08-S67 — Example: Optimal Savings Problem

> PDF pages: 67
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

**Example 6.5:** Consider an infinitely-lived consumer who solves

$$
\begin{aligned}
&\max_{\{c_t,a_t\}_{t=0}^{\infty}} \sum_{t=0}^{\infty} \beta^t u(c_t) \\
&\text{subject to: } a_{t+1} = (1+r)a_t + w - c_t, \quad c_t \geq 0
\end{aligned}
$$

- $u(c)$ is strictly increasing, continuously differentiable, strictly concave
- Without further constraints, this is not well-defined and allows consumer to build unlimited debt ($\lim_{t \to \infty} a_t = -\infty$)—“Ponzi games”.

## L08-S68 — How to Avoid Ponzi Games

> PDF pages: 68
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

Three approaches to prevent unlimited borrowing:

1. **No-Ponzi condition**: Rule out such schemes directly
2. **No borrowing**: $a_{t+1} \geq 0$ for all $t$ (too restrictive)
3. **Natural debt limit**: Maximum repayable debt $a_{t+1} \geq \underline{a} \equiv -w/r$

## L08-S69 — Ensuring Compactness

> PDF pages: 69
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

- **Challenge**: Assets $a$ don't necessarily belong to a compact set.
- **Solution**: Choose upper bound $\bar{a}$ and restrict $a \in [\underline{a}, \bar{a}]$.
  1. Solve problem on a compact set
  2. Verify that the solution indeed lies in the state space
- **Natural choice**: $\bar{a} \equiv a_0 + w/r < \infty$

## L08-S70 — Recursive Formulation

> PDF pages: 70
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

- State variable: $a_t$
- Consumption: $c_t = (1+r)a_t + w - a_{t+1} \geq 0$
- The Bellman equation

  $$
  V(a) = \max_{\substack{a' \in [\underline{a}, \bar{a}]\\
  a' \leq (1+r)a+w}}
  \{u((1+r)a + w - a') + \beta V(a')\}
  $$

Verify that the assumptions are satisfied.

## L08-S71 — Consumption Euler Equation

> PDF pages: 71
> Section: Applications of Stationary Dynamic Programming
> Subsection: Euler Equation

- Using one-dimensional Euler equation and the Envelope Condition gives

  $$
  u'(c) = \beta(1+r)u'(c')
  $$

- Since $u'(.)$ exists and is strictly decreasing (because $u$ is continuously differentiable and strictly concave), we get the following simple rule:

  $$
  \begin{aligned}
  \text{if } r &= \beta^{-1} - 1, c = c' \text{ (constant consumption)} \\
  \text{if } r &> \beta^{-1} - 1, c < c' \text{ (increasing consumption)} \\
  \text{if } r &< \beta^{-1} - 1, c > c' \text{ (decreasing consumption)}
  \end{aligned}
  $$

## L08-S72 — Outline

> PDF pages: 72
> Section: Applications of Stationary Dynamic Programming
> Subsection: Dynamic Programming vs Sequence Problem

1. Problem Description
2. Stationary Dynamic Programming
3. Stationary Dynamic Programming Results
4. The Contraction Mapping Theorem
5. Proofs of Main Theorems
6. Applications of Stationary Dynamic Programming
   - Euler Equation
   - Dynamic Programming vs Sequence Problem

## L08-S73 — Transversality Condition from Finite Horizon Problem

> PDF pages: 73
> Section: Applications of Stationary Dynamic Programming
> Subsection: Dynamic Programming vs Sequence Problem

Consider a dynamic optimization problem with finite horizon $T$:

$$
\begin{aligned}
&\max_{\{x_t\}_{t=1}^{T+1}} \sum_{t=0}^T \beta^t U(x_t, x_{t+1}) \\
&\text{s.t. } x_{t+1} \geq 0, \text{ } x_0 \text{ given}
\end{aligned}
$$

- When $0 \leq t \leq T-1$, FOCs from finite-dimensional optimization assuming interior solution:

  $$
  \frac{\partial U(x^*_t, x^*_{t+1})}{\partial y} + \beta
  \frac{\partial U(x^*_{t+1}, x^*_{t+2})}{\partial x} = 0
  $$

- When $t = T$, the complementary slackness condition implies:

  $$
  x^*_{T+1} \geq 0, \text{ and } \beta^T \frac{\partial U(x^*_T,
  x^*_{T+1})}{\partial y} x^*_{T+1} = 0
  $$

## L08-S74 — Example: Finite Horizon Optimal Growth

> PDF pages: 74
> Section: Applications of Stationary Dynamic Programming
> Subsection: Dynamic Programming vs Sequence Problem

**Example 6.6:** In the optimal growth problem,

$$
U(x_t, x_{t+1}) = u(f(x_t) + (1-\delta)x_t - x_{t+1})
$$

Suppose that the world ends at date $T$. Then at the last date $T$:

$$
\frac{\partial U(x^*_T, x^*_{T+1})}{\partial y} = -u'(c^*_T) < 0
$$

From the boundary condition, an optimal path must have $k^*_{T+1} = x^*_{T+1} = 0$.

No capital should be left at end of world. Any leftover resources should be consumed.

## L08-S75 — Deriving Transversality Condition

> PDF pages: 75
> Section: Applications of Stationary Dynamic Programming
> Subsection: Dynamic Programming vs Sequence Problem

- The transversality condition can be derived heuristically by taking the limit of the boundary condition

  $$
  \lim_{T \to \infty} \beta^T \frac{\partial U(x^*_T,
  x^*_{T+1})}{\partial y} x^*_{T+1} = 0
  $$

- The Euler equation implies

  $$
  \frac{\partial U(x^*_T, x^*_{T+1})}{\partial y} + \beta
  \frac{\partial U(x^*_{T+1}, x^*_{T+2})}{\partial x} = 0
  $$

- Substituting and changing timing:

  $$
  \lim_{T \to \infty} \beta^T \frac{\partial U(x^*_T, x^*_{T+1})}{\partial x} x^*_T = 0
  $$

  which is exactly the transversality condition: a “boundary condition at infinity.”
