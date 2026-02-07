# Row Reduction Algorithm

A step-by-step implementation of the **Row Reduction Algorithm** as taught in introductory Linear Algebra courses. Includes both a Python command-line tool and an interactive web UI themed in Sacramento State colors.

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

## Project Structure

```
RREF_solver/
├── row_reduction.py          # Python CLI tool
├── test_row_reduction.py     # Test suite (14 edge cases)
├── rref-ui/                  # React web UI
│   ├── src/
│   │   ├── App.jsx           # Main UI component
│   │   └── main.jsx          # Entry point
│   ├── package.json
│   └── ...
├── README.md
├── LICENSE
└── .gitignore
```

## Requirements

**Python CLI:**
- Python 3.6+
- No external dependencies (uses only the standard library `fractions` module)

**Web UI:**
- Node.js 18+
- npm

## Usage

### Python CLI

Run interactively from the project root:

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

You can also import it as a module:

```python
from row_reduction import row_reduce

matrix = [
    [1, 2, 4, 5],
    [2, 4, 5, 4],
    [4, 5, 4, 2]
]
result = row_reduce(matrix)
```

### Web UI

From the project root:

```
cd rref-ui
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

The UI features:
- Adjustable matrix size (up to 8×8)
- Preset example matrices
- Fraction input support (e.g. `3/4`)
- Color-coded forward and backward phases
- Highlighted pivot positions
- Step-by-step operation labels
