---
'program-rules-playground': minor
---

Splits the event form submit into **Save** (posts `ACTIVE`) and **Complete** (posts `COMPLETED` with `completedAt`). The registration form keeps a single action, and `status` is never sent as a data value.
