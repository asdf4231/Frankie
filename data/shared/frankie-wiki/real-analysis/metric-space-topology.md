# Metric-Space Topology

> Course sources: [Lecture 6](../raw/lectures/lecture-06.md), slides 8–16, 23

## Overview

A metric generates geometric and topological notions through open balls. Neighborhoods, interior and exterior points, boundaries, limit points, closure, and open and closed sets all depend on the ambient metric space.

## Open balls, neighborhoods, and bounded sets

For $a\in X$ and $r>0$,

$$
B_r(a)=\{x\in X:d(x,a)<r\}
$$

is the open ball centered at $a$ with radius $r$. A subset $Y$ of $X$ is a neighborhood of $a$ if some $B_r(a)$ is contained in $Y$. A set $S\subset X$ is bounded if $S\subset B_r(a)$ for some $a\in X$ and $r>0$.

In $\mathbb{R}$ with its usual metric, $(0,2)=B_1(1)$, and every open interval is an open ball.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slides 8–9.

## Interior, exterior, and boundary

Let $S\subset X$.

- A point is an **interior point** of $S$ if some ball centered there is contained in $S$.
- It is an **exterior point** if some ball centered there is contained in $S^c$.
- It is a **boundary point** if every ball centered there contains at least one point of $S$ and at least one point of $S^c$.

The sets of interior, exterior, and boundary points are denoted by

$$
\operatorname{int}S,
\qquad
\operatorname{ext}S,
\qquad
\partial S.
$$

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 10.

### Dependence on the ambient space

The lecture compares $S=[0,1)$ first as a subset of $X=\mathbb{R}$ and then as a subset of $X=[0,1]$.

**Wiki derivation from the definitions:** In $\mathbb{R}$, $\operatorname{int}S=(0,1)$ and $\partial S=\{0,1\}$. In the ambient space $[0,1]$, the point $0$ becomes interior, so $\operatorname{int}S=[0,1)$ and $\partial S=\{1\}$. The set is the same, but its metric-space surroundings have changed.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slides 10–11.

## Limit points, isolated points, and closure

A point $x\in X$ is a **limit point** of $S$ if every ball centered at $x$ contains an element of $S$ other than $x$. A point $x\in S$ is **isolated** if some ball centered at $x$ contains no other element of $S$.

The closure is

$$
\bar S=S\cup\{\text{limit points of }S\}.
$$

The lecture states

$$
\bar S=(\operatorname{ext}S)^c
$$

and

$$
\bar S=\operatorname{int}S\cup\partial S.
$$

It also states that every ball centered at a limit point contains infinitely many points of $S$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slides 12–13.

For $S=\{1/n:n\in\mathbb{N}\}\subset\mathbb{R}$, every point of $S$ is isolated and $0$ is the only limit point. For $\mathbb{Q}\subset\mathbb{R}$,

$$
\operatorname{int}\mathbb{Q}=\emptyset,
\qquad
\partial\mathbb{Q}=\mathbb{R},
\qquad
\bar{\mathbb{Q}}=\mathbb{R}.
$$

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 14.

## Open and closed sets

A set is open when all its points are interior points. A set $S\subset X$ is closed when $S^c$ is open. The lecture states:

1. every open ball is open;
2. $S$ is closed if and only if $S=\bar S$;
3. $\bar S$ and $\partial S$ are closed;
4. every union of open sets is open, and every intersection of closed sets is closed;
5. every finite intersection of open sets is open, and every finite union of closed sets is closed.

The example

$$
(0,1)=\bigcup_{n=2}^{\infty}[1/n,1-1/n]
$$

shows why the finite qualifier cannot simply be removed from the statement about unions of closed sets.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slides 15–16.

## Sequential characterization of closure and closedness

For $S\subset X$,

$$
x\in\bar S
$$

if and only if there is a sequence $(x_n)\subset S$ with $x_n\to x$. Consequently, $S$ is closed if and only if

$$
(x_n)\subset S
\text{ and }
x_n\to x
\implies x\in S.
$$

In the forward direction of the closure proof, if some term equals $x$, then $x\in S\subset\bar S$. If no term equals $x$, convergence places a point of $S$ other than $x$ in every ball around $x$, so $x$ is a limit point. Conversely, if $x\in S$, the constant sequence $x_n=x$ works; if $x\notin S$ but $x\in\bar S$, choosing $x_n\in B_{1/n}(x)\cap S$ gives $x_n\to x$.

**Course source:** [Lecture 6](../raw/lectures/lecture-06.md), slide 23.

## Connections

- [Metric spaces](metric-spaces.md) provide the distance underlying every definition on this page.
- [Sequences and convergence](sequences-and-convergence.md) explains the sequential criterion used for closure and closedness.
- [Cauchy sequences and metric completeness](cauchy-sequences-and-metric-completeness.md) relates closed subsets to complete subspaces.
- [Compactness](compactness.md) implies closedness and boundedness, and closed subsets of compact metric spaces are compact.
- [Continuity in metric spaces](continuity-in-metric-spaces.md) can be characterized by inverse images of open or closed sets.
