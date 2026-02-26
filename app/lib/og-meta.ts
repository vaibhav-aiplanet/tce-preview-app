interface OgMetaOptions {
  title: string;
  description: string;
  origin: string;
  url?: string;
  image?: string;
  type?: string;
}

export function buildOgMeta(opts: OgMetaOptions) {
  const image = opts.image ?? `${opts.origin}/og-image.png`;
  const url = opts.url ?? opts.origin;
  const type = opts.type ?? "website";

  return [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:type", content: type },
    { property: "og:site_name", content: "TCE Preview" },
    { property: "og:url", content: url },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: image },
    { property: "og:logo", content: `${opts.origin}/og-image.png` },
  ];
}
