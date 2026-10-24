import { LexiconPack, SignClip } from '../../core/types';
import defaultPack from './islBasicPack.json';

class LexiconManager {
  private packs: Map<string, LexiconPack> = new Map();

  constructor() {
    this.registerPack(defaultPack as unknown as LexiconPack);
  }

  public registerPack(pack: LexiconPack): void {
    this.packs.set(pack.id, pack);
  }

  public getAllPacks(): LexiconPack[] {
    return Array.from(this.packs.values());
  }

  public getPack(id: string): LexiconPack | undefined {
    return this.packs.get(id);
  }

  public getAllClips(): SignClip[] {
    const clips: SignClip[] = [];
    for (const pack of this.packs.values()) {
      clips.push(...pack.clips);
    }
    return clips;
  }

  public findClipByGloss(gloss: string): SignClip | undefined {
    const cleanGloss = gloss.trim().toUpperCase().replace(/\s+/g, '-');
    for (const pack of this.packs.values()) {
      const match = pack.clips.find(
        (c) => c.gloss.toUpperCase() === cleanGloss || c.id.toUpperCase() === cleanGloss
      );
      if (match) return match;
    }
    return undefined;
  }

  public searchClips(query: string): SignClip[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAllClips();
    
    return this.getAllClips().filter((clip) => {
      const glossMatch = clip.gloss.toLowerCase().includes(q);
      const enMatch = clip.labels.en.toLowerCase().includes(q);
      const hiMatch = clip.labels.hi.toLowerCase().includes(q);
      return glossMatch || enMatch || hiMatch;
    });
  }
}

export const lexiconManager = new LexiconManager();
