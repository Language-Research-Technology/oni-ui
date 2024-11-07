<template>
  <div id="swagger-ui"></div>
</template>
<script>
import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

export default {
  mounted() {
    const ui = SwaggerUI({
      url: '/api/swagger.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUI.presets.apis, SwaggerUI.SwaggerUIStandalonePreset],
      syntaxHighlight: {
        activated: false, //Disabled because it crashed on large response payloads
        theme: 'agate',
      },
    });
    ui.initOAuth({
      appName: 'Swagger UI Oni',
      // See https://demo.identityserver.io/ for configuration details.
      clientId: 'implicit',
    });
  },
};
</script>
