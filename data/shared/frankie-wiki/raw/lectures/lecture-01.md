# Lecture 1 — Basic Set Theory

> Course: Dynamic Optimization
> Original: slides/lecture01-basic_set_theory.tex
> PDF: slides/lecture01-basic_set_theory.pdf
> Snapshot: v1
> Normalization notes: Course-defined macros for common number sets, the power set, and set families have been expanded to standard Markdown-renderable notation without changing their meaning.

## L01-S01 — Lecture 1: Basic Set Theory

> PDF pages: 1

Junnan Zhang  
Paula and Gregory Chow Institute for Studies in Economics  
Xiamen University  
Fall, 2026

## L01-S02 — Summary

> PDF pages: 2

Topics to be covered today:

- Sets
- Functions
- Real Numbers

## L01-S03 — Outline

> PDF pages: 3

1. Sets
2. Functions
3. Real Numbers

## L01-S04 — Introduction

> PDF pages: 4
> Section: Sets

- Set theory is the language of all mathematics.
- In economics, sets are everywhere: consumption sets, production sets, sets of players, sets of equilibria, etc.

## L01-S05 — Sets

> PDF pages: 5
> Section: Sets

**Definition 1**

- A set is, informally speaking, a collection of objects, which we call **elements**.
- If $x$ is an element of the set $S$, we write $x \in S$. We also say $x$ **belongs to** $S$.
- If $x$ is not an element of $S$, we write $x \notin S$.

## L01-S06 — Sets

> PDF pages: 6
> Section: Sets

We use curly brackets when describing a set. We can list all its elements:

- $\{1,2,3\}$
- $\big\{1,2,\{1,3\}\big\}$

Or we can specify the properties that its elements satisfy:

- $\{x:x\text{ is irrational}\}$: the set of all $x$ such that $x$ is irrational.
- $\{n\in\mathbb{N}:n^2<7\}$: the set of all natural numbers $n$ such that $n^2<7$.

## L01-S07 — Sets

> PDF pages: 7
> Section: Sets

**Definition 2**

- We say two sets $A$ and $B$ are **equal** if they have the same elements, and we write $A=B$.
- An **empty set** is a set with no elements and it is denoted by $\emptyset$.
- If $\forall x\in A$, $x\in B$, we say $A$ is a **subset** of $B$ and we write $A\subset B$.
- The set of all subsets of $A$ is called the **power set** of $A$ and is denoted by $\mathcal{P}(A)$.

We usually prove $A=B$ by proving $A\subset B$ and $B\subset A$.

## L01-S08 — Sets: Examples

> PDF pages: 8
> Section: Sets

- $\{\emptyset\}$ is not an empty set because $\emptyset\in\{\emptyset\}$.
- $\emptyset\subset A$ for all sets $A$.
- If $A=\{1,2\}$, then $\mathcal{P}(A)=\{\emptyset,\{1\},\{2\},\{1,2\}\}$.
- $\emptyset\in\mathcal{P}(A)$ for all sets $A$.

## L01-S09 — Sets

> PDF pages: 9
> Section: Sets

**Proposition 3**

Set inclusion is transitive: if $A\subset B$ and $B\subset C$, then $A\subset C$.

*Proof:*

## L01-S10 — Union and Intersection of Sets

> PDF pages: 10
> Section: Sets

**Definition 4**

- The **union** of $A$ and $B$ is defined by

  $$
  A\cup B:=\{x:x\in A\text{ or }x\in B\}.
  $$

- The **intersection** of $A$ and $B$ is defined by

  $$
  A\cap B:=\{x:x\in A\text{ and }x\in B\}.
  $$

- Two sets $A$ and $B$ are **disjoint** if $A\cap B=\emptyset$.

## L01-S11 — Union and Intersection of Sets: Venn Diagram

> PDF pages: 11
> Section: Sets

The source frame is titled “Union and Intersection of Sets” with the subtitle “Venn Diagram”; no diagram or other content is embedded in the TeX source.

## L01-S12 — Union and Intersection of Sets

> PDF pages: 12
> Section: Sets

**Definition 5**

