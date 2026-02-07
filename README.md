# Row Reduction Algorithm

A Python implementation of the **Row Reduction Algorithm** as taught in introductory Linear Algebra courses. The program performs row reduction step-by-step, showing every row operation, and produces the **reduced echelon form (RREF)** of any matrix.

## Algorithm

The implementation follows the standard two-phase approach:

**Forward Phase (Steps 1–4)** — produces echelon form:
1. Begin with the leftmost nonzero column. Identify the top position.
2. Interchange rows, if necessary, to place a nonzero entry at the top position.
3. Use row replacement operations to create zeros in all positions below the top entry.
4. Cover the top row and any rows above it. Apply Steps 1–3 to the submatrix that remains. Repeat until there are no more nonzero rows to modify.

**Backward Phase (Step 5)** — produces the unique reduced echelon form:

Beginning with the rightmost pivot position, working upward and to the left:
- (5-1) If the number inside the pivot position is not 1, make it 1 by scaling the corresponding row.
- (5-2) Use row replacement operations to create zeros above the pivot position.

## Requirements

- Python 3.6+
- No external dependencies (uses only the standard library `fractions` module)

## Usage

Run interactively:

```
python row_reduction.py
```

You will be prompted for the matrix dimensions and entries:

```
Row Reduction Algorithm
--------------------------------------------------
Enter matrix dimensions:
  Rows: 3
  Cols: 4
Enter each row as 4 space-separated numbers (fractions like 3/4 are OK):
  Row 1: 1 2 4 5
  Row 2: 2 4 5 4
  Row 3: 4 5 4 2
```

The program prints every row operation performed during both phases, then displays the final RREF.

### Use as a module

```python
from row_reduction import row_reduce

matrix = [
    [1, 2, 4, 5],
    [2, 4, 5, 4],
    [4, 5, 4, 2]
]
result = row_reduce(matrix)
```

### Fraction support

All arithmetic is done with Python's `fractions.Fraction` class, so results are always exact — no floating-point rounding. You can also enter fractions as input:

```
  Row 1: 1/3 2/7 5
```

## Tests

```
python test_row_reduction.py
```

Covers 14 edge cases: identity matrices, zero matrices, single row/column, row swaps, inconsistent systems, tall/wide matrices, large values, and complex fractional results.

## License

MIT
