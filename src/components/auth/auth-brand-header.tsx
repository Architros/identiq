import Image from "next/image";

export function AuthBrandHeader() {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <div className="mb-5 flex items-center gap-3">
        <Image
          src="/brand/logo-identiq.svg"
          alt=""
          width={40}
          height={29}
          className="h-9 w-auto"
          priority
        />
        <span className="font-display text-2xl tracking-tight text-foreground">
          identiq
        </span>
      </div>
    </div>
  );
}
