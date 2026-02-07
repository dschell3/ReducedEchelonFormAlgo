"""
Row Reduction Algorithm
=======================
Implements the exact algorithm as described:
  Forward Phase  (Steps 1-4): produces echelon form
  Backward Phase (Step 5):    produces reduced echelon form
"""

from fractions import Fraction


def print_matrix(matrix, label=""):
    """Pretty-print the matrix using fractions for exact arithmetic."""
    if label:
        print(f"\n{label}")
    for row in matrix:
        print("  [", "  ".join(f"{str(val):>8}" for val in row), "]")
    print()


def forward_phase(matrix):
    """
    Steps 1-4: Produce echelon form.
      Step 1: Begin with the leftmost nonzero column.
      Step 2: Interchange rows if necessary for a nonzero top entry.
      Step 3: Row replacement to create zeros below the top entry.
      Step 4: Cover the top row, repeat on the submatrix.
    """
    rows = len(matrix)
    cols = len(matrix[0])
    pivot_row = 0  # tracks which row we're working on (top of submatrix)

    for col in range(cols):
        if pivot_row >= rows:
            break

        # Step 1: Find the leftmost nonzero column (starting from current col)
        # Check if this column has a nonzero entry at or below pivot_row
        nonzero_row = None
        for r in range(pivot_row, rows):
            if matrix[r][col] != 0:
                nonzero_row = r
                break

        if nonzero_row is None:
            # No nonzero entry in this column below pivot_row — skip column
            continue

        # Step 2: Interchange rows to bring nonzero entry to the top position
        if nonzero_row != pivot_row:
            matrix[pivot_row], matrix[nonzero_row] = matrix[nonzero_row], matrix[pivot_row]
            print(f"  Step 2: Swap R{pivot_row + 1} <-> R{nonzero_row + 1}")
            print_matrix(matrix)

        # Step 3: Row replacement — create zeros below the top entry
        for r in range(pivot_row + 1, rows):
            if matrix[r][col] != 0:
                factor = matrix[r][col] / matrix[pivot_row][col]
                for c in range(cols):
                    matrix[r][c] -= factor * matrix[pivot_row][c]
                print(f"  Step 3: R{r + 1} = R{r + 1} - ({factor}) * R{pivot_row + 1}")
                print_matrix(matrix)

        # Step 4: Move to the next row (cover the top row of submatrix)
        pivot_row += 1

    return matrix


def find_pivots(matrix):
    """Locate all pivot positions (row, col) in echelon form."""
    pivots = []
    for r, row in enumerate(matrix):
        for c, val in enumerate(row):
            if val != 0:
                pivots.append((r, c))
                break
    return pivots


def backward_phase(matrix):
    """
    Step 5: Produce reduced echelon form.
      Start with the rightmost pivot position, working upward and to the left.
      5-1: Scale the pivot row so the pivot becomes 1.
      5-2: Row replacement to create zeros above the pivot.
    """
    pivots = find_pivots(matrix)
    cols = len(matrix[0])

    # Process pivots from rightmost to leftmost
    for pivot_row, pivot_col in reversed(pivots):
        # Step 5-1: Scale pivot to 1
        pivot_val = matrix[pivot_row][pivot_col]
        if pivot_val != 1:
            scale = pivot_val
            for c in range(cols):
                matrix[pivot_row][c] /= scale
            print(f"  Step 5-1: R{pivot_row + 1} = R{pivot_row + 1} / ({scale})")
            print_matrix(matrix)

        # Step 5-2: Eliminate all entries above the pivot
        for r in range(pivot_row - 1, -1, -1):
            if matrix[r][pivot_col] != 0:
                factor = matrix[r][pivot_col]
                for c in range(cols):
                    matrix[r][c] -= factor * matrix[pivot_row][c]
                print(f"  Step 5-2: R{r + 1} = R{r + 1} - ({factor}) * R{pivot_row + 1}")
                print_matrix(matrix)

    return matrix


def row_reduce(matrix):
    """Run the full Row Reduction Algorithm."""
    # Convert all entries to Fraction for exact arithmetic
    matrix = [[Fraction(val) for val in row] for row in matrix]

    print_matrix(matrix, "Original matrix:")

    print("=" * 50)
    print("FORWARD PHASE (Steps 1-4): Echelon Form")
    print("=" * 50)
    matrix = forward_phase(matrix)
    print_matrix(matrix, "Echelon form:")

    print("=" * 50)
    print("BACKWARD PHASE (Step 5): Reduced Echelon Form")
    print("=" * 50)
    matrix = backward_phase(matrix)
    print_matrix(matrix, "Reduced echelon form (RREF):")

    return matrix


def parse_matrix_input():
    """Prompt user for matrix dimensions and entries."""
    print("Enter matrix dimensions:")
    rows = int(input("  Rows: "))
    cols = int(input("  Cols: "))
    print(f"Enter each row as {cols} space-separated numbers:")

    matrix = []
    for r in range(rows):
        while True:
            try:
                vals = input(f"  Row {r + 1}: ").split()
                if len(vals) != cols:
                    print(f"  Expected {cols} values, got {len(vals)}. Try again.")
                    continue
                row = [Fraction(v) for v in vals]
                matrix.append(row)
                break
            except ValueError:
                print("  Invalid input. Enter numbers (integers or fractions like 3/4).")
    return matrix


if __name__ == "__main__":
    print("Row Reduction Algorithm")
    print("-" * 50)
    matrix = parse_matrix_input()
    row_reduce(matrix)