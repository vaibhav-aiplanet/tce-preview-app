import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { Link } from "react-router";

export default function Unauthorized() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <Card className="max-w-md">
        <CardHeader className="flex flex-col gap-1 text-center text-2xl font-bold text-danger">
          Access Denied
        </CardHeader>
        <CardBody className="flex flex-col items-center gap-3 text-center text-default-600">
          <p>You do not have permission to access this application.</p>
          <p className="text-sm text-default-500">
            Required roles: CONTENT_ADMIN or CONTENT_REVIEWER
          </p>
          <Button
            className="mt-2"
            color="primary"
            onPress={() => {
              sessionStorage.clear();
              window.location.href = "/";
            }}
          >
            Logout and Try Another Account
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}