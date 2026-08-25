# Lecture 6 — Analysis

> Course: Dynamic Optimization
> Original: slides/lecture06-analysis.tex
> PDF: slides/lecture06-analysis.pdf
> Snapshot: v1
> PDF metadata: Title `Lecture 6: Analysis`; subject `Economics`; author `Junnan Zhang`; creator `LaTeX with Beamer class`; producer `pdfTeX-1.40.29`; 50 pages; PDF version 1.7; created and modified 2026-08-23 13:55:05 +08.
> Normalization notes: The exact course-defined macros `\RR`, `\NN`, and `\QQ` are expanded to $\mathbb{R}$, $\mathbb{N}$, and $\mathbb{Q}$; `\interior` is expanded to $\text{int}\,$; `\cC` and `\bB` are expanded to $\mathcal{C}$ and $\mathcal{B}$; and the course redefinition of `\implies` is rendered as $\Rightarrow$. These expansions are only for Markdown rendering. Presentation-only Beamer syntax has otherwise been removed without correcting source wording or mathematics.

## L06-S01 — Lecture 6: Analysis

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Fall, 2026

## L06-S02 — Introduction

> PDF pages: 2

- A central concept in analysis is “convergence”
- Building on convergence, we have continuity, completeness, compactness, etc
- Important theorems then follow

## L06-S03 — Summary

> PDF pages: 3

Topics to be covered today

- Metric Spaces
- Sequences and Convergence
- Completeness
- Compactness
- Continuity

## L06-S04 — Outline

> PDF pages: 4
> Section: Metric Spaces

1. Metric Spaces
2. Sequences and Convergence
3. Completeness
4. Compactness
5. Continuity

## L06-S05 — Distance

> PDF pages: 5
> Section: Metric Spaces

- What is the distance between two real numbers $a$ and $b$?
- What is the distance between two points on the plane?
- What is the distance between $f(x)=0$ and $f(x)=\sin(x)$?

## L06-S06 — Metric Space

> PDF pages: 6
> Section: Metric Spaces

**Definition 1.** A **distance** or **metric** on a set $X$ is a function $d:X\times X\to\mathbb{R}$ such that for all $x,y,z\in X$ the following holds:

1. $d(x,y)\geq 0$ and $d(x,y)=0$ iff $x=y$
2. $d(x,y)=d(y,x)$
3. triangle inequality: $d(x,y)\leq d(x,z)+d(z,y)$

A **metric space** $(X,d)$ is a set $X$ together with a distance function $d$ on $X$.

## L06-S07 — Metric Space — Examples

> PDF pages: 7
> Section: Metric Spaces

- On $\mathbb{R}$, $d(x,y)=|x-y|$ is a metric (prove it)
- More generally, the **Euclidean** metric on $\mathbb{R}^n$:

  $$
  d(\bm{x},\bm{y})=|\bm{x}-\bm{y}|=\sqrt{(x_1-y_1)^2+\ldots+(x_n-y_n)^2}
  $$

- The metric induced by the **sup norm** on the set of bounded real-valued functions on $X$:

  $$
  d(f,g)=\|f-g\|_\infty=\sup_{x\in X}|f(x)-g(x)|
  $$

## L06-S08 — Open Balls and Neighborhoods

> PDF pages: 8
> Section: Metric Spaces

**Definition 2.**

- An **open ball** with center $a$ and radius $r$ is defined by

  $$
  B_r(a):=\{x\in X:d(x,a)<r\}
  $$

- A subset $Y$ of $X$ is a **neighborhood** of $a\in X$ if there exists $r>0$ such that $B_r(a)\subset Y$
- A subset $S$ of $X$ is **bounded** if $S\subset B_r(a)$ for some $a\in X$ and $r>0$

## L06-S09 — Open Balls and Neighborhoods — Examples

> PDF pages: 9
> Section: Metric Spaces

- $(0,2)$ is an open ball $B_1(1)$
- Any open interval $(a,b)$ in $\mathbb{R}$ is an open ball (prove it)

**Proposition 3.** If $S$ is a bounded subset of a metric space $X$, then for every $y\in X$ there exists $\rho>0$ such that $S\subset B_\rho(y)$.

Prove it in the assignment

## L06-S10 — Interior, Exterior, Boundary, and Closure

> PDF pages: 10
> Section: Metric Spaces

**Definition 4.** Let $S$ be a subset of a metric space $(X,d)$.

