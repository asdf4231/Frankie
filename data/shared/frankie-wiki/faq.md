# Dynamic Optimization — Course FAQ

This is the self-contained reference for course information and common administrative questions. Administrative answers follow the syllabus for the first term of 2026–2027, while conceptual answers follow the current lectures; no concept-wiki consultation is needed.

## Course and contacts

### What course is this, and when is it offered?

**Dynamic Optimization**, Xiamen University, **first term of the 2026–2027 academic year**.

### Who teaches the course, and how can I contact the instructor?

- **Instructor:** Junnan Zhang 张钧南
- **Email:** [zhangjunnan1224@gmail.com](mailto:zhangjunnan1224@gmail.com)
- **Office:** D129, Economics Building 经济楼D129

### When and where are lectures held?

| Day | Time | Location |
|---|---|---|
| Wednesday | 19:10–20:50 | Room 108, Nanqiang 2 |
| Friday | 10:10–11:50 | Room 108, Nanqiang 2 |

### When are office hours?

**Monday, 13:30–14:30**, or **by appointment**. The instructor's office is D129, Economics Building.

### Who is the teaching assistant?

**Ms. Yuanqiu Fu** 付缘秋, reachable at [yuanqiufu21@163.com](mailto:yuanqiufu21@163.com).

## Course aims and preparation

### What is the course about?

The course introduces **dynamic optimization methods in both discrete and continuous time**. It balances mathematical theory with economic applications, so students learn both the underlying principles and how to apply them to economic models.

The course also integrates computational practice in Python, developing analytical insight and practical skills for research and applied work.

### What should I be able to do by the end of the semester?

By the end of the semester, students should have:

- A strong foundation in dynamic optimization methods.
- An understanding of their role in economic modeling.
- Hands-on experience solving problems central to modern economics, including implementing and solving models in Python.

### What are the prerequisites?

**Calculus and Linear Algebra** are prerequisites.

Prior coursework in **Mathematical Analysis and Mathematical Economics** is recommended but **not required**.

## Assessment

### How is the course grade determined?

| Component | Weight |
|---|---:|
| Assignments | 30% |
| Midterm exam | 30% |
| Final exam | 40% |
| **Total** | **100%** |

### Can an exam be rescheduled?

Exams may be rescheduled **only in the event of a medical or family emergency**.

## Reading and resources

### What references does the syllabus list?

