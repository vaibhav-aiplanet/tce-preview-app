import { Button, Chip } from "@heroui/react";
import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
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

  const location = useLocation();

  const isMappedAssetsRoute = useMemo(() => location.pathname === "/mapped-assets", [location]);
  const isHomeRoute = useMemo(() => location.pathname === "/", [location]);
  const isUploadRoute = useMemo(() => location.pathname === "/content-upload", [location]);
  const isAdmin = role === "CONTENT_ADMIN";

  return (
    <nav className="flex items-center gap-3 border-b border-border/40 bg-background/80 px-5 py-2.5 backdrop-blur-sm">
      <Link to="/" className="text-base font-semibold tracking-tight text-foreground no-underline">
        TCE Preview
      </Link>
      {roleLabel && (
        <Chip
          color={isReviewer ? "accent" : "default"}
          variant="soft"
          size="md"
          className="text-xs"
        >
          {roleLabel}
        </Chip>
      )}

      <div className="ml-auto flex items-center gap-3">
        <Button
          className={isHomeRoute ? "underline underline-offset-8 decoration-2" : ""}
          variant="ghost"
          size="sm"
          onPress={() => navigate("/")}
        >
          Home
        </Button>
        <Button
          className={isMappedAssetsRoute ? "underline underline-offset-8 decoration-2" : ""}
          variant="ghost"
          size="sm"
          onPress={() => navigate("/mapped-assets")}
        >
          {queueLabel}
        </Button>
        {isAdmin && (
          <Button
            className={isUploadRoute ? "underline underline-offset-8 decoration-2" : ""}
            variant="ghost"
            size="sm"
            onPress={() => navigate("/content-upload")}
          >
            Upload Content
          </Button>
        )}
        <Button variant="ghost" size="sm" onPress={logout}>
          Logout
        </Button>
      </div>
    </nav>
  );
}
