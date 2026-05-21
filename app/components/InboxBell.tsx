import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Button,
  Chip,
  Popover,
  PopoverContent,
  PopoverDialog,
  PopoverTrigger,
  Spinner,
} from "@heroui/react";
import PlayerDialog from "~/components/PlayerDialog";
import { useUser } from "~/lib/auth";
import { parseCustomFields } from "~/lib/inbox-events";
import { useBatchAssetData, useTCEPlayerData } from "~/lib/tce-queries";
import type {
  InboxMessage,
  InboxResponse,
  MappingAction,
} from "~/types/inbox";

const ALLOWED_ROLES = new Set(["CONTENT_ADMIN", "CONTENT_REVIEWER"]);

const ACTION_COLOR: Record<
  MappingAction,
  "warning" | "success" | "danger" | "default"
> = {
  SUBMITTED: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const ACTION_LABEL: Record<MappingAction, string> = {
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function isMappingAction(value: string | undefined): value is MappingAction {
  return value === "SUBMITTED" || value === "APPROVED" || value === "REJECTED";
}

function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = new Date(raw.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export default function InboxBell() {
  const user = useUser();
  const role = user?.role;
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const enabled = !!user && ALLOWED_ROLES.has(role ?? "");

  const query = useQuery<InboxResponse>({
    queryKey: ["inbox", user?.id],
    queryFn: () =>
      fetch("/_api/inbox", { credentials: "same-origin" }).then((r) => {
        if (!r.ok) throw new Error(`Inbox load failed: ${r.status}`);
        return r.json();
      }),
    enabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      const resp = await fetch(`/_api/inbox/${encodeURIComponent(id)}/read`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!resp.ok) throw new Error(`Mark-read failed: ${resp.status}`);
      return resp.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox", user?.id] });
    },
  });

  const { data: playerData, isLoading: playerLoading } = useTCEPlayerData(
    selectedAssetId || "",
  );

  const messages = useMemo<InboxMessage[]>(() => {
    const list = query.data?.messages ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(b.sent_Datetime.replace(" ", "T")).getTime() -
        new Date(a.sent_Datetime.replace(" ", "T")).getTime(),
    );
  }, [query.data]);

  // Resolve real TCE titles for the messages on display, since
  // chapter_assets.title is often empty and customFields.title falls back to
  // assetId. Only triggers when the popover is opened so we don't fan out
  // extra TCE calls on every poll.
  const assetIds = useMemo(() => {
    if (!isOpen) return [];
    const ids = new Set<string>();
    for (const m of messages) {
      const id = parseCustomFields(m.customFields).assetId;
      if (id) ids.add(id);
    }
    return [...ids];
  }, [isOpen, messages]);

  const { data: batchData } = useBatchAssetData(assetIds);
  const titleByAssetId = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of batchData?.assets ?? []) {
      if (a?.assetId && a.title) map.set(a.assetId, a.title);
    }
    return map;
  }, [batchData]);

  const unreadCount = useMemo(
    () => messages.filter((m) => !m.isRead).length,
    [messages],
  );

  if (!enabled) return null;

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    if (next) query.refetch();
  };

  const handleClick = (msg: InboxMessage) => {
    if (!msg.isRead) {
      readMutation.mutate(msg.id);
    }
    const fields = parseCustomFields(msg.customFields);
    const assetId = fields.assetId;
    if (!assetId) return;
    setIsOpen(false);
    setSelectedAssetId(assetId);
  };

  return (
    <>
      <Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger>
          <Button
            variant="ghost"
            size="sm"
            aria-label={
              unreadCount > 0
                ? `Inbox, ${unreadCount} unread`
                : "Inbox, no new notifications"
            }
            className="relative px-2"
          >
            <BellIcon className="size-5" />
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-danger-foreground"
                aria-hidden="true"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent placement="bottom end" className="w-96">
          <PopoverDialog className="max-h-[28rem] overflow-y-auto p-0">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
              <span className="text-sm font-semibold text-foreground">
                Inbox
              </span>
              {unreadCount > 0 && (
                <span className="text-xs text-muted">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {query.isLoading ? (
              <div className="flex items-center justify-center px-4 py-8">
                <Spinner size="sm" />
              </div>
            ) : query.isError ? (
              <div className="px-4 py-6 text-center text-xs text-danger">
                Couldn't load inbox.
              </div>
            ) : messages.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted">
                No notifications yet.
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {messages.map((msg) => {
                  const fields = parseCustomFields(msg.customFields);
                  const actionRaw = fields.action;
                  const action = isMappingAction(actionRaw) ? actionRaw : null;
                  const assetId = fields.assetId;
                  const resolvedTitle =
                    (assetId && titleByAssetId.get(assetId)) || null;
                  const storedTitle =
                    fields.title && fields.title !== fields.assetId
                      ? fields.title
                      : null;
                  const title =
                    resolvedTitle || storedTitle || assetId || "Untitled";
                  return (
                    <li key={msg.id}>
                      <button
                        type="button"
                        onClick={() => handleClick(msg)}
                        className={`flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-muted/10 ${
                          msg.isRead ? "" : "bg-primary/5"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="truncate text-sm font-medium text-foreground"
                            title={title}
                          >
                            {title}
                          </p>
                          {action && (
                            <Chip
                              color={ACTION_COLOR[action]}
                              variant="soft"
                              size="sm"
                              className="shrink-0 text-xs"
                            >
                              {ACTION_LABEL[action]}
                            </Chip>
                          )}
                        </div>
                        <p className="line-clamp-2 text-xs text-muted">
                          {msg.message}
                        </p>
                        <p className="text-[10px] text-muted/70">
                          {formatDateTime(msg.sent_Datetime)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </PopoverDialog>
        </PopoverContent>
      </Popover>

      {selectedAssetId && playerLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center gap-3 rounded-lg bg-background px-6 py-4">
            <Spinner size="sm" />
            <span className="text-sm">Loading player…</span>
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
    </>
  );
}
