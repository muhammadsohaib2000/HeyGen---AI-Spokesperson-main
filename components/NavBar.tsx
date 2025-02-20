"use client";

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";
import { ThemeSwitch } from "./ThemeSwitch";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <Navbar className="w-full">
      <NavbarContent justify="end">
        <NavbarItem className="flex flex-row items-center gap-4">
          {!isHomePage && (
            <Link
              href="/"
              style={{
                display: "inline-block",
                backgroundColor: "yellow",
                padding: "10px 20px",
                borderRadius: "5px",
                color: "black",
                textDecoration: "none",
                fontWeight: "bold",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                transition: "transform 0.2s ease-in-out",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Home
            </Link>
          )}
          <Link
            href="/survey"
            style={{
              display: "inline-block",
              backgroundColor: "yellow",
              padding: "10px 20px",
              borderRadius: "5px",
              color: "black",
              textDecoration: "none",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease-in-out",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Start Questionnaire
          </Link>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
