---
'program-rules-playground': patch
---

Fixes saving events and registrations that could not be submitted: numeric and boolean values are now accepted, and `orgUnit` and the date fields (which the form resolver strips) are restored before validation and kept after the post-save reset.
