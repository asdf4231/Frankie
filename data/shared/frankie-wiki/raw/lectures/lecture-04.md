# Lecture 4 — Constrained Optimization I

> Course: Dynamic Optimization
> Original: slides/lecture04-constrained_optimization_i.tex
> PDF: slides/lecture04-constrained_optimization_i.pdf
> Snapshot: v1
> Normalization notes: The exact course-defined macro `\RR` is expanded to $\mathbb{R}$ for Markdown rendering wherever it occurs; no rendered slide content in this lecture uses the macro. Presentation-only Beamer syntax has been removed without correcting source wording or mathematics.

## L04-S01 — Lecture 4: Constrained Optimization I

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Slides Prepared by Xiaoling Mei  
Fall, 2026

## L04-S02 — Outline

> PDF pages: 2
> Section: Definition and Examples

1. Definition and Examples
2. Equality Constraints
3. Inequality Constraints
4. Mixed Constraints

## L04-S03 — Motivation

> PDF pages: 3
> Section: Definition and Examples

We often work with the optimization problem in which the objects are not free to take on any value but are constrained. For example:

- A household's consumption is constrained by available income
- A firm's production is constrained by the cost and availability of its inputs
- The central mathematical problem here is that of maximizing/minimizing a function of several variables, where these variables are bound by some constraining equations.

## L04-S04 — Definitions

> PDF pages: 4
> Section: Definition and Examples

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

## L04-S05 — Constrained Optimization: Examples

> PDF pages: 5
> Section: Definition and Examples

Example 18.1 **Utility Maximization Problem**:

- In this most basic problem, $x_i$ represents the amount of commodity $i$
- $f(x_1,\cdots,x_n)$, usually written as $U(x_1,\cdots,x_n)$, measures the individual’s level of utility or satisfaction with consuming $x_1$ units of good 1, $x_2$ units of good 2, and so on.
- Let $p_1,\cdots,p_n$ denote the prices of the commodities and let $I$ denote the individual’s income.

## L04-S06 — Constrained Optimization: Examples

> PDF pages: 6
> Section: Definition and Examples

Example 18.1 **Utility Maximization Problem**: The consumer wants to

$$
\begin{aligned}
\text{maximize} \quad U(&x_1,\cdots,x_n) \\
\text{subject to} \quad p_1&x_1+p_2x_2+\cdots+p_nx_n\leq I \\
&x_1\geq 0,\ x_2\geq0,\ \cdots,\ x_n\geq0
\end{aligned}
$$

To be consistent with the general format, the nonnegativity constraints $x_i\geq 0$ should be written as $-x_i\leq0$ so that all inequality constraints are written with $\leq$ signs.

## L04-S07 — Constrained Optimization: Examples

> PDF pages: 7
> Section: Definition and Examples

Example 18.2 **Utility Maximization with Labor/Leisure Choice**: Let $U,x_1,\cdots,x_n$, $p_1,\cdots,p_n$ be as in the preceding example. In addition, let $w$ denote the wage rate, $I'$ the consumer's nonwage income, $\ell_0$ hours of labor, and $\ell_1$ hours of leisure. The consumer has $I'+w\ell_0$ dollars to spend and wants to

$$
\begin{aligned}
\text{maximize} \qquad U(x_1,\cdots,x_n,\ell_1)& \\
\text{subject to}\qquad p_1x_1+p_2x_2+\cdots+p_nx_n&\leq I'+w\ell_0 \\
\ell_0+\ell_1&=24 \\
x_1\geq0,\ x_2\geq0,\ \cdots,\ x_n\geq0,\ \ell_0\geq0,\ \ell_1&\geq0
\end{aligned}
$$

## L04-S08 — Constrained Optimization: Examples

> PDF pages: 8
> Section: Definition and Examples

Example 18.3 **Profit Maximization of a Competitive Firm**: Suppose that a firm in a competitive industry uses $n$ inputs to manufacture its product.

- Let $y$ denote the amount of its output, and let $x_1,\cdots,x_n$ denote the amounts of its inputs -- all flow concepts.
- Let $y=f(x_1,\cdots,x_n)$ denote the firm's production function, describing the maximal amount of output that can be produced from bundle $(x_1,\cdots,x_n)$.
- Let $p$ be the unit price of the output and let $w_i$ denote the cost of unit input i.

## L04-S09 — Constrained Optimization: Examples

> PDF pages: 9
> Section: Definition and Examples

