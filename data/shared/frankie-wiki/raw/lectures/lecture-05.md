# Lecture 5 — Constrained Optimization II

> Course: Dynamic Optimization
> Original: slides/lecture05-constrained_optimization_ii.tex
> PDF: slides/lecture05-constrained_optimization_ii.pdf
> Snapshot: v1
> Normalization notes: The exact course-defined macro `\RR` is expanded to $\mathbb{R}$ for Markdown rendering. The TeX equation labels `eq1` and `eq2` are represented by their rendered tags (1) and (2). The presentation-only command `\textendash` used as a matrix separator is represented by a literal en dash. Presentation-only Beamer syntax has otherwise been removed without correcting source wording or mathematics.

## L05-S01 — Lecture 5: Constrained Optimization II

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Slides Prepared by Xiaoling Mei  
Fall, 2026

## L05-S02 — Introduction

> PDF pages: 2

This lecture focuses on three other aspects of the Lagrangian approach:

- the sensitivity of the optimal value of the objective function to changes in the parameters
- the second order conditions that distinguish maxima from minima
- the constraint qualifications that are a subtle but necessary hypothesis in the Lagrangian approach

## L05-S03 — Outline

> PDF pages: 3
> Section: The Meaning of the Multiplier

1. The Meaning of the Multiplier
2. Envelope Theorems
3. Second Order Conditions
4. Smooth Dependence on the Parameters
5. Constraint Qualifications

## L05-S04 — The Meaning of the Multiplier

> PDF pages: 4
> Section: The Meaning of the Multiplier
> TeX equation labels: `eq1`, `eq2`

Consider the simplest problem with one equality constraint:

$$
\begin{aligned}
\text{max}\ \ & f(x,y) \tag{1} \\
\text{s.t.}\ \ & h(x,y) = a \tag{2}
\end{aligned}
$$

## L05-S05 — The Meaning of the Multiplier

> PDF pages: 5
> Section: The Meaning of the Multiplier

**Theorem 19.1**

- Let $f$ and $h$ be $C^1$ functions of two variables. For any fixed value of the parameter $a$, let $(x^*(a),y^*(a))$ be the solution of problem (1)--(2) with corresponding multiplier $\mu^*(a)$.
- Suppose that $x^*,y^*$ and $\mu^*$ are $C^1$ functions of $a$ and that NDCQ holds at $(x^*(a),y^*(a))$. Then

  $$
  \mu^*(a) = \frac{d}{da}f(x^*(a),y^*(a))
  $$

## L05-S06 — Example 19.1

> PDF pages: 6
> Section: The Meaning of the Multiplier

**Example 19.1**: Previously, we found that a maximizer of $f(x_1,x_2) = x_1^2x_2$ on the constraint set $2x_1^2+x_2^2 = 3$ is $x_1 = x_2 = 1$, with multiplier $\mu = 0.5$.

- The maximum value of $f$ is $f^* = f(1,1) = 1$
- Redo the problem, this time using the constraint

  $$
  2x_1^2+x_2^2 = 3.3
  $$

- The same computation yields the solution $x_1 = x_2 = \sqrt{1.1}$, with maximum value $f^* = (1.1)^{3/2} \approx 1.1537$, an increase of 0.1537 over the original $f^*$

## L05-S07 — Example 19.1

> PDF pages: 7
> Section: The Meaning of the Multiplier

**Example 19.1**:

- On the other hand, Theorem 19.1 predicts that changing the right-hand side of the constraint by 0.3 unit would change the maximum value of the objective function by roughly

  $$
  0.3\mu = 0.3*0.5 = 0.15\ \text{unit},
  $$

  an approximation correct to two decimal places

## L05-S08 — Several Equality Constraints: Theorem

> PDF pages: 8
> Section: The Meaning of the Multiplier

**Theorem 19.2**

Let $f,h_1,\cdots,h_m$ be $C^1$ functions on $\mathbb{R}^n$. Let $\mathbf{a} = (a_1,\cdots,a_m)$ be an $m$-tuple of exogenous parameters, and consider the problem of maximizing $f(x_1,\cdots,x_n)$ subject to

$$
h_1(x_1,\cdots,x_n)= a_1, \ldots, h_m(x_1,\cdots,x_n) = a_m.
$$

