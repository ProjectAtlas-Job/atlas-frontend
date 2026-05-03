import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_API_URL;

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!backendUrl || !refreshToken) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: `refresh_token=${refreshToken}`,
    },
  });

  if (!response.ok) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const data = (await response.json()) as { access_token: string };
  return NextResponse.json({ access_token: data.access_token });
}
