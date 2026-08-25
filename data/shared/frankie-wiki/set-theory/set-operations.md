# Set Operations

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slides 10, 12–15

## Overview

Union, intersection, difference, and complement construct new sets from existing sets. Their algebraic identities are used to compare sets and simplify set expressions.

## Union, intersection, and disjointness

For sets $A$ and $B$, define

$$
A\cup B:=\{x:x\in A\text{ or }x\in B\},
$$

and

$$
A\cap B:=\{x:x\in A\text{ and }x\in B\}.
$$

The sets are disjoint when $A\cap B=\emptyset$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 10.

## Operations on indexed families

If $\mathscr{F}$ is a family of sets, then

$$
\bigcup\mathscr{F}:=\{x:x\in A\text{ for at least one }A\in\mathscr{F}\},
$$

and

$$
\bigcap\mathscr{F}:=\{x:x\in A\text{ for every }A\in\mathscr{F}\}.
$$

When $\mathscr{F}=\{A_\lambda:\lambda\in J\}$, these operations may be written as

$$
\bigcup_{\lambda\in J}A_\lambda,
\qquad
\bigcap_{\lambda\in J}A_\lambda.
$$

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 12.

## Algebra of union and intersection

Union and intersection are commutative and associative:

$$
A\cup B=B\cup A,
\qquad
A\cap B=B\cap A,
$$

$$
A\cup(B\cup C)=(A\cup B)\cup C,
\qquad
A\cap(B\cap C)=(A\cap B)\cap C.
$$

They characterize inclusion through

$$
A\subset B\iff A\cup B=B,
\qquad
A\subset B\iff A\cap B=A.
$$

They also distribute over one another:

$$
A\cap(B\cup C)=(A\cap B)\cup(A\cap C),
$$

$$
A\cup(B\cap C)=(A\cup B)\cap(A\cup C),
$$

with the corresponding indexed identities

$$
A\cap\bigcup_{\lambda\in J}B_\lambda
=\bigcup_{\lambda\in J}(A\cap B_\lambda),
$$

$$
A\cup\bigcap_{\lambda\in J}B_\lambda
=\bigcap_{\lambda\in J}(A\cup B_\lambda).
$$

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 13.

## Difference and complement

The difference of $A$ and $B$ is

$$
A\setminus B:=\{x:x\in A\text{ and }x\notin B\}.
$$

If a universal set $U$ contains all objects under consideration, the complement of $A$ in $U$ is

$$
A^c:=U\setminus A.
$$

The complement therefore depends on the chosen universal set. For example, if $A=(0,1)$, then its complement is $(-\infty,0]\cup[1,+\infty)$ when $U=\mathbb{R}$, but it is $\{0,1\}$ when $U=[0,1]$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 14.

## De Morgan's laws

For sets $A$, $B$, and an indexed family $\{A_\lambda:\lambda\in J\}$,

$$
(A\cup B)^c=A^c\cap B^c,
\qquad
(A\cap B)^c=A^c\cup B^c,
$$

and

$$
\left(\bigcup_{\lambda\in J}A_\lambda\right)^c
=\bigcap_{\lambda\in J}A_\lambda^c,
$$

$$
\left(\bigcap_{\lambda\in J}A_\lambda\right)^c
=\bigcup_{\lambda\in J}A_\lambda^c.
$$

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 15.

## Connections

- [Sets and subsets](sets-and-subsets.md) supplies the membership and inclusion relations used in these definitions.
- [Functions, images, and inverse images](../functions/functions-images-and-inverse-images.md) describes how these operations behave under a function.
