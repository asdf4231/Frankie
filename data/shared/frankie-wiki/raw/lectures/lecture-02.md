# Lecture 2 — Functions of Several Variables

> Course: Dynamic Optimization
> Original: slides/lecture02-functions_of_several_variables.tex
> PDF: slides/lecture02-functions_of_several_variables.pdf
> Snapshot: v1
> Normalization notes: The course-defined macro for the real numbers has been expanded to $\mathbb{R}$ for Markdown rendering.

## L02-S01 — Lecture 2: Functions of Several Variables

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Fall, 2026

## L02-S02 — Outline

> PDF pages: 2
> Section: Functions of Several Variables

1. Functions of Several Variables
2. Partial Derivatives
3. The Total Derivative
4. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
5. The Chain Rule
6. Directional Derivative
7. Higher Order Derivatives
8. Implicit Function Theorem

## L02-S03 — Definitions

> PDF pages: 3
> Section: Functions of Several Variables

A function $f\colon A\to B$ is a rule that assigns to **each** object in $A$, **one and only one** object in $B$.

- Domain: the set $A$ of elements on which $f$ is defined.
- Target/Codomain: the set $B$ in which $f$ takes its values.
- Image of $x$ under $f$: $y=f(x)\in B$.
- Range: the image of $A$ under $f$.
- Preimage: the preimage of $V$ is

  $$
  f^{-1}(V)=\{a\in A:f(a)\in V\}.
  $$

## L02-S04 — Definitions

> PDF pages: 4
> Section: Functions of Several Variables

- We say $f$ is **one-one** or **injective** if for every $b\in B$, there is at most one $a\in A$ such that $b=f(a)$.
- We say $f$ is **onto** or **surjective** if for every $b\in B$, there exists $a\in A$ such that $b=f(a)$.
- If $f$ is both one-one and onto, we say $f$ is **bijective**.
- Let $f\colon A\to B$ and $g\colon C\to D$ be two functions. Suppose that $B\subseteq C$. Then the composition of $f$ with $g$ is defined as the function

  $$
  (g\circ f)(x)=g(f(x))
  $$

  for all $x\in A$.
- We say $f\colon A\to B$ is **invertible** if there exists $g\colon B\to A$ such that $(f\circ g)(b)=b$ for all $b\in B$ and $(g\circ f)(a)=a$ for all $a\in A$. In this case, $g$ is the **inverse** of $f$ and is denoted by $f^{-1}$.

## L02-S05 — Properties

> PDF pages: 5
> Section: Functions of Several Variables

**Theorem 13.6**

$$
\begin{aligned}
f(U\cup V)&=f(U)\cup f(V),
&\qquad
f(U\cap V)&\subset f(U)\cap f(V),\\
f^{-1}(U\cup V)&=f^{-1}(U)\cup f^{-1}(V),
&
f^{-1}(U\cap V)&=f^{-1}(U)\cap f^{-1}(V),\\
U&\subset f^{-1}(f(U)),
&
f(f^{-1}(V))&\subset V,\\
(f^{-1}(V))^c&=f^{-1}(V^c),
&
\text{no general results for }f.
\end{aligned}
$$

## L02-S06 — Functions between Euclidean Spaces

> PDF pages: 6
> Section: Functions of Several Variables

**Linear Functions**

A linear function (or linear transformation) from $\mathbb{R}^k$ to $\mathbb{R}^m$ is a function $f$ that preserves the vector-space structure:

$$
f(x+y)=f(x)+f(y),
\qquad
f(rx)=rf(x)
$$

for all $x,y\in\mathbb{R}^k$ and all $r\in\mathbb{R}$.

**Theorem 13.1.** Let $f\colon\mathbb{R}^k\to\mathbb{R}^1$ be a linear function. Then there exists a vector $a\in\mathbb{R}^k$ such that

$$
f(x)=a\cdot x
$$

for all $x\in\mathbb{R}^k$.

**Theorem 13.2.** Let $f\colon\mathbb{R}^k\to\mathbb{R}^m$ be a linear function. Then there exists an $m\times k$ matrix $A$ such that

$$
f(x)=Ax
$$

for all $x\in\mathbb{R}^k$.

## L02-S07 — Functions between Euclidean Spaces

> PDF pages: 7
> Section: Functions of Several Variables

**Other Forms**

