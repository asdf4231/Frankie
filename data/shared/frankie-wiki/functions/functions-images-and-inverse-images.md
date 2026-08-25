# Functions, Images, and Inverse Images

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slides 20–21, 23; [Lecture 2](../raw/lectures/lecture-02.md), slides 3–5

## Overview

A function assigns one codomain element to each domain element. Images and inverse images describe how a function relates subsets of its domain and codomain.

## Functions, domains, and codomains

A function, map, or mapping $f$ from $X$ to $Y$ assigns to every $x\in X$ an element $f(x)\in Y$. The lecture writes

$$
\begin{aligned}
f\colon X&\to Y,\\
x&\mapsto f(x).
\end{aligned}
$$

Here $X$ is the domain, $Y$ is the codomain, $x$ is an argument, and $f(x)$ is the image of $f$ at $x$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 20.

## Images, range, and inverse images

For $S\subset X$, the image of $S$ under $f$ is

$$
f(S)=\{f(x):x\in S\}.
$$

The image $f(X)$ of the entire domain is the range of $f$.

For $T\subset Y$, the inverse image of $T$ is

$$
f^{-1}(T):=\{x:f(x)\in T\}.
$$

In this set-valued use, $f^{-1}(T)$ is defined whether or not $f$ is an invertible function.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 21.

## Injective, surjective, and bijective functions

A function is injective, or one-one, if each $y\in Y$ is the image of at most one $x\in X$. It is surjective, or onto, if every $y\in Y$ is the image of at least one $x\in X$. It is bijective if it is both injective and surjective.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 21.

## Images of unions and intersections

Direct images preserve unions:

$$
f(C\cup D)=f(C)\cup f(D),
$$

$$
f\left(\bigcup_{\lambda\in J}A_\lambda\right)
=\bigcup_{\lambda\in J}f(A_\lambda).
$$

For intersections, the lecture states only inclusions in general:

$$
f(C\cap D)\subset f(C)\cap f(D),
$$

$$
f\left(\bigcap_{\lambda\in J}A_\lambda\right)
\subset\bigcap_{\lambda\in J}f(A_\lambda).
$$

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 23.

## Inverse images and set operations

Inverse images preserve both unions and intersections:

$$
f^{-1}(C\cup D)=f^{-1}(C)\cup f^{-1}(D),
$$

$$
f^{-1}\left(\bigcup_{\lambda\in J}A_\lambda\right)
=\bigcup_{\lambda\in J}f^{-1}(A_\lambda),
$$

$$
f^{-1}(C\cap D)=f^{-1}(C)\cap f^{-1}(D),
$$

$$
f^{-1}\left(\bigcap_{\lambda\in J}A_\lambda\right)
=\bigcap_{\lambda\in J}f^{-1}(A_\lambda).
$$

They also preserve complements:

$$
(f^{-1}(A))^c=f^{-1}(A^c).
$$

The lecture indicates, in compressed form, that there is no analogous general direct-image identity for complements. It also states

$$
A\subset f^{-1}(f(A)).
$$

Lecture 2 adds the complementary inclusion for a subset $V$ of the codomain:

$$
f(f^{-1}(V))\subset V.
$$

**Course sources:** [Lecture 1](../raw/lectures/lecture-01.md), slide 23; [Lecture 2](../raw/lectures/lecture-02.md), slide 5.

## Connections

- [Set operations](../set-theory/set-operations.md) defines the unions, intersections, and complements used here.
- [Composition and invertibility](composition-and-invertibility.md) develops inverse functions and the relation between invertibility and bijectivity.
- [Cardinality and countability](../set-theory/cardinality-and-countability.md) compares sets through injections and bijections.
