import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Label, ListBox, Select, Spinner } from "@heroui/react";
import NavBar from "~/components/NavBar";
import { useUser } from "~/lib/auth";
import { requireAuthedLoader } from "~/lib/server-auth";
import type { CurriculumItem } from "~/lib/curriculum-api";
import {
  buildDisplayName,
  deriveBookMetadataFromFilename,
} from "~/lib/excel-parser";
import type { ContentFilesManifest } from "./api.content-files";
import type { Route } from "./+types/content-upload";

const SAMPLE_FILE_URL = "/sample-content-upload.xls";

export async function loader({ request }: Route.LoaderArgs) {
  const { setCookieHeaders } = await requireAuthedLoader(request);
  return Response.json(
    null,
    setCookieHeaders ? { headers: setCookieHeaders } : undefined,
  );
}

type UploadResult = {
  filename: string;
  ok: boolean;
  id?: string;
  error?: string;
  asset_count?: number;
};

type StagedFile = {
  id: string;
  file: File;
  subject_name: string;
  subtopic_name: string | null;
  display_name: string;
  valid: boolean;
};

function stageFile(file: File): StagedFile {
  const { subject_name, subtopic_name } = deriveBookMetadataFromFilename(file.name);
  return {
    id: crypto.randomUUID(),
    file,
    subject_name,
    subtopic_name,
    display_name: buildDisplayName(subject_name, subtopic_name),
    valid: !!subject_name,
  };
}

function gradeKey(name: string): string {
  return name.trim().replace(/^grade\s+/i, "");
}

