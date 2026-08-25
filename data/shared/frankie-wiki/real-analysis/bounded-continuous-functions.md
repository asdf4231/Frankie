# Bounded Continuous Functions

> Course sources: [Lecture 6](../raw/lectures/lecture-06.md), slide 50; [Lecture 8](../raw/lectures/lecture-08.md), slides 30, 46, 52

## Overview

Bounded continuous functions themselves form a metric space when distance is measured uniformly over the domain. If the codomain is complete, the lecture states that this function space is complete under the uniform metric.

## The function space

Let $A\subset X$, where $(X,d)$ is a metric space, and let $(Y,\rho)$ be a metric space. The set of bounded continuous functions $f\colon A\to Y$ is denoted by

$$
\mathcal{B}\mathcal{C}(A;Y).
$$

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 50.

## Uniform metric

For $f,g\in\mathcal{B}\mathcal{C}(A;Y)$, define

$$
d_u(f,g)
:=\sup_{x\in A}\rho\bigl(f(x),g(x)\bigr).
$$

The lecture states that $(\mathcal{B}\mathcal{C}(A;Y),d_u)$ is a metric space.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 50.

## Completeness under uniform distance

If $(Y,\rho)$ is complete, then

$$
\bigl(\mathcal{B}\mathcal{C}(A;Y),d_u\bigr)
$$

is a complete metric space.

The lecture also states closure under uniform convergence: if $f_n\to f$ in the uniform metric, then $f$ is bounded and continuous, so the limit remains in $\mathcal{B}\mathcal{C}(A;Y)$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 50.

## Function spaces in stationary dynamic programming

Lecture 8 uses two related function spaces:

- $B(X)$ is the space of all bounded functions $f:X\to\mathbb R$; Blackwell's sufficient conditions are stated for an operator $T:B(X)\to B(X)$.
- $C(X)$ is the space of continuous real-valued functions on $X$; the contraction proof outline for the Bellman equation defines the operator on this space.

Under Assumption 6.2, $X$ is compact. Continuous real-valued functions on compact $X$ are bounded, so in Lecture 6 notation

$$
C(X)=\mathcal{B}\mathcal{C}(X;\mathbb R).
$$

Thus $C(X)$ is a complete bounded-continuous function space under the sup metric, while $B(X)$ is the broader space appearing in Blackwell's theorem. The Bellman-operator proof still requires a self-map on the chosen space; Lecture 8 states continuity of $G$ as an assumption but does not develop the correspondence-continuity argument needed to show that $T$ preserves continuity.

**Course sources:** [Lecture 6](../raw/lectures/lecture-06.md), slide 50; [Lecture 8](../raw/lectures/lecture-08.md), slides 30, 46, 52.

## Connections

- [Metric spaces](metric-spaces.md) introduces the sup-norm metric on bounded real-valued functions as an example of a function-space metric.
- [Continuity in metric spaces](continuity-in-metric-spaces.md) defines the continuity required of members of $\mathcal{B}\mathcal{C}(A;Y)$.
- [Cauchy sequences and metric completeness](cauchy-sequences-and-metric-completeness.md) defines the completeness conclusion.
- The [contraction mapping theorem](contraction-mapping-theorem.md) can be applied to a self-map of this complete function space only when its contraction assumptions are satisfied.
- The [Bellman operator](../dynamic-programming/bellman-operator.md) explains why Lecture 8 works on $C(X)=\mathcal{B}\mathcal{C}(X;\mathbb R)$ under compact $X$ while stating Blackwell's theorem on $B(X)$.