- Monomial: $f\colon\mathbb{R}^k\to\mathbb{R}^1$ is a monomial if

  $$
  f(x_1,\ldots,x_k)=cx_1^{a_1}x_2^{a_2}\cdots x_k^{a_k};
  $$

  $\sum_i a_i$ is called the degree of the monomial.
- Polynomial: a finite sum of monomials, the highest degree of which is the degree of the polynomial.
- Affine: $f(x)=Ax+b$, a polynomial of degree $1$.

## L02-S08 — Continuous Functions

> PDF pages: 8
> Section: Functions of Several Variables

**Continuity**

- Definition: $f$ is continuous at $x$ if

  $$
  x_n\to x\implies f(x_n)\to f(x).
  $$

- **Theorem 13.4:** Suppose $f$ and $g$ are continuous at $x$. Then $f+g$, $f-g$, and $f\cdot g$ are all continuous at $x$.
- **Theorem 13.5:** $f\colon\mathbb{R}^k\to\mathbb{R}^m$ is continuous if and only if $f_i\colon\mathbb{R}^k\to\mathbb{R}^1$ is continuous for all $i$.
- **Theorem 13.7:** If $f\colon\mathbb{R}^k\to\mathbb{R}^m$ is continuous at $x$ and $g\colon\mathbb{R}^m\to\mathbb{R}^n$ is continuous at $f(x)$, then $g\circ f$ is continuous at $x$.

## L02-S09 — Outline

> PDF pages: 9
> Section: Partial Derivatives

1. Functions of Several Variables
2. Partial Derivatives
3. The Total Derivative
4. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
5. The Chain Rule
6. Directional Derivative
7. Higher Order Derivatives
8. Implicit Function Theorem

## L02-S10 — Partial Derivatives: Definition

> PDF pages: 10
> Section: Partial Derivatives

- Consider a function $y=f(x_1,x_2,\ldots,x_n)$, where each $x_i$ can vary without affecting the others.
- If $x_i$ undergoes a change $\Delta x_i$ while all other $x_j$'s remain fixed, there will be a change in $y$, $\Delta y$.
- The partial derivative of $f$ with respect to $x_i$ is

  $$
  \frac{\partial f}{\partial x_i}(x_1^0,\ldots,x_i^0,\ldots,x_n^0)
  =\lim_{h\to0}
  \frac{f(x_1^0,\ldots,x_i^0+h,\ldots,x_n^0)-f(x_1^0,\ldots,x_i^0,\ldots,x_n^0)}{h}.
  $$

## L02-S11 — Partial Derivatives: Examples

> PDF pages: 11
> Section: Partial Derivatives

**Example 7**

$$
f(x,y)=3x^2y^2+4xy^3+7y.
$$

## L02-S12 — Outline

> PDF pages: 12
> Section: The Total Derivative

1. Functions of Several Variables
2. Partial Derivatives
3. The Total Derivative
4. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
5. The Chain Rule
6. Directional Derivative
7. Higher Order Derivatives
8. Implicit Function Theorem

## L02-S13 — Total Derivatives

> PDF pages: 13
> Section: The Total Derivative

Based on the definition of partial derivatives:

- $F(x^*+\Delta x,y^*)-F(x^*,y^*)\approx \frac{\partial F}{\partial x}(x^*,y^*)\Delta x$.
- $F(x^*,y^*+\Delta y)-F(x^*,y^*)\approx \frac{\partial F}{\partial y}(x^*,y^*)\Delta y$.
- $F(x^*+\Delta x,y^*+\Delta y)-F(x^*,y^*)\approx \frac{\partial F}{\partial x}(x^*,y^*)\Delta x+\frac{\partial F}{\partial y}(x^*,y^*)\Delta y$.

## L02-S14 — Total Derivatives: Geometric Interpretation

> PDF pages: 14
> Section: The Total Derivative

Linear approximation:

$$
F(x^*+\Delta x,y^*+\Delta y)
\approx F(x^*,y^*)
+\frac{\partial F}{\partial x}(x^*,y^*)\Delta x
+\frac{\partial F}{\partial y}(x^*,y^*)\Delta y.
$$

The “tangent plane” can be written as the parametric equation

$$
(x^*,y^*,F(x^*,y^*))
+s\left(1,0,\frac{\partial F}{\partial x}(x^*,y^*)\right)
+t\left(0,1,\frac{\partial F}{\partial y}(x^*,y^*)\right).
$$

## L02-S15 — Total Derivatives

> PDF pages: 15
> Section: The Total Derivative

