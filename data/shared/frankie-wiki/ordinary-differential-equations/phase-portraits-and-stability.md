# Phase Portraits and Stability

> Course sources: [Lecture 9](../raw/lectures/lecture-09.md), slides 9–10, 15, 17–19, 23

## Overview

A phase portrait describes solution paths and their direction of motion. Stability asks how nearby paths behave, not merely whether the equilibrium path stays constant. Scalar signs, planar vector fields, and Jacobian tests provide complementary ways to study these questions.

## Equilibria and stability terminology

For an autonomous system $\dot{\mathbf y}=F(\mathbf y)$, a **steady state**, **rest point**, or **equilibrium** satisfies $F(\mathbf y^*)=\mathbf0$.

- **Stable:** solutions starting sufficiently close remain close for all future time.
- **Asymptotically stable:** stable, and every solution starting sufficiently near converges to the equilibrium as $t\to\infty$.
- **Unstable:** not stable.

Remaining nearby and converging are different requirements. The existence of the constant equilibrium solution alone establishes neither property for nearby solutions.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 9, 15.

## Scalar sign portraits

For $\dot y=f(y)$, first find the zeros of $f$, then check its sign between those zeros:

- $f(y)>0$: $y(t)$ increases, so the arrow points toward larger $y$.
- $f(y)<0$: $y(t)$ decreases, so the arrow points toward smaller $y$.

For an autonomous equation the evolution depends on where the process starts, not when it starts.

The lecture illustrates this with $f(y)=y(2-y)$ and [Figure 24.11 in the raw source](../raw/lectures/lecture-09.md#l09-s09--phase-portraits-on-the-line). Its equilibria are $0$ and $2$. The portrait points away from $0$ and toward $2$ on the positive half-line; every solution with $y(0)>0$ tends to $2$, while $0$ is unstable.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 9.

## The scalar derivative test

**Theorem 24.6.** Let $y_0$ be a rest point of the $C^1$ equation $\dot y=f(y)$, so $f(y_0)=0$.

$$
\begin{aligned}
f'(y_0)<0&\quad\Longrightarrow\quad y_0\text{ is asymptotically stable},\\
f'(y_0)>0&\quad\Longrightarrow\quad y_0\text{ is unstable}.
\end{aligned}
$$

**Lecture proof sketch:** If $f'(y_0)<0$, $f$ is decreasing near $y_0$. It is positive to the left and negative to the right, so the flow approaches $y_0$ from both sides. A positive derivative reverses the signs and the flow moves away.

For $f(y)=y(2-y)$, the derivative values $f'(0)=2>0$ and $f'(2)=-2<0$ confirm the portrait. If $f'(y_0)=0$, this test is inconclusive; it is not a stability classification.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 10.

## Planar vector fields and orbits

For

$$
\dot x=f(x,y),\qquad \dot y=g(x,y),
$$

the **vector field** assigns the velocity $(f(x,y),g(x,y))$ to each point. A solution curve $(x(t),y(t))$ is everywhere tangent to these vectors. The collection of paths or **orbits**, with arrows for increasing $t$, is the **phase portrait** or **phase diagram**.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 17.

A **saddle** can have some convergent solutions while still being unstable: in the lecture's linear case with one negative and one positive eigenvalue, convergence occurs only along the negative-eigenvalue direction. The [linear-systems page](linear-systems.md#saddles-and-convergent-solutions) owns this calculation and Example 25.7, avoiding a second full worked example here.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slides 18–19.

## Drawing a planar phase portrait

The lecture's procedure is:

1. Solve $f(x,y)=g(x,y)=0$ to find equilibria.
2. Use the Jacobian to determine local stability, where the [linearization tests](linearization-and-local-stability.md) apply.
3. Draw the **isoclines** $f(x,y)=0$ and $g(x,y)=0$. On the first the vector field is vertical; on the second it is horizontal.
4. Evaluate the signs of $f$ and $g$ in each sector and fill in the arrows, including arrows on the isoclines.
5. Sketch representative solution curves following those directions.

The signs determine northeast, northwest, southeast, or southwest motion within the sectors. At an equilibrium both velocity components vanish.

**Course source:** [Lecture 9](../raw/lectures/lecture-09.md), slide 23.

## Connections

- [Scalar equations and initial values](scalar-equations-and-initial-values.md) distinguish specifying a path from studying its qualitative behavior.
- [Linear systems](linear-systems.md) connect explicit exponential solutions to stability and saddle geometry.
- [Linearization and local stability](linearization-and-local-stability.md) supply the Jacobian tests and the competing-species phase portrait.
