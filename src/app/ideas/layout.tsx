import { GenerationProvider } from "@/contexts/generation-context";

export default function IdeasLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GenerationProvider>{children}</GenerationProvider>;
}
