import { z } from 'zod';

import configurationJSON from './configuration.json';

const helpSchema = z.object({
  aboutText: z.string(),
  helpUrl: z.string().url(),
  citationText: z.string(),
});

const subHelpLinkSchema = z.object({
  name: z.string(),
  href: z.string().url(),
  target: z.string(),
});

const googleFormSchema = z.object({
  takedown: z.string().url(),
});

// const binderhubRegistrySchema = z.object({
//   registryJson: z.string().url(),
// });

const termsAndPrivacySchema = z.object({
  text: z.string(),
  href: z.string(),
  title: z.string(),
});

// const emailSchema = z.object({
//   help: z.string().email(),
// });

const footerSchema = z.object({
  copyright: z.string(),
  link: z.object({
    href: z.string().url(),
    text: z.string(),
  }),
});

const loginProviderSchema = z.object({
  name: z.string(),
  url: z.string(),
  clientId: z.string(),
  text: z.string(),
  disabled: z.boolean().optional(),
  buttonStyle: z.string().optional(),
});

const topNavItemSchema = z.object({
  route: z.string(),
  display: z.string(),
});

const valueLabelSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const fieldLabelSchema = z.object({
  field: z.string(),
  label: z.string(),
});

const searchSchema = z
  .object({
    sorting: z.array(valueLabelSchema),
    searchSorting: valueLabelSchema,
    ordering: z.array(valueLabelSchema),
    searchDetails: z.array(fieldLabelSchema),
  })
  .optional();

// const mainFieldSchema = z.object({
//   display: z.string(),
//   name: z.string(),
// });

const collectionSchema = z.object({
  name: z.object({
    display: z.string(),
    name: z.string(),
  }),
  top: z.array(
    z.object({
      display: z.string(),
      name: z.string(),
    }),
  ),
  meta: z.object({
    hide: z.array(z.string()),
  }),
  // relationships: z.array(
  //   z.object({
  //     name: z.string(),
  //     display: z.string(),
  //     type: z.string(),
  //   }),
  // ),
});

const objectSchema = z.object({
  name: z.object({
    display: z.string(),
    name: z.string(),
  }),
  top: z.array(
    z.object({
      display: z.string(),
      name: z.string(),
    }),
  ),
  meta: z.object({
    hide: z.array(z.string()),
  }),
});

const fileSchema = z.object({
  meta: z.object({
    hide: z.array(z.string()),
  }),
});

// const notebookSchema = z.object({
//   name: z.object({
//     display: z.string(),
//     name: z.string(),
//   }),
//   top: z.array(
//     z.object({
//       display: z.string(),
//       name: z.string(),
//     }),
//   ),
//   meta: z.object({
//     hide: z.array(z.string()),
//     displayHasMember: z.boolean(),
//     displayHasPart: z.boolean(),
//   }),
// });

const splashSchema = z.object({
  text: z.string(),
  textClass: z.string(),
  image: z.string(),
  enabled: z.boolean(),
  launcher: z.string(),
});

const mapSchema = z.object({
  boundingBox: z.object({
    topRight: z.object({ lat: z.number(), lng: z.number() }),
    bottomLeft: z.object({ lat: z.number(), lng: z.number() }),
  }),
  precision: z.number(),
  center: z.object({ lat: z.number(), lng: z.number() }),
  zoom: z.number(),
});

const uiSchema = z.object({
  title: z.string(),
  shortTitle: z.string().optional(),
  splash: splashSchema,
  showLogo: z.boolean().optional(),
  showEllipsis: z.boolean().optional(),
  navHeight: z.string().optional(),
  help: helpSchema,
  subHelpLinks: z.array(subHelpLinkSchema).optional(),
  googleForm: googleFormSchema,
  // binderhubRegistry: binderhubRegistrySchema,
  terms: termsAndPrivacySchema,
  privacy: termsAndPrivacySchema.optional(),
  // email: emailSchema,
  footer: footerSchema,
  login: z.object({
    enabled: z.boolean(),
  }),
  authorizationProvider: z.object({
    label: z.string(),
    url: z.string().url(),
  }),
  // loginProviders: z.array(loginProviderSchema),
  enrollment: z.object({
    enforced: z.boolean(),
    URL: z.string().url(),
  }),
  topNavItems: z.array(topNavItemSchema).optional(),
  topNavHome: z.string().optional(),
  search: searchSchema,
  main: z.object({
    //   fields: z.array(mainFieldSchema),
    //   byteFields: z.array(z.string()),
    expand: z.array(z.string()),
  }),
  collection: collectionSchema,
  object: objectSchema,
  file: fileSchema,
  // notebook: notebookSchema,
  // baseVocab: z.string().url(),
  conformsTo: z.object({
    collection: z.string().url(),
    object: z.string().url(),
    notebook: z.string().url(),
  }),
  licenses: z.array(
    z.object({
      license: z.string(),
      group: z.string(),
      access: z.string(),
      enrollment: z
        .object({
          url: z.string().url().optional(),
          label: z.string().optional(),
          class: z.string().optional(),
        })
        .optional(),
    }),
  ),
  aggregations: z.array(
    z.object({
      display: z.string(),
      order: z.number(),
      name: z.string(),
      active: z.boolean().optional(),
      help: z.string().optional(),
      hide: z.boolean().optional(),
      icons: z.boolean().optional(),
    }),
  ),
  searchFields: z.record(
    z.object({
      label: z.string(),
      checked: z.boolean(),
    }),
  ),
  analytics: z
    .object({
      gaMeasurementId: z.string(),
    })
    .optional(),
  mapConfig: mapSchema,
});

const apiSchema = z.object({
  rocrate: z.object({
    endpoint: z.string().url(),
    path: z.string(),
    clientId: z.string().optional(),
    callbackPrefix: z.string().optional(),
    usesRedirects: z.boolean().optional(),
  }),
});

// type ConfigurationSchema = z.infer<typeof configurationSchema>;

const configurationSchema = z.object({
  ui: uiSchema,
  api: apiSchema,
});

export const configuration = configurationSchema.parse(configurationJSON);
export const ui = configuration.ui;
