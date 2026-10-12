import type { Metadata } from "next";
import CvView from "@/components/CvView";

export const metadata: Metadata = {
  title: "CV — Mykhaylo Levytskyy",
  description: "Curriculum vitae of Mykhaylo Levytskyy, Information Technology graduate focused on cybersecurity.",
};

export default function CvPage() {
  return <CvView />;
}
