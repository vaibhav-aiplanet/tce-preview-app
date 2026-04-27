import { Link } from "react-router";

export default function Unauthorized() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
      <p className="text-gray-600">
        You do not have permission to access this application.
      </p>
      <p className="text-sm text-gray-500">
        Required roles: CONTENT_ADMIN or CONTENT_REVIEWER
      </p>
      <Link
        to="/"
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        onClick={() => sessionStorage.clear()}
      >
        Logout and Try Another Account
      </Link>
    </div>
  );
}