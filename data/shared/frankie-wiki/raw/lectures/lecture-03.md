# Lecture 3 — Unconstrained Optimization

> Course: Dynamic Optimization
> Original: slides/lecture03-unconstrained_optimization.tex
> PDF: slides/lecture03-unconstrained_optimization.pdf

## L03-S01 — Lecture 3: Unconstrained Optimization

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Slides Prepared by Xiaoling Mei  
Fall, 2026

## L03-S02 — Outline

> PDF pages: 2
> Section: First-Order Conditions

1. First-Order Conditions
2. Quadratic Forms (Chapter 16)
3. Second-Order and Global Conditions

## L03-S03 — Definitions

> PDF pages: 3
> Section: First-Order Conditions

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
> Section: First-Order Conditions

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

## L03-S05 — Outline

> PDF pages: 5
> Section: Quadratic Forms (Chapter 16)

1. First-Order Conditions
2. Quadratic Forms (Chapter 16)
3. Second-Order and Global Conditions

## L03-S06 — Quadratic Forms

> PDF pages: 6
> Section: Quadratic Forms (Chapter 16)

**Definition**

**Definition:** A quadratic form on $\mathbb{R}^k$ is a real-valued function of the form

$$
Q(x_1,\cdots,x_k)=\sum_{i\leq j}a_{ij}x_ix_j
$$

in which each term is a monomial of degree two.

A quadratic form can be written in matrix form:

$$
\mathbf{x}^T\!A\,\mathbf{x}
=(x_1\ x_2\ \cdots\ x_k)
\begin{pmatrix}
a_{11}&\frac12a_{12}&\cdots&\frac12a_{1k}\\
\frac12a_{12}&a_{22}&\cdots&\frac12a_{2k}\\
\vdots&\vdots&\ddots&\vdots\\
\frac12a_{1k}&\frac12a_{2k}&\cdots&a_{kk}
\end{pmatrix}
\begin{pmatrix}x_1\\x_2\\\vdots\\x_k\end{pmatrix},
$$

where $A$ is a symmetric matrix.

## L03-S07 — Definiteness

> PDF pages: 7
> Section: Quadratic Forms (Chapter 16)

A quadratic form (or a symmetric matrix $A$) is

- **positive definite:** if $\mathbf{x}^T\!A\,\mathbf{x}>0$ for all $\mathbf{x}\neq0$ in $\mathbb{R}^n$. For example: $Q(x_1,x_2)=x_1^2+x_2^2$.
- **negative definite:** if $\mathbf{x}^T\!A\,\mathbf{x}<0$ for all $\mathbf{x}\neq0$ in $\mathbb{R}^n$. For example: $Q(x_1,x_2)=-x_1^2-x_2^2$.
- **positive semi-definite:** if $\mathbf{x}^T\!A\,\mathbf{x}\geq0$ for all $\mathbf{x}\neq0$ in $\mathbb{R}^n$. For example: $Q(x_1,x_2)=x_1^2+2x_1x_2+x_2^2$.
- **negative semi-definite:** if $\mathbf{x}^T\!A\,\mathbf{x}\leq0$ for all $\mathbf{x}\neq0$ in $\mathbb{R}^n$. For example: $Q(x_1,x_2)=-x_1^2-2x_1x_2-x_2^2$.
- **indefinite:** if $\mathbf{x}^T\!A\,\mathbf{x}>0$ for some $\mathbf{x}$ in $\mathbb{R}^n$ and $<0$ for some other $\mathbf{x}$ in $\mathbb{R}^n$. For example: $Q(x_1,x_2)=x_1^2-x_2^2$.

## L03-S08 — Principal Minors

> PDF pages: 8
> Section: Quadratic Forms (Chapter 16)

**Definition**

Let $A$ be an $n\times n$ matrix. A $k\times k$ submatrix of $A$ formed by deleting $n-k$ columns, say columns $i_1,i_2,\cdots,i_{n-k}$ and the same rows $i_1,i_2,\cdots,i_{n-k}$ from $A$ is called a $k$th order principal submatrix of $A$. The determinant of a $k\times k$ principal submatrix is called a $k$th order principal minor of $A$.

**Definition**

Let $A$ be an $n\times n$ matrix. The $k$th order principal submatrix of $A$ obtained by deleting the last $n-k$ rows and the last $n-k$ columns from $A$ is called a $k$th order leading principal submatrix of $A$. Its determinant is called a $k$th order *leading principal* minor of $A$.

For example, for a $3\times3$ matrix, there are three leading principal minors:

