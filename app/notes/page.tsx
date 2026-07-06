import { supabaseAdmin } from "@/lib/supabase/admin";
import { NotesClient } from "@/components/NotesClient";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const { data, error } = await supabaseAdmin
    .from("Note")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) throw error;

  const notes = (data ?? []).map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }));

  return <NotesClient notes={notes} />;
}