- If $\mathscr{F}$ is a family of sets, the union of all sets in $\mathscr{F}$ is defined by

  $$
  \bigcup\mathscr{F}:=\{x:x\in A\text{ for at least one }A\in\mathscr{F}\}.
  $$

- Similarly, the intersection of all sets in $\mathscr{F}$ is defined by

  $$
  \bigcap\mathscr{F}:=\{x:x\in A\text{ for every }A\in\mathscr{F}\}.
  $$

- If $\mathscr{F}=\{A_\lambda:\lambda\in J\}$, then

  $$
  \bigcup\mathscr{F}=\bigcup_{\lambda\in J}A_\lambda,
  \qquad
  \bigcap\mathscr{F}=\bigcap_{\lambda\in J}A_\lambda.
  $$

## L01-S13 — Union and Intersection of Sets

> PDF pages: 13
> Section: Sets

**Proposition 6**

Let $A$, $B$, $C$, and $B_\lambda$ (for $\lambda\in J$) be sets. Then

$$
\begin{aligned}
A\cup B=B\cup A
&\quad & A\cap B=B\cap A,\\
A\cup(B\cup C)=(A\cup B)\cup C
&\quad & A\cap(B\cap C)=(A\cap B)\cap C,\\
A\subset A\cup B
&\quad & A\cap B\subset A,\\
A\subset B\iff A\cup B=B
&\quad & A\subset B\iff A\cap B=A,\\
A\cap(B\cup C)=(A\cap B)\cup(A\cap C)
&\quad & A\cup(B\cap C)=(A\cup B)\cap(A\cup C),\\
A\cap\bigcup_{\lambda\in J}B_\lambda
=\bigcup_{\lambda\in J}(A\cap B_\lambda)
&\quad &
A\cup\bigcap_{\lambda\in J}B_\lambda
=\bigcap_{\lambda\in J}(A\cup B_\lambda).
\end{aligned}
$$

Prove some using the definitions.

## L01-S14 — Difference and Complement of Sets

> PDF pages: 14
> Section: Sets

**Definition 7**

- The **difference** of $A$ and $B$ is defined by

  $$
  A\setminus B\;\big(\text{or }A-B\big):=\{x:x\in A\text{ and }x\notin B\}.
  $$

- If $U$ is a set that contains all objects being considered in a certain context (a universal set), then $U\setminus A$ is called the **complement** of $A$ in $U$, and is denoted by $A^c$.

Examples:

- If $U=\mathbb{R}$ and $A=(0,1)$, then $A^c=(-\infty,0]\cup[1,+\infty)$.
- If $U=[0,1]$ and $A=(0,1)$, then $A^c=\{0,1\}$.

## L01-S15 — Difference and Complement of Sets

> PDF pages: 15
> Section: Sets

