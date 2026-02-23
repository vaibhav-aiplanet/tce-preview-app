import { Button } from "@heroui/react";
import { useNavigate } from "react-router";
import { logout } from "~/lib/auth";

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-3 border-b border-border/40 bg-background/80 px-5 py-2.5 backdrop-blur-sm">
      <span
        className="mr-auto cursor-pointer text-base font-semibold tracking-tight text-foreground"
        onClick={() => navigate("/")}
      >
        TCE Preview
      </span>

      <Button variant="ghost" size="sm" onPress={() => navigate("/")}>
        Home
      </Button>
      <Button variant="ghost" size="sm" onPress={logout}>
        Logout
      </Button>
    </nav>
  );
}