Let $x_1^*(\mathbf{a}), \cdots, x_n^*(\mathbf{a})$ denote the solution of the problem with corresponding Lagrange multipliers $\mu_1^*(\mathbf{a}),\cdots, \mu_m^*(\mathbf{a})$. Suppose further that the $x_i^*$'s and $\mu_j^*$'s are differentiable functions of $(a_1,\cdots,a_m)$ and that NDCQ holds. Then, for each $j = 1,\cdots,m,$

$$
\mu_j^*(a_1,\cdots,a_m) = \frac{\partial}{\partial a_j}f(x_1^*(a_1,\cdots,a_m),\cdots,x_n^*(a_1,\cdots,a_m))
$$

## L05-S09 — Several Inequality Constraints

> PDF pages: 9
> Section: The Meaning of the Multiplier

**Theorem 19.3**

Let $\mathbf{a^*} = (a_1^*,\cdots,a_k^*)$ be a $k$-tuple. Consider the problem of maximizing $f(x_1, \cdots, x_n)$ subject to

$$
g_1(x_1,\cdots,x_n) \leq a_1^*, \ldots, g_k(x_1,\cdots,x_n) \leq a_k^*.
$$

Let $x_1^*(\mathbf{a^*}), \cdots, x_n^*(\mathbf{a^*})$ denote the solution of the problem with corresponding Lagrange multipliers $\lambda_1^*(\mathbf{a^*}),\cdots, \lambda_k^*(\mathbf{a^*}).$ Suppose that as $\mathbf{a}$ varies near $\mathbf{a^*}$, $x_1^*,\cdots,x_n^*$ and $\lambda_1^*,\cdots,\lambda_k^*$ are differentiable functions of $(a_1,\cdots,a_k)$ and that NDCQ holds at $\mathbf{a}^*$. Then, for each $j = 1,\cdots,k,$

$$
\lambda_j^*(a_1^*,\cdots,a_k^*) = \frac{\partial}{\partial a_j}f\left(x_1^*(a_1^*,\cdots,a_k^*),\cdots,x_n^*(a_1^*,\cdots,a_k^*)\right)
$$

## L05-S10 — Interpreting the Multiplier

> PDF pages: 10
> Section: The Meaning of the Multiplier

Think of the objective function as the profit function of a firm and think of $a_j$ as the amount of available input in the production process. Then $\lambda_j = \partial f/\partial a_j$ is called the *internal value*, or *shadow price* of input $j$:

- It tells how valuable another unit of certain input would be to the firm's profits
- It tells the maximum amount the firm would be willing to pay to acquire another unit of the input

## L05-S11 — Examples

> PDF pages: 11
> Section: The Meaning of the Multiplier

**Example 19.2** Previously, we computed that the maximizer of $xyz$ on the constraint set

$$
x+y+z\leq 1,\, x\geq 0,\, y\geq 0,\, z\geq 0
$$

is $x = y =z =1/3$, where $xyz = 1/27$. The four multipliers are $1/9, 0, 0$ and $0$ respectively.

- (a) If we change the first constraint to $x+y+z\leq0.9$, we compute that the solution occurs at $x = y = z = 0.3$, where $xyz = 0.027$. Theorem 19.3 predicts that the new optimal value would be $\frac{1}{27} + \frac{1}{9} \cdot \left(-\frac{1}{10}\right) \approx 0.0259$, an estimate that is off by only 0.0011 or 4\%.
- (b) If, instead, we change the second constraint form $x\geq0$ to $x\geq0.1$, we do not change the solution or the optimum value because the new region is a subset of the old region and it still contains the optimal point for the old region. This result is consistent with Theorem 19.3 since the multiplier for the (nonbinding) constraint $x\geq0$ was zero.

## L05-S12 — Outline

> PDF pages: 12
> Section: Envelope Theorems

1. The Meaning of the Multiplier
2. Envelope Theorems
3. Second Order Conditions
4. Smooth Dependence on the Parameters
5. Constraint Qualifications

## L05-S13 — Envelope Theorems

> PDF pages: 13
> Section: Envelope Theorems

- Previous theorems are special cases of a class of theorems which describe how the optimal value of the objective function in a parameterized optimization problem changes as one of the parameter changes.
- Such theorems are called **Envelope theorems**.

## L05-S14 — Envelope Theorems

> PDF pages: 14
> Section: Envelope Theorems

**Theorem 19.4**

Let $f(\mathbf{x}; a)$ be a $C^1$ function of $\mathbf{x}\in \mathbb{R}^n$ and the scalar $a$. For each choice of the parameter $a$, consider the unconstrained maximization problem: $\max_{\mathbf x} f(\mathbf{x}; a)$. Let $\mathbf{x^*}(a)$ be a solution of this problem. Suppose that $\mathbf{x^*}(a)$ is a $C^1$ function of $a$. Then