**Proposition 8 (De Morgan's Laws)**

Let $A$, $B$, and $A_\lambda$ (for $\lambda\in J$) be sets. Then

$$
\begin{aligned}
(A\cup B)^c&=A^c\cap B^c,
&\qquad
(A\cap B)^c&=A^c\cup B^c,\\
\left(\bigcup_{\lambda\in J}A_\lambda\right)^c
&=\bigcap_{\lambda\in J}A_\lambda^c,
&
\left(\bigcap_{\lambda\in J}A_\lambda\right)^c
&=\bigcup_{\lambda\in J}A_\lambda^c.
\end{aligned}
$$

Demonstrate using Venn diagrams.

## L01-S16 — Cartesian Product

> PDF pages: 16
> Section: Sets

**Definition 9**

- An **ordered pair** whose first member is $x$ and second member is $y$ is denoted by $(x,y)$.
- The basic property of ordered pairs is that $(x,y)=(a,b)$ iff $x=a$ and $y=b$.
- The Cartesian product of two sets $A$ and $B$ is defined by

  $$
  A\times B:=\{(a,b):a\in A,\,b\in B\}.
  $$

- We can also define $n$-tuples $(a_1,a_2,\ldots,a_n)$. Then the Cartesian product of $n$ sets is defined by

  $$
  \prod_{i=1}^n A_i
  :=\{(a_1,a_2,\ldots,a_n):a_i\in A_i,\ \forall i=1,2,\ldots,n\}.
  $$

## L01-S17 — Cartesian Product: Examples

> PDF pages: 17
> Section: Sets

- $\{1,2\}\times\{3,4\}=\{(1,3),(1,4),(2,3),(2,4)\}$.
- $\mathbb{R}^n=\underbrace{\mathbb{R}\times\mathbb{R}\times\cdots\times\mathbb{R}}_{n\text{ times}}$.

## L01-S18 — Common Number Sets

> PDF pages: 18
> Section: Sets

- Natural numbers: $\mathbb{N}=\{1,2,\ldots\}$.
- Integers: $\mathbb{Z}=\{\ldots,-1,0,1,\ldots\}$.
- Rational numbers: $\mathbb{Q}=\{p/q:p,q\in\mathbb{Z},\,q\neq0\}$.
- Real numbers: $\mathbb{R}$.
- Complex numbers: $\mathbb{C}$.

## L01-S19 — Outline

> PDF pages: 19
> Section: Functions

1. Sets
2. Functions
3. Real Numbers

## L01-S20 — What is a Function?

> PDF pages: 20
> Section: Functions

**Definition 10**

Let $X$ and $Y$ be two sets. A **function** or **map** or **mapping** $f$ from $X$ to $Y$ associates to every element $x\in X$ an element $y\in Y$, denoted by $f(x)$. We write

$$
\begin{aligned}
f\colon X&\to Y,\\
x&\mapsto f(x).
\end{aligned}
$$

We call $X$ the **domain** of $f$ and $Y$ the **codomain** of $f$.

We call $x$ an **argument** of $f(x)$, and $f(x)$ the **image** of $f$ at $x$.

## L01-S21 — Image and Inverse Image

> PDF pages: 21
> Section: Functions

**Definition 11**

- Let $S\subset X$. The **image** of $S$ under $f$ is defined by $f(S)=\{f(x):x\in S\}$.
- The image of $X$ is called the **range** of $f$.
- Let $T\subset Y$. The **inverse image** of $T$ under $f$ is defined by $f^{-1}(T):=\{x:f(x)\in T\}$.
- We say $f$ is **one-one** or **injective** if for every $y\in Y$, there is at most one $x\in X$ such that $y=f(x)$.
- We say $f$ is **onto** or **surjective** if for every $y\in Y$, there exists $x\in X$ such that $y=f(x)$.
- If $f$ is both one-one and onto, we say $f$ is **bijective**.

## L01-S22 — Image and Inverse Image: Examples

> PDF pages: 22
> Section: Functions

The source frame is titled “Image and Inverse Image” with the subtitle “Examples”; no examples or other content are embedded in the TeX source.

## L01-S23 — Image and Inverse Image

> PDF pages: 23
> Section: Functions

**Proposition 12**

$$
\begin{aligned}
f(C\cup D)&=f(C)\cup f(D),
&
 f\left(\bigcup_{\lambda\in J}A_\lambda\right)
 &=\bigcup_{\lambda\in J}f(A_\lambda),\\
f(C\cap D)&\subset f(C)\cap f(D),
&
 f\left(\bigcap_{\lambda\in J}A_\lambda\right)
 &\subset\bigcap_{\lambda\in J}f(A_\lambda),\\
f^{-1}(C\cup D)&=f^{-1}(C)\cup f^{-1}(D),
&
 f^{-1}\left(\bigcup_{\lambda\in J}A_\lambda\right)
 &=\bigcup_{\lambda\in J}f^{-1}(A_\lambda),\\
f^{-1}(C\cap D)&=f^{-1}(C)\cap f^{-1}(D),
&
 f^{-1}\left(\bigcap_{\lambda\in J}A_\lambda\right)
 &=\bigcap_{\lambda\in J}f^{-1}(A_\lambda),\\
(f^{-1}(A))^c&=f^{-1}(A^c),
&
\text{no general results for }f,\\
A&\subset f^{-1}(f(A)).
\end{aligned}
$$

## L01-S24 — Composition

> PDF pages: 24
> Section: Functions

**Definition 13**

- If $f\colon X\to Y$ and $g\colon Y\to Z$, then the **composition** function $g\circ f\colon X\to Z$ is defined by

  $$
  (g\circ f)(x)=g(f(x)).
  $$

- The **identity** function on $X$ is defined by $Id_X(x)=x$ for all $x\in X$.
- We say $f\colon X\to Y$ is **invertible** if there exists $g\colon Y\to X$ such that $f\circ g=Id_Y$ and $g\circ f=Id_X$. In this case, $g$ is the **inverse** of $f$ and is denoted by $f^{-1}$.

Examples and properties:

- $f(x)=x^2$, $g(x)=\sin(x)$. Then $(g\circ f)(x)=\sin(x^2)$ and $(f\circ g)(x)=\sin^2(x)$.
- The composition operator is associative: $h\circ(g\circ f)=(h\circ g)\circ f$.

## L01-S25 — Composition

> PDF pages: 25
> Section: Functions

**Proposition 14**

$f$ is bijective iff $f$ is invertible.

*Proof:* Suppose that $f$ is bijective. Then, for every $y\in Y$, there is a unique $x\in X$ such that $f(x)=y$. This allows us to defined $g\colon Y\to X$ by $f(g(y))=y$. Therefore, $f\circ g=Id_Y$. Now pick any $x\in X$ and let $y=f(x)$. The definition of $g$ implies that $g(y)=x$. Therefore, $g(f(x))=x$ and thus $g\circ f=Id_X$.

Suppose $f$ is invertible. Then for any $y\in Y$ there is an $x\in X$ given by $x=f^{-1}(y)$ such that $f(x)=f(f^{-1}(y))=Id_Y(y)=y$. Now suppose there is another $x'\in X$ such that $f(x')=y$. Then $f^{-1}(f(x'))=Id_X(x')=x'$. Since $f^{-1}(f(x'))=f^{-1}(y)=x$, $x=x'$. Therefore, $f$ is bijective.

