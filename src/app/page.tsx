import { redirect } from "next/navigation";
import { HomePage } from "@/components/home/home-page";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function RootPage() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        redirect("/login");
      }
    } catch {
      redirect("/login");
    }
  }

  return <HomePage />;
}