$$
\frac{d}{da}f(\mathbf{x^*}(a); a) = \frac{\partial}{\partial a}f(\mathbf{x^*(a); a})
$$

## L05-S15 — Envelope Theorems: Examples

> PDF pages: 15
> Section: Envelope Theorems

**Example 19.3** Consider the problem

$$
\max_x\ \ f(x,a) = -a^3x^4+15x^3-e^ax^2+17
$$

around $a = 1$. Since $f$ is a quartic polynomial in $x$ with a negative leading coefficient, when $a = 1$, $f\rightarrow -\infty$ as $x\rightarrow \pm \infty$. So $f$ admits a a finite global maximizer $x^*(a)$ for each value of $a$ near 1. Hence,

$$
\frac{d}{da}f(x^*(a),a) = \frac{\partial}{\partial a}f(x^*(a),a) = -3a^2x^{*4}-e^ax^{*2}<0
$$

Without solving for the optimal $x^*(a)$, we can tell that as $a$ increases beyond 1, $f(x^*(a),a)$ is a decreasing function of $a$. The peak of the graph of the function decreases as $a$ increases.

## L05-S16 — Envelope Theorems: Examples

> PDF pages: 16
> Section: Envelope Theorems

**Example 19.4** What will be the effect of a unit increase in $a$ on the value of

$$
\max_x\ \ f(x,a) = -x^2+2ax+4a^2
$$

for each $a$? Since $f'(x) = -2x+2a = 0$, $x^*(a) = a$. Then

$$
f(x^*(a),a) = f(a,a) = -a^2+2a*a+4a^2 = 5a^2,
$$

which will increase at a rate of $10a$ as $a$ increases. Instead, if we apply the envelope theorem,

$$
\frac{df^*}{da} = \frac{\partial f}{\partial a}(x^*(a),a) = 2x+8a = 10a
$$

since $x^*(a) = a$.

## L05-S17 — Envelope Theorems: Examples

> PDF pages: 17
> Section: Envelope Theorems

**Example 19.5**

- A silicon Valley firm produces an output of microchips denoted by $y$ and has a cost function $c(y)$ with $c'(y)>0$ and $c''(y)>0$.
- Of the chips it produces, a fraction $1-\alpha$ are unavoidably defective and cannot be sold.
- Working chips can be sold at price $p$, and the microchip market is highly competitive.

How will an increase in production quality affect the firm’s profit?

## L05-S18 — Envelope Theorems: Examples

> PDF pages: 18
> Section: Envelope Theorems

**Example 19.5** The firm’s profit function is given by

$$
\pi(p,\alpha) = \max_y\ \ [p\alpha y-c(y)]
$$

- The conditions on the cost function guarantee that there is a nonzero profit-maximizing output $y^*(\alpha)$ which depends smoothly on $\alpha$.
- The derivative of optimal profit $\pi$ with respect to $\alpha$ is

  $$
  \frac{d\pi}{d\alpha} = \frac{\partial}{\partial \alpha}(p\alpha y-c(y)) = py >0
  $$

## L05-S19 — Constrained Problems: Theorem

> PDF pages: 19
> Section: Envelope Theorems

**Theorem 19.5**

Let $f,h_1,\cdots,h_k$: $\mathbb{R}^n \times \mathbb{R}^1\rightarrow \mathbb{R}^1$ be $C^1$ functions. Let $\mathbf{x^*}(a) = (x_1^*(a),\cdots,x_n^*(a))$ denote the solution of the problem of maximizing $\mathbf{x}\rightarrow f(\mathbf{x},a)$ on the constraint set

$$
h_1(\mathbf{x}; a) = 0,\cdots, h_k(\mathbf{x}; a) = 0
$$

for any fixed choice of the parameter $a$. Suppose that $\mathbf{x^*}(a)$ and the Lagrangian multipliers $\mu_1(a),\cdots,\mu_k(a)$ are $C^1$ functions of $a$ and that the NDCQ holds. Then,

$$
\frac{d}{da}f(\mathbf{x^*}(a); a) = \frac{\partial L}{\partial a}(\mathbf{x^*}(a),\mu(a); a).
$$

## L05-S20 — Envelope Theorems: Example

> PDF pages: 20
> Section: Envelope Theorems

