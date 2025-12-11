import { z } from 'zod/v4';

const helpSchema = z.strictObject({
  aboutText: z.string(),
  citationText: z.string(),
});

const subHelpLinkSchema = z.strictObject({
  name: z.string(),
  href: z.url(),
  target: z.string(),
});

const termsAndPrivacySchema = z.strictObject({
  text: z.string(),
  href: z.string(),
  title: z.string(),
});

const footerSchema = z.strictObject({
  copyright: z.string(),
  link: z.strictObject({
    href: z.url(),
    text: z.string(),
  }),
});

const topNavItemSchema = z.strictObject({
  route: z.string(),
  display: z.string(),
});

const valueLabelSchema = z.strictObject({
  value: z.string(),
  label: z.string(),
});

const fieldLabelSchema = z.strictObject({
  field: z.string(),
  label: z.string(),
});

const searchSchema = z
  .strictObject({
    sorting: z.array(valueLabelSchema),
    default: z.object({
      sorting: z.string(),
      ordering: z.enum(['asc', 'desc']),
    }),
    searchDetails: z.array(fieldLabelSchema),
  })
  .refine((data) => data.sorting.map((s) => s.value).includes(data.default.sorting), {
    message: 'default sorting must be one of the values in sorting array',
    path: ['defailt.sorting'], // This will attach the error to the role field
  })
  .optional();

const fieldDisplaySchema = z.strictObject({
  display: z.string(),
  name: z.string(),
});

const metaSchema = z.discriminatedUnion('mode', [
  z.strictObject({
    mode: z.literal('filter'),
    top: z.array(fieldDisplaySchema),
    hide: z.array(z.string()),
  }),
  z.strictObject({
    mode: z.literal('explicit'),
    show: z.array(z.string()),
  }),
]);

const collectionSchema = z.strictObject({
  meta: metaSchema,
});

const objectSchema = z.object({
  meta: metaSchema,
});

export type CollectionConfig = z.infer<typeof collectionSchema>;
export type ObjectConfig = z.infer<typeof objectSchema>;

const fileSchema = z.strictObject({
  meta: z.strictObject({
    hide: z.array(z.string()),
  }),
});

const splashSchema = z.strictObject({
  text: z.string(),
  textClass: z.string(),
  image: z.string(),
  enabled: z.boolean(),
  launcher: z.string(),
});

const homeSchema = z.strictObject({
  enabled: z.boolean().default(true),
  hero: z.strictObject({
    title: z.string(),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
    backgroundClass: z.string().optional(),
  }),
  search: z
    .strictObject({
      enabled: z.boolean().default(true),
      placeholder: z.string().optional(),
    })
    .optional(),
  content: z.string().optional(),
});

const mapSchema = z.strictObject({
  boundingBox: z.strictObject({
    topRight: z.strictObject({ lat: z.number(), lng: z.number() }),
    bottomLeft: z.strictObject({ lat: z.number(), lng: z.number() }),
  }),
  precision: z.number(),
  center: z.strictObject({ lat: z.number(), lng: z.number() }),
  zoom: z.number(),
});

const citeData = z.strictObject({
  help: z.strictObject({
    text: z.string(),
  }),
});

const uiSchema = z.strictObject({
  urlPrefix: z.string().startsWith('/').optional().default(''),
  management: z
    .strictObject({
      editUrl: z.string().optional(),
    })
    .optional()
    .default({}),
  title: z.string(),
  shortTitle: z.string().optional(),
  splash: splashSchema.optional(),
  home: homeSchema.optional(),
  logoFilename: z.string().startsWith('/').optional(),
  showEllipsis: z.boolean().optional(),
  navHeight: z.string().optional(),
  help: helpSchema,
  subHelpLinks: z.array(subHelpLinkSchema).optional(),
  citeData: citeData,
  takedown: z.url(),
  terms: termsAndPrivacySchema.optional(),
  privacy: termsAndPrivacySchema.optional(),
  footer: footerSchema,
  login: z.strictObject({
    enabled: z.boolean(),
    manageTermsAndConditions: z.boolean(),
  }),
  topNavItems: z.array(topNavItemSchema).optional(),
  topNavHome: z.string().optional(),
  search: searchSchema,
  main: z.strictObject({
    byteFields: z.array(z.string()).optional(),
    durationFields: z.array(z.string()).optional(),
    expand: z.array(z.string()),
    paginatedMeta: z.array(z.string()).optional().default([]),
  }),
  textReplacements: z.record(z.string(), z.string()).optional().default({}),
  head: z.strictObject({
    title: z.string(),
    meta: z.array(z.strictObject({ name: z.string(), content: z.string() })),
  }),
  collection: collectionSchema,
  object: objectSchema,
  file: fileSchema,
  aggregations: z.array(
    z.strictObject({
      display: z.string(),
      name: z.string(),
      help: z.string().optional(),
      type: z.enum(['standard', 'date_histogram']).optional().default('standard'),
    }),
  ),
  searchFields: z.record(z.string(), z.string()),
  analytics: z
    .strictObject({
      gaMeasurementId: z.string(),
    })
    .optional(),
  sentry: z
    .strictObject({
      dsn: z.url(),
      environment: z.string().optional(),
      tracesSampleRate: z.number().min(0).max(1).optional(),
      replaysSessionSampleRate: z.number().min(0).max(1).optional(),
      replaysOnErrorSampleRate: z.number().min(0).max(1).optional(),
    })
    .optional(),
  mapConfig: mapSchema,
  features: z
    .strictObject({
      hasZipDownload: z.boolean().optional(),
    })
    .optional(),
  i18n: z
    .strictObject({
      availableLocales: z.array(z.enum(['en', 'de', 'fr', 'es'])).default(['en']),
      defaultLocale: z.enum(['en', 'de', 'fr', 'es']).default('en'),
    })
    .optional()
    .default({ availableLocales: ['en'], defaultLocale: 'en' }),
});

const apiSchema = z.strictObject({
  rocrate: z.strictObject({
    endpoint: z.url(),
    path: z.string().optional().default(''),
    clientId: z.string().optional(),
    usesRedirects: z.boolean().optional(),
  }),
});

const configurationSchema = z.strictObject({
  ui: uiSchema,
  api: apiSchema,
});

const loadConfig = async () => {
  try {
    const response = await fetch(import.meta.env.VITE_ONI_CONFIG_PATH || '/configuration.json');

    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }

    const data = (await response.json()) as unknown;

    return data;
  } catch (error) {
    console.error('Config loading error:', error);
    throw error;
  }
};

const configurationJSON = await loadConfig();
const configuration = configurationSchema.parse(configurationJSON);
export const ui = configuration.ui;
export const api = configuration.api;
