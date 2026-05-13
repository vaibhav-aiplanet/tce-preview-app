import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Route } from "./+types/home";
import {
  Outlet,
  useNavigate,
  useMatches,
  useSearchParams,
  useLoaderData,
} from "react-router";
import { Button, Select, Label, ListBox, Spinner } from "@heroui/react";
import PlayerDialog from "~/components/PlayerDialog";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { requireAuthedLoader, type AuthedUser } from "~/lib/server-auth";
import { useBatchAssetData } from "~/lib/tce-queries";
import AssetGrid from "~/components/AssetGrid";
import AssetGridSkeleton from "~/components/AssetGridSkeleton";
import NavBar from "~/components/NavBar";
import ReviewerHome from "~/components/ReviewerHome";
import { buildOgMeta } from "~/lib/og-meta";
import { queryClient } from "~/root";
import {
  fetchSubjects,
  fetchSubtopics,
  type CurriculumItem,
} from "~/lib/curriculum-api";

import {
  useSetCurrentGrade,
  useSetCurrentSubject,
  useSetCurrentSubtopic,
} from "~/store";

const PAGE_SIZE = 18;

type Manifest = Record<string, { id?: string; name: string; path: string }[]>;

export async function loader({ request }: Route.LoaderArgs) {
  const { user, setCookieHeaders } = await requireAuthedLoader(request);
  const origin = new URL(request.url).origin;
  return Response.json(
    { origin, user },
    setCookieHeaders ? { headers: setCookieHeaders } : undefined,
  );
}

export function meta({ data }: Route.MetaArgs) {
  const loaderData = data as unknown as { origin: string } | null;
  const origin = loaderData?.origin || "";
  return buildOgMeta({
    title: "TCE Assets Preview",
    description: "Browse and preview TCE educational video assets",
    origin,
  });
}

type HomeLoaderData = { origin: string; user: AuthedUser };

export async function clientLoader({
  serverLoader,
}: {
  serverLoader: () => Promise<HomeLoaderData>;
}): Promise<HomeLoaderData> {
  const serverData = await serverLoader();

  // Prime the reference lists CurriculumFilters selects consume, so
  // PlayerDialog opens with Board/Grade/Subject populated instantly.
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["boards"],
      queryFn: () => fetch("/_api/boards").then((r) => r.json()),
      staleTime: Infinity,
    }),
    queryClient.prefetchQuery({
      queryKey: ["grades"],
      queryFn: () => fetch("/_api/grades").then((r) => r.json()),
      staleTime: Infinity,
    }),
    queryClient.prefetchQuery({
      queryKey: ["subjects-all"],
      queryFn: () => fetchSubjects(),
      staleTime: Infinity,
    }),
  ]);

  return serverData;
}
clientLoader.hydrate = true as const;

function resolveGradeId(
  client: QueryClient,
  gradeNumber: string,
): string | null {
  if (!gradeNumber) return null;
  const grades = client.getQueryData<CurriculumItem[]>(["grades"]);
  if (!grades) return null;
  const target = gradeNumber.toLowerCase().replace(/^grade\s+/, "");
  const match = grades.find(
    (g) => g.name.toLowerCase().replace(/^grade\s+/, "") === target,
  );
  return match?.id ?? null;
}

function resolveSubjectId(
  client: QueryClient,
  subjectName: string,
): string | null {
  if (!subjectName) return null;
  const subjects = client.getQueryData<CurriculumItem[]>(["subjects-all"]);
  if (!subjects) return null;
  const match = subjects.find(
    (s) => s.name.toLowerCase() === subjectName.toLowerCase(),
  );
  return match?.id ?? null;
}

