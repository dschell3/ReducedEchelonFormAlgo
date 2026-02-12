"""
Row Reduction Algorithm
=======================
Implements the exact algorithm as described:
  Forward Phase  (Steps 1-4): produces echelon form
  Backward Phase (Step 5):    produces reduced echelon form
"""

from fractions import Fraction


def print_matrix(matrix, label="", pivots=None):
    """Pretty-print the matrix using fractions for exact arithmetic.
    
    If pivots is provided (list of (row, col) tuples), those entries
    are displayed circled, e.g. (3) instead of  3.
    """
    pivot_set = set(pivots) if pivots else set()
    if label:
        print(f"\n{label}")
    for r, row in enumerate(matrix):
        formatted = []
        for c, val in enumerate(row):
            s = str(val)
            if (r, c) in pivot_set:
                # Circle the leading entry: pad so the parenthesised
                # value occupies the same 8-char field width
                circled = f"({s})"
                formatted.append(f"{circled:>8}")
            else:
                formatted.append(f"{s:>8}")
        print("  [", "  ".join(formatted), "]")
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
                print(f"  Step 3: R{r + 1} = R{r + 1} + ({-factor}) * R{pivot_row + 1}")
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
            print(f"  Step 5-1: R{pivot_row + 1} = ({Fraction(1, 1) / scale}) * R{pivot_row + 1}")
            print_matrix(matrix)

        # Step 5-2: Eliminate all entries above the pivot
        for r in range(pivot_row - 1, -1, -1):
            if matrix[r][pivot_col] != 0:
                factor = matrix[r][pivot_col]
                for c in range(cols):
                    matrix[r][c] -= factor * matrix[pivot_row][c]
                print(f"  Step 5-2: R{r + 1} = R{r + 1} + ({-factor}) * R{pivot_row + 1}")
                print_matrix(matrix)

    return matrix


