# Contraction Mapping Theorem

> Course sources: [Lecture 6](../raw/lectures/lecture-06.md), slides 31–33; [Lecture 8](../raw/lectures/lecture-08.md), slides 30–31, 42–47, 52

## Overview

A contraction uniformly reduces distances. On a complete metric space, iterating a contraction converges to its unique fixed point. Lecture 8 applies this theorem to the stationary Bellman operator.

## Contractions and fixed points

Let $(X,d)$ be a metric space and let $F\colon S\subset X\to X$. The map $F$ is a **contraction** if there is a number $0\leq\lambda<1$ such that

$$
d(F(x),F(y))\leq\lambda d(x,y)
$$

for every $x,y\in S$.

A point $x^*\in S$ is a **fixed point** of $F$ if

$$
F(x^*)=x^*.
$$

The domain qualifications matter: the contraction inequality is required for points in $S$, and a fixed point must itself belong to $S$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 31.

## The theorem

Let $(X,d)$ be a complete metric space and let $F\colon X\to X$ be a contraction. Then:

1. $F$ has a unique fixed point $x^*$;
2. for every starting point $x\in X$,

   $$
   F^n(x)\to x^*
   \qquad\text{as }n\to\infty.
   $$

The lecture describes the iterates by

$$
x_1=F(x),
\quad
x_2=F(x_1),
\quad
x_3=F(x_2),
\quad\ldots,
\quad
x_n=F(x_{n-1}).
$$

**Course sources:** [Lecture 6](../raw/lectures/lecture-06.md), slide 32; [Lecture 8](../raw/lectures/lecture-08.md), slide 44.

## Closed invariant subsets

Lecture 8 adds the following fixed-point consequences. Let $(S,d)$ be complete and let $T:S\to S$ be a contraction with fixed point $\hat z$.

1. If $S'$ is closed and $T(S')\subseteq S'$, then $\hat z\in S'$.
2. Under that closed and invariant $S'$ setup, if $T(S')\subseteq S''\subseteq S'$, then $\hat z\in S''$.

The second statement is read as implicitly carrying forward the closedness and invariance setup from part 1. The lecture presents these implications as a way to prove that a fixed point has properties such as concavity or monotonicity by showing that the operator preserves an appropriate class of functions.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 45.

## Blackwell's sufficient conditions

Lecture 8 states Blackwell's theorem on $B(X)$, the bounded real-valued functions on $X$ with the sup norm. If $T:B(X)\to B(X)$ is monotone and, for some $\beta\in(0,1)$,

$$
[T(f+c)](x)\leq(Tf)(x)+\beta c
$$

for every $f\in B(X)$, $c\geq0$, and $x\in X$, then $T$ is a contraction with modulus $\beta$.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 46.

## Application to the Bellman operator

For

$$
(TV)(x)
=
\max_{y\in G(x)}\{U(x,y)+\beta V(y)\},
$$

pointwise order $V_1\leq V_2$ implies $TV_1\leq TV_2$, and constants satisfy

$$
T(V+c)=TV+\beta c.
$$

These are the lecture's monotonicity and discounting checks. Its existence proof outline defines $T$ on $C(X)$ under compact $X$, where $C(X)=\mathcal{B}\mathcal{C}(X;\mathbb R)$, while Blackwell's theorem itself is stated on the larger space $B(X)$. Under Assumptions 6.1 and 6.2, Theorem 6.3 concludes that the Bellman equation has a unique bounded continuous solution.

Assumption 6.2 states that $G$ is continuous, but the lecture does not develop correspondence continuity or the proof that the Bellman operator preserves continuity on these slides.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 30–31, 46–47, 52.

## Connections

- [Cauchy sequences and metric completeness](cauchy-sequences-and-metric-completeness.md) explains the completeness assumption in the theorem.
- [Sequences and convergence](sequences-and-convergence.md) supplies the convergence notion for the iterates.
- [Bounded continuous functions](bounded-continuous-functions.md) distinguishes the bounded space $B(X)$ from $C(X)=\mathcal{B}\mathcal{C}(X;\mathbb R)$ under compact $X$.
- The [Bellman operator](../dynamic-programming/bellman-operator.md) gives the full operator, Blackwell, and fixed-point formulation.
- The [Bellman equation](../dynamic-programming/bellman-equation.md) is a fixed-point equation in the stationary infinite-horizon setting, but finite-horizon backward induction does not use this contraction argument.
