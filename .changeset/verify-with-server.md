---
'program-rules-playground': minor
---

Adds **Verify with server** to the save review dialog. It posts the exact event payload with `importMode=VALIDATE&async=false` (nothing is saved), attributes the server's rule errors and warnings to their rules, flags rules only the server fired as "Server only", and lists other import errors separately.