Example 18.3 **Profit Maximization of a Competitive Firm**: The firm's goal is to choose $(x_1,\cdots,x_n)$ to maximize its profit:

$$
\begin{aligned}
\text{maximize}\qquad \Pi(x_1,\cdots,x_n)=pf(x_1,\cdots,x_n)&-\sum_{i=1}^n w_ix_i \\
\text{subject to}\qquad pf(x_1,\cdots,x_n)-\sum_{i=1}^n w_ix_i&\geq0, \\
g_1(x)\leq b_1,\cdots,g_k(x)&\leq b_k, \\
x_1\geq0,\cdots,x_n&\geq0.
\end{aligned}
$$

The first inequality constraints reflects the requirement that profit is nonnegative. The $g_j$ constraints represent constraints on the availability of the inputs.

## L04-S10 — Outline

> PDF pages: 10
> Section: Equality Constraints

1. Definition and Examples
2. Equality Constraints
3. Inequality Constraints
4. Mixed Constraints

## L04-S11 — Equality Constraints

> PDF pages: 11
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

## L04-S12 — Equality Constraints

> PDF pages: 12
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

## L04-S13 — Equality Constraints

> PDF pages: 13
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

## L04-S14 — Equality Constraints

> PDF pages: 14
> Section: Equality Constraints

**Constraint Qualification**

- Above method would not have worked if both $\partial h/\partial x_1$ and $\partial h/\partial x_2$ were 0;
- We will need to make the assumption that $\partial h/\partial x_1$ or $\partial h/\partial x_2$ (or both) is not zero at the maximizer
- This restriction is called a **constraint qualification**

## L04-S15 — Equality Constraints: Theorem

> PDF pages: 15
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

## L04-S16 — Example 18.4

> PDF pages: 16
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

## L04-S17 — Example 18.4

> PDF pages: 17
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

## L04-S18 — Example 18.5

> PDF pages: 18
> Section: Equality Constraints

**Example 18.5** Consider a more complex example:

$$
\begin{aligned}
\text{maximize}\quad &f(x_1,x_2)=x_1^2x_2 \\
\text{subject to}\quad &C_h=\{(x_1,x_2):2x_1^2+x_2^2=3\}.
\end{aligned}
$$

*Check constraint qualification*: compute the critical points of $h(x_1,x_2)=2x_1^2+x_2^2$, the only such critical point is $(x_1,x_2)=(0,0)$, which is a point not in the constraint set $C_h$.

## L04-S19 — Example 18.5

> PDF pages: 19
> Section: Equality Constraints

**Example 18.5** Now, from the Lagrangian function

$$
L(x_1,x_2,\mu)=x_1^2x_2-\mu(2x_1^2+x_2^2-3)
$$

Compute the partial derivatives and set them equal to 0:

$$
\begin{aligned}
\frac{\partial L}{\partial x_1}&=2x_1x_2-4\mu x_1=2x_1(x_2-2\mu)=0 \\
\frac{\partial L}{\partial x_2}&=x_1^2-2\mu x_2=0 \\
\frac{\partial L}{\partial \mu}&=-2x_1^2-x_2^2+3=0
\end{aligned}
$$

## L04-S20 — Example 18.5

> PDF pages: 20
> Section: Equality Constraints

**Example 18.5**

- From first equation: $x_1=0$ or $x_2=2\mu$
- If $x_1=0$, $(0,\sqrt{3},0)$ and $(0,-\sqrt{3},0)$ are two solutions of the system
- If $x_1\neq0$, then $x_2=2\mu$. We have $x_1=\pm1,x_2=\pm1$. Then we obtain four more solutions of the system $(1,1,0.5),\,(-1,-1,-0.5),\,(1,-1,-0.5),\,(-1,1,0.5).$
- Since $f(1,1)=f(-1,1)=1$, $f(1,-1)=f(-1,-1)=-1$ and $f(0,\sqrt{3})=f(0,-\sqrt{3})=0$
- The max occurs at $(1,1)$ and $(-1,1)$. Note that $(1,-1)$ and $(-1,-1)$ minimize f on $C_h$.

## L04-S21 — Several Equality Constraints

> PDF pages: 21
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

## L04-S22 — Equality Constraints: Theorem

> PDF pages: 22
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

## L04-S23 — Example 18.6

> PDF pages: 23
> Section: Equality Constraints

**Example 18.6** Consider the problem:

$$
\begin{aligned}
\text{maximize}\quad f(x,y,z)&=xyz \\
\text{subject to}\quad h_1(x,y,z)&\equiv x^2+y^2=1, \\
h_2(x,y,z)&\equiv x+z=1.
\end{aligned}
$$

