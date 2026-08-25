# Real Number System

> Course sources: [Lecture 1](../raw/lectures/lecture-01.md), slides 30–36

## Overview

The lecture presents the real numbers through algebraic and order axioms. These axioms define the operations and order relation used later in convergence and optimization arguments.

## Algebraic structure

The real number system consists of real numbers together with addition, multiplication, the relation “less than,” and the distinguished elements $0$ and $1$.

The addition axioms are

1. **A1:** $a+b=b+a$;
2. **A2:** $(a+b)+c=a+(b+c)$;
3. **A3:** $a+0=0+a=a$;
4. **A4:** there is exactly one real number $-a$ such that $a+(-a)=(-a)+a=0$.

The multiplication axioms are

5. **A5:** $ab=ba$;
6. **A6:** $(ab)c=a(bc)$;
7. **A7:** $a1=1a=a$, with $1\neq0$;
8. **A8:** if $a\neq0$, there is exactly one $a^{-1}$ such that $aa^{-1}=a^{-1}a=1$.

The distributive axiom is

9. **A9:** $a(b+c)=ab+ac$.

The lecture calls A1–A9 the algebraic axioms.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slides 31–32.

## Subtraction, division, and algebraic consequences

Subtraction and division are defined by

$$
a-b=a+(-b),
\qquad
a/b=a\times b^{-1}\quad\text{for }b\neq0.
$$

The lecture derives cancellation:

$$
a+c=b+c\implies a=b,
$$

and

$$
ac=bc\text{ and }c\neq0\implies a=b.
$$

It also states, for $c\neq0$ and $d\neq0$,

1. $a0=0$ and $-(-a)=a$;
2. $(c^{-1})^{-1}=c$ and $(-1)a=-a$;
3. $a(-b)=-(ab)=(-a)b$;
4. $(-a)+(-b)=-(a+b)$;
5. $(-a)(-b)=ab$;
6. $(a/c)(b/d)=(ab)/(cd)$;
7. $(a/c)+(b/d)=(ad+bc)/(cd)$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slides 33–34.

## Order axioms and order relations

There is a subset $P$ of positive real numbers satisfying

10. **A10:** for every real number $a$, exactly one of

    $$
    a=0,
    \qquad
a\in P,
    \qquad
    -a\in P
    $$

    holds;

11. **A11:** if $a,b\in P$, then $a+b\in P$ and $ab\in P$.

The order relations are defined by

$$
a<b\iff b-a\in P,
$$

$$
a\leq b\iff b-a\in P\text{ or }b-a=0,
$$

$$
a>b\iff a-b\in P,
$$

$$
a\geq b\iff a-b\in P\text{ or }a=b.
$$

The lecture also records $a<b$ iff $b>a$, and $a\leq b$ iff $b\geq a$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 35.

## Consequences of the order axioms

The lecture states:

1. $a<b$ and $b<c$ imply $a<c$;
2. exactly one of $a<b$, $a=b$, and $a>b$ is true;
3. $a<b$ implies $a+c<b+c$;
4. $a<b$ and $c>0$ imply $ac<bc$;
5. $a<b$ and $c<0$ imply $ac>bc$;
6. $0<1$ and $-1<0$;
7. $a>0$ implies $1/a>0$;
8. $0<a<b$ implies $0<1/b<1/a$.

Similar results hold for $\leq$.

**Course source:** [Lecture 1](../raw/lectures/lecture-01.md), slide 36.

## Connections

- [Bounds, suprema, and completeness](bounds-suprema-and-completeness.md) adds the least-upper-bound axiom to the algebraic and order axioms.
- The [Archimedean property](archimedean-property.md) is proved using completeness.
- [Bounded and monotone functions](bounded-and-monotone-functions.md) applies the order relation to real-valued functions.
