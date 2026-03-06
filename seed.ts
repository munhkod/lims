import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log("Seeding LIMS database...");

  const { data: orgs } = await supabase.from("organizations").insert([
    { name: "MF Food Company", reg_number: "1234567", contact_name: "Bayaraa Tsend", email: "info@mf.mn", phone: "976-9900-1234" },
    { name: "XXX Corporation", reg_number: "7654321", contact_name: "Zolbayar Naran", email: "lab@xxx.mn", phone: "976-9900-5678" },
    { name: "EcoLab Institute", reg_number: "1122334", contact_name: "Tuya Bat", email: "info@ecolab.mn", phone: "976-9900-9012" },
  ]).select();
  console.log("Organizations:", orgs?.length);

  await supabase.from("equipment").insert([
    { name: "SYSMEX CHEMIX-180", code: "EQ-001", equipment_type: "Chemistry Analyzer", manufacturer: "Sysmex", status: "active" },
    { name: "ELISA Reader", code: "EQ-002", equipment_type: "Immunology", manufacturer: "BioTek", status: "active" },
    { name: "PCR Machine", code: "EQ-003", equipment_type: "Molecular Biology", manufacturer: "Bio-Rad", status: "maintenance" },
    { name: "Autoclave 50L", code: "EQ-004", equipment_type: "Sterilization", manufacturer: "Tuttnauer", status: "active" },
  ]);
  console.log("Equipment seeded");

  const users = [
    { email: "admin@lims.mn", name: "Enkhjargal Dorj", role: "admin" },
    { email: "manager@lims.mn", name: "Soyolnyam Bold", role: "lab_manager" },
    { email: "analyst1@lims.mn", name: "Amartogtokh Gantulga", role: "analyst" },
    { email: "analyst2@lims.mn", name: "Odnoo Khurelbayar", role: "analyst" },
    { email: "client@mf.mn", name: "Bayaraa Tsend", role: "client", orgName: "MF Food Company" },
  ];

  for (const u of users) {
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: u.email, password: "password123", email_confirm: true,
    });
    if (!authUser.user) { console.error("Failed:", u.email); continue; }
    const orgId = u.orgName ? orgs?.find((o: any) => o.name === u.orgName)?.id : null;
    await supabase.from("profiles").insert({ id: authUser.user.id, name: u.name, role: u.role as any, org_id: orgId, is_active: true });
    console.log("Created user:", u.email);
  }
  console.log("Seed complete! Password for all users: password123");
}

seed().catch(console.error);