- We use *differentials* $dF$, $dx$, and $dy$ to denote the variations on the tangent plane.
- The *total differential* is

  $$
  dF=\frac{\partial F}{\partial x}(x^*,y^*)dx
  +\frac{\partial F}{\partial y}(x^*,y^*)dy.
  $$

- Example: if $h=x^3\ln y$, then

  $$
  dh=3x^2\ln y\,dx+\frac{x^3}{y}\,dy.
  $$

## L02-S16 — Total Derivatives

> PDF pages: 16
> Section: The Total Derivative

Generally, for $y=F(x_1,x_2,\ldots,x_n)$:

- The total differential is

  $$
  dF
  =\frac{\partial F}{\partial x_1}(\mathbf{x^*})dx_1
  +\frac{\partial F}{\partial x_2}(\mathbf{x^*})dx_2
  +\cdots
  +\frac{\partial F}{\partial x_n}(\mathbf{x^*})dx_n.
  $$

- The Jacobian derivative of $F$ at $\mathbf{x^*}$ is

  $$
  DF_{\mathbf{x^*}}
  =\left(
  \frac{\partial F}{\partial x_1}(\mathbf{x^*}),
  \frac{\partial F}{\partial x_2}(\mathbf{x^*}),
  \ldots,
  \frac{\partial F}{\partial x_n}(\mathbf{x^*})
  \right).
  $$

- Thus,

  $$
  dF=DF_{\mathbf{x^*}}\cdot d\mathbf{x},
  \qquad
  d\mathbf{x}=(dx_1,dx_2,\ldots,dx_n)'.
  $$

## L02-S17 — Outline

> PDF pages: 17
> Section: Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

1. Functions of Several Variables
2. Partial Derivatives
3. The Total Derivative
4. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
5. The Chain Rule
6. Directional Derivative
7. Higher Order Derivatives
8. Implicit Function Theorem

## L02-S18 — Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

> PDF pages: 18
> Section: Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

- Functions with several endogenous variables:

  $$
  F=(f_1,f_2,\ldots,f_m)\colon\mathbb{R}^n\to\mathbb{R}^m.
  $$

- For each $f_i\colon\mathbb{R}^n\to\mathbb{R}$,

  $$
  \begin{aligned}
  f_1(\mathbf{x^*}+\Delta\mathbf{x})-f_1(\mathbf{x^*})
  &\approx
  \frac{\partial f_1}{\partial x_1}(\mathbf{x^*})\Delta x_1
  +\cdots+
  \frac{\partial f_1}{\partial x_n}(\mathbf{x^*})\Delta x_n,\\
  f_2(\mathbf{x^*}+\Delta\mathbf{x})-f_2(\mathbf{x^*})
  &\approx
  \frac{\partial f_2}{\partial x_1}(\mathbf{x^*})\Delta x_1
  +\cdots+
  \frac{\partial f_2}{\partial x_n}(\mathbf{x^*})\Delta x_n,\\
  &\vdots\\
  f_m(\mathbf{x^*}+\Delta\mathbf{x})-f_m(\mathbf{x^*})
  &\approx
  \frac{\partial f_m}{\partial x_1}(\mathbf{x^*})\Delta x_1
  +\cdots+
  \frac{\partial f_m}{\partial x_n}(\mathbf{x^*})\Delta x_n.
  \end{aligned}
  $$

## L02-S19 — Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

> PDF pages: 19
> Section: Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

Use vector and matrix notation:

$$
F(\mathbf{x^*+\Delta x})-F(\mathbf{x^*})
\approx
\begin{pmatrix}
\frac{\partial f_1}{\partial x_1}(\mathbf{x^*}) & \cdots & \frac{\partial f_1}{\partial x_n}(\mathbf{x^*})\\
\vdots & \ddots & \vdots\\
\frac{\partial f_m}{\partial x_1}(\mathbf{x^*}) & \cdots & \frac{\partial f_m}{\partial x_n}(\mathbf{x^*})
\end{pmatrix}
\begin{pmatrix}
\Delta x_1\\
\Delta x_2\\
\vdots\\
\Delta x_n
\end{pmatrix}.
$$

## L02-S20 — Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

> PDF pages: 20
> Section: Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

**Jacobian Derivative**

The matrix