*Check NDCQ*: First compute the Jacobian matrix of the constraint functions

$$
D\mathbf{h}(x,y,z)=
\left(
\begin{array}{ccc}
\frac{\partial h_1}{\partial x}&\frac{\partial h_1}{\partial y}&\frac{\partial h_1}{\partial z}\\
\frac{\partial h_2}{\partial x}&\frac{\partial h_2}{\partial y}&\frac{\partial h_2}{\partial z}
\end{array}
\right)
=
\left(
\begin{array}{ccc}
2x&2y&0\\
1&0&1
\end{array}
\right)
$$

## L04-S24 — Example 18.6

> PDF pages: 24
> Section: Equality Constraints

**Example 18.6**

- It's easy to see its rank is less than 2 if and only if $x=y=0$.
- Since any point with $x=y=0$ would violate the first constraint, all points in the constraint set satisfy NDCQ.
- Consider the Lagrangian:

  $$
  L(x,y,z,\mu_1,\mu_2)=xyz-\mu_1(x^2+y^2-1)-\mu_2(x+z-1)
  $$

  and set its first partial derivatives equal to 0, we have

## L04-S25 — Example 18.6

> PDF pages: 25
> Section: Equality Constraints

**Example 18.6**

$$
\begin{aligned}
\frac{\partial L}{\partial x}&=yz-2\mu_1x-\mu_2=0 \\
\frac{\partial L}{\partial y}&=xz-2\mu_1y=0 \\
\frac{\partial L}{\partial z}&=xy-\mu_2=0 \\
\frac{\partial L}{\partial \mu_1}&=1-x^2-y^2=0 \\
\frac{\partial L}{\partial \mu_2}&=1-x-z=0
\end{aligned}
$$

## L04-S26 — Example 18.6

> PDF pages: 26
> Section: Equality Constraints

**Example 18.6**

The case $y=0$ gives the candidate

$$
(x,y,z,\mu_1,\mu_2)=(1,0,0,0,0),
$$

with objective value $f(1,0,0)=0$. For $y\neq0$, solve the second and third equations for $\mu_1$ and $\mu_2$ in terms of $x,y$, and $z$ and plug these into the first equation to obtain

$$
y^2z-x^2z-xy^2=0.
$$

Then solve the fourth equation for $y^2$ in terms of $x^2$ and the last equation for $z$ in terms of $x$. The remaining candidates satisfy

$$
(1-x^2)(1-x)-x^2(1-x)-x(1-x^2)=0
$$

and $x=\frac{1}{6}(-1\pm\sqrt{13})\approx-0.7676$ or $0.4343$. They give

$$
\begin{aligned}
x&\approx0.4343,\ y\approx\pm0.9008,\ z\approx0.5657 \\
x&\approx-0.7676,\ y\approx\pm0.6409,\ z\approx1.7675.
\end{aligned}
$$

Evaluating the objective function, the maximizer remains

$$
x\approx-0.7676,\ y\approx-0.6409,\ z\approx1.7675.
$$

## L04-S27 — Outline

> PDF pages: 27
> Section: Inequality Constraints

1. Definition and Examples
2. Equality Constraints
3. Inequality Constraints
4. Mixed Constraints

## L04-S28 — Inequality Constraints

> PDF pages: 28
> Section: Inequality Constraints

- Many optimization problems have their constraints defined by inequalities $g_1(x_1,\cdots,x_n)\leq b_1,\cdots,g_k(x_1,\cdots,x_n)\leq b_k$
- The method for finding the constrained maxima is more complex
- We start with the simplest case when there are two variables and one *inequality* constraint

## L04-S29 — Inequality Constraints

> PDF pages: 29
> Section: Inequality Constraints

- Consider the optimization problem with one inequality constraint:

  $$
  \begin{aligned}
  \max\quad &f(x,y) \\
  \text{s.t.}\quad &g(x,y)\leq b
  \end{aligned}
  $$

## L04-S30 — Inequality Constraints

> PDF pages: 30
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

## L04-S31 — Inequality Constraints

> PDF pages: 31
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

## L04-S32 — Inequality Constraints

> PDF pages: 32
> Section: Inequality Constraints

In summary:

- The constraint is binding: $g(x,y)-b=0$, in this case $\lambda\geq0$
- The constraint is not binding, in this case $\lambda=0$
- Therefore $\lambda=0$ or $g(x,y)-b=0$ (and both may hold). This is called a **complementary slackness condition**:

  $$
  \lambda(g(x,y)-b)=0
  $$