**Example 19.6** Consider the problem

$$
\begin{aligned}
\max \quad f(x,y) & = xy \\
\text{s.t.}\quad x^2+y^2 &\leq 1
\end{aligned}
$$

Now change the constraint to $x^2+1.1y^2 \leq 1$. If we write the constraint as $x^2+ay^2 \leq 1$, the Lagrangian for the parameterized problem is $L(x,y,\lambda;a) = xy-\lambda(x^2+ay^2-1)$.

## L05-S21 — Envelope Theorems: Example

> PDF pages: 21
> Section: Envelope Theorems

- The solution for the original $(a=1)$ problem was $x=y=\frac{1}{\sqrt{2}}$, $\lambda = \frac{1}{2}$
- The Envelope Theorem tells us that as a changes from 1 to 1.1, the optimal value of f changes by approximately

  $$
  \frac{\partial L}{\partial a}\left(\frac{1}{\sqrt{2}},\frac{1}{\sqrt{2}},\frac{1}{2};1\right)*0.1
  $$

- Since $\frac{\partial L}{\partial a} = -\lambda y^2 = -1/4$, the optimal value will decrease by approximately $0.1*(1/4) = 0.025$ to 0.475
- Calculate directly that the solution to the new problem is $x=\frac{1}{\sqrt{2}}, y=\frac{1}{\sqrt{2.2}}$, with $f^*\approx 0.4767$.

## L05-S22 — Outline

> PDF pages: 22
> Section: Second Order Conditions

1. The Meaning of the Multiplier
2. Envelope Theorems
3. Second Order Conditions
4. Smooth Dependence on the Parameters
5. Constraint Qualifications

## L05-S23 — Second Order Conditions: Theorems

> PDF pages: 23
> Section: Second Order Conditions

**Theorem 19.7**

Let $f$ and $h$ be $C^2$ functions on $\mathbb{R}^2$. Consider the problem of maximizing $f$ on the constraint set $C_h = \{(x,y): h(x,y) = c\}$. Form the Lagrangian function

$$
L(x,y,\mu) = f(x,y) - \mu[h(x,y)-c].
$$

Suppose that $(x^*,y^*,\mu^*)$ satisfies

- $\frac{\partial L}{\partial x} = 0$, $\frac{\partial L}{\partial y} = 0$, $\frac{\partial L}{\partial \mu} = 0$ at $(x^*,y^*,\mu^*)$
- 
  $$
  det \left({\begin{array}{ccc}
  0 & \frac{\partial h}{\partial x} & \frac{\partial h}{\partial y} \\
  \frac{\partial h}{\partial x} & \frac{\partial^2 L}{\partial x^2} & \frac{\partial^2 L}{\partial x\partial y} \\
  \frac{\partial h}{\partial y} & \frac{\partial^2 L}{\partial x\partial y} & \frac{\partial^2 L}{\partial y^2}
  \end{array}}\right) > 0
  $$

Then $(x^*,y^*)$ is a local maximizer of $f$.

## L05-S24 — Second Order Conditions: Theorems

> PDF pages: 24
> Section: Second Order Conditions

**Theorem 19.6**

Let $f$ and $h_1,\cdots,h_k$ be $C^2$ functions on $\mathbb{R}^n$. Consider the problem of maximizing $f$ on the constraint set

$$
C_h \equiv \{\mathbf{x}: h_1(\mathbf{x}) = c_1,\cdots,h_k(\mathbf{x}) = c_k\}
$$

Form the Lagrangian and suppose that:

- $\mathbf{x^*}$ lies in the constraint set $C_h$;
- There exist $\mu_1^*,\cdots,\mu_k^*$ such that

  $$
  \frac{\partial L}{\partial x_1} = 0, \cdots, \frac{\partial L}{\partial x_n} = 0, \frac{\partial L}{\partial \mu_1} = 0,\cdots, \frac{\partial L}{\partial \mu_k} = 0
  $$

  at $(x_1^*,\cdots,x_n^*,\mu_1^*,\cdots,\mu_k^*)$
- the Hessian of $L$ with respect to $\mathbf{x}$ at $(\mathbf{x^*},\mu^*)$ is negative definite on the linear constraint set $\{\mathbf{v}: D\mathbf{h}(\mathbf{x^*})\mathbf{v} = 0\}$

Then $\mathbf{x^*}$ is a strict local constrained max of $f$ on $C_h$.

## L05-S25 — Second Order Conditions: Examples

