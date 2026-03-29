"use client";

import StudioNavbar from "@/components/shadcn-studio/blocks/navbar-component-01/navbar-component-01";

const navigationData = [
  { title: "Home", href: "/" },
  { title: "Categories", href: "/categories" },
  { title: "Search", href: "/search" },
  { title: "Help", href: "#" },
];

export default function Navbar() {
  return <StudioNavbar navigationData={navigationData} />;
}
