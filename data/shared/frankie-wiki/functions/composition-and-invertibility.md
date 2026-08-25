# Composition and Invertibility

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slides 24–25; [Lecture 2](../raw/lectures/lecture-02.md), slide 4

## Overview

Composition combines functions in sequence. Identity functions and inverse functions describe when a mapping can be undone, and the lecture proves that invertibility is equivalent to bijectivity.

## Composition and identity

If $f\colon A\to B$ and $g\colon C\to D$ with $B\subseteq C$, their composition $g\circ f\colon A\to D$ is defined by

$$
(g\circ f)(x)=g(f(x)).
$$

The case $B=C$ is the form used in Lecture 1.

The identity function on $X$ is

$$
Id_X(x)=x
$$

for every $x\in X$.

Composition is associative:

$$
h\circ(g\circ f)=(h\circ g)\circ f.
$$

For the example $f(x)=x^2$ and $g(x)=\sin(x)$,

$$
(g\circ f)(x)=\sin(x^2),
\qquad
(f\circ g)(x)=\sin^2(x).
$$

**Course sources:** [Lecture 1](../raw/lectures/lecture-01.md), slide 24; [Lecture 2](../raw/lectures/lecture-02.md), slide 4.

## Inverse functions

A function $f\colon X\to Y$ is invertible if there is a function $g\colon Y\to X$ such that

$$
f\circ g=Id_Y,
\qquad
g\circ f=Id_X.
$$

In this case, $g$ is the inverse of $f$ and is denoted by $f^{-1}$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 24.

## Bijectivity and invertibility

**Proposition.** A function is bijective if and only if it is invertible.

If $f$ is bijective, then for each $y\in Y$ there is a unique $x\in X$ with $f(x)=y$. Define $g(y)$ to be this unique $x$. Then $f(g(y))=y$, so $f\circ g=Id_Y$, and the uniqueness construction also gives $g(f(x))=x$, so $g\circ f=Id_X$.

Conversely, if $f$ has an inverse, then each $y\in Y$ has the preimage $f^{-1}(y)$, so $f$ is onto. If $f(x')=y$, applying $f^{-1}$ gives $x'=f^{-1}(y)$, so the preimage is unique and $f$ is one-one. Therefore $f$ is bijective.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 25.

## Connections

- [Functions, images, and inverse images](functions-images-and-inverse-images.md) defines injectivity, surjectivity, and bijectivity.
- Bijections are the equivalences used to define [cardinality and countability](../set-theory/cardinality-and-countability.md).
