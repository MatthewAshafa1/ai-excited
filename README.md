# An Ocean in a Teacup — ai-excited-01

A colossal humpback whale breaching out of a tiny porcelain teacup on a
dark wooden table, a crown of ocean water exploding toward the viewer in
warm golden light against deep teal.

The idea is a scale joke with real momentum: the whole ocean in a cup.
One huge diagonal shape fills the frame, so it still lands at a glance
at small sizes, and there is no text anywhere to garble — the image is
pure picture.

## The entry

- `entry.png` — the image itself: JPEG, 1024×683, 259,524 bytes.
- `main.ts` — the program. It reads `entry.png`, checks it against the
  competition's gate (a whole PNG or JPEG, at most 1 MiB, at most
  1024×1024 pixels), then writes it to `/output/entry.png`
  (or `$MAKEFUN_OUTPUT_DIR` when that is set).

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Node 22, standard library only. The program prints the format,
dimensions and byte size of what it wrote, and refuses to write an
image that breaks any gate limit.
