# Lecture 2 — Functions of Several Variables

> Course: Dynamic Optimization
> Original: slides/lecture02-functions_of_several_variables.tex
> PDF: slides/lecture02-functions_of_several_variables.pdf

## L02-S01 — Lecture 2: Functions of Several Variables

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Fall, 2026

## L02-S02 — Outline

> PDF pages: 2
> Section: Partial Derivatives

1. Partial Derivatives
2. The Total Derivative
3. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
4. The Chain Rule
5. Directional Derivative
6. Higher Order Derivatives
7. Implicit Function Theorem

## L02-S03 — Partial Derivatives: Definition

> PDF pages: 3
> Section: Partial Derivatives

- Consider a function $y=f(x_1,x_2,\ldots,x_n)$, where each $x_i$ can vary without affecting the others.
- If $x_i$ undergoes a change $\Delta x_i$ while all other $x_j$'s remain fixed, there will be a change in $y$, $\Delta y$.
- The partial derivative of $f$ with respect to $x_i$ is

  $$
  \frac{\partial f}{\partial x_i}(x_1^0,\ldots,x_i^0,\ldots,x_n^0)
  =\lim_{h\to0}
  \frac{f(x_1^0,\ldots,x_i^0+h,\ldots,x_n^0)-f(x_1^0,\ldots,x_i^0,\ldots,x_n^0)}{h}.
  $$

## L02-S04 — Outline

> PDF pages: 4
> Section: The Total Derivative

1. Partial Derivatives
2. The Total Derivative
3. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
4. The Chain Rule
5. Directional Derivative
6. Higher Order Derivatives
7. Implicit Function Theorem

## L02-S05 — Total Derivatives

> PDF pages: 5
> Section: The Total Derivative

Based on the definition of partial derivatives:

- $F(x^*+\Delta x,y^*)-F(x^*,y^*)\approx \frac{\partial F}{\partial x}(x^*,y^*)\Delta x$.
- $F(x^*,y^*+\Delta y)-F(x^*,y^*)\approx \frac{\partial F}{\partial y}(x^*,y^*)\Delta y$.
- $F(x^*+\Delta x,y^*+\Delta y)-F(x^*,y^*)\approx \frac{\partial F}{\partial x}(x^*,y^*)\Delta x+\frac{\partial F}{\partial y}(x^*,y^*)\Delta y$.

## L02-S06 — Total Derivatives: Geometric Interpretation

> PDF pages: 6
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

## L02-S07 — Total Derivatives

> PDF pages: 7
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

## L02-S08 — Total Derivatives

> PDF pages: 8
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

## L02-S09 — Outline

> PDF pages: 9
> Section: Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

1. Partial Derivatives
2. The Total Derivative
3. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
4. The Chain Rule
5. Directional Derivative
6. Higher Order Derivatives
7. Implicit Function Theorem

## L02-S10 — Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

> PDF pages: 10
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

## L02-S11 — Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

> PDF pages: 11
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

## L02-S12 — Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

> PDF pages: 12
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

## L02-S13 — Jacobian Derivative: Example

> PDF pages: 13
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

## L02-S14 — Outline

> PDF pages: 14
> Section: The Chain Rule

1. Partial Derivatives
2. The Total Derivative
3. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
4. The Chain Rule
5. Directional Derivative
6. Higher Order Derivatives
7. Implicit Function Theorem

## L02-S15 — Curves

> PDF pages: 15
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

## L02-S16 — The Velocity Vector

> PDF pages: 16
> Section: The Chain Rule

**Velocity Vector (Tangent Vector)**

- The velocity vector of the curve at $t$ is

  $$
  \mathbf{x}'(t)=(x_1'(t),\ldots,x_n'(t)).
  $$

- If $t$ represents time, then $x_i'(t)$ is the instantaneous velocity of the $i$-th coordinate along the curve at $t$.
- Consider $\mathbf{x}(t_0)$ as a vector in $\mathbb{R}^n$ with tail at $\mathbf{x}_0=\mathbf{x}(t_0)$. Then $\mathbf{x}'(t_0)$ will be tangent to the curve at $\mathbf{x}_0$.

## L02-S17 — Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$

> PDF pages: 17
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

## L02-S18 — Outline

> PDF pages: 18
> Section: Directional Derivative

1. Partial Derivatives
2. The Total Derivative
3. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
4. The Chain Rule
5. Directional Derivative
6. Higher Order Derivatives
7. Implicit Function Theorem

## L02-S19 — Directional Derivatives

> PDF pages: 19
> Section: Directional Derivative

- To compute the rate of change at a given point in any direction.
- $\mathbf{x}=\mathbf{x^*}+t\mathbf{v}$.
- Evaluate $F$ along the line:

  $$
  g(t)=F(\mathbf{x^*}+t\mathbf{v})
  =F(x_1^*+tv_1,\ldots,x_n^*+tv_n).
  $$

