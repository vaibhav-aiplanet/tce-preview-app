import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Route } from "./+types/home";
import {
  Outlet,
  useNavigate,
  useLocation,
  useMatches,
  useSearchParams,
} from "react-router";
import { Button, Select, Label, ListBox, Spinner } from "@heroui/react";
import { ensureAuthenticated } from "~/lib/auth";
import { useBatchAssetData } from "~/lib/tce-queries";
import AssetGrid from "~/components/AssetGrid";
import AssetGridSkeleton from "~/components/AssetGridSkeleton";
import NavBar from "~/components/NavBar";

const PAGE_SIZE = 18;

type Manifest = Record<string, { name: string; path: string }[]>;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TCE Assets Preview" },
    { name: "description", content: "Preview TCE Assets" },
  ];
}

export async function clientLoader() {
  const userInfo = await ensureAuthenticated();
  return userInfo;
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [batchAssetIds, setBatchAssetIds] = useState<string[]>([]);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [page, setPage] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const selectedGrade = searchParams.get("grade") ?? "";
  const selectedFile = searchParams.get("book") ?? "";

  useEffect(() => {
    fetch("/azvasa/manifest.json")
      .then((r) => r.json())
      .then((data: Manifest) => setManifest(data))
      .catch(() => setManifest(null))
      .finally(() => setLoadingFilters(false));
  }, []);

  const gradesFromManifest = manifest
    ? Object.keys(manifest).sort((a, b) => Number(a) - Number(b))
    : [];

  const filesForGrade =
    selectedGrade && manifest ? (manifest[selectedGrade] ?? []) : [];

  const loadAssetIds = useCallback(async (filePath: string) => {
    setFileLoading(true);
    try {
      const resp = await fetch(filePath);
      const ids: string[] = await resp.json();
      setBatchAssetIds(ids);
    } catch {
      setBatchAssetIds([]);
    } finally {
      setFileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFile) {
      loadAssetIds(selectedFile);
    }
  }, [selectedFile, loadAssetIds]);

  const handleGradeChange = (grade: string) => {
    if (grade) {
      setSearchParams({ grade, book: "" });
    } else {
      setSearchParams({});
    }
  };

  const handleBookChange = (book: string) => {
    if (book) {
      setSearchParams({ grade: selectedGrade, book });
    } else {
      setSearchParams({ grade: selectedGrade });
    }
  };

  const totalPages = Math.ceil(batchAssetIds.length / PAGE_SIZE);
  const pageIds = useMemo(
    () => batchAssetIds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [batchAssetIds, page],
  );

  // Reset page when asset IDs change (new book selected)
  useEffect(() => {
    setPage(0);
  }, [batchAssetIds]);

  const {
    data: batchData,
    isLoading: isBatchLoading,
    error: batchError,
  } = useBatchAssetData(pageIds);

  const fromGrid = location.state?.fromGrid === true;
  const matches = useMatches();
  const isAssetRoute = matches.some((m) => "assetId" in m.params);

  const showLayoutContent = !isAssetRoute || (fromGrid && !!batchData);

  const onAssetSelect = (asset: TCEAsset) =>
    navigate(`/${asset.assetId}?${searchParams.toString()}`, {
      state: { fromGrid: true },
    });

  const showIdleState =
    !batchData && !isBatchLoading && batchAssetIds.length === 0;

  const goToPage = (p: number) => {
    setPage(p);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!showLayoutContent) {
    return <Outlet context={{ batchData }} />;
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
            Loading filters...
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
                        {f.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              {fileLoading && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Spinner size="sm" />
                  Loading...
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
            Loading assets...
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

      <Outlet context={{ batchData }} />
    </div>
  );
}