- Since we do not know if the constraint will be binding at the maximizer, we use the above equation to replace $\partial L/\partial\lambda=0$

## L04-S33 — Inequality Constraints: Theorem

> PDF pages: 33
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

## L04-S34 — Inequality Constraints: Example

> PDF pages: 34
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

## L04-S35 — Inequality Constraints: Example

> PDF pages: 35
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

## L04-S36 — Inequality Constraints: Example

> PDF pages: 36
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

## L04-S37 — Inequality Constraints: Example

> PDF pages: 37
> Section: Inequality Constraints

**Example 18.7**: We disregard the last two candidates since they involve a negative multiplier. Plugging the three candidates into the object function, we find that

$$
x=\frac{1}{\sqrt{2}},\,y=\frac{1}{\sqrt{2}}\text{ and }x=-\frac{1}{\sqrt{2}},\,y=-\frac{1}{\sqrt{2}}
$$

are the solutions of our original problem. The two points with the negative multipliers are the solutions of the problem of minimizing $xy$ on the constraint set $x^2+y^2\leq1$.

## L04-S38 — Inequality Constraints: Example

> PDF pages: 38
> Section: Inequality Constraints

**Example 18.8** Consider again the standard utility maximization problem of Example 18.1. We continue to ignore the nonnegativity constraints but do not force the budget constraint to be binding in the statement of the problem.

$$
\begin{aligned}
\max\quad &U(x_1,x_2) \\
\text{s.t.}\quad &p_1x_1+p_2x_2\leq I
\end{aligned}
$$

## L04-S39 — Inequality Constraints: Example

> PDF pages: 39
> Section: Inequality Constraints

**Example 18.8**: We assume that for each commodity bundle$(x_1,x_2)$,

$$
\frac{\partial U}{\partial x_1}(x_1,x_2)>0\quad\text{or}\quad\frac{\partial U}{\partial x_2}(x_1,x_2)>0
$$

- This is a version of the usual monotonicity or nonsatiation assumption
- It states that the commodities under study are goods in that increasing consumption increases utility.

## L04-S40 — Inequality Constraints: Example

> PDF pages: 40
> Section: Inequality Constraints

**Example 18.8**: Since the usual constraint qualification is satisfied, so form the Lagrangian function:

$$
L(x_1,x_2,\lambda)=U(x_1,x_2)-\lambda(p_1x_1+p_2x_2-I)
$$

and compute its $x_1$- and $x_2$-critical points:

$$
\begin{aligned}
\frac{\partial L}{\partial x_1}(x_1,x_2)&=\frac{\partial U}{\partial x_1}(x_1,x_2)-\lambda p_1=0, \\
\frac{\partial L}{\partial x_2}(x_1,x_2)&=\frac{\partial U}{\partial x_2}(x_1,x_2)-\lambda p_2=0,
\end{aligned}
$$

## L04-S41 — Inequality Constraints: Example

> PDF pages: 41
> Section: Inequality Constraints

**Example 18.8**: Then, we conclude

- At the maximizer, the multiplier $\lambda$ cannot be zero. Otherwise both $\frac{\partial U}{\partial x_1}$ and $\frac{\partial U}{\partial x_2}$ would be zero -- a contradiction to our monotonicity assumption.
- Since $\lambda>0$ and $\lambda(p_1x_1+p_2x_2-I)=0$, it follows that $p_1x_1+p_2x_2=I$.
- That is, the consumer will spend all available income and we can treat the budget constraint as an equality constraint.

## L04-S42 — Several Inequality Constraints

> PDF pages: 42
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

## L04-S43 — Inequality Constraints: Theorem

> PDF pages: 43
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

## L04-S44 — Inequality Constraints: Theorem

> PDF pages: 44
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

## L04-S45 — Inequality Constraints: Example

> PDF pages: 45
> Section: Inequality Constraints

**Example 18.9** Consider the problem

$$
\begin{aligned}
\max\qquad f(x,y,z)&=xyz \\
\text{s.t.}\qquad x+y+z&\leq1 \\
x\geq0,\ y\geq0,\ z&\geq0
\end{aligned}
$$

Rewrite the three nonnegatitivity constraints as

$$
-x\leq0,\ -y\leq0,\ -z\leq0
$$

## L04-S46 — Inequality Constraints: Example

> PDF pages: 46
> Section: Inequality Constraints

**Example 18.9** The Jacobian of the constraint functions is