1. Simon, Carl P., and Lawrence Blume. *Mathematics for Economists*. New York: Norton, 1994.
2. Acemoglu, Daron. [*Introduction to Modern Economic Growth*](http://press.princeton.edu/titles/8764.html). Princeton University Press, 2008.
3. Liberzon, Daniel. *Calculus of Variations and Optimal Control Theory: A Concise Introduction*. Princeton University Press, 2011.
4. Stokey, Nancy L., and Robert E. Lucas. *Recursive Methods in Economic Dynamics*. Harvard University Press, 1989.
5. QuantEcon. *Lectures*. [https://quantecon.org/lectures/](https://quantecon.org/lectures/).

## Topics and announcements

### What topics will the course cover?

The syllabus gives the following course outline:

1. Introduction
2. Basic Set Theory
3. Functions of Several Variables
4. Unconstrained Optimization
5. Constrained Optimization
6. Envelope Theorems
7. Mathematical Analysis
8. Dynamic Programming
9. Ordinary Differential Equations and Dynamics
10. Optimal Control
11. Dynamic Optimization with Python

### Can the course outline change?

Yes. **The course outline may be revised during the semester.**


## Frequently Asked Questions in Dynamic Optimization

### Set Theory

Lecture 1.

#### Does an inverse image require an inverse function?

No. For any function $f:X\to Y$ and set $T\subset Y$, the inverse image is $f^{-1}(T)=\{x\in X:f(x)\in T\}$. It collects all inputs whose outputs lie in $T$. An inverse function $f^{-1}:Y\to X$ instead assigns each output its unique original input; it exists precisely when $f$ is bijective, meaning both injective and surjective.

#### How can a set have a supremum but no maximum?

A supremum is the least upper bound; a maximum must also belong to the set. For $S=\{x\in\mathbb{R}:x<3\}$, $\sup S=3$, but $S$ has no maximum. Its elements approach 3 arbitrarily closely without reaching it. Likewise, an optimization problem can have a well-defined supremum without any feasible choice attaining that value.

### Functions of Several Variables

Lecture 2.

### Unconstrained Optimization

Lecture 3.

#### Why distinguish definite from semidefinite Hessians?

Negative definiteness means $\mathbf{v}^TD^2F\mathbf{v}<0$ for every nonzero direction $\mathbf{v}$; negative semidefiniteness allows zero. For a $C^2$ function at an interior critical point, a negative definite Hessian guarantees a strict local maximum. A negative semidefinite Hessian is necessary at a local maximum but alone is inconclusive.

### Constrained Optimization I

Lecture 4.

#### Does a zero multiplier mean the constraint is slack?

Not necessarily. Complementary slackness says

$$
\lambda[g(\mathbf{x})-b]=0.
$$

A slack constraint must have $\lambda=0$, and $\lambda>0$ requires a binding constraint. But a constraint can be binding with a zero multiplier: both factors may vanish. The equation encodes alternatives rather than an equivalence between “binding” and “strictly positive multiplier.”

#### How do I check NDCQ for inequality constraints?

At a feasible point, keep **only the binding inequalities**. Stack their gradients as rows. NDCQ holds if the rank equals the **number of binding inequalities**—the rows must be linearly independent.

For example, consider $x+y\leq1$, $-x\leq0$, and $-y\leq0$. At $(1,0)$, only the first and third bind. Their gradients are $(1,1)$ and $(0,-1)$, which are independent, so NDCQ holds. Ignore the second constraint because it is slack.

If no inequalities bind, NDCQ holds automatically.

#### How can I check NDCQ before finding any candidates?

Check which constraints **can bind together anywhere in the feasible set**, rather than guessing the optimum.

In the example above, all three cannot bind: $x=y=0$ conflicts with $x+y=1$. Each gradient is nonzero, and any two are independent. Therefore NDCQ holds at **every feasible point**, wherever the optimum might be.

If NDCQ does not hold everywhere, identify the feasible points where the binding gradients lose rank and examine those separately. Solving only the KKT equations could miss an optimum there.

### Constrained Optimization II: Multipliers and Envelopes

Lecture 5.

#### What does a multiplier measure economically?

It measures the marginal change in the optimized objective when a constraint's right-hand side changes. For $C^1$ functions with $h(\mathbf{x})=a$ and $L=f-\mu(h-a)$, smooth optimal choices and multipliers satisfying the nondegenerate constraint qualification (NDCQ: here, $\nabla h\neq0$) give $df^*/da=\mu^*(a)$, where $f^*(a)=f(\mathbf{x}^*(a))$. Thus $\Delta f^*\approx\mu^*\Delta a$. For a resource inequality, the multiplier is its shadow price, not generally the exact value of a large resource change.


### Mathematical Analysis

Lecture 6.


### From Static to Finite-Horizon Dynamic Optimization

Lecture 7.

#### If the initial state is given, why solve value functions for states the optimal path never visits?

You must compare alternative choices before knowing which path is optimal. Saving one unit or two units leads to different next-period states; choosing between them requires knowing the continuation value at both. You need values for alternative reachable states, not just those ultimately chosen—but not necessarily every state in the entire state space.

### Infinite-Horizon Optimization and Dynamic Programming

Lecture 8.

#### Why does one Bellman equation contain $\beta V_{t+1}$ while another contains just $V_{t+1}$?

Our **finite-horizon setup does not assume discounting**, so the recursion adds $F_t+V_{t+1}$. Discounting, when used, is included in $F_t$, as in the cake-eating example. A finite sum has no infinite-series convergence issue.

For **infinite horizon**, we usually use discounted returns because an undiscounted sum may diverge. With bounded period payoffs, $0\leq\beta<1$ ensures convergence. Continuation value is measured from the next period, so discounting it back one period gives $U+\beta V$.

The **same discounted problem** can also use different value dates. Write the current payoff as $u$:

- **Date-0 values:** $V_t=\max\{\beta^t u+V_{t+1}\}$. Continuation value already includes discounting to date 0.
- **Current-date values:** $W_t=\max\{u+\beta W_{t+1}\}$. Next period's value needs one more period of discounting.

Both maximize over the same feasible choices, with $V_t=\beta^tW_t$. Thus, no explicit $\beta$ before continuation value does not necessarily mean there is no discounting.

#### Why can an infinite-horizon value function omit time?

In a stationary problem, $U(x,y)$ and the feasible correspondence $G(x)$ do not explicitly depend on time, and the discount factor is constant. Every starting date therefore presents the same remaining problem when value is measured from that date. Stationarity does not mean the state stays constant: a time-invariant rule can generate a changing sequence of states.

#### Why is an Euler equation not enough for infinite-horizon optimality?

For a differentiable interior solution, the Euler equation balances adjacent-period marginal effects:

$$
D_yU(x_t,x_{t+1})+\beta D_xU(x_{t+1},x_{t+2})=0.
$$

It does not by itself settle the treatment of resources arbitrarily far in the future. The accompanying transversality condition is

$$
\lim_{t\to\infty}\beta^tD_xU(x_t,x_{t+1})\cdot x_t=0,
$$

which acts as a boundary condition at infinity, complementing rather than replacing feasibility and the initial condition.

### Ordinary Differential Equations and Dynamics

Lecture 9.

#### Can the Jacobian describe an entire nonlinear trajectory?

It gives a local linear approximation near an equilibrium, not the entire trajectory. For $C^1$ dynamics, deviations $\mathbf{h}=\mathbf{x}-\mathbf{x}^*$ are approximated by $\dot{\mathbf{h}}=DF(\mathbf{x}^*)\mathbf{h}$. Negative real parts imply local asymptotic stability; a positive real part implies instability. If none are positive but some are zero, the test is inconclusive. Global behavior requires examining more than this local matrix.

### Introduction to Optimal Control

Lecture 10.

#### When should we impose a zero terminal costate?

For the smooth interior finite-horizon problem with a freely chosen terminal state and no terminal payoff, impose $\lambda(t_1)=0$. If $x(t_1)=x_1$ is fixed instead, impose that state restriction, not a zero terminal costate. For a lower bound $x(t_1)\geq x_1$, impose $\lambda(t_1)\geq0$ and $\lambda(t_1)[x(t_1)-x_1]=0$. The endpoint specification determines the appropriate condition.

#### How is the HJB equation related to the maximum principle?

The HJB equation describes the differentiable value function across time and states:

$$
-V_t(t,x)=\max_{y\in\mathcal{Y}}\{f(t,x,y)+V_x(t,x)g(t,x,y)\}.
$$

Here discounting is included in $f$. Along an optimal path, identifying $\lambda(t)=V_x(t,\hat x(t))$ makes the maximand the Hamiltonian. Thus HJB uses the marginal value of the state to select controls, while the maximum principle describes the associated state and costate paths.