$$
DF(\mathbf{x}^*)=F'(x^*)=
\begin{pmatrix}
\frac{\partial f_1}{\partial x_1}(\mathbf{x^*}) & \cdots & \frac{\partial f_1}{\partial x_n}(\mathbf{x^*})\\
\vdots & \ddots & \vdots\\
\frac{\partial f_m}{\partial x_1}(\mathbf{x^*}) & \cdots & \frac{\partial f_m}{\partial x_n}(\mathbf{x^*})
\end{pmatrix}
$$

is called the **Jacobian derivative** of $F$ at $\mathbf{x^*}$.

## L02-S21 — Jacobian Derivative: Example

> PDF pages: 21
> Section: Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

In a two-commodity world, consider the pair of constant-elasticity demand functions

$$
Q_1=6p_1^{-2}p_2^{3/2}y,
\qquad
Q_2=4p_1p_2^{-1}y^2
$$

when $p_1^*=6$, $p_2^*=9$, and $y^*=2$.

$$
dQ_1=-3dp_1+1.5dp_2+4.5dy,
$$

$$
dQ_2=\frac{16}{9}dp_1-\frac{32}{27}dp_2+\frac{32}{3}dy.
$$

If both prices rise by $0.1$ and income falls by $0.1$, then $dQ_1=-0.6$ and $dQ_2\approx-1$. You can verify this calculation in matrix notation.

## L02-S22 — Outline

> PDF pages: 22
> Section: The Chain Rule

1. Functions of Several Variables
2. Partial Derivatives
3. The Total Derivative
4. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
5. The Chain Rule
6. Directional Derivative
7. Higher Order Derivatives
8. Implicit Function Theorem

## L02-S23 — Curves

> PDF pages: 23
> Section: The Chain Rule

- We define a curve in $\mathbb{R}^n$ by

  $$
  \mathbf{x}(t)=(x_1(t),x_2(t),\ldots,x_n(t)),
  $$

  where each $x_i$ is a continuous map from $\mathbb{R}$ to $\mathbb{R}$.
- The $x_i(t)$ are **coordinate functions**, and $t$ is the parameter describing the curve.
- The line segment connecting $(0,0)$ and $(1,1)$ can be parameterized as

  $$
  x(t)=t,\quad y(t)=t,\quad 0\leq t\leq1,
  $$

  or

  $$
  x(t)=t^2,\quad y(t)=t^2,\quad 0\leq t\leq1.
  $$

- Parametric equations of a line.

## L02-S24 — The Velocity Vector

> PDF pages: 24
> Section: The Chain Rule

**Velocity Vector (Tangent Vector)**

- The velocity vector of the curve at $t$ is

  $$
  \mathbf{x}'(t)=(x_1'(t),\ldots,x_n'(t)).
  $$

- If $t$ represents time, then $x_i'(t)$ is the instantaneous velocity of the $i$-th coordinate along the curve at $t$.
- Consider $\mathbf{x}(t_0)$ as a vector in $\mathbb{R}^n$ with tail at $\mathbf{x}_0=\mathbf{x}(t_0)$. Then $\mathbf{x}'(t_0)$ will be tangent to the curve at $\mathbf{x}_0$.

## L02-S25 — Regular Curves

> PDF pages: 25
> Section: The Chain Rule

- A curve $\mathbf{x}(t)$ is regular if and only if $x_i'(t)$ is continuous and

  $$
  (x_1'(t),\ldots,x_n'(t))\neq(0,\ldots,0)
  $$

  for all $t$.
- Example: $x(t)=t^3$, $y(t)=t^2$. This curve has a cusp at the origin.

## L02-S26 — Along a Curve: Chain Rule I

> PDF pages: 26
> Section: The Chain Rule

**Chain Rule I (Theorem 14.1)**

If $\mathbf{x}(t)=(x_1(t),\ldots,x_n(t))$ is a $C^1$ curve on an interval about $t_0$ and $f$ is a $C^1$ function on a ball about $\mathbf{x}(t_0)$, then

$$
g(t)\equiv f(x_1(t),\ldots,x_n(t))
$$

is a $C^1$ function at $t_0$ and

$$
\frac{dg}{dt}(t_0)
=\frac{\partial f}{\partial x_1}(\mathbf{x}(t_0))x_1'(t_0)
+\cdots+
\frac{\partial f}{\partial x_n}(\mathbf{x}(t_0))x_n'(t_0).
$$

## L02-S27 — Along a Curve: Chain Rule I

> PDF pages: 27
> Section: The Chain Rule

Example:

