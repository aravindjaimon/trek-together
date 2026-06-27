import { BrandMark } from "./brand-mark";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center pt-8">
      <BrandMark className="size-7 animate-pulse motion-reduce:animate-none" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
