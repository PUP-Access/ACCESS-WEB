import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact PUP ACCESS for inquiries, assistance, and concerns about the Computer Engineering student organization at PUP.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
