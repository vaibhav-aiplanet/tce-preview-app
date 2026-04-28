import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { Button, Input, Modal, Select, ListBox, Spinner, TextArea } from "@heroui/react";
import NavBar from "~/components/NavBar";
import PlayerDialog from "~/components/PlayerDialog";
import StatusBadge from "~/components/StatusBadge";
import { ensureAuthenticated, useUserRole } from "~/lib/auth";
import { useTCEPlayerData } from "~/lib/tce-queries";
import {
  ReviewConflictError,
  reviewMapping,
  type MappingStatus,
} from "~/lib/curriculum-api";

export async function clientLoader() {
  await ensureAuthenticated();
  return null;
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return null;
}

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
  status: MappingStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

function useUniqueValues(assets: MappedAsset[], key: keyof MappedAsset) {
  return useMemo(
    () =>
      [...new Set(assets.map((a) => a[key]).filter(Boolean))]
        .sort() as string[],
    [assets, key],
  );
}

const ADMIN_TABS: MappingStatus[] = ["PENDING", "APPROVED", "REJECTED"];
const REVIEWER_TABS: MappingStatus[] = ["PENDING", "APPROVED", "REJECTED"];

const STATUS_LABEL: Record<MappingStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function MappedAssetsPage() {
  const role = useUserRole();
  const isReviewer = role === "CONTENT_REVIEWER";
  const tabs = isReviewer ? REVIEWER_TABS : ADMIN_TABS;
  const pageTitle = isReviewer ? "Review Queue" : "My Submissions";

  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: assets = [], isLoading, error } = useQuery<MappedAsset[]>({
    queryKey: ["mapped-assets"],
    queryFn: () => fetch("/_api/mapped-assets").then((r) => r.json()),
  });

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const { data: playerData, isLoading: playerLoading } = useTCEPlayerData(
    selectedAssetId || "",
  );

  const tabParam = searchParams.get("tab")?.toUpperCase() as MappingStatus | null;
  const activeTab: MappingStatus = tabParam && tabs.includes(tabParam) ? tabParam : "PENDING";

  const setActiveTab = (next: MappingStatus) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("tab", next);
        return sp;
      },
      { replace: true },
    );
  };
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
  };

  const handleSubjectChange = (value: string) => {
    setSubjectFilter(value);
    setChapterFilter("");
    setSubtopicFilter("");
    setConsumerFilter("");
  };

  const handleChapterChange = (value: string) => {
    setChapterFilter(value);
    setSubtopicFilter("");
    setConsumerFilter("");
  };

  const handleSubtopicChange = (value: string) => {
    setSubtopicFilter(value);
    setConsumerFilter("");
  };

  // Bucket counts for tab labels
  const counts = useMemo(() => {
    const byStatus: Record<MappingStatus, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    for (const a of assets) byStatus[a.status]++;
    return byStatus;
  }, [assets]);

  // Status bucket → progressive curriculum filtering
  const inTab = useMemo(
    () => assets.filter((a) => a.status === activeTab),
    [assets, activeTab],
  );

  const afterGrade = useMemo(
    () => inTab.filter((a) => !gradeFilter || a.grade === gradeFilter),
    [inTab, gradeFilter],
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

  const gradeOptions = useUniqueValues(inTab, "grade");
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

  // Inline review action state (reviewer Pending tab)
  const [reviewingAssetId, setReviewingAssetId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [rejectAssetId, setRejectAssetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  const profile = JSON.parse(sessionStorage.getItem("profile") || "{}");
  const reviewedBy = profile.userName || profile.user_name || "";

  const refreshAfterReview = async () => {
    await qc.invalidateQueries({ queryKey: ["mapped-assets"] });
  };

  const handleApprove = async (assetId: string) => {
    setReviewingAssetId(assetId);
    setReviewAction("approve");
    setReviewError(null);
    try {
      await reviewMapping(assetId, "approve", reviewedBy);
      await refreshAfterReview();
    } catch (err) {
      if (err instanceof ReviewConflictError) {
        setReviewError("This submission was changed. Refreshed.");
        await refreshAfterReview();
      } else {
        setReviewError(err instanceof Error ? err.message : "Approval failed");
      }
    } finally {
      setReviewingAssetId(null);
      setReviewAction(null);
    }
  };

  const handleReject = async () => {
    if (!rejectAssetId || !rejectReason.trim()) return;
    setReviewingAssetId(rejectAssetId);
    setReviewAction("reject");
    setReviewError(null);
    try {
      await reviewMapping(
        rejectAssetId,
        "reject",
        reviewedBy,
        rejectReason.trim(),
      );
      setRejectAssetId(null);
      setRejectReason("");
      await refreshAfterReview();
    } catch (err) {
      if (err instanceof ReviewConflictError) {
        setReviewError("This submission was changed. Refreshed.");
        await refreshAfterReview();
        setRejectAssetId(null);
      } else {
        setReviewError(err instanceof Error ? err.message : "Rejection failed");
      }
    } finally {
      setReviewingAssetId(null);
      setReviewAction(null);
    }
  };

  const showApproveReject = isReviewer && activeTab === "PENDING";
  const showRejectionReason = activeTab === "REJECTED";

  return (
    <div className="flex h-screen flex-col bg-background">
      <NavBar />

      <div className="flex flex-col gap-4 px-6 pt-5 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {pageTitle}
        </h1>

        {/* Tab strip */}
        <div className="flex gap-2 border-b border-border/40">
          {tabs.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {STATUS_LABEL[t]}
              <span className="ml-1.5 text-xs text-muted">({counts[t]})</span>
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" />
            Loading...
          </div>
        )}

        {error && (
          <p className="text-sm text-danger">
            Failed to load.
          </p>
        )}

        {reviewError && (
          <p className="text-sm text-danger">{reviewError}</p>
        )}

        {inTab.length > 0 && (
          <div className="flex flex-wrap items-end gap-3">
            <Input
              className="w-[220px]"
              placeholder="Search by title..."
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
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
              onChange={(value) => setConsumerFilter(String(value ?? ""))}
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
        {!isLoading && inTab.length === 0 && (
          <p className="text-sm text-muted">
            No {STATUS_LABEL[activeTab].toLowerCase()} submissions.
          </p>
        )}

        {inTab.length > 0 && filteredAssets.length === 0 && (
          <p className="text-sm text-muted">No assets match the current filters.</p>
        )}

        {filteredAssets.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Grade</th>
                  <th className="px-4 py-3 text-left font-medium">Subject</th>
                  <th className="px-4 py-3 text-left font-medium">Chapter</th>
                  <th className="px-4 py-3 text-left font-medium">Subtopic</th>
                  <th className="px-4 py-3 text-left font-medium">Consumer</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">
                    {isReviewer ? "Submitted By" : "Mapped By"}
                  </th>
                  {showRejectionReason && (
                    <th className="px-4 py-3 text-left font-medium">Rejection Reason</th>
                  )}
                  {showApproveReject && (
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => {
                  const inFlight =
                    reviewingAssetId === asset.assetId && reviewAction !== null;
                  return (
                    <tr
                      key={asset.assetId}
                      onClick={() => setSelectedAssetId(asset.assetId)}
                      className="cursor-pointer border-b border-border/20 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 text-primary">
                        {asset.title}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={asset.status} />
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
                      {showRejectionReason && (
                        <td className="px-4 py-3 text-muted-foreground max-w-[280px]">
                          <span className="line-clamp-2">
                            {asset.rejectionReason || "—"}
                          </span>
                        </td>
                      )}
                      {showApproveReject && (
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onPress={() => handleApprove(asset.assetId)}
                              isDisabled={inFlight}
                              isPending={
                                inFlight && reviewAction === "approve"
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onPress={() => {
                                setRejectAssetId(asset.assetId);
                                setRejectReason("");
                                setReviewError(null);
                              }}
                              isDisabled={inFlight}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectAssetId && (
        <Modal.Backdrop
          isOpen={!!rejectAssetId}
          onOpenChange={(open) => {
            if (!open && reviewAction !== "reject") {
              setRejectAssetId(null);
              setRejectReason("");
              setReviewError(null);
            }
          }}
          variant="blur"
        >
          <Modal.Container size="md" placement="center">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Reject submission</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-3 px-5 py-3">
                <p className="text-sm text-muted">
                  The Content Admin will see this reason on their Rejected tab.
                </p>
                <TextArea
                  rows={5}
                  placeholder="Why is this submission being rejected?"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full min-h-32 resize-none px-3 py-2 text-sm"
                />
                {reviewError && (
                  <p className="text-sm text-danger">{reviewError}</p>
                )}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setRejectAssetId(null);
                    setRejectReason("");
                    setReviewError(null);
                  }}
                  isDisabled={reviewAction === "reject"}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onPress={handleReject}
                  isDisabled={!rejectReason.trim() || reviewAction === "reject"}
                  isPending={reviewAction === "reject"}
                >
                  {reviewAction === "reject" ? "Rejecting..." : "Reject"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      )}

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
