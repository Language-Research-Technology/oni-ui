import { z } from 'zod/v4';

import configurationJSON from './configuration.json';

const helpSchema = z.strictObject({
  aboutText: z.string(),
  citationText: z.string(),
});

const subHelpLinkSchema = z.strictObject({
  name: z.string(),
  href: z.url(),
  target: z.string(),
});

const googleFormSchema = z.strictObject({
  takedown: z.url(),
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
  title: z.string(),
  shortTitle: z.string().optional(),
  splash: splashSchema,
  logoFilename: z.string().optional(),
  showEllipsis: z.boolean().optional(),
  navHeight: z.string().optional(),
  help: helpSchema,
  subHelpLinks: z.array(subHelpLinkSchema).optional(),
  citeData: citeData,
  googleForm: googleFormSchema,
  terms: termsAndPrivacySchema,
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
  }),
  textReplacements: z.record(z.string(), z.string()),
  head: z.strictObject({
    title: z.string(),
    meta: z.array(z.strictObject({ name: z.string(), content: z.string() })),
  }),
  collection: collectionSchema,
  object: objectSchema,
  file: fileSchema,
  conformsTo: z.strictObject({
    collection: z.url(),
    object: z.url(),
  }),
  aggregations: z.array(
    z.strictObject({
      display: z.string(),
      name: z.string(),
      active: z.boolean().optional(),
      help: z.string().optional(),
    }),
  ),
  searchFields: z.record(
    z.string(),
    z.strictObject({
      label: z.string(),
      checked: z.boolean(),
    }),
  ),
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
});

const apiSchema = z.strictObject({
  rocrate: z.strictObject({
    endpoint: z.url(),
    path: z.string(),
    clientId: z.string().optional(),
    callbackPrefix: z.string().optional(),
    usesRedirects: z.boolean().optional(),
  }),
});

const configurationSchema = z.strictObject({
  ui: uiSchema,
  api: apiSchema,
});

const configuration = configurationSchema.parse(configurationJSON);
export const ui = configuration.ui;
export const api = configuration.api;
