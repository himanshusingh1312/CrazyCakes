export async function GET() {
  const robots = `
User-agent: *
Allow: /

Disallow: /profile
Disallow: /login
Disallow: /cart
Disallow: /checkout
Disallow: /api

Sitemap: https://crazycakes.online/sitemap.xml
  `.trim();

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
