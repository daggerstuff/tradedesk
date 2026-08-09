import { MetadataRoute } from 'next';

const posts = [
  'invoice-reminders-get-paid-faster',
  'field-service-management-software',
  'compliance-document-tracking',
  'invoice-gets-paid',
  'contractor-expense-tracking',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tradedesk.timewarper.me';
  return [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), priority: 0.8 },
    ...posts.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(),
      priority: 0.6,
    })),
  ];
}
