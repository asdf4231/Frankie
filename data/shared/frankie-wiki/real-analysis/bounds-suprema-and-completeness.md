# Bounds, Suprema, and Completeness

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slides 37–39, 41; [Lecture 6](../raw/lectures/lecture-06.md), slide 29

## Overview

Bounds describe how a set sits within the real-number order. Suprema and infima identify the tightest bounds, while least-upper-bound completeness guarantees that suitable real sets possess them. This order property is distinct from the metric completeness introduced through Cauchy sequences.

## Upper and lower bounds

For a set $S\subset\mathbb{R}$, a number $a$ is an upper bound if

$$
x\leq a\quad\text{for all }x\in S.
$$

A set is bounded above if it has an upper bound. Lower bounds and boundedness below are defined analogously.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 37.

## Supremum, infimum, maximum, and minimum

A number $b$ is the least upper bound, or supremum, of $S$ if it is an upper bound and

$$
b\leq a
$$

for every upper bound $a$ of $S$. A maximum is a supremum that belongs to the set itself.

The greatest lower bound, or infimum, and the minimum are defined analogously.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 37.

## Least-upper-bound completeness

**A12 Least Upper Bound Completeness Axiom.** If $S$ is a nonempty set of real numbers that is bounded above, then $S$ has a least upper bound in $\mathbb{R}$.

The lecture gives the corresponding corollary: if $S$ is nonempty and bounded below, then it has a greatest lower bound in $\mathbb{R}$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 38.

## Least-upper-bound completeness versus metric completeness

The completeness axiom on this page is an order statement about nonempty subsets of $\mathbb{R}$ that are bounded above. Lecture 6 uses **metric completeness** for a different definition: a metric space is complete when every Cauchy sequence in it has a limit in the space.

The two notions should therefore be named explicitly rather than silently treated as the same definition.

**Course sources:** [Lecture 1](../raw/lectures/lecture-01.md), slide 38; [Lecture 6](../raw/lectures/lecture-06.md), slide 29.

## Epsilon characterization of a supremum

For a nonempty set $S\subset\mathbb{R}$, the lecture states that $b$ is the supremum of $S$ if and only if

1. $x\leq b$ for every $x\in S$; and
2. for every $\epsilon>0$, there is an $x\in S$ such that

   $$
   x>b-\epsilon.
   $$

The first condition says that $b$ is an upper bound. The second says that elements of $S$ occur above every level $b-\epsilon$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 39.

## Course exercise

Prove that

$$
\sup\{x\in\mathbb{R}:x<3\}=3.
$$

The lecture leaves the proof open.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 41.

## Connections

- The [real number system](real-number-system.md) supplies the order relation used to define bounds.
- The [Archimedean property](archimedean-property.md) is established by applying the completeness axiom to $\mathbb{N}$.
- [Bounded and monotone functions](bounded-and-monotone-functions.md) transfers the language of bounds and extrema from sets to function ranges.
- [Sequences and convergence](sequences-and-convergence.md) records the bounded-monotone convergence theorem that the lecture connects to this axiom.
- [Cauchy sequences and metric completeness](cauchy-sequences-and-metric-completeness.md) develops the distinct metric-space notion of completeness.