def solve_system(matrix):
    """
    Flowchart: How to answer the fundamental questions.
    Follows the decision process from Math 100, Handout 1 (Ali Behzadan).

    Given the RREF of an augmented matrix [A | b]:
      1. Locate the pivot columns.
      2. Is the rightmost column a pivot column?
         - Yes → inconsistent (no solution).
         - No  → consistent (at least one solution).
      3. Determine basic variables and free variables.
      4. Does the system have at least one free variable?
         - No  → unique solution.
         - Yes → infinitely many solutions (parametric vector form).
    """
    pivots = find_pivots(matrix)
    total_cols = len(matrix[0])
    num_vars = total_cols - 1          # last column is the augmented column
    pivot_cols = {c for _, c in pivots}

    # Variable names: x1, x2, ..., xn
    var_names = [f"x{i + 1}" for i in range(num_vars)]

    print("=" * 50)
    print("SOLVING THE SYSTEM (Flowchart)")
    print("=" * 50)

    # --- Locate pivot columns ---
    print(f"\n  Pivot columns: {sorted(c + 1 for c in pivot_cols)}")

    # --- Is the rightmost column (augmented) a pivot column? ---
    if (total_cols - 1) in pivot_cols:
        print("\n  The rightmost column of the augmented matrix IS a pivot column.")
        print("  >> The solution set is EMPTY (the system is inconsistent).")
        return

    print("\n  The rightmost column of the augmented matrix is NOT a pivot column.")
    print("  >> The system is CONSISTENT (at least one solution).")

    # --- Determine basic and free variables ---
    basic_cols = sorted(c for c in pivot_cols if c < num_vars)
    free_cols = sorted(c for c in range(num_vars) if c not in pivot_cols)

    basic_names = [var_names[c] for c in basic_cols]
    free_names = [var_names[c] for c in free_cols]

    print(f"\n  Basic variables:  {', '.join(basic_names)}")
    if free_names:
        print(f"  Free variables:   {', '.join(free_names)}")
    else:
        print(f"  Free variables:   (none)")

    # Build a lookup: pivot_col -> pivot_row for reading equations
    col_to_row = {c: r for r, c in pivots if c < num_vars}

    # --- Does the system have at least one free variable? ---
    if not free_cols:
        # ---- UNIQUE SOLUTION ----
        print("\n  >> The system has a UNIQUE solution.\n")

        print("  Corresponding system of equations:")
        for c in basic_cols:
            r = col_to_row[c]
            val = matrix[r][total_cols - 1]
            print(f"    {var_names[c]} = {val}")

        print("\n  Solution:")
        solution_parts = []
        for i in range(num_vars):
            r = col_to_row[i]
            val = matrix[r][total_cols - 1]
            solution_parts.append(str(val))
        vec = "(" + ", ".join(solution_parts) + ")"
        print(f"    {vec}")
    else:
        # ---- INFINITELY MANY SOLUTIONS ----
        print("\n  >> The system has INFINITELY MANY solutions.\n")

        # Write the corresponding system of equations
        print("  Corresponding system of equations:")
        for c in basic_cols:
            r = col_to_row[c]
            rhs = str(matrix[r][total_cols - 1])
            terms = []
            for fc in free_cols:
                coeff = -matrix[r][fc]  # move to right side
                if coeff != 0:
                    if coeff == 1:
                        terms.append(f"+ {var_names[fc]}")
                    elif coeff == -1:
                        terms.append(f"- {var_names[fc]}")
                    elif coeff > 0:
                        terms.append(f"+ {coeff}{var_names[fc]}")
                    else:
                        terms.append(f"- {-coeff}{var_names[fc]}")
            equation = rhs + " " + " ".join(terms) if terms else rhs
            print(f"    {var_names[c]} = {equation.strip()}")
        for fc in free_cols:
            print(f"    {var_names[fc]} is free")

        # Parametric vector form
        print("\n  Parametric vector form:")

        # Build particular solution (set all free vars = 0)
        particular = [Fraction(0)] * num_vars
        for c in basic_cols:
            r = col_to_row[c]
            particular[c] = matrix[r][total_cols - 1]

        # Build direction vector for each free variable
        directions = []
        for fc in free_cols:
            d = [Fraction(0)] * num_vars
            d[fc] = Fraction(1)
            for c in basic_cols:
                r = col_to_row[c]
                d[c] = -matrix[r][fc]
            directions.append((fc, d))

        # Print in column vector style
        width = 8
        # Header line
        parts = [f"{'':>{width}}"]  # leading spacer for "x ="
        parts.append(f"{'':>{width}}")  # particular vector column
        for fc, _ in directions:
            parts.append(f"{'':>{width}}")  # direction vector columns

        # Print row by row
        bracket_l = [" "] * num_vars
        bracket_r = [" "] * num_vars
        bracket_l[0] = "/"
        bracket_l[-1] = "\\"
        bracket_r[0] = "\\"
        bracket_r[-1] = "/"
        if num_vars == 1:
            bracket_l[0] = "["
            bracket_r[0] = "]"
        elif num_vars == 2:
            bracket_l[0] = "/"
            bracket_l[1] = "\\"
            bracket_r[0] = "\\"
            bracket_r[1] = "/"
        else:
            for i in range(1, num_vars - 1):
                bracket_l[i] = "|"
                bracket_r[i] = "|"

        for i in range(num_vars):
            label = "    x = " if i == num_vars // 2 else "        "
            p_val = f"{str(particular[i]):>{width}}"

            line = f"{label}{bracket_l[i]} {p_val} {bracket_r[i]}"

            for idx, (fc, d) in enumerate(directions):
                param_name = var_names[fc]
                if i == num_vars // 2:
                    plus = f"  + {param_name} "
                else:
                    plus = f"       "
                d_val = f"{str(d[i]):>{width}}"
                line += f"{plus}{bracket_l[i]} {d_val} {bracket_r[i]}"

            print(line)

        print()


def row_reduce(matrix, augmented=False):
    """Run the full Row Reduction Algorithm."""
    # Convert all entries to Fraction for exact arithmetic
    matrix = [[Fraction(val) for val in row] for row in matrix]

    print_matrix(matrix, "Original matrix:")

    print("=" * 50)
    print("FORWARD PHASE (Steps 1-4): Echelon Form")
    print("=" * 50)
    matrix = forward_phase(matrix)
    pivots = find_pivots(matrix)
    print_matrix(matrix, "Echelon form:", pivots=pivots)

    print("=" * 50)
    print("BACKWARD PHASE (Step 5): Reduced Echelon Form")
    print("=" * 50)
    matrix = backward_phase(matrix)
    print_matrix(matrix, "Reduced echelon form (RREF):")

    # Flowchart: solve the system if augmented
    if augmented:
        solve_system(matrix)

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

    aug = input("\n  Is this an augmented matrix? (y/n): ").strip().lower()
    augmented = aug in ("y", "yes")

    row_reduce(matrix, augmented=augmented)