- A point $x\in X$ is an **interior** (resp. **exterior**) point of $S$ if some open ball centered at $x$ is a subset of $S$ (resp. $S^c$).
- If every open ball centered at $x$ contains at least one point in $S$ and at least one point in $S^c$, then $x$ is a **boundary** point of $S$.
- The set of all interior (exterior) points of $S$ is called the interior (exterior) of $S$ and is denoted by $\text{int}\,S$ ($\text{ext}\,S$).
- The set of all boundary points of $S$ is called the boundary of $S$ and is denoted by $\partial S$.

## L06-S11 — Interior, Exterior, Boundary, and Closure — Examples

> PDF pages: 11
> Section: Metric Spaces

Let $X=\mathbb{R}$ and $S=[0,1)$

- $x=1$, $x=0$, $x=0.5$, $x=2$?
- What is $\text{int}\,S$? What is $\partial S$?

Let $X=[0,1]$ and $S=[0,1)$

- $x=1$, $x=0$, $x=0.5$?
- What is $\text{int}\,S$? What is $\partial S$?

## L06-S12 — Interior, Exterior, Boundary, and Closure

> PDF pages: 12
> Section: Metric Spaces

**Definition 5.**

- A point $x\in X$ is a **limit point** of $S$ if every open ball centered at $x$ contains at least one element of $S$ other than $x$.
- A point $x\in S$ is an **isolated point** of $S$ if some open ball centered at $x$ contains no element of $S$ other than $x$.
- The **closure** of $S$ is the union of $S$ and the set of limit points of $S$, and is denoted by $\bar S$.

## L06-S13 — Interior, Exterior, Boundary, and Closure

> PDF pages: 13
> Section: Metric Spaces

**Proposition 6.**

1. If $x$ is a limit point of $S$, then every open ball centered at $x$ contains an infinite number of points from $S$
2. $\bar S=(\text{ext}\,S)^c$
3. $\bar S=\text{int}\,S\cup\partial S$

Prove some using the definitions

## L06-S14 — Interior, Exterior, Boundary, and Closure — Examples

> PDF pages: 14
> Section: Metric Spaces

- If $S=\{1/n:n\in\mathbb{N}\}\subset\mathbb{R}$, then every point in $S$ is an isolated point. The only limit point is 0.
- Consider $\mathbb{Q}\subset\mathbb{R}$. Then $\text{int}\,\mathbb{Q}=\emptyset$, $\partial\mathbb{Q}=\mathbb{R}$, and $\bar{\mathbb{Q}}=\mathbb{R}$.

## L06-S15 — Open and Closed Sets

> PDF pages: 15
> Section: Metric Spaces

A set is open if all its elements are interior points.

**Definition 7.**

- A set $S\subset X$ is **open** iff $S\subset\text{int}\,S$.
- A set $S\subset X$ is **closed** iff $S^c$ is open.

**Proposition 8.**

1. Any open ball is an open set
2. A set $S$ is closed iff $S=\bar S$
3. The sets $\bar S$ and $\partial S$ are closed

## L06-S16 — Open and Closed Sets

> PDF pages: 16
> Section: Metric Spaces

**Theorem 9.**

1. Any union of open sets is open; any intersection of closed sets is closed.
2. Any finite intersection of open sets is open; any finite union of closed sets is closed.

Example: $(0,1)=\bigcup_{n=2}^\infty[1/n,1-1/n]$ (prove this)

## L06-S17 — Outline

> PDF pages: 17
> Section: Sequences and Convergence

1. Metric Spaces
2. Sequences and Convergence
3. Completeness
4. Compactness
5. Continuity

## L06-S18 — Sequences

> PDF pages: 18
> Section: Sequences and Convergence

**Definition 10.**

- A **sequence** in a set $X$ is a function from $\mathbb{N}$ to $X$. We write $x_1,x_2,\ldots$, or $(x_n)_{n=1}^\infty$, or simply $(x_n)$ for the sequence.
- Given a sequence $(x_n)$, a **subsequence** is a sequence $(x_{n_i})$ where $(n_i)$ is a strictly increasing sequence in $\mathbb{N}$.

Examples: $x_n=1/n$, $x_n=2n+1$, etc.

## L06-S19 — Convergence of Sequences

> PDF pages: 19
> Section: Sequences and Convergence

**Definition 11.** A sequence $(x_n)$ in a metric space $(X,d)$ **converges** to a **limit** $x\in X$, written as $x_n\to x$ or $\lim_{n\to\infty}x_n=x$, if for every $\epsilon>0$, there exists $N\in\mathbb{N}$ such that

