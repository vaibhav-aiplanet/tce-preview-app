import { Button, Card } from "@heroui/react";
import { logout } from "~/lib/auth";

export default function Unauthorized() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <Card className="max-w-md p-6">
        <h2 className="mb-4 text-center text-2xl font-bold text-danger">Access Denied</h2>
        <div className="flex flex-col items-center gap-3 text-center text-default-600">
          <p>You do not have permission to access this application.</p>
          <p className="text-sm text-default-500">
            Required roles: CONTENT_ADMIN or CONTENT_REVIEWER
          </p>
          <Button className="mt-2" variant="primary" onPress={logout}>
            Logout and Try Another Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
