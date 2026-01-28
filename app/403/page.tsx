export default function Forbidden() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600">403</h1>
        <p className="mt-2 text-gray-600">Access Denied</p>
      </div>
    </div>
  );
}
