# Lecture 4 — Constrained Optimization I

> Course: Dynamic Optimization
> Original: slides/lecture04-constrained_optimization_i.tex
> PDF: slides/lecture04-constrained_optimization_i.pdf

## L04-S01 — Lecture 4: Constrained Optimization I

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Slides Prepared by Xiaoling Mei  
Fall, 2026

## L04-S02 — Outline

> PDF pages: 2
> Section: Definition

1. Definition
2. Equality Constraints
3. Inequality Constraints
4. Mixed Constraints

## L04-S03 — Motivation

> PDF pages: 3
> Section: Definition

We often work with the optimization problem in which the objects are not free to take on any value but are constrained. For example:

- A household's consumption is constrained by available income
- A firm's production is constrained by the cost and availability of its inputs
- The central mathematical problem here is that of maximizing/minimizing a function of several variables, where these variables are bound by some constraining equations.

## L04-S04 — Definitions

> PDF pages: 4
> Section: Definition

**The Prototype Problem**

- Objective function: $f(x_1,x_2,\cdots,x_n)$
- Constraint functions:

$$
\begin{aligned}
g_1(x_1,\cdots,x_n) &\leq b_1 \\
& \vdots \\
g_k(x_1,\cdots,x_n) &\leq b_k \\
h_1(x_1,\cdots,x_n) &= c_1 \\
& \vdots \\
h_m(x_1,\cdots,x_n) &= c_m
\end{aligned}
$$

## L04-S05 — Outline

> PDF pages: 5
> Section: Equality Constraints

1. Definition
2. Equality Constraints
3. Inequality Constraints
4. Mixed Constraints

## L04-S06 — Equality Constraints

> PDF pages: 6
> Section: Equality Constraints

- Simplest constrained maximization problem: maximizing a function of two variables subject to a single equality constraint
- Setup:

  $$
  \begin{aligned}
  \text{max}\quad &f(x_1,x_2) \\
  \text{s.t.}\quad &h(x_1,x_2)=c
  \end{aligned}
  $$

- The highest level set of $f$ must touch (be tangent to) the constraint curve $C$ at the constrained max. Figure 18.1.

## L04-S07 — Equality Constraints

> PDF pages: 7
> Section: Equality Constraints

- Equivalently, at the constrained max $\mathbf{x^*}$, the slope of the level set of $f$ equals the slope of the constraint curve $C$.
- If $\frac{\partial f}{\partial x_2}(\mathbf{x^*})\neq0$, the slope of the level set of $f$ at $\mathbf{x^*}$ is

  $$
  -\frac{\partial f}{\partial x_1}(\mathbf{x^*})\Big/\frac{\partial f}{\partial x_2}(\mathbf{x^*})
  $$

- If $\frac{\partial h}{\partial x_2}(\mathbf{x^*})\neq0$, the slope of the constraint set $h(x_1,x_2)=c$ at $\mathbf{x^*}$ is

  $$
  -\frac{\partial h}{\partial x_1}(\mathbf{x^*})\Big/\frac{\partial h}{\partial x_2}(\mathbf{x^*})
  $$

## L04-S08 — Equality Constraints

> PDF pages: 8
> Section: Equality Constraints

- Equalize the slope and we get:

  $$
  \frac{\frac{\partial f}{\partial x_1}(\mathbf{x^*})}{\frac{\partial h}{\partial x_1}(\mathbf{x^*})}
  =
  \frac{\frac{\partial f}{\partial x_2}(\mathbf{x^*})}{\frac{\partial h}{\partial x_2}(\mathbf{x^*})}
  =\mu.
  $$

- Rewrite the equation and combine with the constraint equation:

  $$
  \begin{aligned}
  \frac{\partial f}{\partial x_1}(\mathbf{x^*})-\mu\frac{\partial h}{\partial x_1}(\mathbf{x^*})&=0 \\
  \frac{\partial f}{\partial x_2}(\mathbf{x^*})-\mu\frac{\partial h}{\partial x_2}(\mathbf{x^*})&=0 \\
  h(x_1,x_2)&=c
  \end{aligned}
  $$

  A system with three unknowns.

- More generally, tangency means that the gradients are proportional:

  $$
  \nabla f(\mathbf{x^*})=\mu\nabla h(\mathbf{x^*}).
  $$

## L04-S09 — Equality Constraints

> PDF pages: 9
> Section: Equality Constraints

**Constraint Qualification**

