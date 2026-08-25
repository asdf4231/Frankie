# Bounded and Monotone Functions

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slides 42–43

## Overview

For real-valued functions, bounds and extrema are defined through the range. Monotonicity describes how function values respond to the order of their arguments.

## Bounds, maxima, and maximizers

Let $f\colon X\to Y$ be real-valued, meaning that $Y\subset\mathbb{R}$. Upper bounds, the supremum, and the maximum of $f$ are defined as the corresponding upper bounds, supremum, and maximum of its range

$$
f(X)\subset\mathbb{R}.
$$

Arguments $x$ at which $f(x)$ equals the maximum are called maximizers. The function is bounded if its range is bounded.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 42.

## Monotonicity

When $X\subset\mathbb{R}$:

- $f$ is increasing if

  $$
  x\leq x'\implies f(x)\leq f(x');
  $$

- $f$ is decreasing if

  $$
  x\leq x'\implies f(x)\geq f(x');
  $$

- $f$ is monotonic if it is increasing or decreasing;
- $f$ is strictly increasing if

  $$
  x<x'\implies f(x)<f(x');
  $$

- $f$ is strictly decreasing if

  $$
  x<x'\implies f(x)>f(x').
  $$

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 43.

## Connections

- [Bounds, suprema, and completeness](bounds-suprema-and-completeness.md) defines the set-based bounds and extrema applied to the range here.
- The [real number system](real-number-system.md) supplies the order relation used in the monotonicity definitions.
- [Functions, images, and inverse images](../functions/functions-images-and-inverse-images.md) provides the general function and range terminology.
