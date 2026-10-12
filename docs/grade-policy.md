# General Average policy

The six fields are Monthly, First prelim, Second prelim, Midterm, Pre-final and Final. Their equal mean is the General Average. This is not a units-weighted or cross-subject GPA.

Scores are numeric 0–100 inclusive, at most two decimals. Empty means null; zero remains a valid score. Partial records can be saved, with an Incomplete state and no invented average, equivalent or remarks.

The raw sum / 6 is independently rounded half-up to two decimals for display and one decimal for classification. The one-decimal classification is matched against descending thresholds:

| Minimum | Equivalent |
|---|---|
|96.5|1.00|
|93.5|1.25|
|90.5|1.50|
|87.5|1.75|
|84.5|2.00|
|81.5|2.25|
|78.5|2.50|
|75.5|2.75|
|74.5|3.00|
|Below 74.5|5.00 (Failed)|

All equivalents other than 5.00 have Passed remarks. Six 96.45 scores classify at 96.5, equivalent 1.00; six 74.45 classify at 74.5, equivalent 3.00. Six 74.44 fail. Mixed 88/90/91/89/92/90 average 90.00, classify at 90.0, equivalent 1.75.

This is the user-approved portfolio policy resolving gaps and overlaps in recovered code; it does not claim to be an institution’s official policy. Browser previews use integer hundredths. PostgreSQL independently validates and calculates with numeric arithmetic. The API accepts only six scores and an enrollment reference, never client-supplied average/results.
