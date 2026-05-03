import { NextResponse, type NextRequest } from "next/server";
import { withAuth } from "@/lib/auth";
import {
  getHumanityAccessToken,
  updateEmployee,
} from "@/lib/humanity";

export const PUT = withAuth(async (
  request: NextRequest,
  _user,
  context
) => {
  try {
    if (!context) {
      return NextResponse.json(
        { error: "Invalid request context" },
        { status: 400 }
      );
    }

    const { id } = await context.params;
    const employeeId = Array.isArray(id) ? id[0] : id;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Fetch access token from database
    const accessToken = await getHumanityAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Humanity access token not found" },
        { status: 500 }
      );
    }

    // Update employee
    const data = await updateEmployee(accessToken, employeeId, body);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});