- Given $f(x,y)=x^2+y^2$, let $x(t)=t$ and $y(t)=t$. Then $(x(t),y(t))$ is a straight line through the origin.
- $g(t)=f(x(t),y(t))$ measures the squared distance from the origin as one moves along the line.
- $\partial f/\partial x=2x$, $\partial f/\partial y=2y$, and $x'(t)=y'(t)=1$. When $t=1$, $x=y=1$. Therefore,

  $$
  g'(1)
  =\frac{\partial f}{\partial x}(1,1)\cdot1
  +\frac{\partial f}{\partial y}(1,1)\cdot1
  =4.
  $$

## L02-S28 — The Chain Rule

> PDF pages: 28
> Section: The Chain Rule

**Chain Rule (Theorem 14.3)**

Let $F\colon\mathbb{R}^n\to\mathbb{R}^m$ and $\mathbf{a}\colon\mathbb{R}\to\mathbb{R}^n$ be $C^1$ functions. Then the composite function

$$
g(t)=F(\mathbf{a}(t))
$$

is a $C^1$ function from $\mathbb{R}$ to $\mathbb{R}^m$, and

$$
\begin{aligned}
g_i'(t)
&=\sum_{j=1}^n
\frac{\partial F_i}{\partial x_j}(a_1(t),\ldots,a_n(t))a_j'(t)\\
&=DF_i(\mathbf{a}(t))\cdot\mathbf{a}'(t).
\end{aligned}
$$

Putting all component conditions together:

$$
g'(t)=DF(\mathbf{a}(t))\cdot\mathbf{a}'(t).
$$

## L02-S29 — Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

> PDF pages: 29
> Section: The Chain Rule

**Example 14.14**

Consider the demand functions from the previous example:

$$
Q_1=6p_1^{-2}p_2^{3/2}y,
\qquad
Q_2=4p_1p_2^{-1}y^2.
$$

Let

$$
p_1(t)=\sqrt{12t},
\qquad
p_2(t)=t^2,
\qquad
y(t)=t-1.
$$

How is the demand changing with respect to time at $t=3$?

## L02-S30 — Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

> PDF pages: 30
> Section: The Chain Rule

**General Chain Rule (Theorem 14.4)**

Let $F\colon\mathbb{R}^n\to\mathbb{R}^m$ and $A\colon\mathbb{R}^s\to\mathbb{R}^n$ be $C^1$ functions. Let $\mathbf{x^*}=A(\mathbf{s^*})\in\mathbb{R}^n$. Consider the composite function

$$
H=F\circ A\colon\mathbb{R}^s\to\mathbb{R}^m.
$$

Let $DF(\mathbf{x^*})$ be the $m\times n$ Jacobian matrix of $F$ at $\mathbf{x^*}$ and $DA(\mathbf{s^*})$ be the $n\times s$ Jacobian matrix of $A$ at $\mathbf{s^*}$. Then the Jacobian matrix of $H$ is

$$
DH(\mathbf{s^*})=DF(\mathbf{x^*})\cdot DA(\mathbf{s^*}).
$$

## L02-S31 — Outline

> PDF pages: 31
> Section: Directional Derivative

1. Functions of Several Variables
2. Partial Derivatives
3. The Total Derivative
4. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
5. The Chain Rule
6. Directional Derivative
7. Higher Order Derivatives
8. Implicit Function Theorem

## L02-S32 — Directional Derivatives

> PDF pages: 32
> Section: Directional Derivative

- To compute the rate of change at a given point in any direction.
- $\mathbf{x}=\mathbf{x^*}+t\mathbf{v}$.
- Evaluate $F$ along the line:

  $$
  g(t)=F(\mathbf{x^*}+t\mathbf{v})
  =F(x_1^*+tv_1,\ldots,x_n^*+tv_n).
  $$

## L02-S33 — Directional Derivatives

> PDF pages: 33
> Section: Directional Derivative

Take the derivative of $g$ at $0$:

$$
\begin{aligned}
g'(0)
&=\frac{\partial F}{\partial x_1}(\mathbf{x^*})v_1
+\cdots+
\frac{\partial F}{\partial x_n}(\mathbf{x^*})v_n\\
&=
\left(
\frac{\partial F}{\partial x_1}(\mathbf{x^*}),
\ldots,
\frac{\partial F}{\partial x_n}(\mathbf{x^*})
\right)
\begin{pmatrix}
v_1\\
v_2\\
\vdots\\
v_n
\end{pmatrix}\\
&=DF_{\mathbf{x^*}}\cdot\mathbf{v}
=\frac{\partial F}{\partial v}(\mathbf{x}^*)
=D_vF(\mathbf{x}^*).
\end{aligned}
$$

