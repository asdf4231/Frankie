# Sets and Subsets

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slides 4–9, 18

## Overview

A set is a collection of objects called elements. Set membership, equality, inclusion, and power sets provide the basic language used throughout the course.

## Sets and membership

If $x$ is an element of a set $S$, write $x\in S$; otherwise write $x\notin S$. Sets may be described by listing their elements or by specifying a property their elements satisfy, as in

$$
\{1,2,3\},
\qquad
\{x:x\text{ is irrational}\},
\qquad
\{n\in\mathbb{N}:n^2<7\}.
$$

The lecture emphasizes that sets occur throughout economics, including consumption sets, production sets, sets of players, and sets of equilibria.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slides 4–6.

## Equality, the empty set, and subsets

Two sets $A$ and $B$ are equal when they have the same elements. The empty set, denoted by $\emptyset$, has no elements.

The course defines $A\subset B$ by

$$
\forall x\in A,\quad x\in B.
$$

Thus, $\subset$ denotes the subset relation in this course and does not require a strict or proper inclusion. A standard way to prove $A=B$ is to prove both $A\subset B$ and $B\subset A$.

Set inclusion is transitive: if $A\subset B$ and $B\subset C$, then $A\subset C$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slides 7–9.

## Power set

The power set of $A$, denoted by $\mathcal{P}(A)$, is the set of all subsets of $A$. For example, if $A=\{1,2\}$, then

$$
\mathcal{P}(A)=\{\emptyset,\{1\},\{2\},\{1,2\}\}.
$$

The lecture also notes that $\emptyset\subset A$ and $\emptyset\in\mathcal{P}(A)$ for every set $A$, while $\{\emptyset\}$ is not empty because it contains the element $\emptyset$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slides 7–8.

## Common number sets

The course uses the following notation:

- $\mathbb{N}=\{1,2,\ldots\}$ for the natural numbers;
- $\mathbb{Z}=\{\ldots,-1,0,1,\ldots\}$ for the integers;
- $\mathbb{Q}=\{p/q:p,q\in\mathbb{Z},\ q\neq0\}$ for the rational numbers;
- $\mathbb{R}$ for the real numbers;
- $\mathbb{C}$ for the complex numbers.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 18.

## Connections

- [Set operations](set-operations.md) construct new sets using unions, intersections, differences, and complements.
- The [Cartesian product](cartesian-product.md) constructs sets of ordered tuples.
- [Functions, images, and inverse images](../functions/functions-images-and-inverse-images.md) use sets as domains and codomains.
