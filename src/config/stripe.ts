export const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    quota: 10, // PDFs per month
    pagesPerPdf: 10,
    fileSizeLimit: 4 * 1024 * 1024, // 4MB in bytes
    tokensPerMonth: 100000, // 100k tokens per month
    price: {
      amount: 0,
      priceIds: {
        test: '',
        production: '',
      },
    },
  },
  {
    name: 'Pro',
    slug: 'pro',
    quota: 50, // PDFs per month
    pagesPerPdf: 25,
    fileSizeLimit: 16 * 1024 * 1024, // 16MB in bytes
    tokensPerMonth: 1000000, // 1M tokens per month
    price: {
      amount: 14,
      priceIds: {
        test: 'price_1NuEwTA19umTXGu8MeS3hN8L',
        production: '',
      },
    },
  },
]