This is called the derivative of $F$ at $\mathbf{x^*}$ in the direction of $\mathbf{v}$, or the directional derivative of $F$ with respect to $v$ at $\mathbf{x}^*$.

## L02-S34 — The Gradient Vector

> PDF pages: 34
> Section: Directional Derivative

- The gradient vector is

  $$
  \nabla F_{\mathbf{x^*}}
  =
  \begin{pmatrix}
  \frac{\partial F}{\partial x_1}(\mathbf{x^*})\\
  \vdots\\
  \frac{\partial F}{\partial x_n}(\mathbf{x^*})
  \end{pmatrix}.
  $$

- Think of it as a vector in $\mathbb{R}^n$ with tail at $\mathbf{x^*}$.
- Considering only unit vectors $\mathbf{v}$, $DF_{\mathbf{x^*}}\cdot\mathbf{v}$ measures the rate of change from $\mathbf{x^*}$ in the direction $\mathbf{v}$.
- Example 14.9.

## L02-S35 — The Gradient Vector: Theorem

> PDF pages: 35
> Section: Directional Derivative

**Theorem 14.2**

Let $F\colon\mathbb{R}^n\to\mathbb{R}$ be a $C^1$ function. At any point $\mathbf{x}$ at which $\nabla F(\mathbf{x})\neq\mathbf{0}$, the gradient vector $\nabla F(\mathbf{x})$ points at $\mathbf{x}$ into the direction in which $F$ increases most rapidly.

Example: Consider the production function

$$
Q=F(K,L)=4K^{3/4}L^{1/4}.
$$

Current input bundles is $(10{,}000,625)$. In what proportions we should add $K$ and $L$ to increase the production most rapidly?

## L02-S36 — The Gradient Vector: Example

> PDF pages: 36
> Section: Directional Derivative

Solution: We compute the gradient vector of $F$ at $(10{,}000,625)$:

$$
\nabla F(10{,}000,625)
=
\begin{pmatrix}
1.5\\
8
\end{pmatrix}.
$$

So we deduce that we should add $K$ and $L$ at a ratio of $1.5$ to $8$.

- Exercise 14.18.

## L02-S37 — Outline

> PDF pages: 37
> Section: Higher Order Derivatives

1. Functions of Several Variables
2. Partial Derivatives
3. The Total Derivative
4. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
5. The Chain Rule
6. Directional Derivative
7. Higher Order Derivatives
8. Implicit Function Theorem

## L02-S38 — Cross Partial Derivatives

> PDF pages: 38
> Section: Higher Order Derivatives

- For $y=f(x_1,\ldots,x_n)$, define

  $$
  \frac{\partial^2 f}{\partial x_j\partial x_i},
  \qquad i\neq j,
  $$

  as the **cross/mixed partial derivatives**.
- $C^1$: continuously differentiable, $f'$ is continuous.
- $C^2$: twice continuously differentiable, $f''$ is continuous.
- Suppose that $y=f(x_1,\ldots,x_n)$ is $C^2$ in $\mathbb{R}^n$. Then

  $$
  \frac{\partial^2f}{\partial x_i\partial x_j}(\mathbf{x})
  =
  \frac{\partial^2f}{\partial x_j\partial x_i}(\mathbf{x}).
  $$

## L02-S39 — Hessian Matrix

> PDF pages: 39
> Section: Higher Order Derivatives

The Hessian matrix of $f$ is defined as

$$
D^2f_{x^*}
=
\begin{pmatrix}
\frac{\partial^2f}{\partial x_1^2}(\mathbf{x^*}) & \cdots & \frac{\partial^2f}{\partial x_n\partial x_1}(\mathbf{x^*})\\
\vdots & \ddots & \vdots\\
\frac{\partial^2f}{\partial x_1\partial x_n}(\mathbf{x^*}) & \cdots & \frac{\partial^2f}{\partial x_n^2}(\mathbf{x^*})
\end{pmatrix}.
$$

Example: consider the production function

$$
Q=4K^{3/4}L^{1/4}.
$$

Then

$$
\frac{\partial Q}{\partial K}=3K^{-1/4}L^{1/4},
\qquad
\frac{\partial Q}{\partial L}=K^{3/4}L^{-3/4}.
$$