## L02-S20 — Directional Derivatives

> PDF pages: 20
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

## L02-S21 — The Gradient Vector

> PDF pages: 21
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

## L02-S22 — The Gradient Vector: Theorem

> PDF pages: 22
> Section: Directional Derivative

**Theorem 14.2**

Let $F\colon\mathbb{R}^n\to\mathbb{R}$ be a $C^1$ function. At any point $\mathbf{x}$ at which $\nabla F(\mathbf{x})\neq\mathbf{0}$, the gradient vector $\nabla F(\mathbf{x})$ points at $\mathbf{x}$ into the direction in which $F$ increases most rapidly.

Example: Consider the production function

$$
Q=F(K,L)=4K^{3/4}L^{1/4}.
$$

Current input bundles is $(10{,}000,625)$. In what proportions we should add $K$ and $L$ to increase the production most rapidly?

## L02-S23 — The Gradient Vector: Example

> PDF pages: 23
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

## L02-S24 — Outline

> PDF pages: 24
> Section: Higher Order Derivatives

1. Partial Derivatives
2. The Total Derivative
3. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
4. The Chain Rule
5. Directional Derivative
6. Higher Order Derivatives
7. Implicit Function Theorem

## L02-S25 — Cross Partial Derivatives

> PDF pages: 25
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

## L02-S26 — Hessian Matrix

> PDF pages: 26
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

Example: Consider the general production function

$$
Q=4K^{3/4}L^{1/4}.
$$

Then

$$
\frac{\partial Q}{\partial K}=3K^{-1/4}L^{1/4},
\qquad
\frac{\partial Q}{\partial L}=K^{3/4}L^{-3/4}.
$$

## L02-S27 — Hessian Matrix

> PDF pages: 27
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

## L02-S28 — Outline

> PDF pages: 28
> Section: Implicit Function Theorem

1. Partial Derivatives
2. The Total Derivative
3. Explicit Functions from $\mathbb{R}^n$ to $\mathbb{R}^m$
4. The Chain Rule
5. Directional Derivative
6. Higher Order Derivatives
7. Implicit Function Theorem

## L02-S29 — Implicit Functions

> PDF pages: 29
> Section: Implicit Function Theorem

- Explicit functions: the endogenous variable is explicitly expressed as a function of the $x_i$'s:

  $$
  y=f(x_1,x_2,\ldots,x_n).
  $$

- Implicit functions: for each $(x_1,x_2,\ldots,x_n)$, the endogenous variable $y$ is implicitly determined by

  $$
  G(x_1,x_2,\ldots,x_n,y)=0.
  $$

## L02-S30 — Implicit Functions: Questions

> PDF pages: 30
> Section: Implicit Function Theorem

1. Given the implicit equation $G(x,y)=c$ and a point $(x_0,y_0)$ such that $G(x_0,y_0)=c$, does there exist a continuous function $y=y(x)$ defined on an interval $I$ about $x_0$ such that $G(x,y(x))=c$ for all $x\in I$ and $y(x_0)=y_0$?
2. If $y(x)$ exists and differentiable, what is $y'(x_0)$?

## L02-S31 — Implicit Function Theorem

> PDF pages: 31
> Section: Implicit Function Theorem

**Theorem 15.1**

Let $G(x,y)$ be a $C^1$ function on a ball about $(x_0,y_0)$ in $\mathbb{R}^2$. Suppose that $G(x_0,y_0)=c$ and consider the expression $G(x,y)=c$. If

$$
\frac{\partial G}{\partial y}(x_0,y_0)\neq0,
$$

then there exists a $C^1$ function $y=y(x)$ defined on an interval $I$ about $x_0$ such that

- (a) $G(x,y(x))\equiv c$ for all $x\in I$;
- (b) $y(x_0)=y_0$;
- (c)

   $$
   y'(x_0)
   =-
   \frac{\frac{\partial G}{\partial x}(x_0,y_0)}
   {\frac{\partial G}{\partial y}(x_0,y_0)}.
   $$

## L02-S32 — Implicit Function Theorem: Example

> PDF pages: 32
> Section: Implicit Function Theorem

**Example**

Consider the equation

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

## L02-S33 — Implicit Function Theorem

> PDF pages: 33
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

- (a) $G(x_1,\ldots,x_k,y(x_1,\ldots,x_k))\equiv c$ for all $(x_1,\ldots,x_k)$ in $B$;
- (b) $y^*=y(x_1^*,\ldots,x_k^*)$;
- (c)

   $$
   \frac{\partial y}{\partial x_i}(x_1^*,\ldots,x_k^*)
   =-
   \frac{\frac{\partial G}{\partial x_i}(x_1^*,\ldots,x_k^*,y^*)}
   {\frac{\partial G}{\partial y}(x_1^*,\ldots,x_k^*,y^*)}.
   $$

## L02-S34 — Implicit Function Theorem: General Form

> PDF pages: 34
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
