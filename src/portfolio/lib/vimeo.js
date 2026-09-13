const cache = new Map();

export function fetchVimeoOembed(vimeoUrl) {
  if (cache.has(vimeoUrl)) {
    return cache.get(vimeoUrl);
  }

  const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}`;

  const promise = fetch(oembedUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`Vimeo oEmbed request failed with status ${response.status}`);
    }
    return response.json();
  });

  cache.set(vimeoUrl, promise);

  promise.catch(() => {
    cache.delete(vimeoUrl);
  });

  return promise;
}
