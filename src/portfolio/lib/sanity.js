import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const projectId = process.env.REACT_APP_SANITY_PROJECT_ID;
const dataset = process.env.REACT_APP_SANITY_DATASET || 'production';
const isDev = process.env.NODE_ENV === 'development';

export const isSanityConfigured = Boolean(projectId);

export const client = createClient({
  projectId: projectId || 'placeholder',
  dataset,
  apiVersion: '2024-06-01',
  useCdn: !isDev,
  stega: { enabled: false },
  ...(isDev && {
    apiHost: 'http://localhost:3000/sanity-api',
    useProjectHostname: false,
  }),
});

const builder = imageUrlBuilder(client);

export function urlFor(source) {
  return builder.image(source);
}

export const PHOTOS_QUERY = `*[_type == "photo"] | order(coalesce(order, 9999) asc, _createdAt desc) {
  _id,
  title,
  alt,
  caption,
  image
}`;

export async function fetchPhotos() {
  if (!isSanityConfigured) {
    return [];
  }
  return client.fetch(PHOTOS_QUERY);
}
