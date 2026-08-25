# Cardinality and Countability

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slides 26–28

## Overview

Cardinality compares the sizes of sets through functions between them. Bijections define equal cardinality, while injections provide a non-strict comparison of cardinalities.

## Equivalence and cardinality

Two sets $X$ and $Y$ are equivalent when there is a bijection $f\colon X\to Y$; the lecture writes this as

$$
X\sim Y.
$$

Equivalent sets have the same cardinality. The lecture uses an injection from $X$ into $Y$ to compare their sizes; stated non-strictly, this means that $Y$ has cardinality at least as high as $X$.

**Source note:** Slide 26 phrases the injection-based comparison as “higher cardinality.”

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 26.

## Finite, countable, and uncountable sets

A set is finite if it is empty or equivalent to $\{1,2,\ldots,n\}$ for some $n\in\mathbb{N}$. Otherwise it is infinite.

A set is denumerable, or countably infinite, if it is equivalent to $\mathbb{N}$. A set is countable if it is finite or denumerable. The lecture denotes the cardinality of a denumerable set by $d$.

A set is uncountable if it is not countable. A set equivalent to $\mathbb{R}$ is assigned cardinality $c$ in the lecture.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 27.

## Results stated in the lecture

The lecture states the following:

1. Any subset of a countable set is countable.
2. $\mathbb{Q}$ is denumerable.
3. The even numbers are equivalent to $\mathbb{N}$, and $(0,1)$ is equivalent to $\mathbb{R}$.
4. $\mathbb{N}$ and $(0,1)$ are not equivalent.
5. The product of two countable sets is countable.
6. $\mathbb{R}^n$ has cardinality $c$.
7. The product of two sets of cardinality $c$ has cardinality $c$.
8. A countable union of countable sets is countable.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 28.

## Connections

- [Functions, images, and inverse images](../functions/functions-images-and-inverse-images.md) defines injective, surjective, and bijective maps.
- [Composition and invertibility](../functions/composition-and-invertibility.md) shows that bijectivity is equivalent to invertibility.
- The [Cartesian product](cartesian-product.md) is the set construction appearing in several cardinality results.