$$
n\geq N\Rightarrow d(x_n,x)<\epsilon.
$$

## L06-S20 — Convergence of Sequences — Examples

> PDF pages: 20
> Section: Sequences and Convergence

- $(x_n)=(1,1,\ldots)$
- $x_n=1/n$
- $(x_1,x_2,\ldots)=(1,1/2,1,1/3,\ldots)$

## L06-S21 — Convergence of Sequences

> PDF pages: 21
> Section: Sequences and Convergence

**Proposition 12.** A sequence in a metric space can have at most one limit.

*Proof:* Suppose $x_n\to x$ and $x_n\to y$ as $n\to\infty$. Suppose $x\neq y$ and let $d(x,y)=r>0$.

There exists $N_1,N_2\in\mathbb{N}$ such that

$$
\begin{gathered}
n\geq N_1\Rightarrow d(x_n,x)<r/2\\
n\geq N_2\Rightarrow d(x_n,y)<r/2
\end{gathered}
$$

Let $N=\max\{N_1,N_2\}$. Then $d(x,y)\leq d(x,x_N)+d(y,x_N)<r$, which is a contradiction.

(Bounding the distance between two points using triangle inequality is a very important method that will be used over and over again.)

## L06-S22 — Convergence of Sequences

> PDF pages: 22
> Section: Sequences and Convergence

**Definition 13.** A sequence $(x_n)$ is **bounded** if the set $\{x_n:n\in\mathbb{N}\}$ is bounded.

**Proposition 14.** A convergent sequence in a metric space is bounded.

*Proof:* Let $x_n\to x$. There exists an $N\in\mathbb{N}$ such that $d(x_n,x)<1$ for all $n\geq N$. Let

$$
M=\max\{d(x_1,x),d(x_2,x),\ldots,d(x_N,x),1\}.
$$

Then $d(x_n,x)\leq M$ for all $n\in\mathbb{N}$.

(Using convergence to handle the “tail” of a sequence is an important method.)

## L06-S23 — Sequences and the Closure of a Set

> PDF pages: 23
> Section: Sequences and Convergence

**Theorem 15.** Let $S$ be a subset of $X$. Then $x\in\bar S$ iff there is a sequence $(x_n)\subset S$ such that $x_n\to x$.

**Corollary 16.** Let $S$ be a subset of $X$. Then $S$ is closed iff

$$
(x_n)\subset S\text{ and }x_n\to x\Rightarrow x\in S.
$$

*Proof:* Suppose $(x_n)\subset S$ and $x_n\to x$. If $x_n=x$ for some $n$, then $x\in S\subset\bar S$. Otherwise, every open ball centered at $x$ contains a term $x_n\in S$ other than $x$, so $x$ is a limit point of $S$ and hence $x\in\bar S$.

Conversely, suppose $x\in\bar S$. If $x\in S$, take the constant sequence $x_n=x$. If $x\notin S$, choose $x_n\in B_{1/n}(x)\cap S$ for each $n\in\mathbb{N}$. Then $d(x_n,x)<1/n$, so $x_n\to x$.

## L06-S24 — Sequences in $\mathbb{R}$

> PDF pages: 24
> Section: Sequences and Convergence

**Proposition 17.** Suppose $x_n\to x$ and $y_n\to y$. Then

1. $x_n+y_n\to x+y$
2. $cx_n\to cx$ for all $c\in\mathbb{R}$
3. $x_ny_n\to xy$
4. $1/x_n\to1/x$ if $x_n\neq0$ and $x\neq0$

**Proposition 18.**

1. If $0\leq x_n\leq y_n$ for all $n\geq N$, and $y_n\to0$, then $x_n\to0$.
2. If $x_n\leq y_n$ for all $n\geq N$, $x_n\to x$, and $y_n\to y$, then $x\leq y$.

## L06-S25 — Sequences in $\mathbb{R}$

> PDF pages: 25
> Section: Sequences and Convergence

**Theorem 19.** Every bounded monotone sequence in $\mathbb{R}$ has a limit in $\mathbb{R}$.

The theorem can be proved using the Completeness Axiom.

## L06-S26 — Outline

> PDF pages: 26
> Section: Completeness

1. Metric Spaces
2. Sequences and Convergence
3. Completeness
4. Compactness
5. Continuity

## L06-S27 — Cauchy Sequences

> PDF pages: 27
> Section: Completeness

- The definition for convergence requires that we know the limit a priori.
- We would like a criterion for convergence that does not depend on the limit itself.