## L01-S26 — Cardinality

> PDF pages: 26
> Section: Functions

**Definition 15**

- Two sets $X$ and $Y$ are **equivalent** if there exists a bijection $f\colon X\to Y$. We write $X\sim Y$.
- With every set $A$ we associate a **cardinal number** or **cardinality** to indicate the “number” of elements in $A$. Two sets have the same cardinality if they are equivalent.
- $Y$ has higher cardinality than $X$ if there exists an injection from $X$ into $Y$.

## L01-S27 — Cardinality

> PDF pages: 27
> Section: Functions

**Definition 16**

- A set is finite if it is empty or it is equivalent to the set $\{1,2,\ldots,n\}$ for some $n\in\mathbb{N}$. In this case, it has cardinality $n$. A set is **infinite** if it is not finite.
- A set is **denumerable** (or countably infinite) if it is equivalent to $\mathbb{N}$. A set is **countable** if it is denumerable or finite. If a set is denumerable, we say it has cardinality $d$.
- A set is **uncountable** if it is not countable. If a set is equivalent to $\mathbb{R}$, we say it has cardinality $c$.

## L01-S28 — Cardinality

> PDF pages: 28
> Section: Functions

**Proposition 17**

1. Any subset of a countable set is countable.
2. The set of rational numbers $\mathbb{Q}$ is denumerable.
3. The set of even numbers is equivalent to $\mathbb{N}$. The set $(0,1)$ is equivalent to $\mathbb{R}$.
4. The set $\mathbb{N}$ and $(0,1)$ are not equivalent.
5. The product of two countable sets is countable.
6. The cardinality of $\mathbb{R}^n$ is $c$.
7. The product of two sets of cardinality $c$ has cardinality $c$.
8. The union of a countable family of countable sets is countable.

## L01-S29 — Outline

> PDF pages: 29
> Section: Real Numbers

1. Sets
2. Functions
3. Real Numbers

## L01-S30 — The Real Number System

> PDF pages: 30
> Section: Real Numbers