$$
\left(
\begin{array}{ccc}
1&1&1\\
-1&0&0\\
0&-1&0\\
0&0&-1
\end{array}
\right)
$$

Every subset of at most three rows is linearly independent. All four constraints cannot bind simultaneously. Therefore the NDCQ holds at any solution candidate.

## L04-S47 — Inequality Constraints: Example

> PDF pages: 47
> Section: Inequality Constraints

**Example 18.9** Form the Lagrangian function:

$$
L(x,y,z,\lambda_1,\lambda_2,\lambda_3,\lambda_4)=xyz-\lambda_1(x+y+z-1)-\lambda_2(-x)-\lambda_3(-y)-\lambda_4(-z)
$$

It can be simplified to

$$
L(x,y,z,\lambda_1,\lambda_2,\lambda_3,\lambda_4)=xyz-\lambda_1(x+y+z-1)+\lambda_2x+\lambda_3y+\lambda_4z
$$

## L04-S48 — Inequality Constraints: Example

> PDF pages: 48
> Section: Inequality Constraints

**Example 18.9** According to Theorem 18.4, we have:

$$
\begin{aligned}
&(1)\ \frac{\partial L}{\partial x}=yz-\lambda_1+\lambda_2=0 \\
&(2)\ \frac{\partial L}{\partial y}=xz-\lambda_1+\lambda_3=0 \\
&(3)\ \frac{\partial L}{\partial z}=xy-\lambda_1+\lambda_4=0 \\
&(4)\ \lambda_1(x+y+z-1)=0,\qquad &(5)\ \lambda_2x=0 \\
&(6)\ \lambda_3y=0 &(7)\ \lambda_4z=0 \\
&(8)\ \lambda_1\geq0 &(9)\ \lambda_2\geq0 \\
&(10)\ \lambda_3\geq0 &(11)\ \lambda_4\geq0 \\
&(12)\ x+y+z\leq1 &(13)\ x\geq0 \\
&(14)\ y\geq0 &(15)\ z\geq0
\end{aligned}
$$

## L04-S49 — Inequality Constraints: Example

> PDF pages: 49
> Section: Inequality Constraints

**Example 18.9**

- Rewrite conditions 1, 2, and 3, without minus signs, as

  $$
  \lambda_1=yz+\lambda_2=xz+\lambda_3=xy+\lambda_4
  $$

- If $\lambda_1=0$, then $yz=xz=xy=0$ and $\lambda_1=\lambda_2=\lambda_3=\lambda_4=0$, because of nonnegativity.
- If $\lambda_1>0$, suppose $x=0$, then $\lambda_1=\lambda_3=\lambda_4>0$ $\Rightarrow$ $y=z=0$, a contradiction to $x+y+z=1$, so $x>0$.
- Similar arguments show that $y>0,z>0$ $\Rightarrow$ $\lambda_2=\lambda_3=\lambda_4=0$ and $yz=xz=xy$, so $x=y=z=\frac{1}{3}$ and $\lambda_1=\frac{1}{9}$.
- Since $f(\frac{1}{3},\frac{1}{3},\frac{1}{3})=\frac{1}{27}>0$, $x=y=z=\frac{1}{3}$ is the solution of the constraint maximization problem.

## L04-S50 — Outline

> PDF pages: 50
> Section: Mixed Constraints

1. Definition and Examples
2. Equality Constraints
3. Inequality Constraints
4. Mixed Constraints

## L04-S51 — Mixed Constraints

> PDF pages: 51
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

## L04-S52 — Mixed Constraints: Theorem

> PDF pages: 52
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

## L04-S53 — Mixed Constraints: Theorem

> PDF pages: 53
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

## L04-S54 — Mixed Constraints: Example

> PDF pages: 54
> Section: Mixed Constraints

**Example 18.10** Consider the problem

$$
\begin{aligned}
\max\quad f(x,y)&=x-y^2 \\
\text{s.t.}\quad x^2+y^2&=4 \\
x\geq0,\ y&\geq0
\end{aligned}
$$

- Checking the NDCQ, first note that the gradient of $x^2+y^2$ is zero only at the origin, a point which is not in the constraint set.
- If either nonnegativity constraint is binding, then the solution candidates is $(2,0)$ and $(0,2)$.
- In both cases, the corresponding $2\times2$ Jacobian matrix of constraints has rank two, so the NDCQ will automatically be satisfied.

## L04-S55 — Mixed Constraints: Example

> PDF pages: 55
> Section: Mixed Constraints