**Definition 20.** Let $(x_n)\subset X$. Then $(x_n)$ is a **Cauchy sequence** if for every $\epsilon>0$, there exists $N\in\mathbb{N}$ such that

$$
m,n\geq N\Rightarrow d(x_m,x_n)<\epsilon.
$$

## L06-S28 — Cauchy Sequences

> PDF pages: 28
> Section: Completeness

**Proposition 21.**

1. If a sequence is Cauchy, then it is bounded.
2. If a sequence converges, then it is Cauchy.

Similar to convergent sequences, Cauchy sequences are also bounded, but the second result above suggests that Cauchy is weaker.

When is a Cauchy sequence convergent?

## L06-S29 — Completeness

> PDF pages: 29
> Section: Completeness

**Definition 22.** A metric space $(X,d)$ is **complete** if every Cauchy sequence in $X$ has a limit in $X$.

**Proposition 23.** $\mathbb{R}^n$ with the Euclidean metric is a complete metric space.

## L06-S30 — Completeness

> PDF pages: 30
> Section: Completeness

**Proposition 24.** Let $(X,d)$ be a metric space and let $S\subset X$.

1. If $(S,d)$ is complete, then $S$ is closed.
2. If $(X,d)$ is complete, then $S$ is closed in $X$ iff $(S,d)$ is complete.

*Proof:* 1. To prove that $S$ is closed, we pick any sequence $x_n\subset S$ converging to $x\in X$. Then $(x_n)$ is Cauchy in $S$ and thus has a limit in $S$.

2. Suppose $S$ is closed. Since any Cauchy sequence in $S$ is a Cauchy sequence in $X$, and thus has a limit in $X$. Since $S$ is closed, any sequence $(x_n)\subset S$ that converges has a limit in $S$. Therefore, $(S,d)$ is complete. The other direction follows from 1.

## L06-S31 — Contraction Mapping Theorem

> PDF pages: 31
> Section: Completeness

**Definition 25.** Let $(X,d)$ be a metric space. We say $F:S\subset X\to X$ is a **contraction** if there exists $0\leq\lambda<1$ such that

$$
d(F(x),F(y))\leq\lambda d(x,y)
$$

for all $x,y\in S$.

**Definition 26.** We say $x^*\in S$ is a **fixed** point of $F:S\subset X\to X$ if $F(x^*)=x^*$.

## L06-S32 — Contraction Mapping Theorem

> PDF pages: 32
> Section: Completeness

**Theorem 27 (Contraction Mapping Theorem).** Let $(X,d)$ be a *complete* metric space and let $F:X\to X$ be a contraction. Then $F$ has a unique fixed point $x^*$ and $F^n(x)\to x^*$ as $n\to\infty$ for all $x\in X$.

*Notes:* here $F^n(x)$ means apply $F$ iteratively $n$ times:

$$
x_1=F(x),\,x_2=F(x_1),\,x_3=F(x_2),\,\ldots,\,x_n=F(x_{n-1})
$$

## L06-S33 — Contraction Mapping Theorem

> PDF pages: 33
> Section: Completeness

- In economics, the contraction mapping theorem is mainly used in dynamic programming
- The Bellman operator is a contraction mapping

## L06-S34 — Outline

> PDF pages: 34
> Section: Compactness

1. Metric Spaces
2. Sequences and Convergence
3. Completeness
4. Compactness
5. Continuity

## L06-S35 — Subsequences

> PDF pages: 35
> Section: Compactness

**Theorem 28.** If a sequence in a metric space converges, then every subsequence converges to the same limit as the original sequence.

**Theorem 29.** If a Cauchy sequence $(x_n)$ in a metric space has a subsequence converging to $x$, then $x_n\to x$.

*Proof:* The first is by applying the definition. To prove the second theorem, pick an arbitrary $\epsilon>0$. There exists $N\in\mathbb{N}$ such that $d(x_m,x_n)<\epsilon/2$ for all $m,n\geq N$. If a subsequence $(x_{n_i})$ converges to $x$, then there exists $M\in\mathbb{N}$ such that $d(x_{n_i},x)<\epsilon/2$ for all $i\geq M$. Choose one $j\geq M$ such that $n_j\geq N$. Then for every $m\geq N$,

$$
d(x,x_m)\leq d(x,x_{n_j})+d(x_{n_j},x_m)<\epsilon.
$$

## L06-S36 — Subsequences

> PDF pages: 36
> Section: Compactness