- Most functions we encounter in economics are real-valued functions.
- It is important to know some basic properties of the real numbers.
- It is also key to the study of convergence later on.

## L01-S31 — The Real Number System

> PDF pages: 31
> Section: Real Numbers

The **Real Number System** is a set of objects called **Real Numbers** together with two binary operations called **addition** ($+$) and **multiplication** ($\times$), a binary relation called **less than** ($<$), and two elements called **zero** ($0$) and **unity** ($1$), that satisfies a set of axioms.

Properties of addition:

1. **A1:** $a+b=b+a$.
2. **A2:** $(a+b)+c=a+(b+c)$.
3. **A3:** $a+0=0+a=a$.
4. **A4:** There is exactly one real number, denoted by $-a$, such that $a+(-a)=(-a)+a=0$.

## L01-S32 — The Real Number System

> PDF pages: 32
> Section: Real Numbers

Properties of multiplication:

5. **A5:** $a\times b=b\times a$.
6. **A6:** $(a\times b)\times c=a\times(b\times c)$.
7. **A7:** $a\times1=1\times a=a$, and $1\neq0$.
8. **A8:** If $a\neq0$, then there is exactly one real number, denoted by $a^{-1}$, such that $a\times a^{-1}=a^{-1}\times a=1$.

The distributive property:

9. **A9:** $a(b+c)=ab+ac$.

Axioms A1–A9 are called algebraic axioms.

## L01-S33 — Consequences of Algebraic Axioms

> PDF pages: 33
> Section: Real Numbers

**Definition 18**

- Define **subtraction** by $a-b=a+(-b)$.
- Define **division** by $a/b=a\times b^{-1}$ for $b\neq0$.

**Theorem 19**

1. If $a+c=b+c$, then $a=b$.
2. If $ac=bc$ and $c\neq0$, then $a=b$.

*Proof:* Since $a+c=b+c$, $(a+c)+(-c)=(b+c)+(-c)$. It follows from A2 that $a+(c+(-c))=b+(c+(-c))$. By A4, $a+0=b+0$. By A3, $a=b$. The second claim can be proved in a similar way.

## L01-S34 — Consequences of Algebraic Axioms

> PDF pages: 34
> Section: Real Numbers

**Theorem 20**

If $c\neq0$ and $d\neq0$, then

1. $a0=0$, $-(-a)=a$.
2. $(c^{-1})^{-1}=c$, $(-1)a=-a$.
3. $a(-b)=-(ab)=(-a)b$.
4. $(-a)+(-b)=-(a+b)$.
5. $(-a)(-b)=ab$.
6. $(a/c)(b/d)=(ab)/(cd)$.
7. $(a/c)+(b/d)=(ad+bc)/(cd)$.

Prove some using Axioms A1–A9.

## L01-S35 — The Real Number System

> PDF pages: 35
> Section: Real Numbers

The Order Axioms: there is a subset $P$ of the real numbers, called the set of **positive numbers**, such that

10. **A10:** For any real number $a$, exactly one of the following holds:

    $$
    a=0\quad\text{or}\quad a\in P\quad\text{or}\quad -a\in P.
    $$

11. **A11:** If $a\in P$ and $b\in P$, then $a+b\in P$ and $ab\in P$.

The “Less Than” Relation: define $a<b$ to mean $b-a\in P$, $a\leq b$ to mean $b-a\in P$ or $b-a=0$, $a>b$ to mean $a-b\in P$, and $a\geq b$ to mean $a-b\in P$ or $a=b$.

$a<b$ iff $b>a$ and $a\leq b$ iff $b\geq a$.

## L01-S36 — The Real Number System

> PDF pages: 36
> Section: Real Numbers

**Theorem 21**

1. $a<b$ and $b<c$ implies $a<c$.
2. Exactly one of $a<b$, $a=b$, and $a>b$ is true.
3. $a<b$ implies $a+c<b+c$.
4. $a<b$ and $c>0$ implies $ac<bc$.
5. $a<b$ and $c<0$ implies $ac>bc$.
6. $0<1$ and $-1<0$.
7. $a>0$ implies $1/a>0$.
8. $0<a<b$ implies $0<1/b<1/a$.