**Example 18.10**

- Form the Lagrangian

  $$
  L=x-y^2-\mu(x^2+y^2-4)+\lambda_1x+\lambda_2y
  $$

- The first order conditions become:

  $$
  \begin{aligned}
  (1)&\quad \partial L/\partial x=1-2\mu x+\lambda_1=0 \\
  (2)&\quad \partial L/\partial y=-2y-2\mu y+\lambda_2=0 \\
  (3)&\quad x^2+y^2-4=0; \\
  (4)&\quad \lambda_1x=0\qquad (5)\quad\lambda_2y=0 \\
  (6)&\quad \lambda_1\geq0,\qquad (7)\quad\lambda_2\geq0 \\
  (8)&\quad x\geq0\qquad (9)\quad y\geq0
  \end{aligned}
  $$

## L04-S56 — Mixed Constraints: Example

> PDF pages: 56
> Section: Mixed Constraints

**Example 18.10**

- Write (1) as $1+\lambda_1=2\mu x$. Since $\lambda_1\geq0$, $1+\lambda_1>0$. Therefore $\mu>0$ and $x>0$, so according to (4), $\lambda_1=0$
- Write (2) as $2y(1+\mu)=\lambda_2$. Since $1+\mu>0$, either both $y$ and $\lambda_2$ are 0 or both are positive.
- By (5), both cannot be positive, therefore $\lambda_2=y=0$.
- So $x=2$ by (3) and (8), $\lambda_1=0$ by (4) and $\mu=1/4$ by (1). So the solution is

  $$
  (x,y,\mu,\lambda_1,\lambda_2)=(2,0,1/4,0,0)
  $$

## L04-S57 — Mixed Constraints: Minimization Problems

> PDF pages: 57
> Section: Mixed Constraints

- Present the all the inequality constraints in a minimization problem as $g(\mathbf{x})\geq b$ instead of as $g(\mathbf{x})\leq b$.
- Follow the same steps as in a maximization problems

## L04-S58 — Mixed Constraints: Example

> PDF pages: 58
> Section: Mixed Constraints

**Example 18.11** Consider the problem

$$
\begin{aligned}
\min\quad f(x,y)&=2y-x^2 \\
\text{s.t.}\quad x^2+y^2&\leq1 \\
x\geq0,\ y&\geq0
\end{aligned}
$$

- Write the first constraint as $-x^2-y^2\geq-1$
- For the Lagrangian function

  $$
  \begin{aligned}
  L(x,y,\lambda_1,\lambda_2,\lambda_3)&=2y-x^2 \\
  &-\lambda_1(-x^2-y^2+1)-\lambda_2x-\lambda_3y
  \end{aligned}
  $$

## L04-S59 — Mixed Constraints: Example

> PDF pages: 59
> Section: Mixed Constraints

**Example 18.11** The first order conditions are:

$$
\begin{aligned}
&(1)\ \frac{\partial L}{\partial x}=-2x+2\lambda_1x-\lambda_2=0 \\
&(2)\ \frac{\partial L}{\partial y}=2+2\lambda_1y-\lambda_3=0 \\
&(3)\ \lambda_1(-x^2-y^2+1)=0 \\
&(4)\ \lambda_2x=0 \\
&(5)\ \lambda_3y=0 \\
&(6)\ \lambda_1,\lambda_2,\lambda_3\geq0
\end{aligned}
$$

## L04-S60 — Mixed Constraints: Example

> PDF pages: 60
> Section: Mixed Constraints

**Example 18.11**

- Rewrite the first two equations to $2x+\lambda_2=2\lambda_1x$ and $2+2\lambda_1y=\lambda_3$. Since $\lambda_3\geq2>0$, we conclude that $y=0$ from (5) and $\lambda_3=2$.
- Next examine $x$. If $x=0$, then from (3), $\lambda_1=0$ and $\lambda_2=0$ by (1). Thus $f(0,0)=0$;
- If $x>0$, then $\lambda_2=0$ by (4), $\lambda_1=1$ by (1) and $x=1$ by (3), thus $f(1,0)=-1$
- We conclude that $(x,y)=(1,0)$ minimizes $f(x,y)=2y-x^2$ on the constraint set.

## L04-S61 — Mixed Constraints: Kuhn-Tucker Formulation

> PDF pages: 61
> Section: Mixed Constraints

