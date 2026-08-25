# Dynamic Programming Principles

> Course sources: [Lecture 7](../raw/lectures/lecture-07.md), slides 12, 16–17, 21; [Lecture 8](../raw/lectures/lecture-08.md), slides 16, 25, 49, 51; [Lecture 9](../raw/lectures/lecture-09.md), slide 40

## Overview

Dynamic programming links full-path optimality to optimal continuation tails. Lecture 7 distinguishes a finite-horizon dynamic programming principle from an if-and-only-if stagewise principle of optimality; Lecture 8 gives the stationary discrete-time infinite-horizon principle; Lecture 9 gives its continuous-time integral form.

## Dynamic programming principle

In the state-to-state formulation, if

$$
(x_1,x_2,\ldots,x_T)
$$

solves $V_0(x_0)$, then for every $t=1,2,\ldots,T-1$, the tail

$$
(x_{t+1},\ldots,x_T)
$$

solves $V_t(x_t)$. An optimal path therefore remains optimal after any state reached along that path.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 12.

## Splicing argument

The proof is by contradiction. If a different admissible tail from $x_t$ had a strictly higher payoff, that tail could be spliced onto the original path through date $t$. The resulting full sequence would remain admissible and would improve the value from $x_0$, contradicting optimality of the original path.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 12.

## Principle of optimality

With the terminal convention $V_T=0$, a state sequence $(x_1,\ldots,x_T)$ solves $V_0(x_0)$ if and only if, for every

$$
t=0,1,\ldots,T-1,
$$

the chosen next state $x_{t+1}$ solves

$$
\sup_{x'\in\Gamma_t(x_t)}
\left\{
F_t(x_t,x')+V_{t+1}(x')
\right\}.
$$

This is an if-and-only-if characterization of a full optimal path by its stage choices.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 16.

## Why the characterization works

If the full sequence is optimal, the dynamic programming principle makes every tail optimal. Consequently,

$$
F_t(x_t,x_{t+1})+V_{t+1}(x_{t+1})
=
V_t(x_t),
$$

so the chosen $x_{t+1}$ attains the period-$t$ Bellman supremum.

Conversely, suppose every $x_{t+1}$ solves its stage problem. Repeated substitution into the Bellman equation and the terminal condition $V_T(x_T)=0$ gives

$$
V_0(x_0)
=
\sum_{t=0}^{T-1}F_t(x_t,x_{t+1}),
$$

so the induced sequence attains the value of the original problem.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 17.

## Control-state versions

For controls, the dynamic programming principle says that an optimal control sequence $(u_0,\ldots,u_{T-1})$, together with its induced states, has an optimal tail $(u_t,\ldots,u_{T-1})$ for $V_t(x_t)$.

The principle of optimality says that the full control sequence is optimal if and only if, for every $t=0,1,\ldots,T-1$, $u_t$ solves

$$
\sup_{u\in G_t(x_t)}
\left\{
F_t(x_t,u)+V_{t+1}\bigl(f_t(x_t,u)\bigr)
\right\},
$$

with the induced transition

$$
x_{t+1}=f_t(x_t,u_t)
$$

and $V_T=0$.

**Course source:** [Lecture 7](../raw/lectures/lecture-07.md), slide 21.

## Infinite-horizon principle of optimality

Under Assumption 6.1, let $\mathbf{x}^*\in\Phi(x_0)$ be a feasible stationary infinite-horizon plan that attains $V^*(x_0)$. Theorem 6.2 states that every date along the plan satisfies

$$
V^*(x^*_t)
=
U(x^*_t,x^*_{t+1})
+
\beta V^*(x^*_{t+1}),
\qquad t=0,1,\ldots.
$$

Conversely, if a feasible plan satisfies these equalities at every date, then it attains the optimal sequence value. The lecture's proof sketch treats each tail $(x^*_t,x^*_{t+1},\ldots)$ as the continuation plan from $x^*_t$ and uses the return-separation lemma; the converse iterates the Bellman equalities.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 16, 25, 49, 51.

## Continuous-time principle of optimality

Let $(\hat x(t),\hat y(t))$ attain the infinite-horizon continuous-time value from $(t_0,x(t_0))$. For every $t_1\ge t_0$, Lecture 9 states

$$
\begin{aligned}
V(t_0,x(t_0))
&=
\int_{t_0}^{t_1}
f(t,\hat x(t),\hat y(t))\,dt
+
V(t_1,\hat x(t_1))\\
&=
\max_{y(t)\in\mathcal Y}
\left\{
\int_{t_0}^{t_1}f(t,x(t),y(t))\,dt
+
V(t_1,x(t_1))
\right\},
\end{aligned}
$$

where each candidate control segment induces its state trajectory through

$$
\dot x(t)=g(t,x(t),y(t)).
$$

The first equality splits the optimal return into the payoff earned before $t_1$ and the optimal continuation value at the reached state. The second expresses the same value by optimizing over the first control segment plus continuation value. Discounting, when present, is embedded in $f$.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 40.

## Distinguishing the finite-horizon principles

**Wiki comparison:** The following table reorganizes the two sourced statements without changing their logical scope.

| Aspect | Dynamic programming principle | Principle of optimality |
|---|---|---|
| Starting point | A full solution is already given | Candidate stage choices are given |
| Claim | Every continuation tail is optimal | The full path is optimal if and only if every stage choice solves its Bellman problem |
| Logical form | One-way implication | If and only if |
| Main proof idea | Splice in a supposedly better tail | Use optimal tails in one direction and iterate Bellman equalities in the other |

## Connections

- The [Bellman equation](bellman-equation.md) defines the stage problems appearing in the principle of optimality.
- The [value function](value-function.md) assigns values to the continuation problems used in both statements.
- [Finite-horizon dynamic optimization](finite-horizon-dynamic-optimization.md) supplies the finite sequence problems to which the Lecture 7 principles apply.
- [Infinite-horizon dynamic optimization](infinite-horizon-dynamic-optimization.md) supplies the stationary feasible plans and finite-return assumption used in Theorem 6.2.
- [Policy functions and correspondences](policy-functions-and-correspondences.md) represent the stage choices that generate an optimal stationary path.
- [Continuous-time optimal control problems](../optimal-control/continuous-time-optimal-control-problems.md) supply the state equation and admissible control paths used in the integral principle.
- The [Hamilton–Jacobi–Bellman equation](../optimal-control/hamilton-jacobi-bellman-equation.md) is the differential recursive equation built from the continuous-time principle.
