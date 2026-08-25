# Lecture 3 — Unconstrained Optimization

> Course: Dynamic Optimization
> Original: slides/lecture03-unconstrained_optimization.tex
> PDF: slides/lecture03-unconstrained_optimization.pdf
> Snapshot: v1
> Normalization notes: The course-defined macro for the real numbers has been expanded to $\mathbb{R}$ for Markdown rendering.

## L03-S01 — Lecture 3: Unconstrained Optimization

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Slides Prepared by Xiaoling Mei  
Fall, 2026

## L03-S02 — Outline

> PDF pages: 2
> Section: Unconstrained Optimization (Ch17)

1. Unconstrained Optimization (Ch17)

## L03-S03 — Definitions

> PDF pages: 3
> Section: Unconstrained Optimization (Ch17)

Consider a real-valued function of $n$ variables

$$
F\colon U\subset\mathbb{R}^n\to\mathbb{R}.
$$

A point $\mathbf{x}^*$ is a

- **maximizer** of $F$ on $U$ if $F(\mathbf{x}^*)\geq F(\mathbf{x})$ for all $\mathbf{x}\in U$;
- **strict maximizer** if $F(\mathbf{x}^*)>F(\mathbf{x})$ for all $\mathbf{x}\neq\mathbf{x}^*$ in $U$;
- **local/relative maximizer** if there is a ball $B_r(\mathbf{x}^*)$ about $\mathbf{x}^*$ such that $F(\mathbf{x}^*)\geq F(\mathbf{x})$ for all $\mathbf{x}\in B_r(\mathbf{x}^*)\cap U$;
- **strict local maximizer** if there is a ball $B_r(\mathbf{x}^*)$ about $\mathbf{x}^*$ such that $F(\mathbf{x}^*)>F(\mathbf{x})$ for all $\mathbf{x}\neq\mathbf{x}^*$ in $B_r(\mathbf{x}^*)\cap U$.

## L03-S04 — First Order Conditions

> PDF pages: 4
> Section: Unconstrained Optimization (Ch17)

**Theorem 17.1**

Let $F\colon U\subset\mathbb{R}^n\to\mathbb{R}^1$ be a $C^1$ function. If $\mathbf{x}^*$ is a local max or min of $F$ in $U$ and if $\mathbf{x}^*$ is an interior point of $U$, then

$$
\frac{\partial F}{\partial x_i}(\mathbf{x}^*)=0
\qquad
\text{for }i=1,\ldots,n.
$$

Proof: for each $x_i$, $x_i^*$ is an interior maximizer of

$$
x_i\mapsto F(x_1^*,\ldots,x_{i-1}^*,x_i,x_{i+1}^*,\ldots,x_n^*).
$$

Use Theorem 3.3.

## L03-S05 — First Order Conditions: Example

> PDF pages: 5
> Section: Unconstrained Optimization (Ch17)

To find the local maxs and mins of

$$
F(x,y)=x^3-y^3+9xy,
$$

compute the first-order partial derivatives and set them equal to zero:

$$
\frac{\partial F}{\partial x}=3x^2+9y=0,
$$

$$
\frac{\partial F}{\partial y}=-3y^2+9x=0.
$$

Solutions to the above system of equations are the two points $(0,0)$ and $(3,-3)$. For now, we can conclude that the only candidates for a max or min of $F$ are these two points. We are unable to say whether either of these two is a max or min.

## L03-S06 — Second Order Conditions

> PDF pages: 6
> Section: Unconstrained Optimization (Ch17)

- A point $\mathbf{x}^*$ is a **critical point** if

  $$
  DF(\mathbf{x}^*)=0.
  $$

- To determine if a critical point is a max or min, use a condition on the second derivatives of $F$.
- The **Hessian** of $F$ is

  $$
  \begin{pmatrix}
  \frac{\partial^2F}{\partial x_1^2} & \cdots & \frac{\partial^2F}{\partial x_n\partial x_1}\\
  \vdots & \ddots & \vdots\\
  \frac{\partial^2F}{\partial x_1\partial x_n} & \cdots & \frac{\partial^2F}{\partial x_n^2}
  \end{pmatrix}.
  $$

## L03-S07 — Second Order Conditions

> PDF pages: 7
> Section: Unconstrained Optimization (Ch17)

**Theorem 17.2 (Sufficient Conditions)**

Let $F\colon U\subset\mathbb{R}^n\to\mathbb{R}^1$ be a $C^2$ function whose domain is an open set $U$ in $\mathbb{R}^n$. Suppose $\mathbf{x}^*$ is a critical point of $F$:

