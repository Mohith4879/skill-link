import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TUTORS = [
  { email: "arjun.reddy@skilllink.demo",  name: "Arjun Reddy — Hyderabad",   bio: "Mathematics tutor from Hyderabad. IIT graduate, 5+ years helping students master algebra, calculus, and JEE prep.", subjects: ["Mathematics","Calculus","Algebra"], rate: 30, rating: 4.9, total: 47 },
  { email: "priya.sharma@skilllink.demo", name: "Priya Sharma — Delhi",      bio: "Physics enthusiast from Delhi. Specializing in mechanics, electromagnetism, and modern physics for boards & NEET.", subjects: ["Physics","Mechanics","NEET Prep"], rate: 28, rating: 4.8, total: 62 },
  { email: "rahul.verma@skilllink.demo",  name: "Rahul Verma — Mumbai",      bio: "Chemistry PhD candidate from Mumbai. I make organic and physical chemistry simple, intuitive, and fun.", subjects: ["Chemistry","Organic Chemistry","Physical Chemistry"], rate: 35, rating: 4.7, total: 33 },
  { email: "sneha.iyer@skilllink.demo",   name: "Sneha Iyer — Chennai",      bio: "Biology specialist from Chennai. Loves making genetics, ecology, and human physiology accessible to everyone.", subjects: ["Biology","Genetics","Botany"], rate: 26, rating: 4.8, total: 35 },
  { email: "vikram.singh@skilllink.demo", name: "Vikram Singh — Bangalore",  bio: "Computer Science engineer from Bangalore. Expert in DSA, Python, JavaScript, and full-stack web development.", subjects: ["Computer Science","Python","Web Development"], rate: 32, rating: 4.6, total: 41 },
];

const STUDENTS = [
  { email: "ananya.gupta@skilllink.demo",  name: "Ananya Gupta — Lucknow" },
  { email: "karthik.reddy@skilllink.demo", name: "Karthik Reddy — Vijayawada" },
  { email: "meera.nair@skilllink.demo",    name: "Meera Nair — Kochi" },
  { email: "rohan.das@skilllink.demo",     name: "Rohan Das — Kolkata" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: any[] = [];

  for (const t of TUTORS) {
    try {
      // 1. Create auth user
      const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
        email: t.email,
        password: "Demo1234!",
        email_confirm: true,
        user_metadata: { full_name: t.name },
      });

      let userId = userData?.user?.id;

      if (userErr || !userId) {
        // User might already exist — look them up
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list.users.find((u) => u.email === t.email);
        if (existing) {
          userId = existing.id;
        } else {
          results.push({ email: t.email, status: "failed", error: userErr?.message });
          continue;
        }
      }

      // 2. Update profile (auto-created by trigger) with role + name
      await supabase.from("profiles")
        .update({ full_name: t.name, role: "tutor" })
        .eq("user_id", userId);

      // 3. Upsert tutor_profile
      await supabase.from("tutor_profiles").upsert({
        user_id: userId,
        bio: t.bio,
        subjects: t.subjects,
        hourly_rate: t.rate,
        rating: t.rating,
        total_ratings: t.total,
      }, { onConflict: "user_id" });

      // 4. Add 5 future time slots
      const slots = [
        { d: 1, h: 10 }, { d: 2, h: 14 }, { d: 3, h: 16 },
        { d: 5, h: 11 }, { d: 7, h: 15 },
      ].map(({ d, h }) => {
        const start = new Date();
        start.setDate(start.getDate() + d);
        start.setHours(h, 0, 0, 0);
        const end = new Date(start);
        end.setHours(h + 1);
        return {
          tutor_id: userId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          status: "available" as const,
        };
      });
      await supabase.from("time_slots").insert(slots);

      results.push({ email: t.email, status: "ok", userId });
    } catch (e: any) {
      results.push({ email: t.email, status: "failed", error: e.message });
    }
  }

  // Seed demo students
  for (const s of STUDENTS) {
    try {
      const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
        email: s.email,
        password: "Demo1234!",
        email_confirm: true,
        user_metadata: { full_name: s.name },
      });
      let userId = userData?.user?.id;
      if (userErr || !userId) {
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list.users.find((u) => u.email === s.email);
        if (existing) userId = existing.id;
        else { results.push({ email: s.email, status: "failed", error: userErr?.message }); continue; }
      }
      await supabase.from("profiles").update({ full_name: s.name, role: "student" }).eq("user_id", userId);
      results.push({ email: s.email, status: "ok", role: "student", userId });
    } catch (e: any) {
      results.push({ email: s.email, status: "failed", error: e.message });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
