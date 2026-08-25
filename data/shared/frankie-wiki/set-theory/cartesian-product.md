# Cartesian Product

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slides 16–17

## Overview

The Cartesian product forms a set of ordered tuples by selecting one element from each component set.

## Ordered pairs and two-set products

An ordered pair with first member $x$ and second member $y$ is denoted by $(x,y)$. Its defining equality property is

$$
(x,y)=(a,b)\iff x=a\text{ and }y=b.
$$

For sets $A$ and $B$, their Cartesian product is

$$
A\times B:=\{(a,b):a\in A,\ b\in B\}.
$$

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 16.

## Finite products

For sets $A_1,\ldots,A_n$, the product is

$$
\prod_{i=1}^n A_i
:=\{(a_1,a_2,\ldots,a_n):a_i\in A_i,\ \forall i=1,2,\ldots,n\}.
$$

A central example is

$$
\mathbb{R}^n
=\underbrace{\mathbb{R}\times\mathbb{R}\times\cdots\times\mathbb{R}}_{n\text{ times}}.
$$

For finite sets, the lecture gives

$$
\{1,2\}\times\{3,4\}
=\{(1,3),(1,4),(2,3),(2,4)\}.
$$

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slides 16–17.

## Connections

- [Sets and subsets](sets-and-subsets.md) provides the component sets used in a product.
- [Cardinality and countability](cardinality-and-countability.md) includes results about the cardinality of products.
- Products such as $\mathbb{R}^n$ serve as domains and codomains for [functions](../functions/functions-images-and-inverse-images.md).
