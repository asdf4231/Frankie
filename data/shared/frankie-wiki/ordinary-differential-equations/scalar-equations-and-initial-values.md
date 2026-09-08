# Scalar Equations and Initial Values

> Course sources: [Lecture 9](../raw/lectures/lecture-09.md), slides 3–8

## Overview

A scalar ordinary differential equation specifies how an unknown function changes. A general solution describes a family of paths; an initial value selects a path when uniqueness holds. The lecture develops linear and separable solution methods, then distinguishes explicit solvability from local existence and uniqueness.

## Equations, autonomy, and initial conditions

An **ordinary differential equation** is a relationship

$$
\dot y=F(y,t),\qquad \dot y=\frac{dy}{dt},
$$

satisfied by an unknown function $y(t)$. It is **first order** when only its first derivative appears. If $F$ does not explicitly involve $t$, the equation is **autonomous** (time-independent), $\dot y=F(y)$; otherwise it is **nonautonomous** (time-dependent).

A parameterized family $y(t,k)$ is a **general solution** when every solution is obtained by varying $k$. An **initial value problem** also requires $y(t_0)=y_0$.

In **Example 24.5**, a bank account earning continuously compounded interest at annual rate $r$ satisfies

$$
\dot y=ry,\qquad y(t)=ke^{rt}.
$$

The growth rate alone does not determine the account's size. The original deposit $y(0)=y_0$ sets $k=y_0$, giving $y(t)=y_0e^{rt}$.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 3–4.

## Constant-coefficient linear equations

For constant $a$, the homogeneous equation $\dot y=ay$ has general solution $y(t)=ke^{at}$. For constants $a,b$ with $a\ne0$, the nonhomogeneous equation has solution

$$
\dot y=ay+b,
\qquad y(t)=-\frac ba+ke^{at}.
$$

The lecture verifies this by substitution:

$$
\dot y(t)=ake^{at},\qquad
ay(t)+b=a\left(-\frac ba+ke^{at}\right)+b=ake^{at}.
$$

Setting $k=0$ gives the **steady state solution** $y(t)=-b/a$.

**Wiki algebra for an initial value:** Substituting $y(t_0)=y_0$ into the sourced formula gives $k=(y_0+b/a)e^{-at_0}$ and hence

$$
y(t)=-\frac ba+\left(y_0+\frac ba\right)e^{a(t-t_0)}.
$$

The restriction $a\ne0$ applies to these expressions involving $b/a$.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 4–5.

## Integrating factors

For the nonautonomous linear equation

$$
\dot y=a(t)y+b(t),
$$

multiply $\dot y-a(t)y=b(t)$ by $\exp(-\int_{t_0}^t a(s)\,ds)$. The left side becomes an exact derivative:

$$
\frac{d}{dt}\left[y(t)e^{-\int_{t_0}^t a(s)\,ds}\right]
=b(t)e^{-\int_{t_0}^t a(s)\,ds}.
$$

This multiplier is the **integrating factor**. Integrating yields

$$
y(t)=\left[k+\int_{t_0}^t b(s)e^{-\int_{t_0}^s a(u)\,du}\,ds\right]
e^{\int_{t_0}^t a(s)\,ds},\qquad k=y(t_0).
$$

For $b(t)=0$, the formula reduces to

$$
y(t)=ke^{\int_{t_0}^t a(s)\,ds}.
$$

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 6.

## Separable equations and solutions lost by division

An equation is **separable** if $F(y,t)=g(y)h(t)$. On an interval where $g(y)\ne0$,

$$
\frac{dy}{g(y)}=h(t)\,dt,
\qquad \int\frac{dy}{g(y)}=\int h(t)\,dt+c.
$$

Division excludes the zeros of $g$. Constant solutions with $g(y)=0$ must therefore be checked separately.

In **Example 24.10**, $\dot y=y^2$ gives

$$
\int y^{-2}\,dy=\int dt+c,
\qquad -y^{-1}=t+c,
\qquad y(t)=\frac1{k-t},\quad k=-c.
$$

These are the nonzero solutions. The additional solution $y(t)=0$ satisfies the original equation but is lost when dividing by $y^2$.

**Wiki domain observation:** The displayed nonzero formula is undefined at $t=k$, so a solution interval using it cannot include that point. This is a direct check of the formula, not a global existence claim.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 7.

## Local existence and uniqueness

**Theorem 24.5.** For

$$
\dot y=f(t,y),\qquad y(t_0)=y_0,
$$

suppose $f$ is continuous in a neighborhood of $(t_0,y_0)$. There exists a $C^1$ function $y:I\to\mathbb R$ on an open interval $I=(t_0-\alpha,t_0+\alpha)$ such that

$$
y(t_0)=y_0,\qquad \dot y(t)=f(t,y(t))\quad\text{for all }t\in I.
$$

If $f$ is $C^1$ in that neighborhood, the local solution is unique. The result does not promise a closed-form solution or existence for all future time.

**Notation:** Slides 3–7 use $F(y,t)$, while this theorem uses $f(t,y)$; the order of the arguments changes in the source.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 8.

## Connections

- [Phase portraits and stability](phase-portraits-and-stability.md) analyze autonomous paths through signs and equilibria, without needing explicit solutions.
- [Linear systems](linear-systems.md) extend the initial-value setup to two variables and solve decoupled scalar equations in eigenvector coordinates.
- [Continuous-time optimal control problems](../optimal-control/continuous-time-optimal-control-problems.md) provide the subsequent optimization framework with differential-equation state constraints; the ODE results here are not optimality conditions.
