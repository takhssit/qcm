import { Suspense } from "react";
import { Examen } from "./Examen";

export default function ExamenPage() {
  return (
    <Suspense>
      <Examen />
    </Suspense>
  );
}
