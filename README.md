# Oni UI

## Development

Current guide applies to Mac and Linux:

1. Copy `configuration.sample.json` to `configuration.json` and modify as you wish
1. Create vocabs by running `pnpm run setup:vocabs vocab.json`
1. Start an API endpoint
   1. `docker compose up` (NOTE: This does not exist yet, waiting on `arocapi` release)
   1. Wait for API to be ready
1. Develop Portal:
   1. `cd src`
   1. `pnpm i`
   1. `pnpm run dev`
1. Open a browser to <http://localhost:5173>

## Configuration

The Oni UI is configured via `src/configuration.json`.
The configuration schema is defined and validated using Zod v4 in
`src/configuration.ts`.

### Configuration Structure

The configuration file has two main sections:

- **`ui`**: User interface settings, branding, navigation, search, metadata
      display, and features
- **`api`**: API endpoint configuration for the RO-Crate API.

### UI Configuration

#### Branding and Identity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.title` | string | Yes | Full title of the portal displayed in headers and page titles |
| `ui.shortTitle` | string | No | Abbreviated title for compact displays |
| `ui.logoFilename` | string | No | Filename of the logo image in the public assets directory |
| `ui.showEllipsis` | boolean | No | Whether to show ellipsis for truncated text |
| `ui.navHeight` | string | No | CSS height value for the navigation bar (e.g., "80px") |

**Example:**

```json
{
  "ui": {
    "title": "Oni Discovery Portal",
    "shortTitle": "Oni",
    "logoFilename": "logo.jpg",
    "navHeight": "80px",
    "showEllipsis": true
  }
}
```

#### Splash Screen

The splash screen appears when users first visit the portal.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.splash.text` | string | Yes | Main text content for the splash screen |
| `ui.splash.textClass` | string | Yes | CSS classes for styling the splash text |
| `ui.splash.image` | string | Yes | Background image filename for the splash screen |
| `ui.splash.enabled` | boolean | Yes | Whether to display the splash screen |
| `ui.splash.launcher` | string | Yes | Text for the button that launches/dismisses the splash |

**Example:**

```json
{
  "ui": {
    "splash": {
      "text": "Welcome to our portal...",
      "textClass": "text-5xl text-[#F4EDE4] pb-10",
      "image": "splash-background-1.png",
      "enabled": true,
      "launcher": "Acknowledgement of Country"
    }
  }
}
```

#### Navigation

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.topNavItems` | array | No | Navigation menu items for the top navigation bar |
| `ui.topNavItems[].route` | string | Yes | Route path or query string for the navigation item |
| `ui.topNavItems[].display` | string | Yes | Display text for the navigation item |
| `ui.topNavHome` | string | No | Custom home route override |

**Example:**

```json
{
  "ui": {
    "topNavItems": [
      {
        "route": "search",
        "display": "Search"
      },
      {
        "route": "list?entityType=https%3A%2F%2Fw3id.org%2Fldac%2Fprofile%23Collection",
        "display": "Collections"
      }
    ]
  }
}
```

##### Available Routes

The following routes are available for use in navigation items:

| Route | Description | Query Parameters |
|-------|-------------|------------------|
| `search` | Search results displayed in list format with filtering, sorting, and pagination | Standard search parameters |
| `map` | Geographic search results displayed on an interactive map with geohash grid visualisation | Standard search parameters |
| `list` | Browse all entities with sorting and pagination | `entityType` (optional) - Filter by RO-Crate profile URL |
| `collection` | Display detailed information about a collection entity | `id` (required) - Collection identifier |
| `object` | Display detailed information about an object entity | `id` (required) - Object identifier |
| `file` | Display detailed information about a file | `id` (required) - File identifier<br/>`parentId` (required) - Parent object identifier |
| `about` | Display application information and citation text | None |
| `terms` | Display terms and conditions | None |
| `privacy` | Display privacy policy | None |

**Common Navigation Patterns:**

1. **Search Page:**

   ```json
   { "route": "search", "display": "Search" }
   ```

2. **Browse Collections Only:**

   ```json
   {
     "route": "list?entityType=https%3A%2F%2Fw3id.org%2Fldac%2Fprofile%23Collection",
     "display": "Collections"
   }
   ```

3. **Browse Objects Only:**

   ```json
   {
     "route": "list?entityType=https%3A%2F%2Fw3id.org%2Fldac%2Fprofile%23Object",
     "display": "Items"
   }
   ```