async function resolveSubtopicId(
  client: QueryClient,
  subjectId: string,
  subtopicName: string,
): Promise<string | null> {
  if (!subjectId || !subtopicName) return null;
  const subtopics = await client.fetchQuery({
    queryKey: ["subtopics", subjectId],
    queryFn: () => fetchSubtopics(subjectId),
    staleTime: 5 * 60 * 1000,
  });
  const match = subtopics.find(
    (s) => s.name.toLowerCase() === subtopicName.toLowerCase(),
  );
  return match?.id ?? null;
}

export function HydrateFallback() {
  return null;
}

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof clientLoader>();
  const isReviewer = loaderData?.user?.role === "CONTENT_REVIEWER";
  const [batchAssetIds, setBatchAssetIds] = useState<string[]>([]);
  const [fileLoading, setFileLoading] = useState(false);
  const [page, setPage] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const selectedGrade = searchParams.get("grade") ?? "";
  const selectedFile = searchParams.get("book") ?? "";

  const qc = useQueryClient();
  const setCurrentGrade = useSetCurrentGrade();
  const setCurrentSubject = useSetCurrentSubject();
  const setCurrentSubtopic = useSetCurrentSubtopic();

  const { data: manifest, isLoading: loadingFilters } = useQuery<Manifest>({
    queryKey: ["manifest"],
    queryFn: () =>
      fetch("/_api/content-files").then((r) => {
        if (!r.ok) throw new Error("Failed to load manifest");
        return r.json() as Promise<Manifest>;
      }),
    staleTime: Infinity,
  });

  const gradesFromManifest = manifest
    ? Object.keys(manifest).sort((a, b) => Number(a) - Number(b))
    : [];

  const filesForGrade =
    selectedGrade && manifest ? (manifest[selectedGrade] ?? []) : [];

  const loadAssetIds = useCallback(
    async (filePath: string) => {
      setFileLoading(true);
      try {
        const resp = await fetch(filePath);
        const data = (await resp.json()) as {
          subject_name: string;
          subtopic_name: string;
          assetIds: string[];
        };
        setBatchAssetIds(data.assetIds);

        const subjectId = resolveSubjectId(qc, data.subject_name);
        setCurrentSubject(subjectId);

        const subtopicId = subjectId
          ? await resolveSubtopicId(qc, subjectId, data.subtopic_name)
          : null;
        setCurrentSubtopic(subtopicId);

        setPage(0);
      } catch {
        setBatchAssetIds([]);
        setPage(0);
      } finally {
        setFileLoading(false);
      }
    },
    [qc, setCurrentSubject, setCurrentSubtopic],
  );

  const initialBookRef = useRef(selectedFile);
  useEffect(() => {
    if (initialBookRef.current) {
      loadAssetIds(initialBookRef.current);
    }
    setCurrentGrade(resolveGradeId(qc, selectedGrade));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGradeChange = (grade: string) => {
    if (grade) {
      setSearchParams({ grade, book: "" });
      setCurrentGrade(resolveGradeId(qc, grade));
    } else {
      setSearchParams({});
      setCurrentGrade(null);
    }
  };

  const handleBookChange = (book: string) => {
    if (book) {
      setSearchParams({ grade: selectedGrade, book });
      loadAssetIds(book);
    } else {
      setSearchParams({ grade: selectedGrade });
      setBatchAssetIds([]);
      setPage(0);
    }
  };

  const totalPages = Math.ceil(batchAssetIds.length / PAGE_SIZE);
  const pageIds = useMemo(
    () => batchAssetIds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [batchAssetIds, page],
  );

  const {
    data: batchData,
    isLoading: isBatchLoading,
    error: batchError,
  } = useBatchAssetData(pageIds);

  const matches = useMatches();
  const isAssetRoute = matches.some((m) => "assetId" in m.params);

  const previewId = searchParams.get("preview");
  const previewAsset =
    previewId && batchData
      ? batchData.assets.find((a) => a.assetId === previewId)
      : undefined;

  const onAssetSelect = (asset: TCEAsset) => {
    const routerSp = new URLSearchParams(searchParams);
    routerSp.set("preview", asset.assetId);
    const maskSp = new URLSearchParams(searchParams);
    maskSp.delete("preview");
    const maskQuery = maskSp.toString();
    navigate(`/?${routerSp.toString()}`, {
      mask: `/${asset.assetId}${maskQuery ? `?${maskQuery}` : ""}`,
    });
  };

  const closePreview = () => {
    const sp = new URLSearchParams(searchParams);
    sp.delete("preview");
    setSearchParams(sp);
  };

  const showIdleState =
    !batchData && !isBatchLoading && batchAssetIds.length === 0;

  if (isReviewer) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <NavBar />
        <ReviewerHome />
      </div>
    );
  }

  const goToPage = (p: number) => {
    setPage(p);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isAssetRoute) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <NavBar />

      {/* Header section */}
      <div
        className={`flex flex-col items-start gap-3 px-6 pt-5 pb-4 ${showIdleState ? "flex-1 justify-center" : ""}`}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Preview TCE Assets
        </h1>

        {loadingFilters && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" />
            Loading filters…
          </div>
        )}

        {!loadingFilters && gradesFromManifest.length > 0 && (
          <div className="flex w-full flex-wrap items-end justify-between gap-3 mt-2">
            <div className="flex flex-wrap items-end gap-3">
              <Select
                className="w-[180px]"
                placeholder="Select Grade"
                value={selectedGrade || null}
                onChange={(value) => handleGradeChange(String(value ?? ""))}
              >
                <Label>Grade</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {gradesFromManifest.map((g) => (
                      <ListBox.Item key={g} id={g} textValue={`Grade ${g}`}>
                        Grade {g}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                className="w-[360px] data-[placeholder=true]:truncate"
                placeholder="Select Book"
                isDisabled={!selectedGrade}
                value={selectedGrade ? selectedFile || null : null}
                onChange={(value) => handleBookChange(String(value ?? ""))}
              >
                <Label>Book</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {filesForGrade.map((f) => (
                      <ListBox.Item key={f.path} id={f.path} textValue={f.name}>
                        {f.name.replace(";", " ")}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              {fileLoading && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Spinner size="sm" />
                  Loading…
                </div>
              )}
            </div>

            {totalPages > 1 && batchData && (
              <div className="flex items-center gap-3">
                <Button
                  variant={page === 0 ? "ghost" : "primary"}
                  size="sm"
                  isDisabled={page === 0}
                  onPress={() => goToPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted">
                  Page <span className="font-extrabold">{page + 1}</span> of{" "}
                  {totalPages}
                </span>
                <Button
                  size="sm"
                  variant={page >= totalPages - 1 ? "ghost" : "primary"}
                  isDisabled={page >= totalPages - 1}
                  onPress={() => goToPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {isBatchLoading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" />
            Loading assets…
          </div>
        )}
        {batchError && (
          <p className="text-sm text-danger">{batchError.message}</p>
        )}

        {showIdleState && !loadingFilters && (
          <div className="mt-6 flex flex-col items-center self-center text-center">
            <p className="text-base text-muted">
              Select a grade and book above to browse assets.
            </p>
            <p className="mt-1 text-sm text-muted/60">
              Or navigate to an asset directly by its ID.
            </p>
          </div>
        )}
      </div>

      {/* Content area */}
      <div ref={contentRef} className="flex-1 overflow-auto">
        {isBatchLoading && !batchData && (
          <AssetGridSkeleton count={pageIds.length || 12} />
        )}

        {batchData && batchData.assets.length > 0 && (
          <AssetGrid assets={batchData.assets} onSelect={onAssetSelect} />
        )}
      </div>

      {previewAsset && batchData && (
        <PlayerDialog
          asset={previewAsset}
          accessToken={batchData.accessToken}
          expiryTime={batchData.expiryTime}
          expiresIn={batchData.expiresIn}
          onClose={closePreview}
        />
      )}
    </div>
  );
}
