import express from 'express';

const app = express();

app.get('/ldaca/entities', async (req, res) => {
  const queryString = URL.parse(`http://dummy${req.url}`)?.search || '';
  const response = await fetch(`https://data.ldaca.edu.au/api/objects${queryString}`, { redirect: 'follow' });
  if (!response.ok) {
    const body = response.text();
    res.status(response.status).send(body);

    return;
  }

  // @ts-expect-error Ignore type errors
  const { total, data } = await response.json();

  // @ts-expect-error Ignore type errors
  const entities = data.map(({ crateId, locked, objectRoot, record, url, ...rest }) => ({
    id: crateId,
    ...rest,
  }));
  const result = {
    total,
    entities,
  };

  res.json(result);
});

app.get('/ldaca/entity/:id', async (req, res) => {
  const queryString = (URL.parse(`http://dummy${req.url}`)?.search || '').replace(/^\?/, '&');
  const url = `https://data.ldaca.edu.au/api/object/meta?id=${encodeURIComponent(req.params.id)}${queryString}`;
  const response = await fetch(url);

  const body = await response.text();
  res.status(response.status).send(body);
});

app.post('/api/search/index/items', async (req, res) => {
  const url = 'https://data.ldaca.edu.au/api/search/index/items';

  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', async () => {
    const response = await fetch(url, {
      method: 'POST',
      // @ts-expect-error Ignore type errors
      headers: req.headers,
      body: data,
    });

    const body = await response.text();
    res.status(response.status).send(body);
  });
});

export const ldacaProxy = app;