1. If the Hessian $D^2F(\mathbf{x}^*)$ is a negative definite symmetric matrix, then $\mathbf{x}^*$ is a strict local max of $F$.
2. If the Hessian $D^2F(\mathbf{x}^*)$ is a positive definite symmetric matrix, then $\mathbf{x}^*$ is a strict local min of $F$.
3. If the Hessian $D^2F(\mathbf{x}^*)$ is indefinite, then $\mathbf{x}^*$ is neither a local max nor a local min of $F$.

## L03-S08 — Second Order Conditions

> PDF pages: 8
> Section: Unconstrained Optimization (Ch17)

- Equivalent statements based on analytical characterization of positive definite and negative definite matrices: Theorems 17.3–17.5.
- A critical point of $F$ for which the Hessian $D^2F(\mathbf{x}^*)$ is indefinite is called a **saddle point**.
- A saddle point is a min of $F$ in some directions and a max in other directions.
- Example:

  $$
  F(x_1,x_2)=x_1^2-x_2^2.
  $$

## L03-S09 — Necessary Conditions

> PDF pages: 9
> Section: Unconstrained Optimization (Ch17)

**Theorem 17.6**

Let $F\colon U\subset\mathbb{R}^n\to\mathbb{R}^1$ be a $C^2$ function. Suppose $\mathbf{x}^*$ is an interior point of $U$ and a local max/min of $F$. Then

$$
DF(\mathbf{x}^*)=\mathbf{0},
$$

and $D^2F(\mathbf{x}^*)$ is negative/positive **semidefinite**.

## L03-S10 — Necessary Conditions

> PDF pages: 10
> Section: Unconstrained Optimization (Ch17)

**Theorem 17.7**

Let $F\colon U\subset\mathbb{R}^n\to\mathbb{R}^1$ be a $C^2$ function of $n$ variables. Suppose $\mathbf{x}^*$ is an interior point of $U$ and a local max/min of $F$.

1. If $\mathbf{x}^*$ is a local min of $F$, then

   $$
   \frac{\partial F}{\partial x_i}(\mathbf{x}^*)=0
   $$

   for $i=1,\ldots,n$, and all the principal minors of the Hessian $D^2F(\mathbf{x}^*)$ are $\geq0$.
2. If $\mathbf{x}^*$ is a local max of $F$, then

   $$
   \frac{\partial F}{\partial x_i}(\mathbf{x}^*)=0
   $$

   for $i=1,\ldots,n$, all principal minors of odd order are $\leq0$, and all principal minors of even order are $\geq0$.

## L03-S11 — Example

> PDF pages: 11
> Section: Unconstrained Optimization (Ch17)

Previously, the critical points of

$$
F(x,y)=x^3-y^3+9xy
$$

were computed as $(0,0)$ and $(3,-3)$. The Hessian is

$$
\begin{pmatrix}
F_{xx} & F_{xy}\\
F_{yx} & F_{yy}
\end{pmatrix}
=
\begin{pmatrix}
6x & 9\\
9 & -6y
\end{pmatrix}.
$$

- The first-order leading principal minor is $F_{xx}=6x$, and the second-order leading principal minor is

  $$
  \det D^2F(\mathbf{x})=-36xy-81.
  $$

- At $(0,0)$, these minors are $0$ and $-81$. Since the second-order leading principal minor is negative, $(0,0)$ is a saddle of $F$, neither a max nor a min.
- At $(3,-3)$, the minors are $18$ and $243$. Since both are positive, $D^2F(3,-3)$ is positive definite and $(3,-3)$ is a strict local min of $F$.
- The point $(3,-3)$ is not a global min, because at $(0,n)$,

  $$
  F(0,n)=-n^3\to-\infty
  $$

  as $n\to\infty$.

## L03-S12 — Global Maximum and Minimum

> PDF pages: 12
> Section: Unconstrained Optimization (Ch17)

**Theorem 17.8**

Let $F\colon U\to\mathbb{R}^1$ be a $C^2$ function whose domain is a convex open subset $U$ of $\mathbb{R}^n$.

1. The following three conditions are equivalent:
   1. $F$ is concave on $U$.
   2. 

      $$
      F(\mathbf{y})-F(\mathbf{x})
      \leq
      DF(\mathbf{x})(\mathbf{y}-\mathbf{x})
      $$

      for all $\mathbf{x},\mathbf{y}\in U$.
   3. $D^2F(\mathbf{x})$ is negative semidefinite for all $\mathbf{x}\in U$.
2. The following three conditions are equivalent:
   1. $F$ is convex on $U$.
   2. 

      $$
      F(\mathbf{y})-F(\mathbf{x})
      \geq
      DF(\mathbf{x})(\mathbf{y}-\mathbf{x})
      $$

      for all $\mathbf{x},\mathbf{y}\in U$.
   3. $D^2F(\mathbf{x})$ is positive semidefinite for all $\mathbf{x}\in U$.