- Above method would not have worked if both $\partial h/\partial x_1$ and $\partial h/\partial x_2$ were 0;
- We will need to make the assumption that $\partial h/\partial x_1$ or $\partial h/\partial x_2$ (or both) is not zero at the maximizer
- This restriction is called a **constraint qualification**

## L04-S10 — Equality Constraints: Theorem

> PDF pages: 10
> Section: Equality Constraints

**Theorem 18.1**

Suppose $\mathbf{x^*}=(x_1^*,x_2^*)$ is a solution and suppose further that it is not a critical point of $h$. Then there is real number $\mu^*$ such that $(x_1^*,x_2^*,\mu^*)$ is a critical point of the *Lagrangian function*

$$
L(x_1,x_2,\mu)\equiv f(x_1,x_2)-\mu(h(x_1,x_2)-c).
$$

In other words, at $(x_1^*,x_2^*,\mu^*)$:

$$
\frac{\partial L}{\partial x_1}=0,\quad
\frac{\partial L}{\partial x_2}=0,\quad
\frac{\partial L}{\partial \mu}=0
$$

$\mu$ is called a **Lagrange multiplier**.

## L04-S11 — Example 18.4

> PDF pages: 11
> Section: Equality Constraints

**Example 18.4**: Use Theorem 18.1 to solve a simple utility maximization problem:

$$
\begin{aligned}
\text{maximize}\quad f(x_1,x_2)&=x_1x_2 \\
\text{subject to}\quad h(x_1,x_2)&\equiv x_1+4x_2=16
\end{aligned}
$$

The gradient of $h$ is $(1,4)$, so $h$ has no critical points and the constraint qualification is satisfied. From the Lagrangian function

$$
L(x_1,x_2,\mu)=x_1x_2-\mu(x_1+4x_2-16)
$$

## L04-S12 — Example 18.4

> PDF pages: 12
> Section: Equality Constraints

**Example 18.4**: Set the partial derivatives equal to zero:

$$
\begin{aligned}
\frac{\partial L}{\partial x_1}&=x_2-\mu=0 \\
\frac{\partial L}{\partial x_2}&=x_1-4\mu=0 \\
\frac{\partial L}{\partial \mu}&=-(x_1+4x_2-16)=0
\end{aligned}
$$

We conclude the solution of this system is

$$
x_1=8,\,x_2=2,\,\mu=2
$$

So the only candidate for a solution is

$$
x_1=8,\,x_2=2
$$

## L04-S13 — Several Equality Constraints

> PDF pages: 13
> Section: Equality Constraints

- When there are several equality constraints, the problem becomes

  $$
  \begin{aligned}
  \max\ &f(x_1,x_2,\cdots,x_n) \\
  \text{s.t.}\quad &h_1(\mathbf{x})=a_1;\ \cdots;\ h_m(\mathbf{x})=a_m
  \end{aligned}
  $$

- Generalized constraint qualification: $x$ is called a critical point of $\mathbf{h}=(h_1,h_2,\cdots,h_m)$ if the rank of the matrix $D\mathbf h(\mathbf{x}^*)$ is less than $m$.
- **Nondegenerate Constraint Qualification**: The rank of Jacobian $D\mathbf h(\mathbf{x}^*)$ is equal to the number of the constraints, then $\mathbf{x^*}$ satisfies NDCQ.

## L04-S14 — Equality Constraints: Theorem

> PDF pages: 14
> Section: Equality Constraints

**Theorem 18.2**

Suppose $x^*$ is a solution and suppose further it satisfies condition NDCQ. Then there exists $\mu^*=(\mu_1^*,\cdots,\mu_m^*)$ such that $(\mathbf{x}^*,\mu^*)$ is a critical point of the *Lagrangian*

$$
L(x,\mu)\equiv f(x)-\mu_1(h_1(x)-a_1)-\mu_2(h_2(x)-a_2)-\cdots-\mu_m(h_m(x)-a_m).
$$

In other words,

$$
\begin{aligned}
\frac{\partial L}{\partial x_1}(x^*,\mu^*)&=0,\cdots,\frac{\partial L}{\partial x_n}(x^*,\mu^*)=0 \\
\frac{\partial L}{\partial \mu_1}(x^*,\mu^*)&=0,\cdots,\frac{\partial L}{\partial \mu_m}(x^*,\mu^*)=0
\end{aligned}
$$

## L04-S15 — Outline