> PDF pages: 25
> Section: Second Order Conditions

**Example 19.7** In example 18.5, we consider the problem:

$$
\begin{aligned}
\text{maximize}\quad &f(x_1,x_2) = x_1^2x_2 \\
\text{s.t.}\quad &C_h = \{(x_1,x_2): 2x_1^2+x_2^2 = 3\}.
\end{aligned}
$$

We found six solutions to the first order conditions:

$$
(x_1,x_2,\mu) =
\begin{cases}
(0,\pm\sqrt{3},0)\\
(\pm1,+1,+0.5)\\
(\pm1,-1,-0.5)
\end{cases}
$$

## L05-S26 — Second Order Conditions: Examples

> PDF pages: 26
> Section: Second Order Conditions

**Example 19.7** Let's use the second order conditions to decide which of these points are local maxima and which are local minima. The Hessian is given by

$$
H = \left({\begin{array}{ccc}
0 & h_{x_1} & h_{x_2}\\
h_{x_1} & L_{x_1x_1} & L_{x_1x_2} \\
h_{x_2} & L_{x_2x_1} & L_{x_2x_2}
\end{array}}\right) = \left({\begin{array}{ccc}
0 & 4x_1 &2x_2\\
4x_1 & 2x_2-4\mu & 2x_1 \\
2x_2 & 2x_1 & -2\mu
\end{array}}\right)
$$

This problem has $n = 2$ variables and $k = 1$ equality constraints.

## L05-S27 — Second Order Conditions: Examples

> PDF pages: 27
> Section: Second Order Conditions

**Example 19.7** As Theorem 19.7 indicates, we need only check the sign of $n-k$ determinant---the determinant of H itself.

- At the points $(\pm1,-1,-0.5)$:

  $$
  H = \left({\begin{array}{ccc}
  0 & \pm4 &-2\\
  \pm4 & 0 & \pm2 \\
  -2 & \pm2 & 1
  \end{array}}\right)
  $$

  In either case, $detH=-48$; so these two points are local minima.
- At the points $(\pm1,1,0.5)$:

  $$
  H = \left({\begin{array}{ccc}
  0 & \pm4 &2\\
  \pm4 & 0 & \pm2 \\
  2 & \pm2 & -1
  \end{array}}\right)
  $$

  In either case, $detH=48$; so these two points are local maxima.

## L05-S28 — Second Order Conditions: Examples

> PDF pages: 28
> Section: Second Order Conditions

**Example 19.7**

- At the points $(0,\pm\sqrt{3},0)$, the corresponding bordered Hessian is

  $$
  H = \left({\begin{array}{ccc}
  0 & 0 & \pm2 \sqrt{3}\\
  0 & \pm2 \sqrt{3} & 0\\
  \pm2 \sqrt{3} & 0 & 0
  \end{array}}\right)
  $$

  For $(x_1,x_2) = (0,+\sqrt{3})$, $detH = -24\sqrt{3}<0$, this point is a local min.

  For $(x_1,x_2) = (0,-\sqrt{3})$, $detH = +24\sqrt{3}>0$, this point is a local max.

## L05-S29 — Second Order Conditions: Examples

> PDF pages: 29
> Section: Second Order Conditions

**Example 19.8** Consider the problem:

$$
\begin{aligned}
\text{max} \quad &f(x,y,z) = x^2y^2z^2 \\
\text{s.t.}\quad &C_h = \{(x,y,z): x^2+y^2+z^2 = 3\}.
\end{aligned}
$$

The first order conditions are:

$$
\begin{aligned}
\partial L/\partial x & = 2xy^2z^2-2\mu x = 0 \\
\partial L/\partial y & = 2x^2yz^2-2\mu y = 0 \\
\partial L/\partial z & = 2x^2y^2z-2\mu z = 0 \\
-\partial L/\partial \mu& = x^2+y^2+z^2 - 3 = 0
\end{aligned}
$$

with solution $x^2=y^2=z^2=\mu=1$.

## L05-S30 — Second Order Conditions: Examples

> PDF pages: 30
> Section: Second Order Conditions

**Example 19.8** The bordered Hessian for this problem is:

$$
H = \left({\begin{array}{cccc}
0 & 2x & 2y & 2z \\
2x & 2y^2z^2-2\mu &4xyz^2 & 4xy^2z \\
2y & 4xyz^2 & 2x^2z^2-2\mu & 4x^2yz \\
2z & 4xy^2z & 4x^2yz & 2x^2y^2-2\mu
\end{array}}\right)
$$

