// The claude.ai test build only: that host limits how many files a page can
// have, so the narration clips are joined into a few dozen "packs" and read
// back out by byte range. The normal build never calls this.
import { fetchBytes } from '../audio/engine.ts';

interface PackIndex {
  packs: string[];
  /** clip id → [pack number, byte offset, byte length] */
  clips: Record<string, [number, number, number]>;
}

const BASE = `${import.meta.env.BASE_URL}narration-packs/`;
let index: Promise<PackIndex> | null = null;
const packs = new Map<number, Promise<ArrayBuffer>>();

function getIndex(): Promise<PackIndex> {
  if (!index) {
    index = fetch(`${BASE}index.json`).then((r) => {
      if (!r.ok) throw new Error(`pack index ${r.status}`);
      return r.json() as Promise<PackIndex>;
    });
    index.catch(() => { index = null; });
  }
  return index;
}

/** The bytes of one clip, as its own MP3 file. */
export async function packedClip(id: string): Promise<ArrayBuffer> {
  const ix = await getIndex();
  const at = ix.clips[id];
  if (!at) throw new Error(`no clip ${id}`);
  const [n, offset, length] = at;
  let pack = packs.get(n);
  if (!pack) {
    pack = fetchBytes(`${BASE}${ix.packs[n]}`);
    pack.catch(() => packs.delete(n));
    packs.set(n, pack);
  }
  // A copy, because decoding takes ownership of the buffer it is given.
  return (await pack).slice(offset, offset + length);
}
