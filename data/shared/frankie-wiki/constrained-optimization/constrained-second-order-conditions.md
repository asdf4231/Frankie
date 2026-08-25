# Constrained Second-Order Conditions

> Course sources: [Lecture 4](../raw/lectures/lecture-04.md), slides 51–53; [Lecture 5](../raw/lectures/lecture-05.md), slides 23–32

## Overview

Constrained second-order conditions examine the Hessian of the Lagrangian only along directions that preserve the locally binding constraints to first order. Lecture 5 states a tangent-space condition for equality constraints, a bordered-Hessian determinant test for one equality in two variables, and a tangent-space condition for mixed equality and inequality constraints.

These are classification results applied after the relevant first-order multiplier or Kuhn–Tucker system has been satisfied. The constrained directions are selected by constraint Jacobians, while curvature is measured by the Hessian of the Lagrangian with respect to the choice variables.

## Equality constraints: curvature on the linearized constraint set

Let $f,h_1,\ldots,h_k$ be $C^2$ functions on $\mathbb{R}^n$, and consider maximizing $f$ on

$$
C_h
=
\{\mathbf{x}:h_1(\mathbf{x})=c_1,\ldots,h_k(\mathbf{x})=c_k\}.
$$

Form the Lagrangian. Theorem 19.6 assumes that:

- $\mathbf{x}^*\in C_h$;
- there are multipliers $\mu_1^*,\ldots,\mu_k^*$ such that all choice-variable and multiplier first-order conditions hold at $(\mathbf{x}^*,\boldsymbol\mu^*)$; and
- the Hessian of $L$ with respect to $\mathbf{x}$ at $(\mathbf{x}^*,\boldsymbol\mu^*)$ is negative definite on

  $$
  \{\mathbf v:D\mathbf h(\mathbf{x}^*)\mathbf v=0\}.
  $$

Then $\mathbf{x}^*$ is a strict local constrained maximum of $f$ on $C_h$.

The equation $D\mathbf h(\mathbf{x}^*)\mathbf v=0$ restricts the curvature test to directions that satisfy the equality constraints to first order. The theorem does not require the Lagrangian Hessian to be negative definite in directions excluded by this linearized constraint set.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slide 24.

## One equality in two variables: bordered Hessian

Let $f$ and $h$ be $C^2$ on $\mathbb{R}^2$, and consider maximizing $f$ on

$$
C_h=\{(x,y):h(x,y)=c\}.
$$

With

$$
L(x,y,\mu)=f(x,y)-\mu[h(x,y)-c],
$$

Theorem 19.7 assumes that $(x^*,y^*,\mu^*)$ satisfies

$$
L_x=L_y=L_\mu=0
$$

and that, at this point,

$$
\det
\begin{pmatrix}
0 & h_x & h_y\\
h_x & L_{xx} & L_{xy}\\
h_y & L_{xy} & L_{yy}
\end{pmatrix}
>0.
$$

Then $(x^*,y^*)$ is a local maximizer of $f$ on the constraint set.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slide 23.

### Wiki counterpart for a constrained minimum

**Wiki counterpart:** Apply the stated maximum result to $-f$. Using the same sign convention

$$
L(x,y,\mu)=f(x,y)-\mu[h(x,y)-c],
$$

the corresponding sufficient bordered-Hessian condition for a local constrained minimum is

$$
\det
\begin{pmatrix}
0 & h_x & h_y\\
h_x & L_{xx} & L_{xy}\\
h_y & L_{xy} & L_{yy}
\end{pmatrix}
<0,
$$

provided the same first-order equations hold. This minimum statement is not separately stated as a theorem on the slide; it is the counterpart obtained by applying Theorem 19.7 to $-f$. The worked classifications in Example 19.7 use this sign counterpart.

**Course source for the maximum result and worked classifications:** [Lecture 5](../raw/lectures/lecture-05.md), slides 23, 27–28.

## Worked example: six equality-constrained candidates

Example 19.7 returns to

$$
\begin{aligned}
\max\quad &f(x_1,x_2)=x_1^2x_2\\
\text{s.t.}\quad &2x_1^2+x_2^2=3.
\end{aligned}
$$

The six first-order tuples are

$$
(x_1,x_2,\mu)
=
(0,\pm\sqrt3,0),
\quad
(\pm1,1,0.5),
\quad
(\pm1,-1,-0.5).
$$

The bordered Hessian is

$$
H
=
\begin{pmatrix}
0 & 4x_1 & 2x_2\\
4x_1 & 2x_2-4\mu & 2x_1\\
2x_2 & 2x_1 & -2\mu
\end{pmatrix}.
$$

At $(\pm1,-1,-0.5)$,

$$
H
=
\begin{pmatrix}
0 & \pm4 & -2\\
\pm4 & 0 & \pm2\\
-2 & \pm2 & 1
\end{pmatrix},
\qquad
\det H=-48,
$$

so these points are local constrained minima. At $(\pm1,1,0.5)$,

$$
H
=
\begin{pmatrix}
0 & \pm4 & 2\\
\pm4 & 0 & \pm2\\
2 & \pm2 & -1
\end{pmatrix},
\qquad
\det H=48,
$$

so these points are local constrained maxima.

For $(0,\pm\sqrt3,0)$,

$$
H
=
\begin{pmatrix}
0 & 0 & \pm2\sqrt3\\
0 & \pm2\sqrt3 & 0\\
\pm2\sqrt3 & 0 & 0
\end{pmatrix}.
$$