4. **Browse Both Collections and Objects:**

   ```json
   {
     "route": "list?entityType=https%3A%2F%2Fw3id.org%2Fldac%2Fprofile%23Object,https%3A%2F%2Fw3id.org%2Fldac%2Fprofile%23Collection",
     "display": "Browse All"
   }
   ```

5. **Map View:**

   ```json
   { "route": "map", "display": "Map" }
   ```

6. **About Page:**

   ```json
   { "route": "about", "display": "About" }
   ```

**Note:** The `entityType` parameter values should be URL-encoded.

#### Help and Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.help.aboutText` | string | Yes | About text displayed in the help section (supports markdown) |
| `ui.help.citationText` | string | Yes | Citation text for the portal |
| `ui.subHelpLinks` | array | No | Additional help links displayed in the help section |
| `ui.subHelpLinks[].name` | string | Yes | Display name for the help link |
| `ui.subHelpLinks[].href` | URL | Yes | URL for the help link |
| `ui.subHelpLinks[].target` | string | Yes | Link target (e.g., "_blank" for new tab) |

**Example:**

```json
{
  "ui": {
    "help": {
      "aboutText": "This portal provides access to language data...",
      "citationText": "CITE AS: Oni Platform..."
    },
    "subHelpLinks": [
      {
        "name": "User Guide",
        "href": "https://docs.example.com/guide",
        "target": "_blank"
      }
    ]
  }
}
```

#### Terms, Privacy, and Footer

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.terms.text` | string | Yes | Link text for terms of service |
| `ui.terms.href` | string | Yes | URL or path to terms of service |
| `ui.terms.title` | string | Yes | Title attribute for terms link |
| `ui.privacy` | object | No | Privacy notice configuration (same structure as terms) |
| `ui.footer.copyright` | string | Yes | Copyright text for the footer |
| `ui.footer.link.href` | URL | Yes | URL for the footer link |
| `ui.footer.link.text` | string | Yes | Display text for the footer link |

**Example:**

```json
{
  "ui": {
    "terms": {
      "text": "Terms of Service",
      "href": "/terms",
      "title": "Terms of Service"
    },
    "privacy": {
      "text": "Privacy Notice",
      "href": "/privacy",
      "title": "Privacy Notice"
    },
    "footer": {
      "copyright": "Example Organisation",
      "link": {
        "href": "https://example.com",
        "text": "Oni"
      }
    }
  }
}
```

#### Search Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.search.sorting` | array | Yes | Available sorting options |
| `ui.search.sorting[].value` | string | Yes | Internal value for the sorting option |
| `ui.search.sorting[].label` | string | Yes | Display label for the sorting option |
| `ui.search.default.sorting` | string | Yes | Default sorting value (must match one of the sorting values) |
| `ui.search.default.ordering` | "asc" \| "desc" | Yes | Default sort order |
| `ui.search.searchDetails` | array | Yes | Fields to display in advanced search dropdown |
| `ui.search.searchDetails[].field` | string | Yes | Field name from the data |
| `ui.search.searchDetails[].label` | string | Yes | Display label for the field |
| `ui.searchFields` | object | Yes | Mapping of searchable fields to display names |

**Example:**

```json
{
  "ui": {
    "search": {
      "sorting": [
        { "value": "relevance", "label": "Relevance" },
        { "value": "name", "label": "Title" },
        { "value": "created_at", "label": "Created" }
      ],
      "default": {
        "sorting": "relevance",
        "ordering": "desc"
      },
      "searchDetails": [
        { "field": "Language", "label": "Language" }
      ]
    },
    "searchFields": {
      "name": "Name",
      "description": "Description",
      "inLanguage": "Language",
      "text": "Text"
    }
  }
}
```

#### Main Data Display

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.main.byteFields` | array | No | Fields that contain byte values (will be formatted as file sizes) |
| `ui.main.durationFields` | array | No | Fields that contain duration values (will be formatted as time) |
| `ui.main.expand` | array | Yes | Fields to automatically expand in the UI |
| `ui.main.paginatedMeta` | array | No | Fields to paginate in metadata display (default: []) |

**Example:**

```json
{
  "ui": {
    "main": {
      "byteFields": ["size", "contentSize"],
      "durationFields": ["duration"],
      "expand": ["speaker", "author", "citation"],
      "paginatedMeta": ["inLanguage", "ldac:subjectLanguage"]
    }
  }
}
```

#### Text Replacements

Text replacements allow you to customise how field names are displayed throughout the interface using regular expressions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.textReplacements` | object | No | Regular expression patterns mapped to replacement strings (default: {}) |