> PDF pages: 15
> Section: Inequality Constraints

1. Definition
2. Equality Constraints
3. Inequality Constraints
4. Mixed Constraints

## L04-S16 — Inequality Constraints

> PDF pages: 16
> Section: Inequality Constraints

- Many optimization problems have their constraints defined by inequalities $g_1(x_1,\cdots,x_n)\leq b_1,\cdots,g_k(x_1,\cdots,x_n)\leq b_k$
- The method for finding the constrained maxima is more complex
- We start with the simplest case when there are two variables and one *inequality* constraint

## L04-S17 — Inequality Constraints

> PDF pages: 17
> Section: Inequality Constraints

- Consider the optimization problem with one inequality constraint:

  $$
  \begin{aligned}
  \max\quad &f(x,y) \\
  \text{s.t.}\quad &g(x,y)\leq b
  \end{aligned}
  $$

## L04-S18 — Inequality Constraints

> PDF pages: 18
> Section: Inequality Constraints

Case A: If the maximum of $f$ occurs at a point where $g(x,y)=b$, that is, when the constraint is **binding** (active/effective/tight)

- Highest level curve of $f$ meets the constraint set at point $\mathbf{p}$
- Equivalently, the level set of $f$ and the level set of $g$ are tangent to each other at $\mathbf{p}$
- $\triangledown f(\mathbf{p})$, $\triangledown g(\mathbf{p})$ line up: $\triangledown f(\mathbf{p})-\lambda\triangledown g(\mathbf{p})=\mathbf{0}$
- More importantly, $\triangledown f(\mathbf{p})$ and $\triangledown g(\mathbf{p})$ *point to the same direction*: $\lambda\geq0$
- Form the Lagrangian function:

  $$
  L(x,y,\lambda)=f(x,y)-\lambda[g(x,y)-b]
  $$

## L04-S19 — Inequality Constraints

> PDF pages: 19
> Section: Inequality Constraints

Case B: If the maximum of $f$ occurs at a point where $g(x,y)<b$, that is, when the constraint is **not binding** (inactive/ineffective/loose)

- $\mathbf{q}$ must be a local max of $f$, that is, a local unconstrained max
- Then we have $\frac{\partial f}{\partial x}(\mathbf{q})=0$ and $\frac{\partial f}{\partial y}(\mathbf{q})=0$
- The derivative of $g$ does not enter the calculations at $\mathbf{q}$
- In this case, we can still use the Lagrangian function:

  $$
  L(x,y,\lambda)=f(x,y)-\lambda[g(x,y)-b]
  $$

  provided that we set $\lambda=0$.

## L04-S20 — Inequality Constraints

> PDF pages: 20
> Section: Inequality Constraints

In summary:

- The constraint is binding: $g(x,y)-b=0$, in this case $\lambda\geq0$
- The constraint is not binding, in this case $\lambda=0$
- Therefore $\lambda=0$ or $g(x,y)-b=0$ (and both may hold). This is called a **complementary slackness condition**:

  $$
  \lambda(g(x,y)-b)=0
  $$

- Since we do not know if the constraint will be binding at the maximizer, we use the above equation to replace $\partial L/\partial\lambda=0$

## L04-S21 — Inequality Constraints: Theorem

> PDF pages: 21
> Section: Inequality Constraints

**Theorem 18.3**

Suppose that $f$ and $g$ are $C^1$ and $(x^*,y^*)$ maximizes $f$ on the set $g(x,y)\leq b$. If $g(x^*,y^*)=b$, further suppose that $\frac{\partial g}{\partial x}(x^*,y^*)\neq0$ or $\frac{\partial g}{\partial y}(x^*,y^*)\neq0$. In any case, form the Lagrangian function

$$
L(x,y,\lambda)\equiv f(x,y)-\lambda(g(x,y)-b)
$$

Then there is a multiplier $\lambda^*$ such that

- (a) $\frac{\partial L}{\partial x}(x^*,y^*,\lambda^*)=0$
- (b) $\frac{\partial L}{\partial y}(x^*,y^*,\lambda^*)=0$
- (c) $\lambda^*[g(x^*,y^*)-b]=0$
- (d) $\lambda^*\geq0$
- (e) $g(x^*,y^*)\leq b$

## L04-S22 — Inequality Constraints: Example

> PDF pages: 22
> Section: Inequality Constraints

**Example 18.7**: Consider the problem:

