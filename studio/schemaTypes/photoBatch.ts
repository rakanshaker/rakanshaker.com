import { defineArrayMember, defineField, defineType } from 'sanity';

export const photoBatch = defineType({
  name: 'photoBatch',
  title: 'Photo upload (multiple)',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Batch name',
      type: 'string',
      description: 'Optional (e.g. "Tokyo 2024"). Only for your reference in Studio.',
    }),
    defineField({
      name: 'batchOrder',
      title: 'Batch display order',
      type: 'number',
      description:
        'Optional. Lower numbers sort this whole batch earlier on the site.',
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      description:
        'Drag multiple image files here at once, or use Upload to select many.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              description: 'Required for accessibility.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
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
            }),
          ],
        }),
      ],
      options: {
        layout: 'grid',
      },
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { label: 'label', photos: 'photos' },
    prepare({ label, photos }) {
      const count = photos?.length ?? 0;
      return {
        title: label || 'Photo batch',
        subtitle: `${count} photo${count === 1 ? '' : 's'}`,
        media: photos?.[0],
      };
    },
  },
});
