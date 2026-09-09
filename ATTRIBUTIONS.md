# Image attributions

Every portrait in `public/officials/` is an **official U.S. government portrait**
(White House, federal department/agency, or the U.S. Congress). Works produced by
employees of the U.S. federal government as part of their official duties are in
the **public domain** under 17 U.S.C. § 105 and carry no usage restrictions.

Files were retrieved via **Wikimedia Commons**. The `source` field on each entry
in `src/data/officials.yaml` points at the Commons file page for that portrait;
check there for the specific photographer credit and the exact PD tag
(`PD-USGov`, `PD-USGov-Congress`, `PD-USGov-DHS`, `PD-USGov-Military`, etc.).

If you swap in a different image, make sure it is public domain or under a
license that permits reuse, and update `source` / `license` accordingly.

A few entries are officeholders whose only widely-available photo is **not** a
federal-government work (e.g. a state official or a former member of Congress);
those are marked `license: See source` in `officials.yaml` — verify the license
on the linked Commons file page before any public/commercial use.

## Regenerating the portraits

`scripts/fetch-portraits.mjs` downloads a square thumbnail for every roster entry
from the Commons file named in its `source` URL and writes it to
`public/officials/<id>.jpg`. Run it with:

```bash
node scripts/fetch-portraits.mjs
```

Re-run it after editing `officials.yaml`. Any entry whose image can't be fetched
falls back to a generated placeholder so the app still runs.