$$
\begin{aligned}
\max\quad f(x,y)&=xy \\
\text{s.t.}\quad g(x,y)&=x^2+y^2\leq1
\end{aligned}
$$

The only critical point of g occurs at the origin -- far away from the boundary of the constraint set $x^2+y^2=1$. So the constraint qualification will be satisfied at any candidate for a solution. Form the Lagrangian function

$$
L(x,y,\lambda)=xy-\lambda(x^2+y^2-1)
$$

and write out the first order conditions described in Theorem 18.3:

## L04-S23 — Inequality Constraints: Example

> PDF pages: 23
> Section: Inequality Constraints

**Example 18.7**:

$$
\begin{aligned}
\frac{\partial L}{\partial x}=y-2\lambda x&=0 \\
\frac{\partial L}{\partial y}=x-2\lambda y&=0 \\
\lambda(x^2+y^2-1)&=0 \\
x^2+y^2&\leq1 \\
\lambda&\geq0
\end{aligned}
$$

The first two equations yield

$$
\lambda=\frac{y}{2x}=\frac{x}{2y}\quad\text{or}\quad x^2=y^2
$$

## L04-S24 — Inequality Constraints: Example

> PDF pages: 24
> Section: Inequality Constraints

**Example 18.7**:

- If $\lambda=0$, then $x=y=0$, which is a candidate for a solution.
- If $\lambda\neq0$, then $x^2+y^2-1=0$ $\Rightarrow$ $x^2=y^2=\frac{1}{2}$, which gives $x=\pm\frac{1}{\sqrt{2}},y=\pm\frac{1}{\sqrt{2}}$ then we find the following four candidates:

  $$
  \begin{aligned}
  x&=+\frac{1}{\sqrt{2}},\ y=+\frac{1}{\sqrt{2}},\ \lambda=+\frac{1}{2} \\
  x&=-\frac{1}{\sqrt{2}},\ y=-\frac{1}{\sqrt{2}},\ \lambda=+\frac{1}{2} \\
  x&=+\frac{1}{\sqrt{2}},\ y=-\frac{1}{\sqrt{2}},\ \lambda=-\frac{1}{2} \\
  x&=-\frac{1}{\sqrt{2}},\ y=+\frac{1}{\sqrt{2}},\ \lambda=-\frac{1}{2}
  \end{aligned}
  $$

## L04-S25 — Inequality Constraints: Example

> PDF pages: 25
> Section: Inequality Constraints

**Example 18.7**: We disregard the last two candidates since they involve a negative multiplier. Plugging the three candidates into the object function, we find that

$$
x=\frac{1}{\sqrt{2}},\,y=\frac{1}{\sqrt{2}}\text{ and }x=-\frac{1}{\sqrt{2}},\,y=-\frac{1}{\sqrt{2}}
$$

are the solutions of our original problem. The two points with the negative multipliers are the solutions of the problem of minimizing $xy$ on the constraint set $x^2+y^2\leq1$.

## L04-S26 — Several Inequality Constraints

> PDF pages: 26
> Section: Inequality Constraints

- Problem setup:

  $$
  \begin{aligned}
  \max\quad &f(x) \\
  \text{s.t.}\quad &g_1(x)\leq b_1 \\
  &g_2(x)\leq b_2 \\
  &\quad\vdots \\
  &g_k(x)\leq b_k
  \end{aligned}
  $$

## L04-S27 — Inequality Constraints: Theorem

> PDF pages: 27
> Section: Inequality Constraints

**Theorem 18.4**

Suppose $x^*$ is a local maximizer of $f$ on the constraint set.

- Assume the first $k_0$ constraints are binding at $x^*$ and the last $k-k_0$ are not binding.
- Suppose the following NDCQ condition is satisfied at $x^*$: the rank of

  $$
  \left(
  \begin{array}{ccc}
  \frac{\partial g_1}{\partial x_1}(x^*)&\cdots&\frac{\partial g_1}{\partial x_n}(x^*)\\
  \vdots&\vdots&\vdots\\
  \frac{\partial g_{k_0}}{\partial x_1}(x^*)&\cdots&\frac{\partial g_{k_0}}{\partial x_n}(x^*)
  \end{array}
  \right)
  $$

  is $k_0$ -- as large as it can be.

## L04-S28 — Inequality Constraints: Theorem

> PDF pages: 28
> Section: Inequality Constraints

**Theorem 18.4 (Cond.)**

Form the Lagrangian function:

