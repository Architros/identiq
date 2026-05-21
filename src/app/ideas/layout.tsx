import { GenerationProvider } from "@/contexts/generation-context";
import { GenerationMainChrome } from "@/components/generation/generation-main-chrome";

export default function IdeasLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GenerationProvider>
      <GenerationMainChrome>{children}</GenerationMainChrome>
    </GenerationProvider>
  );
}
