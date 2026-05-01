import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("_api/subjects", "routes/api.subjects.ts"),
  route("_api/chapters", "routes/api.chapters.ts"),
  route("_api/subtopics", "routes/api.subtopics.ts"),
  route("_api/mapping", "routes/api.mapping.ts"),
  route("_api/mapping/review", "routes/api.mapping.review.ts"),
  route("_api/boards", "routes/api.boards.ts"),
  route("_api/grades", "routes/api.grades.ts"),
  route("_api/og-image", "routes/api.og-image.tsx"),

  route("_api/mapped-assets", "routes/api.mapped-assets.ts"),
  route("_api/mapped-assets/counts", "routes/api.mapped-assets.counts.ts"),

  route("auth/callback", "routes/auth.callback.tsx"),
  route("unauthorized", "routes/unauthorized.tsx"),
  route("mapped-assets", "routes/mapped-assets.tsx"),
  layout("routes/home.tsx", [
    index("routes/home-index.tsx"),
    route(":assetId", "routes/asset.tsx"),
  ]),
] satisfies RouteConfig;