- For the type of constrained maximization problem with only inequality constraints and a complete set of nonnegativity constraints
- That is:

  $$
  \begin{aligned}
  \max\quad &f(x_1,\cdots,x_n) \\
  \text{s.t.}\quad &g_1(x_1,\cdots,x_n)\leq b_1,\cdots,g_k(x_1,\cdots,x_n)\leq b_k \\
  &x_1\geq0,\cdots,x_n\geq0
  \end{aligned}
  $$

- The Lagrangian gives

  $$
  \begin{aligned}
  L(\mathbf{x},\lambda_1,\cdots,\lambda_k,\nu_1,\cdots,\nu_n)
  \equiv f(\mathbf{x})-\lambda_1[g_1(\mathbf{x})-b_1]&-\cdots-\lambda_k[g_k(\mathbf{x})-b_k] \\
  &+\nu_1x_1+\cdots+\nu_nx_n
  \end{aligned}
  $$

## L04-S62 — Mixed Constraints: Kuhn-Tucker Formulation

> PDF pages: 62
> Section: Mixed Constraints

The corresponding FOC are:

$$
\begin{aligned}
(1)\qquad &\frac{\partial L}{\partial x_1}=\frac{\partial f}{\partial x_1}-\lambda_1\frac{\partial g_1}{\partial x_1}-\cdots-\lambda_k\frac{\partial g_k}{\partial x_1}+\nu_1=0 \\
&\quad\ldots \\
&\frac{\partial L}{\partial x_n}=\frac{\partial f}{\partial x_n}-\lambda_1\frac{\partial g_1}{\partial x_n}-\cdots-\lambda_k\frac{\partial g_k}{\partial x_n}+\nu_n=0 \\
(2)\qquad &\lambda_1[g_1(\mathbf{x})-b_1]=-\lambda_1\frac{\partial L}{\partial\lambda_1}=0 \\
&\quad\ldots \\
&\lambda_k[g_k(\mathbf{x})-b_k]=-\lambda_k\frac{\partial L}{\partial\lambda_k}=0 \\
(3)\qquad &\nu_1x_1=0,...,\nu_nx_n=0 \\
&\lambda_1,\cdots,\lambda_k,\nu_1,\cdots,\nu_n\geq0
\end{aligned}
$$

## L04-S63 — Mixed Constraints: Kuhn-Tucker Formulation

> PDF pages: 63
> Section: Mixed Constraints

- A special Lagrangian was proposed by Harold Kuhn and A.W. Tucker (the Kuhn-Tucker formulation):

  $$
  \tilde{L}(\mathbf{x},\lambda_1,\cdots,\lambda_k)\equiv f(\mathbf{x})-\lambda_1[g_1(\mathbf{x})-b_1]-\cdots-\lambda_k[g_k(\mathbf{x})-b_k]
  $$

- Note that

  $$
  L(\mathbf{x},\lambda_1,\cdots,\lambda_k,\nu_1,\cdots,\nu_n)=\tilde{L}(\mathbf{x},\lambda_1,\cdots,\lambda_k)+\nu_1x_1+\cdots+\nu_nx_n
  $$

## L04-S64 — Mixed Constraints: Kuhn-Tucker Formulation

> PDF pages: 64
> Section: Mixed Constraints

- Rewrite (1) as:

  $$
  (4)\ \frac{\partial L}{\partial x_j}=\frac{\partial\tilde{L}}{\partial x_j}+\nu_j=0\quad\text{or}\quad\frac{\partial\tilde{L}}{\partial x_j}=-\nu_j
  $$

- By (3) and (4) and nonnegativity of $\nu$, we have

  $$
  \frac{\partial\tilde{L}}{\partial x_j}\leq0\quad\text{and}\quad x_j\frac{\partial\tilde{L}}{\partial x_j}=0
  $$

- On the other hand, $\frac{\partial\tilde{L}}{\partial\lambda_j}=\frac{\partial L}{\partial\lambda_j}=b_j-g_j(\mathbf{x})\geq0$

## L04-S65 — Mixed Constraints: Kuhn-Tucker Formulation

> PDF pages: 65
> Section: Mixed Constraints

- To summarize, the first order conditions in terms of the Kuhn-tucker formulation is:

  $$
  \begin{aligned}
  \frac{\partial\tilde{L}}{\partial x_1}&\leq0,\cdots,\frac{\partial\tilde{L}}{\partial x_n}\leq0 \\
  \frac{\partial\tilde{L}}{\partial\lambda_1}&\geq0,\cdots,\frac{\partial\tilde{L}}{\partial\lambda_k}\geq0 \\
  x_1\frac{\partial\tilde{L}}{\partial x_1}&=0,\cdots,x_n\frac{\partial\tilde{L}}{\partial x_n}=0 \\
  \lambda_1\frac{\partial\tilde{L}}{\partial\lambda_1}&=0,\cdots,\lambda_k\frac{\partial\tilde{L}}{\partial\lambda_k}=0
  \end{aligned}
  $$

