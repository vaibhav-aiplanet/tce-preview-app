import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input, Select, ListBox, Spinner, Pagination } from "@heroui/react";
import NavBar from "~/components/NavBar";
import PlayerDialog from "~/components/PlayerDialog";
import { useTCEPlayerData } from "~/lib/tce-queries";

const PAGE_SIZE = 20;

interface MappedAsset {
  assetId: string;
  title: string;
  grade: string | null;
  subject: string | null;
  chapter: string | null;
  subtopic: string | null;
  consumer: string | null;
  contentType: string | null;
  createdBy: string | null;
  updatedAt: string | null;
}

function useUniqueValues(assets: MappedAsset[], key: keyof MappedAsset) {
  return useMemo(
    () =>
      [...new Set(assets.map((a) => a[key]).filter(Boolean))]
        .sort() as string[],
    [assets, key],
  );
}

export default function MappedAssetsPage() {
  const { data: assets = [], isLoading, error } = useQuery<MappedAsset[]>({
    queryKey: ["mapped-assets"],
    queryFn: () => fetch("/_api/mapped-assets").then((r) => r.json()),
  });

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [titleFilter, setTitleFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [subtopicFilter, setSubtopicFilter] = useState("");
  const [consumerFilter, setConsumerFilter] = useState("");

  const handleGradeChange = (value: string) => {
    setGradeFilter(value);
    setSubjectFilter("");
    setChapterFilter("");
    setSubtopicFilter("");
    setConsumerFilter("");
    setCurrentPage(1);
  };

  const handleSubjectChange = (value: string) => {
    setSubjectFilter(value);
    setChapterFilter("");
    setSubtopicFilter("");
    setConsumerFilter("");
    setCurrentPage(1);
  };

  const handleChapterChange = (value: string) => {
    setChapterFilter(value);
    setSubtopicFilter("");
    setConsumerFilter("");
    setCurrentPage(1);
  };

  const handleSubtopicChange = (value: string) => {
    setSubtopicFilter(value);
    setConsumerFilter("");
    setCurrentPage(1);
  };

  // Progressive filtering: each level filters based on all filters to its left
  const afterGrade = useMemo(
    () => assets.filter((a) => !gradeFilter || a.grade === gradeFilter),
    [assets, gradeFilter],
  );
  const afterSubject = useMemo(
    () => afterGrade.filter((a) => !subjectFilter || a.subject === subjectFilter),
    [afterGrade, subjectFilter],
  );
  const afterChapter = useMemo(
    () => afterSubject.filter((a) => !chapterFilter || a.chapter === chapterFilter),
    [afterSubject, chapterFilter],
  );
  const afterSubtopic = useMemo(
    () => afterChapter.filter((a) => !subtopicFilter || a.subtopic === subtopicFilter),
    [afterChapter, subtopicFilter],
  );

  // Dropdown options derived from progressively filtered data
  const gradeOptions = useUniqueValues(assets, "grade");
  const subjectOptions = useUniqueValues(afterGrade, "subject");
  const chapterOptions = useUniqueValues(afterSubject, "chapter");
  const subtopicOptions = useUniqueValues(afterChapter, "subtopic");
  const consumerOptions = useUniqueValues(afterSubtopic, "consumer");

  const filteredAssets = useMemo(() => {
    const search = titleFilter.toLowerCase();
    return afterSubtopic.filter((a) => {
      if (search && !a.title.toLowerCase().includes(search)) return false;
      if (consumerFilter && a.consumer !== consumerFilter) return false;
      return true;
    });
  }, [afterSubtopic, titleFilter, consumerFilter]);

  const totalPages = Math.ceil(filteredAssets.length / PAGE_SIZE);
  const paginatedAssets = useMemo(
    () => filteredAssets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredAssets, currentPage],
  );

  const { data: playerData, isLoading: playerLoading } = useTCEPlayerData(
    selectedAssetId || "",
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <NavBar />

      <div className="flex flex-col gap-4 px-6 pt-5 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Mapped Assets
        </h1>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" />
            Loading mapped assets...
          </div>
        )}

        {error && (
          <p className="text-sm text-danger">
            Failed to load mapped assets.
          </p>
        )}

        {assets.length > 0 && (
          <div className="flex flex-wrap items-end gap-3">
            <Input
              className="w-[220px]"
              placeholder="Search by title..."
              value={titleFilter}
              onChange={(e) => { setTitleFilter(e.target.value); setCurrentPage(1); }}
            />

            <Select
              className="w-[160px]"
              placeholder="Grade"
              value={gradeFilter || null}
              onChange={(value) => handleGradeChange(String(value ?? ""))}
            >
              <Select.Trigger>
                <Select.Value className="truncate" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="" textValue="All Grades">
                    All Grades
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {gradeOptions.map((g) => (
                    <ListBox.Item key={g} id={g} textValue={g}>
                      {g}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-[180px]"
              placeholder="Subject"
              value={subjectFilter || null}
              onChange={(value) => handleSubjectChange(String(value ?? ""))}
            >
              <Select.Trigger>
                <Select.Value className="truncate" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="" textValue="All Subjects">
                    All Subjects
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {subjectOptions.map((s) => (
                    <ListBox.Item key={s} id={s} textValue={s}>
                      {s}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-[180px]"
              placeholder="Chapter"
              value={chapterFilter || null}
              onChange={(value) => handleChapterChange(String(value ?? ""))}
            >
              <Select.Trigger>
                <Select.Value className="truncate" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="" textValue="All Chapters">
                    All Chapters
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {chapterOptions.map((c) => (
                    <ListBox.Item key={c} id={c} textValue={c}>
                      {c}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-[180px]"
              placeholder="Subtopic"
              value={subtopicFilter || null}
              onChange={(value) => handleSubtopicChange(String(value ?? ""))}
            >
              <Select.Trigger>
                <Select.Value className="truncate" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="" textValue="All Subtopics">
                    All Subtopics
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {subtopicOptions.map((st) => (
                    <ListBox.Item key={st} id={st} textValue={st}>
                      {st}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-[160px]"
              placeholder="Consumer"
              value={consumerFilter || null}
              onChange={(value) => { setConsumerFilter(String(value ?? "")); setCurrentPage(1); }}
            >
              <Select.Trigger>
                <Select.Value className="truncate" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="" textValue="All Consumers">
                    All Consumers
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {consumerOptions.map((c) => (
                    <ListBox.Item key={c} id={c} textValue={c}>
                      {c}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {!isLoading && assets.length === 0 && (
          <p className="text-sm text-muted">No mapped assets found.</p>
        )}

        {assets.length > 0 && filteredAssets.length === 0 && (
          <p className="text-sm text-muted">No assets match the current filters.</p>
        )}

        {filteredAssets.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Grade</th>
                    <th className="px-4 py-3 text-left font-medium">Subject</th>
                    <th className="px-4 py-3 text-left font-medium">Chapter</th>
                    <th className="px-4 py-3 text-left font-medium">Subtopic</th>
                    <th className="px-4 py-3 text-left font-medium">Consumer</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Mapped By</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map((asset) => (
                    <tr
                      key={asset.assetId}
                      onClick={() => setSelectedAssetId(asset.assetId)}
                      className="cursor-pointer border-b border-border/20 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 text-primary">
                        {asset.title}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {asset.grade || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {asset.subject || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {asset.chapter || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {asset.subtopic || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {asset.consumer || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {asset.contentType || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {asset.createdBy || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredAssets.length)} of {filteredAssets.length}
                </span>
                <Pagination>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous
                        isDisabled={currentPage === 1}
                        onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      />
                    </Pagination.Item>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Pagination.Item key={page}>
                            <Pagination.Link
                              isActive={page === currentPage}
                              onPress={() => setCurrentPage(page)}
                            >
                              {page}
                            </Pagination.Link>
                          </Pagination.Item>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <Pagination.Item key={page}>
                            <Pagination.Ellipsis />
                          </Pagination.Item>
                        );
                      }
                      return null;
                    })}
                    <Pagination.Item>
                      <Pagination.Next
                        isDisabled={currentPage === totalPages}
                        onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      />
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {selectedAssetId && playerLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center gap-3 rounded-lg bg-background px-6 py-4">
            <Spinner size="sm" />
            <span className="text-sm">Loading player...</span>
          </div>
        </div>
      )}

      {selectedAssetId && playerData && (
        <PlayerDialog
          asset={playerData.asset}
          accessToken={playerData.accessToken}
          expiryTime={playerData.expiryTime}
          expiresIn={playerData.expiresIn}
          onClose={() => setSelectedAssetId(null)}
        />
      )}
    </div>
  );
}
