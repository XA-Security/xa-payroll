import { NextResponse, type NextRequest } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getHumanityAccessToken,
  fetchAllEmployees,
} from "@/lib/humanity";

export const GET = withAuth(async (_request: NextRequest, _user) => {
  try {
    // Fetch access token from database
    const accessToken = await getHumanityAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Humanity access token not found" },
        { status: 500 }
      );
    }

    // Fetch all employees
    const data = await fetchAllEmployees(accessToken);

    // Enrich employee data with status from Users table
    if (data.data && Array.isArray(data.data)) {
      // Extract external IDs from Humanity response to avoid full table scan
      const externalIds = data.data
        .map((emp: any) => emp.id)
        .filter(Boolean);

      if (externalIds.length > 0) {
        const supabase = getSupabaseAdmin();
        // Only fetch users with the external IDs that exist in Humanity response
        const { data: dbUsers, error: dbError } = await supabase
          .from("Users")
          .select("external_id, status_in_humanity, status_in_adp, adp_employee_id")
          .in("external_id", externalIds);

        if (!dbError && dbUsers) {
          const statusMap = new Map<string, { status_in_humanity?: string; status_in_adp?: string; adp_employee_id?: string }>();
          dbUsers.forEach((user: any) => {
            if (user.external_id) {
              statusMap.set(user.external_id, {
                status_in_humanity: user.status_in_humanity,
                status_in_adp: user.status_in_adp,
                adp_employee_id: user.adp_employee_id,
              });
            }
          });

          // Enrich each employee with status data
          data.data = data.data.map((employee: any) => ({
            ...employee,
            ...statusMap.get(employee.id),
          }));
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});
