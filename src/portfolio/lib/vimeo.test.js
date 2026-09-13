import { fetchVimeoOembed } from './vimeo';

const OK_RESPONSE = {
  thumbnail_url: 'https://i.vimeocdn.com/video/thumb.jpg',
  html: '<iframe src="https://player.vimeo.com/video/123"></iframe>',
};

function mockFetchOnce(ok, body) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    json: () => Promise.resolve(body),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('requests the Vimeo oEmbed endpoint with the encoded video URL', async () => {
  mockFetchOnce(true, OK_RESPONSE);

  await fetchVimeoOembed('https://vimeo.com/123456789');

  expect(global.fetch).toHaveBeenCalledWith(
    'https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F123456789'
  );
});

test('resolves with the parsed oEmbed JSON on success', async () => {
  mockFetchOnce(true, OK_RESPONSE);

  const result = await fetchVimeoOembed('https://vimeo.com/123456789');

  expect(result).toEqual(OK_RESPONSE);
});

test('caches results so a second call for the same URL does not refetch', async () => {
  mockFetchOnce(true, OK_RESPONSE);

  await fetchVimeoOembed('https://vimeo.com/555555555');
  await fetchVimeoOembed('https://vimeo.com/555555555');

  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('does not cache a failed request, so a later call retries', async () => {
  mockFetchOnce(false, {});

  await expect(fetchVimeoOembed('https://vimeo.com/999')).rejects.toThrow();

  mockFetchOnce(true, OK_RESPONSE);
  const result = await fetchVimeoOembed('https://vimeo.com/999');

  expect(result).toEqual(OK_RESPONSE);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
