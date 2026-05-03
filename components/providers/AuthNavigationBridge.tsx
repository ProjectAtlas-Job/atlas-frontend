"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { setAuthNavigate } from "@/stores/auth.store";

export function AuthNavigationBridge() {
  const router = useRouter();

  useEffect(() => {
    setAuthNavigate((path) => router.push(path));
    return () => setAuthNavigate(null);
  }, [router]);

  return null;
}
