import { Button } from "@heroui/react";
import { Link, useNavigate } from "react-router";
import { logout } from "~/lib/auth";

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-3 border-b border-border/40 bg-background/80 px-5 py-2.5 backdrop-blur-sm">
      <Link
        to="/"
        className="mr-auto text-base font-semibold tracking-tight text-foreground no-underline"
      >
        TCE Preview
      </Link>

      <Button variant="ghost" size="sm" onPress={() => navigate("/")}>
        Home
      </Button>
      <Button variant="ghost" size="sm" onPress={logout}>
        Logout
      </Button>
    </nav>
  );
}
