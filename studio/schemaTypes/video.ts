import { defineField, defineType } from 'sanity';

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo URL',
      type: 'string',
      description: 'Paste the full Vimeo link, e.g. https://vimeo.com/123456789 (works for unlisted links too).',
      validation: (rule) =>
        rule
          .required()
          .regex(/^https:\/\/(www\.)?vimeo\.com\//, {
            name: 'vimeo URL',
            invert: false,
          })
          .error('Must be a vimeo.com URL.'),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers appear first. Leave empty to sort by date added.',
    }),
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [
        { field: 'order', direction: 'asc' },
        { field: '_createdAt', direction: 'desc' },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'vimeoUrl',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Untitled video',
        subtitle,
      };
    },
  },
});