Similar results hold for $\leq$.

Prove some using Axioms A1–A11.

## L01-S37 — Completeness Axiom

> PDF pages: 37
> Section: Real Numbers

**Definition 22**

If $S$ is a set of real numbers, then

1. $a$ is an **upper bound** for $S$ if $x\leq a$ for all $x\in S$.
2. $b$ is the **least upper bound** (or **l.u.b.** or **supremum** or sup) for $S$ if $b$ is an upper bound and $b\leq a$ whenever $a$ is an upper bound.
3. We call $b$ a **maximum** of $S$ if $b$ is the l.u.b. for $S$ and $b\in S$.

We can similarly define **lower bound**, **greatest lower bound** (or **g.l.b.** or **infimum** or inf), and **mimimum**.

A set is **bounded above** if it has an upper bound and is **bounded below** if it has a lower bound.

## L01-S38 — Completeness Axiom

> PDF pages: 38
> Section: Real Numbers

**A12 Least Upper Bound Completeness Axiom**

Suppose $S$ is a nonempty set of real numbers that is bounded above. Then $S$ has a l.u.b. in $\mathbb{R}$.

**Corollary 23**

Suppose $S$ is a nonempty set of real numbers that is bounded below. Then $S$ has a g.l.b. in $\mathbb{R}$.

## L01-S39 — Completeness Axiom

> PDF pages: 39
> Section: Real Numbers

**Proposition 24**

Suppose $S$ is a nonempty set of real numbers. Then $b$ is the supremum of $S$ iff

1. $x\leq b$ for all $x\in S$, and
2. for each $\epsilon>0$, there exists $x\in S$ such that $x>b-\epsilon$.

*Proof:*

## L01-S40 — The Archimedean Property

> PDF pages: 40
> Section: Real Numbers

**Theorem 25**

The set $\mathbb{N}$ is not bounded above.

*Proof:* Suppose $\mathbb{N}$ is bounded above. By the Completeness Axiom, there is a supremum $b\in\mathbb{R}$ such that $n\leq b$ for all $n\in\mathbb{N}$. Since $n+1\in\mathbb{N}$, $n+1\leq b$ and thus $n\leq b-1$ for all $n\in\mathbb{N}$. This is a contradiction since $b$ is no longer the least upper bound of $\mathbb{N}$.

**Theorem 26**

1. For any $x,y\in\mathbb{R}$, if $x<y$, then there exists a rational (irrational) number $r$ such that $x<r<y$.
2. For any $x\in\mathbb{R}$ and $\epsilon>0$, there exists a rational (irrational) number $r$ such that $0<|r-x|<\epsilon$.

## L01-S41 — The Archimedean Property: Exercise

> PDF pages: 41
> Section: Real Numbers

Prove that the supremum of $\{x\in\mathbb{R}:x<3\}$ is $3$.

*Proof:*

## L01-S42 — Boundedness and Monotonicity of Functions

> PDF pages: 42
> Section: Real Numbers

**Definition 27**

Let $f\colon X\to Y$ be a **real-valued** function, that is, $Y\subset\mathbb{R}$.

Define upper bounds, the supremum, the maximum of $f$ as the upper bounds, supremum, and maximum of its range $f(X)\subset\mathbb{R}$. The arguments $x$ such that $f(x)$ is the maximum are called the **maximizers** of $f$.

We say $f$ is **bounded** if its range is bounded.

## L01-S43 — Boundedness and Monotonicity of Functions

> PDF pages: 43
> Section: Real Numbers

**Definition 28**

If $X\subset\mathbb{R}$, then we say

- $f$ is **increasing** if $x\leq x'\implies f(x)\leq f(x')$.
- $f$ is **decreasing** if $x\leq x'\implies f(x)\geq f(x')$.
- $f$ is **monotonic** if it is increasing or decreasing.
- $f$ is **strictly increasing** if $x<x'\implies f(x)<f(x')$.
- $f$ is **strictly decreasing** if $x<x'\implies f(x)>f(x')$.
