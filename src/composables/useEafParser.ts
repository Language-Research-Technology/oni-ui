type EafAnnotation = {
  id: string;
  startMs: number;
  endMs: number;
  value: string;
};

export type EafTier = {
  tierId: string;
  participant?: string;
  annotator?: string;
  linguisticTypeRef?: string;
  parentRef?: string;
  langRef?: string;
  annotations: EafAnnotation[];
};

export type EafMediaDescriptor = {
  mediaUrl: string;
  relativeMediaUrl?: string;
  mimeType: string;
  timeOrigin?: number;
};

export type EafLanguage = {
  langId: string;
  langDef?: string;
  langLabel?: string;
};

export type EafLinguisticType = {
  id: string;
  timeAlignable?: boolean;
  constraints?: string;
  controlledVocabularyRef?: string;
};

export type EafDocument = {
  author?: string;
  date?: string;
  version?: string;
  format?: string;
  mediaDescriptors: EafMediaDescriptor[];
  languages: EafLanguage[];
  linguisticTypes: EafLinguisticType[];
  tiers: EafTier[];
};

export function parseEaf(xml: string): EafDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  // Document metadata
  const root = doc.querySelector('ANNOTATION_DOCUMENT');
  const author = root?.getAttribute('AUTHOR') ?? undefined;
  const date = root?.getAttribute('DATE') ?? undefined;
  const version = root?.getAttribute('VERSION') ?? undefined;
  const format = root?.getAttribute('FORMAT') ?? undefined;

  // Media descriptors
  const mediaDescriptors: EafMediaDescriptor[] = [];
  for (const md of doc.querySelectorAll('HEADER > MEDIA_DESCRIPTOR')) {
    const mediaUrl = md.getAttribute('MEDIA_URL');
    const mimeType = md.getAttribute('MIME_TYPE');
    if (mediaUrl && mimeType) {
      const timeOrigin = md.hasAttribute('TIME_ORIGIN') && md.getAttribute('TIME_ORIGIN');
      mediaDescriptors.push({
        mediaUrl,
        relativeMediaUrl: md.getAttribute('RELATIVE_MEDIA_URL') ?? undefined,
        mimeType,
        timeOrigin: timeOrigin ? Number.parseInt(timeOrigin, 10) : undefined,
      });
    }
  }

  // Languages
  const languages: EafLanguage[] = [];
  for (const langEl of doc.querySelectorAll('LANGUAGE')) {
    const langId = langEl.getAttribute('LANG_ID');
    if (langId) {
      languages.push({
        langId,
        langDef: langEl.getAttribute('LANG_DEF') ?? undefined,
        langLabel: langEl.getAttribute('LANG_LABEL') ?? undefined,
      });
    }
  }

  // Linguistic types
  const linguisticTypes: EafLinguisticType[] = [];
  for (const ltEl of doc.querySelectorAll('LINGUISTIC_TYPE')) {
    const id = ltEl.getAttribute('LINGUISTIC_TYPE_ID');
    if (id) {
      linguisticTypes.push({
        id,
        timeAlignable: ltEl.getAttribute('TIME_ALIGNABLE') === 'true',
        constraints: ltEl.getAttribute('CONSTRAINTS') ?? undefined,
        controlledVocabularyRef: ltEl.getAttribute('CONTROLLED_VOCABULARY_REF') ?? undefined,
      });
    }
  }

  // Build time slot map
  const timeSlots = new Map<string, number>();
  for (const slot of doc.querySelectorAll('TIME_ORDER > TIME_SLOT')) {
    const id = slot.getAttribute('TIME_SLOT_ID');
    const value = slot.getAttribute('TIME_VALUE');
    if (id && value) {
      timeSlots.set(id, Number.parseInt(value, 10));
    }
  }

  // First pass: collect all alignable annotations (needed for REF_ANNOTATION resolution)
  const alignableMap = new Map<string, EafAnnotation>();
  for (const annEl of doc.querySelectorAll('ALIGNABLE_ANNOTATION')) {
    const id = annEl.getAttribute('ANNOTATION_ID') || '';
    const ts1 = annEl.getAttribute('TIME_SLOT_REF1') || '';
    const ts2 = annEl.getAttribute('TIME_SLOT_REF2') || '';
    const valueEl = annEl.querySelector('ANNOTATION_VALUE');

    alignableMap.set(id, {
      id,
      startMs: timeSlots.get(ts1) ?? 0,
      endMs: timeSlots.get(ts2) ?? 0,
      value: valueEl?.textContent ?? '',
    });
  }

  // Build a map of all annotations by ID (alignable first, ref annotations resolved after)
  const allAnnotations = new Map<string, EafAnnotation>(alignableMap);

  // Collect ref annotations in order so we can resolve them
  const refAnnotationEls: { id: string; annotationRef: string; valueEl: Element | null }[] = [];
  for (const refEl of doc.querySelectorAll('REF_ANNOTATION')) {
    refAnnotationEls.push({
      id: refEl.getAttribute('ANNOTATION_ID') || '',
      annotationRef: refEl.getAttribute('ANNOTATION_REF') || '',
      valueEl: refEl.querySelector('ANNOTATION_VALUE'),
    });
  }

  // Resolve ref annotations — may need multiple passes if chains exist
  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;
    for (const ref of refAnnotationEls) {
      if (allAnnotations.has(ref.id)) {
        continue;
      }
      const parent = allAnnotations.get(ref.annotationRef);
      if (parent) {
        allAnnotations.set(ref.id, {
          id: ref.id,
          startMs: parent.startMs,
          endMs: parent.endMs,
          value: ref.valueEl?.textContent ?? '',
        });
        madeProgress = true;
      }
    }
  }

  // Parse tiers
  const tiers: EafTier[] = [];
  for (const tierEl of doc.querySelectorAll('TIER')) {
    const tierId = tierEl.getAttribute('TIER_ID') || 'Unknown';
    const annotations: EafAnnotation[] = [];

    for (const annWrapper of tierEl.querySelectorAll(':scope > ANNOTATION')) {
      const alignable = annWrapper.querySelector('ALIGNABLE_ANNOTATION');
      const refAnn = annWrapper.querySelector('REF_ANNOTATION');
      const annId = alignable?.getAttribute('ANNOTATION_ID') || refAnn?.getAttribute('ANNOTATION_ID') || '';
      const match = allAnnotations.get(annId);
      if (match) {
        annotations.push(match);
      }
    }

    annotations.sort((a, b) => a.startMs - b.startMs);

    tiers.push({
      tierId,
      participant: tierEl.getAttribute('PARTICIPANT') ?? undefined,
      annotator: tierEl.getAttribute('ANNOTATOR') ?? undefined,
      linguisticTypeRef: tierEl.getAttribute('LINGUISTIC_TYPE_REF') ?? undefined,
      parentRef: tierEl.getAttribute('PARENT_REF') ?? undefined,
      langRef: tierEl.getAttribute('LANG_REF') ?? undefined,
      annotations,
    });
  }

  return {
    author,
    date,
    version,
    format,
    mediaDescriptors,
    languages,
    linguisticTypes,
    tiers,
  };
}
