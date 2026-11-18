import { Suspense } from "react";
import { Entrainement } from "./Entrainement";

export default function EntrainementPage() {
  return (
    <Suspense>
      <Entrainement />
    </Suspense>
  );
}
