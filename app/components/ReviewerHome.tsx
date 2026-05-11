import { useQuery } from "@tanstack/react-query";
import { Card, Button, Spinner } from "@heroui/react";
import { useNavigate } from "react-router";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as React from "react";

interface Counts {
  pending: number;
  approved: number;
  rejected: number;
}

const STATUS_CONFIG = [
  { key: "pending", label: "Pending", color: "hsl(45, 90%, 55%)" },
  { key: "approved", label: "Approved", color: "hsl(140, 60%, 45%)" },
  { key: "rejected", label: "Rejected", color: "hsl(0, 75%, 55%)" },
] as const;

export default function ReviewerHome() {
  const navigate = useNavigate();
  const {
    data: counts,
    isLoading,
    error,
  } = useQuery<Counts>({
    queryKey: ["mapped-assets-counts"],
    queryFn: () => fetch("/_api/mapped-assets/counts").then((r) => r.json()),
  });

  const chartData = STATUS_CONFIG.map((s) => ({
    name: s.label,
    value: counts?.[s.key as keyof Counts] ?? 0,
    fill: s.color,
  }));

  const total = (counts?.pending ?? 0) + (counts?.approved ?? 0) + (counts?.rejected ?? 0);

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">Review Dashboard</h1>
        <p className="mb-8 text-muted">
          Overview of asset review status. Use the Review Queue to take action on pending
          submissions.
        </p>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" />
            Loading asset counts…
          </div>
        )}

        {error && (
          <p className="text-sm text-danger">Failed to load asset data. Please try again.</p>
        )}

        {!isLoading && !error && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {STATUS_CONFIG.map((s) => (
                <Card
                  key={s.key}
                  className="cursor-pointer overflow-hidden rounded-xl border border-border bg-background p-0 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                  style={{ transition: "border-color 0.2s, background-color 0.2s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = s.color;
                    e.currentTarget.style.backgroundColor = `${s.color}0D`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <button
                    onClick={() => navigate(`/mapped-assets?tab=${s.key}`)}
                    className="w-full text-left p-5 cursor-pointer"
                  >
                    <p className="text-sm font-medium text-muted">{s.label}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">
                      {counts?.[s.key as keyof Counts] ?? 0}
                    </p>
                  </button>
                </Card>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Distribution</h2>
              {total === 0 ? (
                <p className="py-8 text-center text-sm text-muted">No assets to display.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="middle"
                      align="right"
                      layout="vertical"
                      iconType="circle"
                      iconSize={10}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
