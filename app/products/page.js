import { Suspense } from "react";
import ProductsListPage from "./ProductsListPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <ProductsListPage />
    </Suspense>
  );
}
