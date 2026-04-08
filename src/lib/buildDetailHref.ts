/**
 * Build a `?from=<current-url>` query suffix for navigation to the detail page.
 *
 * Use as: `navigate(buildDetailHref(uid, location))`. The detail page's
 * `<BackLink>` will read the from param and navigate back to the saved URL,
 * preserving filters and pagination of the source listing.
 */
export function buildDetailHref(
  uid: string,
  location: { pathname: string; search: string },
  basePath = "/contas",
): string {
  const fromUrl = `${location.pathname}${location.search}`;
  const encoded = encodeURIComponent(fromUrl);
  return `${basePath}/${uid}?from=${encoded}`;
}