At $(0,\sqrt3)$, $\det H=-24\sqrt3<0$, so the point is a local constrained minimum. At $(0,-\sqrt3)$, $\det H=24\sqrt3>0$, so the point is a local constrained maximum.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 25–28.

## Worked example: a three-variable bordered Hessian

Example 19.8 considers

$$
\begin{aligned}
\max\quad &f(x,y,z)=x^2y^2z^2\\
\text{s.t.}\quad &C_h=\{(x,y,z):x^2+y^2+z^2=3\}.
\end{aligned}
$$

The first-order conditions have the displayed solution

$$
x^2=y^2=z^2=\mu=1.
$$

At $x=y=z=\mu=1$, the bordered Hessian is

$$
H
=
\begin{pmatrix}
0&2&2&2\\
2&0&4&4\\
2&4&0&4\\
2&4&4&0
\end{pmatrix}.
$$

Because the example has $n=3$ variables and $k=1$ equality constraint, the lecture checks the two displayed leading principal minors,

$$
\det H_3=32,
\qquad
\det H_4=-192,
$$

and classifies the candidate $x=y=z=1$ as a local constrained maximum.

**Course source:** [Lecture 5](../raw/lectures/lecture-05.md), slides 29–31.

## Mixed equality and inequality constraints

Theorem 19.8 uses $m$ inequality constraints and $k$ equality constraints:

$$
C_{g,h}
=
\left\{\mathbf{x}:
\begin{aligned}
g_1(\mathbf{x})&\leq b_1,\ldots,g_m(\mathbf{x})\leq b_m,\\
h_1(\mathbf{x})&=c_1,\ldots,h_k(\mathbf{x})=c_k
\end{aligned}
\right\}.
$$

The Lagrangian is

$$
\begin{aligned}
L(\mathbf{x},\boldsymbol\lambda,\boldsymbol\mu)
=f(\mathbf{x})
&-\lambda_1[g_1(\mathbf{x})-b_1]-\cdots-\lambda_m[g_m(\mathbf{x})-b_m]\\
&-\mu_1[h_1(\mathbf{x})-c_1]-\cdots-\mu_k[h_k(\mathbf{x})-c_k].
\end{aligned}
$$

The theorem's assumption that the “first order conditions are satisfied” is interpreted as the complete mixed Kuhn–Tucker system:

$$
\nabla_{\mathbf{x}}L(\mathbf{x}^*,\boldsymbol\lambda^*,\boldsymbol\mu^*)
=\mathbf0,
$$

$$
g_j(\mathbf{x}^*)\leq b_j,
\qquad
\lambda_j^*\geq0,
\qquad
\lambda_j^*[g_j(\mathbf{x}^*)-b_j]=0,
\qquad j=1,\ldots,m,
$$

and

$$
h_i(\mathbf{x}^*)=c_i,
\qquad i=1,\ldots,k.
$$

There is no sign restriction on the equality multipliers $\mu_i^*$ in this system.

Suppose only $g_1,\ldots,g_e$ bind at $\mathbf{x}^*$, and write $(g_1,\ldots,g_e)$ as $g_E$. If the Hessian of $L$ with respect to $\mathbf{x}$ at $(\mathbf{x}^*,\boldsymbol\lambda^*,\boldsymbol\mu^*)$ is negative definite on

$$
\{\mathbf v:
Dg_E(\mathbf{x}^*)\mathbf v=0
\text{ and }
D\mathbf h(\mathbf{x}^*)\mathbf v=0\},
$$

then $\mathbf{x}^*$ is a strict local constrained maximum of $f$ on $C_{g,h}$.

**Course sources:** [Lecture 4](../raw/lectures/lecture-04.md), slides 51–53; [Lecture 5](../raw/lectures/lecture-05.md), slide 32.

### Notation relation to Lecture 4

Lecture 5's Theorem 19.8 uses $m$ for the number of inequalities and $k$ for the number of equalities. Lecture 4's mixed Kuhn–Tucker theorem uses $k$ for the inequalities and $m$ for the equalities. The two letters therefore exchange roles across the lectures; the mixed first-order system above keeps Lecture 5's $m$/$k$ notation.

**Course sources:** [Lecture 4](../raw/lectures/lecture-04.md), slides 51–53; [Lecture 5](../raw/lectures/lecture-05.md), slide 32.

## Connections

- [Lagrange multipliers for equality constraints](lagrange-multipliers-for-equality-constraints.md) supplies the equality-constrained first-order candidates classified by these tests.
- [Kuhn–Tucker conditions](kuhn-tucker-conditions.md) supplies the complete mixed first-order system used in Theorem 19.8.
- [Constraint qualifications](constraint-qualifications.md) describes the active-gradient regularity conditions used by the course's multiplier theorems.
- The [Jacobian derivative](../multivariable-calculus/jacobian-derivative.md) supplies $D\mathbf h$ and $Dg_E$, which select the linearized feasible directions.
- The [Hessian matrix and mixed partials](../multivariable-calculus/hessian-and-mixed-partials.md) supplies the second-derivative matrix of the Lagrangian.
- [Unconstrained second-order conditions](../unconstrained-optimization/second-order-conditions.md) test the Hessian in all directions, whereas the constrained tests here restrict attention to linearized feasible directions.
