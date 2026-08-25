# Optimal-Control Sufficiency Conditions

> Course sources: [Lecture 9](../raw/lectures/lecture-09.md), slides 29–33, 58–61

## Overview

The Maximum Principle supplies necessary candidate conditions, but those conditions may describe a stationary point, a local maximum, or no attainable optimum. Lecture 9 uses concavity to obtain global sufficiency results for finite-horizon and discounted infinite-horizon optimal-control problems.

## Why necessary conditions are not enough

The finite-horizon Maximum Principle is stated for an interior continuous solution, but it does not establish that such a solution exists. Even when the state, costate, and control equations can be solved, the resulting path need not be a global maximum. The lecture therefore separates candidate location from verification by concavity.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 29.

## Mangasarian's finite-horizon conditions

Suppose an interior continuous pair

$$
(\hat x(t),\hat y(t))
\in
\operatorname{Int}\mathcal X
\times
\operatorname{Int}\mathcal Y
$$

satisfies the finite-horizon necessary conditions. If

1. $\mathcal X\times\mathcal Y$ is convex; and
2. for the resulting costate $\lambda(t)$, the Hamiltonian $H(t,x,y,\lambda)$ is jointly concave in $(x,y)\in\mathcal X\times\mathcal Y$ for every $t\in[0,t_1]$,

then the pair attains the global maximum. If the Hamiltonian is strictly concave in $(x,y)$ for every date, the solution is unique.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 30.

## Arrow's finite-horizon conditions

Define the maximized Hamiltonian

$$
M(t,x,\lambda)
\equiv
\max_{y\in\mathcal Y}H(t,x,y,\lambda).
$$

Suppose the same interior continuous pair satisfies the necessary conditions. If

1. $\mathcal X$ is convex; and
2. for the resulting costate, $M(t,x,\lambda)$ is concave in $x\in\mathcal X$ for every $t\in[0,t_1]$,

then the pair attains the global maximum. Strict concavity of $M$ in $x$ gives uniqueness. The lecture presents this as weaker than requiring the original Hamiltonian to be jointly concave in both the state and control.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 31.

## A useful sign check

At an interior control, the condition

$$
f_y(t,\hat x(t),\hat y(t))
+
\lambda(t)g_y(t,\hat x(t),\hat y(t))
=0
$$

implies $\lambda(t)>0$ when

$$
f_y(t,\hat x(t),\hat y(t))>0
\qquad\text{and}\qquad
g_y(t,\hat x(t),\hat y(t))<0.
$$

Once the costate is known to be nonnegative, the lecture notes that

$$
H=f+\lambda g
$$

is concave when both $f$ and $g$ are concave. This observation can make the Mangasarian check easier, but it does not replace the theorem's full convexity and concavity requirements.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 32.

## Worked example: a concave Hamiltonian

Consider

$$
\begin{aligned}
\max\quad
&\int_0^T\left[1-tx(t)-u^2(t)\right]dt,\\
\text{subject to}\quad
&\dot x(t)=u(t),
\qquad x(0)=x_0>0,
\qquad u(t)\in\mathbb R.
\end{aligned}
$$

The Hamiltonian is

$$
H(t,x,u,\lambda)
=
1-tx-u^2+\lambda u,
$$

which the lecture identifies as concave in $(x,u)$. The necessary conditions are

$$
-2\hat u(t)+\lambda(t)=0,
$$

$$
\dot\lambda(t)=t,
\qquad
\lambda(T)=0,
$$

and

$$
\dot x(t)=u(t),
\qquad
x(0)=x_0.
$$

Solving them gives

$$
\lambda(t)=\frac{t^2}{2}-\frac{T^2}{2},
$$

$$
\hat u(t)=\frac{t^2}{4}-\frac{T^2}{4},
$$

and

$$
\hat x(t)
=
\frac{t^3}{12}-\frac{T^2t}{4}+x_0.
$$

The concavity check is what promotes the path obtained from the necessary conditions to the lecture's global-optimum conclusion; the first-order system alone would not do so.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 33.

## Discounted infinite-horizon sufficiency

For the discounted problem, suppose a candidate pair $(\hat x(t),\hat y(t))$ satisfies the current-value necessary conditions and transversality condition (7.65)–(7.68). Given its current-value costate $\mu(t)$, define

$$
M(t,x,\mu)
\equiv
\max_{y(t)\in\mathcal Y(t)}
\widehat H(t,x,y,\mu).
$$

Theorem 7.14 additionally assumes:

1. $V(t,\hat x(t))$ exists and is finite for every $t$;
2. for every admissible pair $(x(t),y(t))$,

   $$
   \lim_{t\to\infty}
   \left[e^{-\rho t}\mu(t)x(t)\right]
   \ge0;
   $$

3. $\mathcal X(t)$ is convex and $M(t,x,\mu)$ is concave in $x\in\mathcal X(t)$ for every $t$.

Under these assumptions, the candidate achieves the global maximum. If $M$ is strictly concave in $x$, the solution is unique.

For this concave sufficiency theorem, the lecture says that Assumption 7.1 and the limiting-state conditions used to strengthen transversality to (7.69) are not required. The proof strategy used in applications is therefore: solve the necessary conditions, verify concavity, and check the limiting inequality for other admissible paths.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 58–60.

## Continuity corollary

If the hypotheses of Theorem 7.14 hold, $M(t,x,\mu)$ is strictly concave in $x$ for every $t$, and $\mathcal Y$ is compact, then the optimal control $\hat y(t)$ is continuous on $\mathbb R_+$.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 61.

## Connections

- The [Maximum Principle](maximum-principle.md) supplies the necessary candidate system to which these verification results apply.
- [Concavity, convexity, and global optima](../unconstrained-optimization/concavity-convexity-and-global-optima.md) gives the static curvature logic that the optimal-control theorems extend to Hamiltonians and maximized Hamiltonians.
- [First-order conditions](../unconstrained-optimization/first-order-conditions.md) likewise distinguish stationary candidates from classified optima.
- The [Hamilton–Jacobi–Bellman equation](hamilton-jacobi-bellman-equation.md) provides the value-function side of the continuous-time problem but is not itself the sufficiency theorem stated here.
