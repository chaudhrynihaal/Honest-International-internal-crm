import { prisma } from "@/lib/prisma";
import { NotesClient } from "@/components/NotesClient";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notesRaw = await prisma.note.findMany({ orderBy: { createdAt: "desc" } });

  const notes = notesRaw.map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));

  return <NotesClient notes={notes} />;
}