**Example:**

```json
{
  "ui": {
    "textReplacements": {
      "^_": "",
      "^ldac:doi$": "DOI",
      "^ldac:isDeIdentified$": "Is De-Identified",
      "^citation$": "Related Works",
      "^ldac:": "",
      "^url$": "URL",
      "^@type$": "Type"
    }
  }
}
```

**Note:** The patterns are applied using `startCase` while preserving specific text replacements. For example, `_memberOf` with pattern `^_: ""` becomes `Member Of`.

#### Metadata Display Configuration

The metadata display for collections, objects, and files can be configured in two modes: `filter` or `explicit`.

##### Filter Mode

In filter mode, you specify which fields to display at the top and which to hide from the rest.

```json
{
  "ui": {
    "collection": {
      "meta": {
        "mode": "filter",
        "top": [
          { "display": "Name", "name": "name" },
          { "display": "Description", "name": "description" }
        ],
        "hide": ["@type", "id", "license"]
      }
    }
  }
}
```

##### Explicit Mode

In explicit mode, you explicitly list all fields to show.

```json
{
  "ui": {
    "object": {
      "meta": {
        "mode": "explicit",
        "show": ["name", "description", "creator", "datePublished"]
      }
    }
  }
}
```

##### File Metadata

File metadata only supports hiding specific fields.

```json
{
  "ui": {
    "file": {
      "meta": {
        "hide": ["@type", "id", "_access"]
      }
    }
  }
}
```

#### HTML Head Metadata

Configure Dublin Core metadata tags for SEO and discovery.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.head.title` | string | Yes | Field name to use for page title |
| `ui.head.meta` | array | Yes | Dublin Core metadata mappings |
| `ui.head.meta[].name` | string | Yes | Dublin Core metadata name (e.g., "DC.title") |
| `ui.head.meta[].content` | string | Yes | Field name from data to use as content |

**Example:**

```json
{
  "ui": {
    "head": {
      "title": "DC.publisher",
      "meta": [
        { "name": "DC.title", "content": "name" },
        { "name": "DC.description", "content": "description" },
        { "name": "DC.creator", "content": "creator" }
      ]
    }
  }
}
```

#### Aggregations (Faceted Search)

Configure which fields can be used for faceted filtering in search results.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.aggregations[].display` | string | Yes | Display name for the facet |
| `ui.aggregations[].name` | string | Yes | Field name to aggregate on |
| `ui.aggregations[].help` | string | No | Help text for the facet |

**Example:**

```json
{
  "ui": {
    "aggregations": [
      {
        "display": "License",
        "name": "license"
      },
      {
        "display": "Language",
        "name": "inLanguage",
        "active": true,
        "help": "Filter by language of the content"
      }
    ]
  }
}
```

#### Login Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.login.enabled` | boolean | Yes | Whether login functionality is enabled |
| `ui.login.manageTermsAndConditions` | boolean | Yes | Whether to manage terms and conditions acceptance |

**Example:**

```json
{
  "ui": {
    "login": {
      "enabled": true,
      "manageTermsAndConditions": false
    }
  }
}
```

#### Google Forms Integration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.googleForm.takedown` | URL | Yes | URL to Google Form for takedown requests |

**Example:**

```json
{
  "ui": {
    "googleForm": {
      "takedown": "https://docs.google.com/forms/d/e/1FAIpQLSc3wWGY.../viewform?usp=pp_url&entry.812577446="
    }
  }
}
```