## L02-S40 — Hessian Matrix

> PDF pages: 40
> Section: Higher Order Derivatives

Then

$$
\begin{aligned}
\frac{\partial^2Q}{\partial L\partial K}
&=\frac{\partial}{\partial L}\left(\frac{\partial Q}{\partial K}\right)
=\frac{\partial}{\partial L}\left(3K^{-1/4}L^{1/4}\right)
=\frac{3}{4}K^{-1/4}L^{-3/4},\\
\frac{\partial^2Q}{\partial K\partial L}
&=\frac{\partial}{\partial K}\left(\frac{\partial Q}{\partial L}\right)
=\frac{\partial}{\partial K}\left(K^{3/4}L^{-3/4}\right)
=\frac{3}{4}K^{-1/4}L^{-3/4},\\
\frac{\partial^2Q}{\partial L^2}
&=\frac{\partial}{\partial L}\left(\frac{\partial Q}{\partial L}\right)
=\frac{\partial}{\partial L}\left(K^{3/4}L^{-3/4}\right)
=-\frac{3}{4}K^{3/4}L^{-7/4},\\
\frac{\partial^2Q}{\partial K^2}
&=\frac{\partial}{\partial K}\left(\frac{\partial Q}{\partial K}\right)
=\frac{\partial}{\partial K}\left(3K^{-1/4}L^{1/4}\right)
=-\frac{3}{4}K^{-5/4}L^{1/4}.
\end{aligned}
$$

An economic application: law of diminishing marginal productivity.

## L02-S41 — Outline

> PDF pages: 41
> Section: Implicit Function Theorem

1. Functions of Several Variables
2. Partial Derivatives
3. The Total Derivative
4. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
5. The Chain Rule
6. Directional Derivative
7. Higher Order Derivatives
8. Implicit Function Theorem

## L02-S42 — Implicit Functions

> PDF pages: 42
> Section: Implicit Function Theorem

- Explicit functions: the endogenous variable is explicitly expressed as a function of the $x_i$'s:

  $$
  y=f(x_1,x_2,\ldots,x_n).
  $$

- Implicit functions: for each $(x_1,x_2,\ldots,x_n)$, the endogenous variable $y$ is implicitly determined by

  $$
  G(x_1,x_2,\ldots,x_n,y)=0.
  $$

## L02-S43 — Implicit Functions: Example

> PDF pages: 43
> Section: Implicit Function Theorem

**Example 1**

The equation

$$
4x+2y=5
$$

or

$$
4x+2y-5=0
$$

expresses $y$ as an implicit function of $x$.

Write $y$ as an explicit function of $x$:

$$
y=2.5-2x.
$$

**Example 2**

Consider

$$
y^2-5xy+4x^2=0.
$$

Convert it into an explicit function:

$$
y
=\frac{5x\pm\sqrt{25x^2-16x^2}}{2}
=\frac{1}{2}(5x\pm3x)
=\begin{cases}
4x,\\
x.
\end{cases}
$$

## L02-S44 — Implicit Functions: Example (cont.)

> PDF pages: 44
> Section: Implicit Function Theorem

**Example 3**

$$
xy^2-3y-e^x=0.
$$

**Example 4**

$$
y^5-5xy+4x^2=0.
$$

No general formula for solving quintic equations.

## L02-S45 — Implicit Functions: Questions

> PDF pages: 45
> Section: Implicit Function Theorem

1. Given the implicit equation $G(x,y)=c$ and a point $(x_0,y_0)$ such that $G(x_0,y_0)=c$, does there exist a continuous function $y=y(x)$ defined on an interval $I$ about $x_0$ such that $G(x,y(x))=c$ for all $x\in I$ and $y(x_0)=y_0$?
2. If $y(x)$ exists and differentiable, what is $y'(x_0)$?

## L02-S46 — Implicit Function Theorem

> PDF pages: 46
> Section: Implicit Function Theorem

**Theorem 15.1**

Let $G(x,y)$ be a $C^1$ function on a ball about $(x_0,y_0)$ in $\mathbb{R}^2$. Suppose that $G(x_0,y_0)=c$ and consider the expression $G(x,y)=c$. If

$$
\frac{\partial G}{\partial y}(x_0,y_0)\neq0,
$$

then there exists a $C^1$ function $y=y(x)$ defined on an interval $I$ about $x_0$ such that

