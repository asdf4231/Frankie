# Continuity in Metric Spaces

> Course sources: [Lecture 2](../raw/lectures/lecture-02.md), slide 8; [Lecture 6](../raw/lectures/lecture-06.md), slides 41–49

## Overview

Continuity says that inputs approaching a point produce outputs approaching the function value there. In metric spaces this idea has equivalent sequential and $\epsilon$-$\delta$ forms, and it can also be characterized by inverse images of open or closed sets.

## Limits of functions

Let $f\colon A\subset X\to Y$, where $(X,d)$ and $(Y,\rho)$ are metric spaces, and let $a$ be a limit point of $A$. The limit of $f$ at $a$ is $b$ if, for every sequence $(x_n)\subset A\setminus\{a\}$,

$$
x_n\to a\implies f(x_n)\to b.
$$

This is written as

$$
\lim_{x\to a}f(x)=b.
$$

Equivalently, for every $\epsilon>0$ there is a $\delta>0$ such that

$$
x\in A\setminus\{a\}
\text{ and }
d(x,a)<\delta
\implies
\rho(f(x),b)<\epsilon.
$$

When $X=\mathbb{R}$ and $a$ is an endpoint of the interval $A$, the lecture uses $\lim_{x\to a^+}f(x)$ and $\lim_{x\to a^-}f(x)$ for right- and left-hand limits.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slides 41–43.

## Continuity at a point

For $a\in A$, the function $f$ is continuous at $a$ if either $a$ is an isolated point of $A$, or $a$ is a limit point of $A$ and

$$
\lim_{x\to a}f(x)=f(a).
$$

The following are equivalent:

1. $f$ is continuous at $a$;
2. for every sequence $(x_n)\subset A$, $x_n\to a$ implies $f(x_n)\to f(a)$;
3. for every $\epsilon>0$ there is a $\delta>0$ such that

   $$
   x\in A
   \text{ and }
   d(x,a)<\delta
   \implies
   \rho\bigl(f(x),f(a)\bigr)<\epsilon.
   $$

A function continuous at every point of $A$ is continuous on $A$. The lecture denotes the collection of such functions by $\mathcal{C}(A;Y)$, or by $\mathcal{C}(A)$ when $Y=\mathbb{R}$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slides 44–45.

## Arithmetic, components, and composition

For real-valued functions continuous at $a$, Lecture 6 states that $f+g$, $fg$, and $f/g$ when $g(a)\neq0$ are continuous at $a$. Lecture 2 also records continuity of $f-g$.

For $f\colon\mathbb{R}^k\to\mathbb{R}^m$, continuity is equivalent to continuity of every component function $f_i\colon\mathbb{R}^k\to\mathbb{R}$.

If $f$ is continuous at $a$ and $g$ is continuous at $f(a)$, then $g\circ f$ is continuous at $a$.

**Course sources:** [Lecture 2](../raw/lectures/lecture-02.md), slide 8; [Lecture 6](../raw/lectures/lecture-06.md), slide 47.

## Intermediate values

If $f$ is a continuous real-valued function on $[a,b]$, $f(a)<f(b)$, and

$$
f(a)<c<f(b),
$$

then there is an $x\in(a,b)$ such that $f(x)=c$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 47.

## Topological characterization

For $f\colon X\to Y$, the following are equivalent:

1. $f$ is continuous;
2. $f^{-1}(E)$ is open in $X$ whenever $E$ is open in $Y$;
3. $f^{-1}(C)$ is closed in $X$ whenever $C$ is closed in $Y$.

The corresponding statement is about inverse images. A continuous image of an open set need not be open, and a continuous image of a closed set need not be closed. The lecture illustrates this with

$$
f(x)=x^2,
\qquad
f((-1,1))=[0,1),
$$

and

$$
f(x)=e^x,
\qquad
f(\mathbb{R})=(0,\infty).
$$

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 48.

## Continuous functions on compact domains

Let $f\colon K\subset X\to Y$ be continuous, where $X$ and $Y$ are metric spaces and $K$ is compact. Then $f(K)$ is compact. If additionally $Y\subset\mathbb{R}$ and $K$ is nonempty, then $f$ is bounded above and below and has a maximum and a minimum.

The lecture contrasts this result with three noncompact-domain examples:

- $f(x)=1/x$ on $(0,1]$ is unbounded above;
- $f(x)=x$ on $[0,1)$ is bounded but has no maximum;
- $f(x)=1/x$ on $[1,\infty)$ has no minimum.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 49.

## Connections

- [Metric spaces](metric-spaces.md) provide the distances used in both forms of continuity.
- [Metric-space topology](metric-space-topology.md) supplies the open and closed sets in the inverse-image characterization.
- [Sequences and convergence](sequences-and-convergence.md) supply the sequential tests for limits and continuity.
- [Compactness](compactness.md) gives the domain condition behind boundedness and attainment of extrema.
- [Bounded continuous functions](bounded-continuous-functions.md) organizes bounded continuous maps into a complete function space under the uniform metric when the codomain is complete.
- [Maximizers and local extrema](../unconstrained-optimization/maximizers-and-local-extrema.md) records the optimization consequence of the compact-domain theorem.
- [Composition and invertibility](../functions/composition-and-invertibility.md) defines composition, while the [chain rule](../multivariable-calculus/chain-rule.md) differentiates compositions under its stated assumptions.
- The [Jacobian derivative](../multivariable-calculus/jacobian-derivative.md) and [implicit function theorem](../multivariable-calculus/implicit-function-theorem.md) use continuity through the course's $C^1$ assumptions.
