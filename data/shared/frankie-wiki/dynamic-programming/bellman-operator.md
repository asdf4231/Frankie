# Bellman Operator

> Course sources: [Lecture 6](../raw/lectures/lecture-06.md), slide 50; [Lecture 8](../raw/lectures/lecture-08.md), slides 30–31, 42–47, 52

## Overview

The Bellman operator maps a candidate continuation-value function into the value obtained by optimizing current payoff plus discounted candidate continuation value. A solution of the stationary Bellman equation is a fixed point of this operator.

## Function spaces

Let $B(X)$ denote the space of bounded functions $f:X\to\mathbb R$, equipped with the sup norm. Blackwell's theorem in Lecture 8 is stated on this space.

The contraction proof outline for dynamic programming instead places the Bellman operator on $C(X)$, the continuous real-valued functions on $X$. Under Assumption 6.2, $X$ is compact, so continuous real-valued functions on $X$ are bounded. In the notation of Lecture 6,

$$
C(X)=\mathcal{B}\mathcal{C}(X;\mathbb R).
$$

Thus $C(X)$ is the bounded-continuous subspace of the larger space $B(X)$, and it is complete under the sup metric.

**Course sources:** [Lecture 6](../raw/lectures/lecture-06.md), slide 50; [Lecture 8](../raw/lectures/lecture-08.md), slides 30, 46, 52.

## Definition

For a candidate value function $V$, define

$$
(TV)(x)
=
\max_{y\in G(x)}
\{U(x,y)+\beta V(y)\}.
$$

The Bellman equation is the fixed-point equation

$$
TV=V.
$$

In the existence proof outline, the lecture treats $T$ as an operator on $C(X)$ under Assumption 6.2. That assumption states that $G$ is nonempty-valued, compact-valued, and continuous and that $U$ is continuous on $X_G$. The lecture does not develop correspondence continuity or prove the continuity-preservation step in these slides, so this page records the stated setup without adding an external maximum-theorem argument.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 30, 47, 52.

## Blackwell's sufficient conditions

**Theorem 6.9.** Let $T:B(X)\to B(X)$. If:

1. **Monotonicity:** $f(x)\leq g(x)$ for all $x$ implies $(Tf)(x)\leq(Tg)(x)$ for all $x$; and
2. **Discounting:** for some $\beta\in(0,1)$,

   $$
   [T(f+c)](x)\leq(Tf)(x)+\beta c
   $$

   for every $f\in B(X)$, $c\geq0$, and $x\in X$,

then $T$ is a contraction with modulus $\beta$ on $B(X)$.

This theorem is stated on all bounded functions, even though the dynamic-programming existence proof seeks a fixed point in $C(X)=\mathcal{B}\mathcal{C}(X;\mathbb R)$ under compact $X$.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 46.

## Verification for the Bellman operator

If $V_1\leq V_2$ pointwise, then

$$
\begin{aligned}
(TV_1)(x)
&=\max_{y\in G(x)}\{U(x,y)+\beta V_1(y)\}\\
&\leq\max_{y\in G(x)}\{U(x,y)+\beta V_2(y)\}
=(TV_2)(x).
\end{aligned}
$$

For a nonnegative constant $c$,

$$
\begin{aligned}
[T(V+c)](x)
&=\max_{y\in G(x)}\{U(x,y)+\beta(V(y)+c)\}\\
&=(TV)(x)+\beta c.
\end{aligned}
$$

The Bellman operator therefore satisfies Blackwell's monotonicity and discounting checks displayed in the lecture.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 47.

## Fixed point, uniqueness, and iteration

The contraction mapping theorem states that a contraction on a complete metric space has a unique fixed point and that iterates from any starting element converge to it. Applied through the lecture's Bellman-operator proof route, the fixed point is the unique bounded continuous function satisfying the Bellman equation. Theorem 6.3 additionally states that an optimal plan exists from every initial state under Assumptions 6.1 and 6.2.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 31, 42–44, 52.

## Invariant subsets and inherited properties

**Theorem 6.8.** Let $(S,d)$ be complete and let $T:S\to S$ be a contraction with fixed point $\hat z$.

1. If $S'$ is closed and $T(S')\subseteq S'$, then $\hat z\in S'$.
2. Under that closed and invariant $S'$ setup, if also $T(S')\subseteq S''\subseteq S'$, then $\hat z\in S''$.

The second statement is read as implicitly carrying forward the closedness and invariance setup from part 1. The lecture presents this result as a way to establish properties such as concavity or monotonicity by finding a closed class of functions that the operator preserves.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 45.

## Connections

- The [Bellman equation](bellman-equation.md) is the fixed-point equation $TV=V$.
- The [contraction mapping theorem](../real-analysis/contraction-mapping-theorem.md) gives existence, uniqueness, and convergence once the operator and complete metric space satisfy its hypotheses.
- [Bounded continuous functions](../real-analysis/bounded-continuous-functions.md) explains the distinction between $B(X)$ and $C(X)=\mathcal{B}\mathcal{C}(X;\mathbb R)$ under compact $X$.
- [Infinite-horizon dynamic optimization](infinite-horizon-dynamic-optimization.md) gives the sequence problem represented by the fixed point.
