# Optimal Savings and Debt Limits

> Course sources: [Lecture 8](../raw/lectures/lecture-08.md), slides 5, 67–71

## Overview

The infinite-horizon savings problem illustrates why borrowing restrictions and nonnegative consumption must be included in the feasible set. Lecture 8 compares ways to rule out unlimited debt, imposes compact asset bounds for the dynamic-programming treatment, and derives the consumption Euler equation.

## Savings problem and consumption feasibility

An infinitely lived consumer solves

$$
\begin{aligned}
&\max_{\{c_t,a_t\}_{t=0}^{\infty}}
\sum_{t=0}^{\infty}\beta^t u(c_t)\\
\text{s.t.}\quad
&a_{t+1}=(1+r)a_t+w-c_t,\\
&c_t\geq0,
\end{aligned}
$$

where $u$ is strictly increasing, continuously differentiable, and strictly concave. The canonical setup uses $\beta\in[0,1)$.

**Wiki assumptions for the formulas below:** Take $0<\beta<1$ and $r>0$. These restrictions make $\beta^{-1}$ and the debt-limit expressions involving $w/r$ well defined; the lecture displays those formulas without separately stating both restrictions in this application.

Without an additional debt restriction, the lecture says the problem is not well-defined because the consumer can let assets tend to $-\infty$ through a Ponzi game.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 5, 67.

## Ways to exclude unlimited borrowing

Lecture 8 lists three approaches:

1. impose a no-Ponzi condition directly;
2. prohibit borrowing through $a_{t+1}\geq0$, which the lecture calls too restrictive;
3. impose the natural debt limit

   $$
   a_{t+1}\geq\underline a
   \equiv-\frac{w}{r}.
   $$

The natural debt limit is described as the maximum repayable debt.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 68.

## Compact asset restriction

Because assets need not lie in a compact set, the lecture proposes restricting the state to

$$
a\in[\underline a,\bar a]
$$

and then verifying that the solution remains in that state space. Its stated upper bound is

$$
\bar a\equiv a_0+\frac{w}{r}<\infty.
$$

The slides state the formulas $\underline a=-w/r$ and $\bar a=a_0+w/r$ but do not separately state a restriction on $r$ in this application.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slides 68–69.

## Bellman equation and the feasible next-asset set

Consumption is determined by current and next-period assets:

$$
c=(1+r)a+w-a'.
$$

Nonnegative consumption requires

$$
a'\leq(1+r)a+w.
$$

The recursive problem is therefore

$$
V(a)
=
\max_{\substack{a'\in[\underline a,\bar a]\\
a'\leq(1+r)a+w}}
\left\{
 u((1+r)a+w-a')+\beta V(a')
\right\}.
$$

Lecture 8 asks the reader to verify the dynamic-programming assumptions; the slides do not carry out that verification.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 70.

## Consumption Euler equation

Using the one-dimensional Euler equation and dynamic envelope condition gives

$$
u'(c)=\beta(1+r)u'(c').
$$

Since $u'$ exists and is strictly decreasing under the stated utility assumptions, the lecture obtains:

$$
\begin{aligned}
r&=\beta^{-1}-1
&&\Longrightarrow& c&=c',\\
r&>\beta^{-1}-1
&&\Longrightarrow& c&<c',\\
r&<\beta^{-1}-1
&&\Longrightarrow& c&>c'.
\end{aligned}
$$

Thus consumption is constant, increasing, or decreasing according to the comparison between $r$ and $\beta^{-1}-1$.

**Course source:** [Lecture 8](../raw/lectures/lecture-08.md), slide 71.

## Connections

- [Infinite-horizon dynamic optimization](infinite-horizon-dynamic-optimization.md) supplies the stationary sequence framework.
- The [Bellman equation](bellman-equation.md) represents the savings problem recursively over next-period assets.
- [Euler equations and the transversality condition](euler-equations-and-transversality-condition.md) supplies the marginal condition used to derive consumption growth.
- [Policy functions and correspondences](policy-functions-and-correspondences.md) distinguishes the next-asset policy from cases with multiple maximizing asset choices.
