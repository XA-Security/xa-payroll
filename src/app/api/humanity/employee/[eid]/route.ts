import { NextResponse } from "next/server";
import {
  getHumanityAccessToken,
  fetchEmployeeDetails,
} from "@/lib/humanity";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eid: string }> }
) {
  try {
    const { eid } = await params;

    if (!eid) {
      return NextResponse.json(
        { error: "Employee ID (eid) is required" },
        { status: 400 }
      );
    }

    // Fetch access token from database
    const accessToken = await getHumanityAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Humanity access token not found" },
        { status: 500 }
      );
    }

    // Fetch employee details
    const data = await fetchEmployeeDetails(accessToken, eid);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching employee details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
