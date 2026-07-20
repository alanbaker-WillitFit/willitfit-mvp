# RC2.46 Data Reliability

- Deduplicated concurrent Google OAuth token requests.
- Added token response validation.
- Ignored empty Sheet rows and reported duplicate headers.
- Added duplicate ID/slug rejection for published tips.
- Deduplicated airline-specific and generic tip results.
- Normalised and validated SEO page slugs and required fields.
- Added request-level caching for SEO pages.
- Required HTTPS affiliate destinations and validated required affiliate fields.
- Rejected duplicate affiliate IDs and cached affiliate data.
- Restricted sitemap review dates to ISO `YYYY-MM-DD`.
