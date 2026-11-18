import { NextResponse, type NextRequest } from "next/server";
import { lireComptes, verifierAutorisation } from "@/lib/acces";

// Toutes les adresses sont protégées, y compris les fichiers JS qui contiennent les questions.
export async function proxy(request: NextRequest) {
  const comptes = lireComptes(process.env.QCM_ACCES);
  if (comptes.size === 0) {
    // Sans comptes : libre en local (développement), fermé en ligne pour ne jamais exposer le site par oubli.
    return process.env.VERCEL ? new NextResponse("Accès non configuré.", { status: 503 }) : NextResponse.next();
  }
  if (await verifierAutorisation(request.headers.get("authorization"), comptes)) return NextResponse.next();
  return new NextResponse("Identifiant ou mot de passe requis.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="QCM Pedagogie moderne", charset="UTF-8"' },
  });
}
