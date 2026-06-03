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

const PHOTOS_QUERY = `{
  "singles": *[_type == "photo"] {
    "_id": _id,
    title,
    alt,
    caption,
    image,
    "sortOrder": coalesce(order, 9999),
    "sortDate": _createdAt
  },
  "batches": *[_type == "photoBatch"] {
    "batchOrder": coalesce(batchOrder, 9999),
    "sortDate": _createdAt,
    photos[]{
      "_id": ^._id + "-" + _key,
      "image": select(_type == "image" => @, image),
      "alt": coalesce(alt, image.alt),
      "title": coalesce(title, image.title),
      "caption": coalesce(caption, image.caption),
      "sortOrder": coalesce(order, image.order, ^.batchOrder, 9999),
      "sortDate": ^._createdAt
    }
  }
}`;

function sortPhotos(a, b) {
  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }
  return new Date(b.sortDate) - new Date(a.sortDate);
}

function normalizePhoto({ sortOrder, sortDate, ...photo }) {
  return photo;
}

export async function fetchPhotos() {
  if (!isSanityConfigured) {
    return [];
  }

  const { singles, batches } = await client.fetch(PHOTOS_QUERY);
  const fromBatches = (batches || []).flatMap((batch) => batch.photos || []);
  const merged = [...(singles || []), ...fromBatches].sort(sortPhotos);

  return merged.map(normalizePhoto);
}
