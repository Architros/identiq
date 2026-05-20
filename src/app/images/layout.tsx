import { GenerationProvider } from "@/contexts/generation-context";

export default function ImagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GenerationProvider>{children}</GenerationProvider>;
}