3. If $F$ is concave on $U$ and $DF(\mathbf{x^*})=\mathbf{0}$ for some $\mathbf{x^*}\in U$, then $\mathbf{x^*}$ is a global max of $F$ on $U$.
4. If $F$ is convex on $U$ and $DF(\mathbf{x^*})=\mathbf{0}$ for some $\mathbf{x^*}\in U$, then $\mathbf{x^*}$ is a global min of $F$ on $U$.

## L03-S13 — Economic Applications: Discriminating Monopolist

> PDF pages: 13
> Section: Unconstrained Optimization (Ch17)

- A monopolist faces two distinct and separated markets, such as a domestic and a foreign market, each with its own demand function:
  - supply: $Q_i$;
  - inverse demand function: $P_i=G_i(Q_i)$;
  - revenue: $Q_iG_i(Q_i)$;
  - production costs: $C(Q_1+Q_2)$.
- Profit:

  $$
  F(Q_1,Q_2)
  =Q_1G_1(Q_1)+Q_2G_2(Q_2)-C(Q_1+Q_2).
  $$

- Suppose the firm produces a positive amount for each market.
- Problem: compute the maxima of the profit function $F$ in the interior of the positive quadrant.

## L03-S14 — Economic Applications: Discriminating Monopolist

> PDF pages: 14
> Section: Unconstrained Optimization (Ch17)

Then

$$
\frac{d(Q_1G_1(Q_1))}{dQ_1}
=
\frac{d(Q_2G_2(Q_2))}{dQ_2}
=
C'(Q_1+Q_2).
$$

The marginal revenue in **each** market equals the marginal cost of total output.

## L03-S15 — Economic Applications: Discriminating Monopolist: Example

> PDF pages: 15
> Section: Unconstrained Optimization (Ch17)

- $G(Q_1)=50-5Q_1$.
- $G(Q_2)=100-10Q_2$.
- $C(Q)=90+20Q$.
- In order to maximize profits, how much should the monopolist produce for each market?

## L03-S16 — Economic Applications: Discriminating Monopolist: Example

> PDF pages: 16
> Section: Unconstrained Optimization (Ch17)

The discriminating monopolist's profit function is

$$
F(Q_1,Q_2)
=Q_1(50-5Q_1)+Q_2(100-10Q_2)-(90+20(Q_1+Q_2)).
$$

The critical point of $F$ satisfies

$$
\frac{\partial F}{\partial Q_1}=50-10Q_1-20=0,
$$

$$
\frac{\partial F}{\partial Q_2}=100-20Q_2-20=0.
$$

Hence, $Q_1=3$ and $Q_2=4$.

## L03-S17 — Economic Applications: Discriminating Monopolist: Example

> PDF pages: 17
> Section: Unconstrained Optimization (Ch17)

Now check the second-order conditions:

$$
F_{Q_1Q_1}=-10,
\qquad
F_{Q_2Q_2}=-20,
\qquad
F_{Q_1Q_2}=F_{Q_2Q_1}=0.
$$

- The first-order leading principal minor of $D^2F(3,4)$ is $-10$, and the second-order leading principal minor is $200$.
- Therefore, $F$ is a concave function and the point $(3,4)$ is a maximizer.

## L03-S18 — Economic Applications: Least Squares Analysis

> PDF pages: 18
> Section: Unconstrained Optimization (Ch17)

> Figure: slides/ls.png
>
> The figure shows three data points, a fitted line, and the vertical deviations $|y_i-(ax_i+b)|$ between each point and the line.

The objective is

$$
S(m,b)=\sum_{i=1}^n(mx_i+b-y_i)^2.
$$

The first-order conditions are

$$
\frac{\partial S}{\partial m}
=
\sum_{i=1}^n2(mx_i+b-y_i)x_i
=0,
$$

$$
\frac{\partial S}{\partial b}
=
\sum_{i=1}^n2(mx_i+b-y_i)
=0.
$$

Solving:

$$
\left(\sum_i x_i^2\right)m
+
\left(\sum_i x_i\right)b
=
\sum_i x_iy_i,
$$

$$
\left(\sum_i x_i\right)m+nb
=
\sum_i y_i.
$$

By Cramer's rule,

$$
m^*
=
\frac{
 n\sum_i x_iy_i
 -\left(\sum_i x_i\right)\left(\sum_i y_i\right)
}{
 n\sum_i x_i^2
 -\left(\sum_i x_i\right)^2
},
$$

$$
b^*
=
\frac{
 \left(\sum_i x_i^2\right)\left(\sum_i y_i\right)
 -\left(\sum_i x_i\right)\left(\sum_i x_iy_i\right)
}{
 n\sum_i x_i^2
 -\left(\sum_i x_i\right)^2
}.
$$