#### Citation Help

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.citeData.help.text` | string | Yes | Help text for citing data (supports HTML) |

**Example:**

```json
{
  "ui": {
    "citeData": {
      "help": {
        "text": "See this <a href=\"https://example.com/cite\">help</a> page for citation details."
      }
    }
  }
}
```

#### Map Configuration

Configure the geographical map display for spatial data.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.mapConfig.boundingBox.topRight` | object | Yes | Top-right corner coordinates |
| `ui.mapConfig.boundingBox.topRight.lat` | number | Yes | Latitude |
| `ui.mapConfig.boundingBox.topRight.lng` | number | Yes | Longitude |
| `ui.mapConfig.boundingBox.bottomLeft` | object | Yes | Bottom-left corner coordinates |
| `ui.mapConfig.boundingBox.bottomLeft.lat` | number | Yes | Latitude |
| `ui.mapConfig.boundingBox.bottomLeft.lng` | number | Yes | Longitude |
| `ui.mapConfig.precision` | number | Yes | Geohash precision level |
| `ui.mapConfig.center` | object | Yes | Default map centre coordinates |
| `ui.mapConfig.center.lat` | number | Yes | Centre latitude |
| `ui.mapConfig.center.lng` | number | Yes | Centre longitude |
| `ui.mapConfig.zoom` | number | Yes | Default zoom level |

**Example:**

```json
{
  "ui": {
    "mapConfig": {
      "boundingBox": {
        "topRight": { "lat": -11.523088, "lng": 162.649886 },
        "bottomLeft": { "lat": -42.811522, "lng": 108.64901 }
      },
      "precision": 5,
      "center": { "lat": -25, "lng": 134 },
      "zoom": 8
    }
  }
}
```

#### Analytics (Optional)

Configure Google Analytics tracking.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.analytics.gaMeasurementId` | string | Yes | Google Analytics measurement ID |

**Example:**

```json
{
  "ui": {
    "analytics": {
      "gaMeasurementId": "G-XXXXXXXXXX"
    }
  }
}
```

#### Sentry Error Tracking (Optional)

Configure Sentry for error tracking and monitoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.sentry.dsn` | URL | Yes | Sentry DSN (Data Source Name) |
| `ui.sentry.environment` | string | No | Environment name (e.g., "production", "development") |
| `ui.sentry.tracesSampleRate` | number | No | Traces sample rate (0.0 to 1.0) |
| `ui.sentry.replaysSessionSampleRate` | number | No | Session replay sample rate (0.0 to 1.0) |
| `ui.sentry.replaysOnErrorSampleRate` | number | No | Error replay sample rate (0.0 to 1.0) |

**Example:**

```json
{
  "ui": {
    "sentry": {
      "dsn": "https://examplePublicKey@o0.ingest.sentry.io/0",
      "environment": "production",
      "tracesSampleRate": 0.1,
      "replaysSessionSampleRate": 0.1,
      "replaysOnErrorSampleRate": 1.0
    }
  }
}
```

#### Features (Optional)

Enable or disable specific features.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ui.features.hasZipDownload` | boolean | No | Whether to enable ZIP download functionality |

**Example:**

```json
{
  "ui": {
    "features": {
      "hasZipDownload": true
    }
  }
}
```

### API Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `api.rocrate.endpoint` | URL | Yes | Base URL of the RO-Crate API endpoint |
| `api.rocrate.path` | string | Yes | Path to the API (appended to endpoint) |
| `api.rocrate.clientId` | string | No | OAuth client ID for authentication |
| `api.rocrate.callbackPrefix` | string | No | Prefix for OAuth callback URLs |
| `api.rocrate.usesRedirects` | boolean | No | Whether the API uses redirects |

**Example:**

```json
{
  "api": {
    "rocrate": {
      "endpoint": "https://catalog.example.com",
      "path": "/api/v1/oni",
      "clientId": "your-client-id",
      "callbackPrefix": "https://your-portal.com",
      "usesRedirects": false
    }
  }
}
```

### Validation

The configuration is validated using Zod schemas defined in `src/configuration.ts`. The validation includes:

- **Type checking**: All fields must match their specified types
- **URL validation**: URLs must be valid and properly formatted
- **Required fields**: All required fields must be present
- **Custom validations**:
  - `search.default.sorting` must match one of the values in `search.sorting` array
  - Discriminated unions for `meta.mode` ensure correct field combinations

**Common validation errors:**

1. **Missing required field**: Ensure all required fields are present in your configuration
2. **Invalid URL**: Check that all URL fields contain valid, fully-qualified URLs
3. **Type mismatch**: Verify that boolean fields contain `true`/`false`, numbers contain numeric values, etc.
4. **Default sorting mismatch**: The `search.default.sorting` value must exist in the `search.sorting` array

### Example Complete Configuration

See `configuration.sample.json` for a complete working example of the configuration file.