1. $G(x,y(x))\equiv c$ for all $x\in I$;
2. $y(x_0)=y_0$;
3. 

   $$
   y'(x_0)
   =-
   \frac{\frac{\partial G}{\partial x}(x_0,y_0)}
   {\frac{\partial G}{\partial y}(x_0,y_0)}.
   $$

## L02-S47 — Implicit Function Theorem: Example

> PDF pages: 47
> Section: Implicit Function Theorem

Consider

$$
G(x,y)\equiv x^2-3xy+y^3-7=0.
$$

At the point $(4,3)$,

$$
\frac{\partial G}{\partial x}=2x-3y=-1,
$$

$$
\frac{\partial G}{\partial y}=-3x+3y^2=15,
$$

and

$$
y'(x_0)
=-
\frac{\frac{\partial G}{\partial x}(x_0,y_0)}
{\frac{\partial G}{\partial y}(x_0,y_0)}
=\frac{1}{15}.
$$

When $x_1=4.3$,

$$
y_1\approx y_0+y'(x_0)\Delta x
=3+(1/15)\times0.3
=3.02.
$$

## L02-S48 — Implicit Function Theorem: Example

> PDF pages: 48
> Section: Implicit Function Theorem

Consider

$$
G(x,y)=x^2+y^2=1
$$

around the point $x=0$, $y=1$. First,

$$
\frac{\partial G}{\partial y}=2y=2\neq0,
$$

so $y(x)$ exists around this point. Moreover,

$$
y'(x)\big|_{x=0}
=-\frac{\partial G/\partial x}{\partial G/\partial y}
=-\frac{2x}{2y}
=-\frac{0}{2}
=0.
$$

In this case, an explicit formula is

$$
y(x)=\sqrt{1-x^2},
$$

with

$$
y'(x)=\frac{-x}{\sqrt{1-x^2}}.
$$

Thus $y'(x)=0$ when $x=0$.

## L02-S49 — Implicit Function Theorem

> PDF pages: 49
> Section: Implicit Function Theorem

**Theorem 15.2**

Let $G(x_1,x_2,\ldots,x_k,y)$ be a $C^1$ function around the point $(x_1^*,\ldots,x_k^*,y^*)$. Suppose further that $(x_1^*,\ldots,x_k^*,y^*)$ satisfies

$$
G(x_1^*,\ldots,x_k^*,y^*)=c,
$$

and

$$
\frac{\partial G}{\partial y}(x_1^*,\ldots,x_k^*,y^*)\neq0.
$$

Then there is a $C^1$ function $y=y(x_1,\ldots,x_k)$ defined on an open ball $B$ about $(x_1^*,\ldots,x_k^*)$ such that

1. $G(x_1,\ldots,x_k,y(x_1,\ldots,x_k))\equiv c$ for all $(x_1,\ldots,x_k)$ in $B$;
2. $y^*=y(x_1^*,\ldots,x_k^*)$;
3. 

   $$
   \frac{\partial y}{\partial x_i}(x_1^*,\ldots,x_k^*)
   =-
   \frac{\frac{\partial G}{\partial x_i}(x_1^*,\ldots,x_k^*,y^*)}
   {\frac{\partial G}{\partial y}(x_1^*,\ldots,x_k^*,y^*)}.
   $$

## L02-S50 — Implicit Function Theorem: General Form

> PDF pages: 50
> Section: Implicit Function Theorem

**Implicit Function Theorem**

Let $F$ be a $C^1$ mapping of an open set $E\subset\mathbb{R}^{m+n}$ to $\mathbb{R}^m$ such that

$$
F(y^*,x^*)=c^*,
$$

where $y^*\in\mathbb{R}^m$ and $x^*\in\mathbb{R}^n$. Suppose

$$
\left(\frac{\partial F}{\partial y}\right)(y^*,x^*)
$$

is invertible. Then:

1. There exist $\epsilon,\delta>0$ such that for all $c\in B_\delta(c^*)$ and all $x\in B_\delta(x^*)$, there is a unique $y\in B_\epsilon(y^*)$ such that $F(y,x)=c$.
2. If this $y$ is denoted by $G(x,c)$, then $G$ is $C^1$ and

   $$
   \left(\frac{\partial G}{\partial x}\right)(x^*,c^*)
   =-
   \left(\frac{\partial F}{\partial y}\right)^{-1}(y^*,x^*)
   \left(\frac{\partial F}{\partial x}\right)(y^*,x^*).
   $$
