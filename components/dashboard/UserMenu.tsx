"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserData {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export function UserMenu() {
  const { user: firebaseUser, loading, signOut } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (firebaseUser && !loading) {
      const stored = localStorage.getItem("firebaseUser");
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          setUserData({
            ...parsedData,
            image: parsedData.image || firebaseUser.photoURL || undefined,
          });
        } catch (e) {
          console.error("Error parsing user data:", e);
          setUserData({
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name:
              firebaseUser.displayName ||
              firebaseUser.email?.split("@")[0] ||
              "User",
            image: firebaseUser.photoURL || undefined,
          });
        }
      } else {
        setUserData({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "User",
          image: firebaseUser.photoURL || undefined,
        });
      }
    } else if (!firebaseUser && !loading) {
      setUserData(null);
    }
  }, [firebaseUser, loading]);

  const handleSignOut = async () => {
    await signOut();
    document.cookie = "firebaseToken=; path=/; max-age=0";
    router.push("/login");
  };

  if (loading || !firebaseUser || !userData) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-textPrimary hover:bg-gray-100 transition-colors"
          type="button"
        >
          {userData.image ? (
            <img
              src={userData.image}
              alt={userData.name || "User"}
              className="size-6 shrink-0 rounded-full"
              width={24}
              height={24}
              referrerPolicy="no-referrer"
              onError={(e) => {
                console.error("Image failed to load:", userData.image);
                // Hide the image and show fallback instead
                const target = e.currentTarget;
                target.style.display = "none";
                // Show fallback avatar
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = "flex";
                }
              }}
            />
          ) : null}
          <div
            className="size-6 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium"
            style={{ display: userData.image ? "none" : "flex" }}
          >
            {userData.name?.[0]?.toUpperCase() ||
              userData.email?.[0]?.toUpperCase() ||
              "U"}
          </div>
          <span className="capitalize text-textPrimary">
            {userData.name || userData.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userData.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/billing">Billing</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-600 focus:text-red-600"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