$$
L(x_1,\cdots,x_n,\lambda_1,\cdots,\lambda_k)\equiv f(x)-\lambda_1[g_1(x)-b_1]-\ldots-\lambda_k[g_k(x)-b_k].
$$

Then there exist multipliers $\lambda_1^*,\cdots,\lambda_k^*$ such that

- (a) $\frac{\partial L}{\partial x_1}(x^*,\lambda^*)=0,\cdots,\frac{\partial L}{\partial x_n}(x^*,\lambda^*)=0$
- (b) $\lambda_1^*[g_1(x^*)-b_1]=0,\cdots,\lambda_k^*[g_k(x^*)-b_k]=0$
- (c) $\lambda_1^*\geq0,\cdots,\lambda_k^*\geq0$
- (d) $g_1(x^*)\leq b_1,\cdots,g_k(x^*)\leq b_k$

## L04-S29 — Outline

> PDF pages: 29
> Section: Mixed Constraints

1. Definition
2. Equality Constraints
3. Inequality Constraints
4. Mixed Constraints

## L04-S30 — Mixed Constraints

> PDF pages: 30
> Section: Mixed Constraints

- Some maximization problems involve both equality and inequality constraints
- Problem setup:

  $$
  \begin{aligned}
  \max\quad &f(\mathbf{x}) \\
  \text{s.t.}\quad &g_1(\mathbf{x})\leq b_1,\cdots,g_k(\mathbf{x})\leq b_k \\
  &h_1(\mathbf{x})=c_1,\cdots,h_m(\mathbf{x})=c_m
  \end{aligned}
  $$

## L04-S31 — Mixed Constraints: Theorem

> PDF pages: 31
> Section: Mixed Constraints

**Theorem 18.5**

Suppose that $f,g_1,\cdots,g_k,h_1,\cdots,h_m$ are $C^1$. Suppose that $x^*\in\mathbb{R}^n$ is a local maximizer of $f$ on the constraint set.

- Assume the first $k_0$ constraints are binding at $x^*$ and the last $k-k_0$ are not binding. Suppose the following NDCQ condition is satisfied at $x^*$: the rank of

  $$
  \left(
  \begin{array}{ccc}
  \frac{\partial g_1}{\partial x_1}(x^*)&\cdots&\frac{\partial g_1}{\partial x_n}(x^*)\\
  \vdots&\vdots&\vdots\\
  \frac{\partial g_{k_0}}{\partial x_1}(x^*)&\cdots&\frac{\partial g_{k_0}}{\partial x_n}(x^*)\\
  \frac{\partial h_1}{\partial x_1}(x^*)&\cdots&\frac{\partial h_1}{\partial x_n}(x^*)\\
  \vdots&\ddots&\vdots\\
  \frac{\partial h_m}{\partial x_1}(x^*)&\cdots&\frac{\partial h_m}{\partial x_n}(x^*)
  \end{array}
  \right)
  $$

  is $k_0+m$ -- as large as it can be.

## L04-S32 — Mixed Constraints: Theorem

> PDF pages: 32
> Section: Mixed Constraints

**Theorem 18.5 (Cond.)**

Form the Lagrangian Function

$$
\begin{aligned}
L(x_1,\cdots,x_n,\lambda_1,\cdots,\lambda_k,\mu_1,\cdots,\mu_m)
\equiv f(x)&-\lambda_1[g_1(x)-b_1]-\cdots-\lambda_k[g_k(x)-b_k] \\
&-\mu_1[h_1(x)-c_1]-\cdots-\mu_m[h_m(x)-c_m]
\end{aligned}
$$

Then there exist multipliers $\lambda_1^*,\cdots,\lambda_k^*,\mu_1^*,\cdots,\mu_m^*$ such that:

- (a) $\frac{\partial L}{\partial x_1}(x^*,\lambda^*,\mu^*)=0,\cdots,\frac{\partial L}{\partial x_n}(x^*,\lambda^*,\mu^*)=0$
- (b) $\lambda_1^*[g_1(x^*)-b_1]=0,\cdots,\lambda_k^*[g_k(x^*)-b_k]=0$
- (c) $h_1(x^*)=c_1,\cdots,h_m(x^*)=c_m$
- (d) $\lambda_1^*\geq0,\cdots,\lambda_k^*\geq0$
- (e) $g_1(x^*)\leq b_1,\cdots,g_k(x^*)\leq b_k$