$$
|a_{11}|,\quad
\begin{vmatrix}a_{11}&a_{12}\\a_{21}&a_{22}\end{vmatrix},\quad
\begin{vmatrix}
a_{11}&a_{12}&a_{13}\\
a_{21}&a_{22}&a_{23}\\
a_{31}&a_{32}&a_{33}
\end{vmatrix}.
$$

## L03-S09 — Characterization of Definiteness I

> PDF pages: 9
> Section: Quadratic Forms (Chapter 16)

**Theorem 16.1**

Let $A$ be an $n\times n$ symmetric matrix. Then,

- (a) $A$ is positive definite *if and only if* all its $n$ leading principal minors are (strictly) positive.
- (b) $A$ is negative definite *if and only if* its $n$ leading principal minors alternate in sign as follows: $|A_1|<0$, $|A_2|>0$, $|A_3|<0$, etc. That is, the $k$th order leading principal minor should have the same sign as $(-1)^k$.
- (c) If some $k$th order leading principal minor of $A$ is nonzero but does not fit either of the above two sign patterns, then $A$ is indefinite. This case occurs when $A$ has a negative $k$th order leading principal minor for an *even* integer $k$; or when $A$ has a negative $k$th order leading principal minor and a positive $\ell$th order leading principal minor for two distinct *odd* integers $k$ and $\ell$.

This test may fail for a symmetric matrix when some leading principal minor is $0$ while the nonzero ones fit the pattern in either (a) or (b).

## L03-S10 — Characterization of Definiteness II

> PDF pages: 10
> Section: Quadratic Forms (Chapter 16)

**Theorem 16.2**

Let $A$ be an $n\times n$ symmetric matrix. Then

- $A$ is positive semidefinite *if and only if* **every** principal minor of $A$ is $\geq0$.
- $A$ is negative semidefinite *if and only if* **every** principal minor of odd order is $\leq0$ and every principal minor of even order is $\geq0$.

## L03-S11 — Definiteness of Diagonal Matrices

> PDF pages: 11
> Section: Quadratic Forms (Chapter 16)

- The simplest $n\times n$ symmetric matrix is the diagonal matrix, which corresponds to the simplest quadratic form $a_1x_1^2+\cdots a_nx_n^2$.
- It is positive definite $\iff$ all the $a_i$'s are positive and negative definite $\iff$ all the $a_i$'s are negative.
- It is positive semidefinite $\iff$ all $a_i\geq0$ and negative semidefinite $\iff$ all $a_i\leq0$.
- If there are two $a_i$'s of opposite signs, it will be indefinite.
- If some $a_j=0$, it is not definite.

## L03-S12 — Definiteness and Optimality

> PDF pages: 12
> Section: Quadratic Forms (Chapter 16)

- Fact: determining the definiteness of a quadratic form $Q$ is equivalent to determining whether $\mathbf{x}=\mathbf{0}$ is a max, a min, or neither for the real-valued function $Q$.
- Figures 16.2–16.6.

## L03-S13 — Outline

> PDF pages: 13
> Section: Second-Order and Global Conditions

1. First-Order Conditions
2. Quadratic Forms (Chapter 16)
3. Second-Order and Global Conditions

## L03-S14 — Second Order Conditions

> PDF pages: 14
> Section: Second-Order and Global Conditions

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

## L03-S15 — Second Order Conditions

> PDF pages: 15
> Section: Second-Order and Global Conditions

**Theorem 17.2 (Sufficient Conditions)**

Let $F\colon U\subset\mathbb{R}^n\to\mathbb{R}^1$ be a $C^2$ function whose domain is an open set $U$ in $\mathbb{R}^n$. Suppose $\mathbf{x}^*$ is a critical point of $F$:

- (a) If the Hessian $D^2F(\mathbf{x}^*)$ is a negative definite symmetric matrix, then $\mathbf{x}^*$ is a strict local max of $F$.
- (b) If the Hessian $D^2F(\mathbf{x}^*)$ is a positive definite symmetric matrix, then $\mathbf{x}^*$ is a strict local min of $F$.
- (c) If the Hessian $D^2F(\mathbf{x}^*)$ is indefinite, then $\mathbf{x}^*$ is neither a local max nor a local min of $F$.

## L03-S16 — Second Order Conditions

> PDF pages: 16
> Section: Second-Order and Global Conditions

- Equivalent statements based on analytical characterization of positive definite and negative definite matrices: Theorems 17.3–17.5.
- A critical point of $F$ for which the Hessian $D^2F(\mathbf{x}^*)$ is indefinite is called a **saddle point**.
- A saddle point is a min of $F$ in some directions and a max in other directions.
- Example:

  $$
  F(x_1,x_2)=x_1^2-x_2^2.
  $$

