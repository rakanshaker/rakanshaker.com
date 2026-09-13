import { client, isSanityConfigured, fetchVideos } from './sanity';

test('fetchVideos returns [] without calling the client when Sanity is not configured', async () => {
  if (isSanityConfigured) {
    return; // this repo's test env has REACT_APP_SANITY_PROJECT_ID set; skip
  }
  const spy = jest.spyOn(client, 'fetch');
  const result = await fetchVideos();
  expect(result).toEqual([]);
  expect(spy).not.toHaveBeenCalled();
});

test('fetchVideos queries the video document type and returns the client result', async () => {
  const fakeVideos = [
    { _id: 'v1', title: 'Reel', vimeoUrl: 'https://vimeo.com/1', caption: '' },
  ];
  const spy = jest.spyOn(client, 'fetch').mockResolvedValue(fakeVideos);

  const result = await fetchVideos();

  expect(spy).toHaveBeenCalledWith(expect.stringContaining('_type == "video"'));
  expect(result).toEqual(fakeVideos);

  spy.mockRestore();
});