**Theorem 30 (Bolzano-Weierstrass Theorem).** Every bounded sequence in $\mathbb{R}^n$ has a convergent subsequence.

The same result is not true for an arbitrary metric space!

**Corollary 31.** If $S\subset\mathbb{R}^n$, then $S$ is closed and bounded iff every sequence from $S$ has a subsequence which converges to a limit in $S$.

*Proof:* First suppose $S$ is closed and bounded. Since $S$ is bounded, every sequence has a convergent subsequence. Since $S$ is closed, the limit is in $S$.

For the other direction, closedness is obvious. We prove $S$ is bounded by contradiction. Suppose $S$ is unbounded. Then for every $n\in\mathbb{N}$, there exists $x_n\in S$ such that $|x_n|>n$. Any subsequence of $(x_n)$ is unbounded and thus cannot converge.

## L06-S37 — Compactness

> PDF pages: 37
> Section: Compactness

**Definition 32.** A subset $S$ of a metric space $(X,d)$ is **compact** if every sequence from $S$ has a subsequence that converges to a limit in $S$.

This definition is actually called *sequential compactness*, but it is equivalent to compactness for metric spaces.

The Bolzano-Weierstrass Theorem implies the following theorem (although it was proved independently).

**Theorem 33 (Heine-Borel Theorem).** A subset of $\mathbb{R}^n$ is compact iff it is closed and bounded.

## L06-S38 — Compactness

> PDF pages: 38
> Section: Compactness

**Proposition 34.** If a subset of a metric space $(X,d)$ is compact, then it is bounded and closed (in $X$).

*Proof:* Suppose $S\subset X$ is compact. Then for any sequence $(x_n)\subset S$ that converges to $x\in X$, there exists a subsequence that converges to a limit in $S$. By a previous theorem, the limit must be $x$. Hence $S$ is closed.

Suppose $S$ is not bounded. Then we can build a sequence that has no convergent subsequence.

## L06-S39 — Compactness

> PDF pages: 39
> Section: Compactness

**Proposition 35.** Let $S$ be a subset of a compact metric space $(X,d)$. Then $S$ is compact iff $S$ is closed in $X$.

*Proof:* If $S$ is compact, then it is closed. Suppose that $S$ is closed. Since $X$ is compact, any sequence in $S\subset X$ has a convergent subsequence in $X$. Since $S$ is closed, the limit is also in $S$. Hence $S$ is compact.

## L06-S40 — Outline

> PDF pages: 40
> Section: Continuity

1. Metric Spaces
2. Sequences and Convergence
3. Completeness
4. Compactness
5. Continuity

## L06-S41 — Limits of Functions

> PDF pages: 41
> Section: Continuity

**Definition 36.** Let $f:(A\subset X)\to Y$ where $X$ and $Y$ are metric spaces and let $a$ be a limit point of $A$. If for every sequence $(x_n)\subset A\setminus\{a\}$, $x_n\to a$ implies $f(x_n)\to b$, then we say $f(x)$ approaches $b$ as $x$ approaches $a$, or $f$ has **limit** $b$ at $a$, and write

$$
f(x)\to b\text{ as }x\to a,
$$

or

$$
\lim_{x\to a}f(x)=b.
$$

## L06-S42 — Limits of Functions

> PDF pages: 42
> Section: Continuity

**Definition 37.** If $X=\mathbb{R}$ and $A$ is an interval with $a$ as left or right endpoint, then we write

$$
\lim_{x\to a^+}f(x)\text{ or }\lim_{x\to a^-}f(x)
$$

and say the limit as $x$ approaches from the right or the left, respectively.

Examples:

- Let $A=(-\infty,0)\cup(0,\infty)$. Let $f(x)=1$ for $x\in A$. Then $\lim_{x\to0}f(x)=1$.
- Draw some diagrams

## L06-S43 — Limits of Functions

> PDF pages: 43
> Section: Continuity

We have an equivalent definition of a limit using the usual $\epsilon$-$\delta$ language

**Theorem 38.** Suppose $(X,d)$ and $(Y,\rho)$ are metric spaces, $A\subset X$, $f:A\to Y$, and $a$ is a limit point of $A$. Then the following are equivalent

1. $\lim_{x\to a}f(x)=b$
2. For every $\epsilon>0$, there exists a $\delta>0$ such that

   $$
   x\in A\setminus\{a\}\text{ and }d(x,a)<\delta\Rightarrow\rho(f(x),b)<\epsilon
   $$

## L06-S44 — Continuity

> PDF pages: 44
> Section: Continuity

