# Difficulty Grading — Unit Basis

**Decision date:** 2025-07-07  
**Status:** Accepted

## Context

The Shenandoah NPS difficulty formula is defined as:

```
difficulty = sqrt(2 × elevationGain × distance)
```

The official NPS resources express the formula in **feet and miles** (gain in
feet, distance in miles). The application stores all values in **SI metres**
internally per the codebase convention (PROJECT-SPEC.md §11). Unit conversion
must occur somewhere.

## Options considered

| Option | Effect | Verdict |
|---|---|---|
| Compute score directly from metres | `sqrt(2 × gainM × distanceM)` gives different (smaller) numbers | Rejected — doesn't match NPS published bands |
| Store both SI and imperial values | More fields, more confusion | Rejected — redundant |
| Convert at the grading boundary | Single SI source of truth; conversion is trivial and documented | **Chosen** |

## Decision

**Convert metres → feet and miles at the grading boundary only.** The
`difficulty()` function accepts metres in, converts internally, computes the
score, and returns both `score` (rounded to 2 decimals) and `band`.

Conversion factors:
- `1 m = 3.28084 ft`
- `1 m = 1 / 1609.344 mi`

## Bands

| Score | Band |
|---|---|
| < 50 | Easiest |
| 50 – 100 | Moderate |
| 100 – 150 | Moderately Strenuous |
| 150 – 200 | Strenuous |
| > 200 | Very Strenuous |

## References

- NPS Shenandoah hiking difficulty:
  https://www.nps.gov/shen/planyourvisit/how-to-determine-hiking-difficulty.htm
- PROJECT-SPEC.md §5.4
