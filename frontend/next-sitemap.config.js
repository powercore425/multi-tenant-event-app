/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://multi-tenant-event-app-frontend.vercel.app/',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [],
      },
    ],
  },
  // Transform function to set appropriate priorities and changefreq for all routes
  transform: async (config, path) => {
    // Set priorities based on route type
    let priority = 0.7
    let changefreq = 'weekly'
    
    // Homepage gets highest priority
    if (path === '/') {
      priority = 1.0
      changefreq = 'daily'
    }
    // Public pages (login, register) get high priority
    else if (['/login', '/register', '/tenant/signup', '/tenant/login'].includes(path)) {
      priority = 0.8
      changefreq = 'monthly'
    }
    // Event pages get high priority
    else if (path.startsWith('/events')) {
      priority = 0.9
      changefreq = 'daily'
    }
    // Dashboard pages get medium priority
    else if (path.includes('dashboard') || path === '/tenant' || path === '/super-admin') {
      priority = 0.7
      changefreq = 'weekly'
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    }
  },
}