**Definition 39.** Let $f:A(\subset X)\to Y$ where $X$ and $Y$ are metric spaces and let $a\in A$. We say $f$ is **continuous** at $a$ if $a$ is an isolated point of $A$ or if $a$ is a limit point and $\lim_{x\to a}f(x)=f(a)$.

If $f$ is continuous at every $a\in A$, then we say $f$ is **continuous**. The set of all such continuous functions is denoted by $\mathcal{C}(A;Y)$ or $\mathcal{C}(A)$ if $Y=\mathbb{R}$.

## L06-S45 — Continuity

> PDF pages: 45
> Section: Continuity

We also have equivalent definitions of continuity

**Proposition 40.** Suppose $(X,d)$ and $(Y,\rho)$ are metric spaces, $A\subset X$, $f:A\to Y$, and $a\in A$. Then the following are equivalent:

1. $f$ is continuous at $a$
2. whenever $(x_n)\subset A$ and $x_n\to a$, then $f(x_n)\to f(a)$
3. for each $\epsilon>0$, there exists $\delta>0$ such that

   $$
   x\in A\text{ and }d(x,a)<\delta\Rightarrow\rho\left(f(x),f(a)\right)<\epsilon
   $$

## L06-S46 — Continuity — Examples

> PDF pages: 46
> Section: Continuity

- Show that $f(x)=x$ is continuous at $x=1$
- Show that $f(x)=x^2$ is continuous at every point in $\mathbb{R}$

## L06-S47 — Continuity

> PDF pages: 47
> Section: Continuity

**Theorem 41.**

1. Let $f$ and $g$ be two real-valued functions. If $f$ and $g$ are continuous at $a$, then $f+g$, $fg$, and $f/g$ (if $g(a)\neq0$) are continuous at $a$
2. If $f$ is continuous at $a$ and $g$ is continuous at $f(a)$, then $g\circ f$ is continuous at $a$

**Theorem 42 (Intermediate Value Theorem).** Let $f$ be a continuous real function on the interval $[a,b]$. If $f(a)<f(b)$ and $c$ is such that $f(a)<c<f(b)$, then there exists a point $x\in(a,b)$ such that $f(x)=c$.

## L06-S48 — Continuity

> PDF pages: 48
> Section: Continuity

**Theorem 43.** Let $f:X\to Y$ where $(X,d)$ and $(Y,\rho)$ are metric spaces. Then the following are equivalent

1. $f$ is continuous
2. $f^{-1}(E)$ is open in $X$ whenever $E$ is open in $Y$
3. $f^{-1}(C)$ is closed in $X$ whenever $C$ is closed in $Y$

The continuous image of an open set is not necessarily open and the continuous image of a closed set is not necessarily closed.

For example, let $f(x)=x^2$ and then $f((-1,1))=[0,1)$; let $f(x)=e^x$ and $f(\mathbb{R})=(0,\infty)$

## L06-S49 — Continuous Functions on Compact Sets

> PDF pages: 49
> Section: Continuity

**Theorem 44.** Let $f:K(\subset X)\to Y$ be a continuous function, where $X$ and $Y$ are metric spaces, and $K$ is compact. Then

1. $f(K)$ is compact
2. If $Y\subset\mathbb{R}$ and $K$ is nonempty, then $f$ is bounded (above and below) and has a maximum and a minimum

Examples:

- Let $f(x)=1/x$ for $x\in(0,1]$
- Let $f(x)=x$ for $x\in[0,1)$
- Let $f(x)=1/x$ for $x\in[1,\infty)$

## L06-S50 — The Space of Bounded Continuous Functions

> PDF pages: 50
> Section: Continuity

**Definition 45.** The set of *bounded* continuous functions $f:A\to Y$ is denoted by $\mathcal{B}\mathcal{C}(A;Y)$.

**Theorem 46.** Suppose $A\subset X$, $(X,d)$ is a metric space and $(Y,\rho)$ is a complete metric space. Then $\mathcal{B}\mathcal{C}(A;Y)$ is a complete metric space under the **uniform metric** $d_u$ defined by

$$
d_u(f,g):=\sup_{x\in A}\rho\Big(f(x),g(x)\Big).
$$

Several important results:

1. $(\mathcal{B}\mathcal{C}(A;Y),d_u)$ is a metric space
2. $\mathcal{B}\mathcal{C}(A;Y)$ is closed under uniform convergence: if $f_n\to f$ in the uniform metric, then $f$ is also bounded continuous
