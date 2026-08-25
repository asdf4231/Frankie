# Archimedean Property

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slide 40

## Overview

The lecture presents the Archimedean property as the statement that the natural numbers are not bounded above in the real numbers. It also states density results for rational and irrational numbers.

## The natural numbers are unbounded above

**Theorem.** The set $\mathbb{N}$ is not bounded above.

Suppose instead that $\mathbb{N}$ is bounded above. By completeness it has a supremum $b\in\mathbb{R}$, so $n\leq b$ for every $n\in\mathbb{N}$. Since $n+1\in\mathbb{N}$, it follows that $n+1\leq b$ and hence $n\leq b-1$ for every $n\in\mathbb{N}$. Thus $b-1$ is also an upper bound, contradicting that $b$ is the least upper bound.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 40.

## Density statements

The lecture's compressed “rational (irrational)” wording gives parallel statements for rational and irrational numbers:

- If $x,y\in\mathbb{R}$ and $x<y$, then there is a rational number $r$ with $x<r<y$, and there is also an irrational number with the same property.
- If $x\in\mathbb{R}$ and $\epsilon>0$, then there is a rational number $r$ with $0<|r-x|<\epsilon$, and there is also an irrational number with the same property.

The lecture states these results on the Archimedean-property slide but does not include their proofs there.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 40.

## Connections

- [Bounds, suprema, and completeness](bounds-suprema-and-completeness.md) supplies the completeness axiom used in the proof.
- The order structure comes from the [real number system](real-number-system.md).
