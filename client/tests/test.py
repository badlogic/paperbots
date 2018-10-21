def fib(n):
	if n < 2:
		return n
	else:
		return fib(n - 2) + fib(n - 1)

import timeit
print(timeit.timeit("fib(30)", setup="from __main__ import fib", number=5))