## L05-S31 — Second Order Conditions: Examples

> PDF pages: 31
> Section: Second Order Conditions

**Example 19.8** At $x = y =z = \mu = 1$, the bordered Hessian becomes

$$
H = \left({\begin{array}{ccccc}
0 & 2 & 2 & | & 2 \\
2 & 0 & 4 & | & 4 \\
2 & 4 & 0 & | & 4 \\
\text{–} & \text{–} & \text{–} & \text{–} & \\
2 & 4 & 4 & & 0
\end{array}}\right)
$$

Since $n = 3$ and $k = 1$, we have to check the the signs of the two leading principal minors: det$H_3 = 32$ and det$H_4 = -192$. Hence, the candidate $x = y = z = 1$ is local constrained max by Theorem 19.6.

## L05-S32 — Second Order Conditions: Theorems

> PDF pages: 32
> Section: Second Order Conditions

**Theorem 19.8 (Mixed Constraints)**

Let $f$, $g_1,\cdots,g_m$ and $h_1,\cdots,h_k$ be $C^2$ functions on $\mathbb{R}^n$. Consider the problem of maximizing $f$ on

$$
C_{g,h} \equiv \{\mathbf{x}: g_1(\mathbf{x}) \leq b_1,\cdots,g_m(\mathbf{x}) \leq b_m, h_1(\mathbf{x}) = c_1,\cdots,h_k(\mathbf{x}) = c_k\}.
$$

Form the Lagrangian

$$
\begin{aligned}
L(\mathbf{x},\lambda_1,\cdots,\lambda_m,\mu_1,\cdots,\mu_k) = f(\mathbf{x})
&-\lambda_1[g_1(\mathbf{x})-b_1]-\cdots-\lambda_m[g_m(\mathbf{x})-b_m] \\
&-\mu_1[h_1(\mathbf{x})-c_1]-\cdots-\mu_k[h_k(\mathbf{x})-c_k]
\end{aligned}
$$

- Suppose that there exist $\lambda_1^*,\cdots,\lambda_m^*, \mu_1^*,\cdots,\mu_k^*$ such that the first order conditions are satisfied.
- Suppose only $g_1,\cdots,g_e$ are binding at $\mathbf{x^*}$. Write $(g_1,\cdots,g_e)$ as $g_E$. Suppose that the Hessian of $L$ with respect to $\mathbf{x}$ at $(\mathbf{x^*},\lambda^*, \mu^*)$ is negative definite on the linear constraint set $\{\mathbf{v}: Dg_E(\mathbf x^*)\mathbf v = 0 \text{ and } D\mathbf{h}(\mathbf{x}^*)\mathbf v = 0\}$.

Then $\mathbf{x^*}$ is a strict local constrained max of $f$ on $C_{g,h}$.

## L05-S33 — Outline

> PDF pages: 33
> Section: Smooth Dependence on the Parameters

1. The Meaning of the Multiplier
2. Envelope Theorems
3. Second Order Conditions
4. Smooth Dependence on the Parameters
5. Constraint Qualifications

## L05-S34 — Smooth Dependence on the Parameters

> PDF pages: 34
> Section: Smooth Dependence on the Parameters

**Theorem 19.9**

Consider the problem of maximizing $f(x; a)$ subject to $h_1(x; a)=0, h_2(x; a)=0, \ldots, h_k(x; a)=0$. Let $x^*(a)$ be the solution of the parameterized constrained maximization problem and let $\mu^*(a)$ be the corresponding Lagrange multiplier. If the Hessian matrix of the Lagrangian is nonsingular at the point $(x^*(a_0), \mu^*(a_0); a_0)$, then:

1. $x^*(a)$ and $\mu^*(a)$ are $C^1$ functions of $a$ at $a = a_0$; and
2. the NDCQ holds at $(x^*(a_0), \mu^*(a_0); a_0)$.

## L05-S35 — Outline

> PDF pages: 35
> Section: Constraint Qualifications

1. The Meaning of the Multiplier
2. Envelope Theorems
3. Second Order Conditions
4. Smooth Dependence on the Parameters
5. Constraint Qualifications

## L05-S36 — Constraint Qualifications

> PDF pages: 36
> Section: Constraint Qualifications

- In Lecture 4, we talked about NDCQ
- A theorem that does not impose constraint qualification: Theorem 19.11
- There are other constraint qualifications
- Theorem 19.12