- $n+k$ unknowns and equations

## L04-S66 — Kuhn-Tucker Formulation: Examples

> PDF pages: 66
> Section: Mixed Constraints

**Example 18.12** The Kuhn-Tucker Lagrangian for the usual utility maximization problem with two variables in Example 18.1 is:

$$
\tilde{L}(x_1,x_2,\lambda)=U(x_1,x_2)-\lambda(p_1x_1+p_2x_2-I)
$$

The FOCs are:

$$
\begin{aligned}
&\frac{\partial U}{\partial x_1}-\lambda p_1\leq0,\ \frac{\partial U}{\partial x_2}-\lambda p_2\leq0 \\
&\frac{\partial\tilde{L}}{\partial\lambda}=I-p_1x_1-p_2x_2\geq0 \\
&x_1\left(\frac{\partial U}{\partial x_1}-\lambda p_1\right)=0,\ x_2\left(\frac{\partial U}{\partial x_2}-\lambda p_2\right)=0 \\
&\lambda\frac{\partial\tilde{L}}{\partial\lambda}=\lambda(I-p_1x_1-p_2x_2)=0
\end{aligned}
$$

## L04-S67 — Examples

> PDF pages: 67
> Section: Mixed Constraints

**Example 18.13** Consider the problem

$$
\begin{aligned}
\max\quad f(x,y)&=x^2+x+4y^2 \\
\text{s.t.}\quad 2x+2y&\leq1 \\
x\geq0,\ y&\geq0
\end{aligned}
$$

- The Jacobian of the constraint functions is

  $$
  \left(
  \begin{array}{cc}
  2&2\\
  -1&0\\
  0&-1
  \end{array}
  \right)
  $$

- At most two constraints can be binding at the same time, and any $2\times2$ submatrix of the Jacobian has rank two. Therefore, the NDCQ will hold at any solution candidate.

## L04-S68 — Example

> PDF pages: 68
> Section: Mixed Constraints

**Example 18.13** Form the Lagrangian

$$
L(x,y,\lambda_1,\lambda_2,\lambda_3)=x^2+x+4y^2-\lambda_1(2x+2y-1)+\lambda_2x+\lambda_3y
$$

- The FOCs are:

  $$
  \begin{aligned}
  &(1)\ \frac{\partial L}{\partial x}=2x+1-2\lambda_1+\lambda_2=0 \\
  &(2)\ \frac{\partial L}{\partial y}=8y-2\lambda_1+\lambda_3=0 \\
  &(3)\ \lambda_1(2x+2y-1)=0,\ \lambda_2x=0,\ \lambda_3y=0 \\
  &(4)\ \lambda_1\geq0,\lambda_2\geq0,\lambda_3\geq0 \\
  &(5)\ 2x+2y\leq1,\ x\geq0,\ y\geq0
  \end{aligned}
  $$

## L04-S69 — Example

> PDF pages: 69
> Section: Mixed Constraints

**Example 18.13**

- From (1), $2\lambda_1\geq1>0$, which implies that $2x+2y=1$ is binding
- Now consider $\lambda_2>0$. It follows from (3) that $x=0$, $y=0.5$, and $\lambda_3=0$. It follows from (1) and (2) that $\lambda_1=2$ and $\lambda_2=3$. So the assumption $\lambda_2>0$ leads to the candidate

  $$
  (x,y,\lambda_1,\lambda_2,\lambda_3)=(0,0.5,2,3,0)
  $$

- Try the opposite case, $\lambda_2=0$. Then we have $2x+1+\lambda_2=2\lambda_1$ and $2=10y+\lambda_3$, which leads to the conclusion that either $y=0$ or $\lambda_3=0$ and we get two candidates:

  $$
  (x,y,\lambda_1,\lambda_2,\lambda_3)=(0.5,0,1,0,2),\,
  (x,y,\lambda_1,\lambda_2,\lambda_3)=(0.3,0.2,0.8,0,0)
  $$

- By evaluating the objective function at each of these three candidates, we find that the constrained maximum occurs at the point $x=0,y=0.5$ where $\lambda_1=2,\lambda_2=3,\lambda_3=0$.
