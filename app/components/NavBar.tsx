import { Button, Chip } from "@heroui/react";
import { Link, useNavigate } from "react-router";
import { logout, useUserRole } from "~/lib/auth";

export default function NavBar() {
  const navigate = useNavigate();
  const role = useUserRole();
  const isReviewer = role === "CONTENT_REVIEWER";
  const queueLabel = isReviewer ? "Review Queue" : "My Submissions";
  const roleLabel = isReviewer
    ? "Content Reviewer"
    : role === "CONTENT_ADMIN"
      ? "Content Admin"
      : null;

  const homePath = isReviewer ? "/mapped-assets" : "/";

  return (
    <nav className="flex items-center gap-3 border-b border-border/40 bg-background/80 px-5 py-2.5 backdrop-blur-sm">
      <Link
        to={homePath}
        className="text-base font-semibold tracking-tight text-foreground no-underline"
      >
        TCE Preview
      </Link>
      {roleLabel && (
        <Chip
          color={isReviewer ? "accent" : "default"}
          variant="soft"
          size="sm"
          className="text-xs"
        >
          {roleLabel}
        </Chip>
      )}

      <div className="ml-auto flex items-center gap-3">
        {!isReviewer && (
          <Button variant="ghost" size="sm" onPress={() => navigate("/")}>
            Home
          </Button>
        )}
        <Button variant="ghost" size="sm" onPress={() => navigate("/mapped-assets")}>
          {queueLabel}
        </Button>
        <Button variant="ghost" size="sm" onPress={logout}>
          Logout
        </Button>
      </div>
    </nav>
  );
}