export default function ContentUpload() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useUser();
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "CONTENT_ADMIN") {
      navigate("/unauthorized", { replace: true });
    }
  }, [user, navigate]);

  const onDrop = useCallback((accepted: File[]) => {
    setStaged((prev) => [...prev, ...accepted.map(stageFile)]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: true,
  });

  const removeStaged = (id: string) =>
    setStaged((prev) => prev.filter((s) => s.id !== id));

  const { data: gradesList = [], isLoading: gradesLoading } = useQuery<CurriculumItem[]>({
    queryKey: ["grades"],
    queryFn: () => fetch("/_api/grades").then((r) => r.json()),
    staleTime: Infinity,
  });

  const selectedGradeName = useMemo(
    () =>
      selectedGradeId
        ? gradesList.find((g) => g.id === selectedGradeId)?.name ?? ""
        : "",
    [gradesList, selectedGradeId],
  );
  const selectedGradeNumber = selectedGradeName ? gradeKey(selectedGradeName) : "";

  const { data: manifest, isLoading: manifestLoading } = useQuery<ContentFilesManifest>({
    queryKey: ["content-files-manifest"],
    queryFn: () => fetch("/_api/content-files").then((r) => r.json()),
  });

  const existingForGrade = useMemo(
    () =>
      selectedGradeNumber && manifest
        ? manifest[selectedGradeNumber] ?? []
        : [],
    [manifest, selectedGradeNumber],
  );

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("gradeId", selectedGradeId);
      for (const s of staged) {
        if (s.valid) fd.append("files", s.file, s.file.name);
      }
      const resp = await fetch("/_api/content-files/upload", {
        method: "POST",
        body: fd,
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Upload failed: ${resp.status}`);
      }
      return (await resp.json()) as { uploaded: UploadResult[] };
    },
    onSuccess: (data) => {
      setResults(data.uploaded);
      // Drop successfully uploaded files from the staged list; keep failures so the
      // user can see what went wrong and retry.
      const failed = new Set(
        data.uploaded.flatMap((r) => (!r.ok ? [r.filename] : [])),
      );
      setStaged((prev) => prev.filter((s) => failed.has(s.file.name)));
      qc.invalidateQueries({ queryKey: ["content-files-manifest"] });
      qc.invalidateQueries({ queryKey: ["manifest"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const resp = await fetch(`/_api/content-files/${id}`, {
        method: "DELETE",
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Delete failed: ${resp.status}`);
      }
      return resp.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-files-manifest"] });
      qc.invalidateQueries({ queryKey: ["manifest"] });
    },
  });

  const canUpload =
    !!selectedGradeId && staged.some((s) => s.valid) && !uploadMutation.isPending;

  return (
    <div className="flex h-screen flex-col bg-background">
      <NavBar />

      <div className="flex-1 overflow-auto px-6 pt-5 pb-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Upload Content
            </h1>
            <p className="mt-1 text-sm text-muted">
              Upload Excel sheets containing TCE asset IDs. Files are parsed on
              the server and stored as JSON in S3. Filename convention:{" "}
              <code>Subject-Subtopic-….xlsx</code> (use <code>NA</code> for the
              subtopic when there is none).
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            onPress={() => {
              const a = document.createElement("a");
              a.href = SAMPLE_FILE_URL;
              a.download = "";
              a.click();
            }}
          >
            Download Sample File
          </Button>
        </div>

        <div className="mt-6 max-w-xl">
          <Select
            className="w-[220px]"
            placeholder={gradesLoading ? "Loading grades…" : "Select Grade"}
            value={selectedGradeId || null}
            isDisabled={gradesLoading}
            onChange={(value) => setSelectedGradeId(String(value ?? ""))}
          >
            <Label>Grade</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {gradesList.map((g) => (
                  <ListBox.Item key={g.id} id={g.id} textValue={g.name}>
                    {g.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <div
          {...getRootProps()}
          className={`mt-6 cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border/60 bg-background hover:border-primary/60"
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-sm text-foreground">
            {isDragActive
              ? "Drop the .xlsx files here…"
              : "Drag and drop .xlsx files here, or click to browse."}
          </p>
          <p className="mt-1 text-xs text-muted">
            Accepts .xlsx and .xls (multiple files supported).
          </p>
        </div>

        {staged.length > 0 && (
          <div className="mt-6">
            <h2 className="text-base font-medium text-foreground">
              Staged files ({staged.length})
            </h2>
            <ul className="mt-3 divide-y divide-border/50 rounded-md border border-border/50">
              {staged.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {s.file.name}
                    </p>
                    {s.valid ? (
                      <p className="text-xs text-muted">
                        Will be saved as{" "}
                        <span className="font-medium">{s.display_name}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-danger">
                        Could not derive subject from filename. Use{" "}
                        <code>Subject-Subtopic-….xlsx</code>.
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => removeStaged(s.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="primary"
            isDisabled={!canUpload}
            onPress={() => uploadMutation.mutate()}
          >
            {uploadMutation.isPending ? "Uploading…" : "Upload"}
          </Button>
          {uploadMutation.isPending && <Spinner size="sm" />}
          {uploadMutation.error && (
            <span className="text-sm text-danger">
              {uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : "Upload failed"}
            </span>
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-6">
            <h2 className="text-base font-medium text-foreground">
              Last upload results
            </h2>
            <ul className="mt-3 divide-y divide-border/50 rounded-md border border-border/50">
              {results.map((r, i) => (
                <li key={r.id ?? `${r.filename}-${i}`} className="px-4 py-2 text-sm">
                  <span
                    className={
                      r.ok ? "text-success font-medium" : "text-danger font-medium"
                    }
                  >
                    {r.ok ? "OK" : "FAIL"}
                  </span>{" "}
                  <span className="font-medium">{r.filename}</span>
                  {r.ok && (
                    <span className="text-muted">: {r.asset_count} asset(s)</span>
                  )}
                  {!r.ok && r.error && (
                    <span className="text-danger">: {r.error}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-base font-medium text-foreground">
            Existing files {selectedGradeName && `for ${selectedGradeName}`}
          </h2>
          {manifestLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Spinner size="sm" /> Loading…
            </div>
          ) : !selectedGradeId ? (
            <p className="mt-2 text-sm text-muted">
              Select a grade above to see existing uploaded books.
            </p>
          ) : existingForGrade.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              No books uploaded yet for {selectedGradeName}.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border/50 rounded-md border border-border/50">
              {existingForGrade.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 px-4 py-2"
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {entry.name}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    isDisabled={deleteMutation.isPending}
                    onPress={() => deleteMutation.mutate(entry.id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