## L03-S17 — Necessary Conditions

> PDF pages: 17
> Section: Second-Order and Global Conditions

**Theorem 17.6**

Let $F\colon U\subset\mathbb{R}^n\to\mathbb{R}^1$ be a $C^2$ function. Suppose $\mathbf{x}^*$ is an interior point of $U$ and a local max/min of $F$. Then

$$
DF(\mathbf{x}^*)=\mathbf{0},
$$

and $D^2F(\mathbf{x}^*)$ is negative/positive **semidefinite**.

## L03-S18 — Necessary Conditions

> PDF pages: 18
> Section: Second-Order and Global Conditions

**Theorem 17.7**

Let $F\colon U\subset\mathbb{R}^n\to\mathbb{R}^1$ be a $C^2$ function of $n$ variables. Suppose $\mathbf{x}^*$ is an interior point of $U$ and a local max/min of $F$.

- (a) If $\mathbf{x}^*$ is a local min of $F$, then

   $$
   \frac{\partial F}{\partial x_i}(\mathbf{x}^*)=0
   $$

   for $i=1,\ldots,n$, and all the principal minors of the Hessian $D^2F(\mathbf{x}^*)$ are $\geq0$.
- (b) If $\mathbf{x}^*$ is a local max of $F$, then

   $$
   \frac{\partial F}{\partial x_i}(\mathbf{x}^*)=0
   $$

   for $i=1,\ldots,n$, all principal minors of odd order are $\leq0$, and all principal minors of even order are $\geq0$.

## L03-S19 — Global Maximum and Minimum

> PDF pages: 19
> Section: Second-Order and Global Conditions

**Theorem 17.8**

Let $F\colon U\to\mathbb{R}^1$ be a $C^2$ function whose domain is a convex open subset $U$ of $\mathbb{R}^n$.

- (a) The following three conditions are equivalent:
  - (i) $F$ is a concave function on $U$; and
  - (ii)

    $$
    F(\mathbf{y})-F(\mathbf{x})
    \leq
    DF(\mathbf{x})(\mathbf{y}-\mathbf{x})
    $$

    for all $\mathbf{x},\mathbf{y}\in U$; and
  - (iii) $D^2F(\mathbf{x})$ is negative semidefinite for all $\mathbf{x}\in U$.
- (b) The following three conditions are equivalent:
  - (i) $F$ is a convex function on $U$; and
  - (ii)

    $$
    F(\mathbf{y})-F(\mathbf{x})
    \geq
    DF(\mathbf{x})(\mathbf{y}-\mathbf{x})
    $$

    for all $\mathbf{x},\mathbf{y}\in U$; and
  - (iii) $D^2F(\mathbf{x})$ is positive semidefinite for all $\mathbf{x}\in U$.
- (c) If $F$ is concave on $U$ and $DF(\mathbf{x^*})=\mathbf{0}$ for some $\mathbf{x^*}\in U$, then $\mathbf{x^*}$ is a global max of $F$ on $U$.
- (d) If $F$ is convex on $U$ and $DF(\mathbf{x^*})=\mathbf{0}$ for some $\mathbf{x^*}\in U$, then $\mathbf{x^*}$ is a global min of $F$ on $U$.

## L03-S20 — Economic Applications: Discriminating Monopolist

> PDF pages: 20
> Section: Second-Order and Global Conditions

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

## L03-S21 — Economic Applications: Discriminating Monopolist

> PDF pages: 21
> Section: Second-Order and Global Conditions

Then

$$
\frac{d(Q_1G_1(Q_1))}{dQ_1}
=
\frac{d(Q_2G_2(Q_2))}{dQ_2}
=
C'(Q_1+Q_2).
$$

The marginal revenue in **each** market equals the marginal cost of total output.

## L03-S22 — Economic Applications: Discriminating Monopolist: Example

> PDF pages: 22
> Section: Second-Order and Global Conditions

- $G(Q_1)=50-5Q_1$.
- $G(Q_2)=100-10Q_2$.
- $C(Q)=90+20Q$.
- In order to maximize profits, how much should the monopolist produce for each market?

## L03-S23 — Economic Applications: Discriminating Monopolist: Example

> PDF pages: 23
> Section: Second-Order and Global Conditions

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

## L03-S24 — Economic Applications: Discriminating Monopolist: Example

> PDF pages: 24
> Section: Second-Order and Global Conditions

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
