import Image from "next/image";

type OfficersRosterMediaProps = {
  url: string;
  alt?: string;
  className?: string;
};

export default function OfficersRosterMedia({
  url,
  alt = "Current ACCESS officers",
  className = "h-auto w-full object-contain",
}: OfficersRosterMediaProps) {
  return (
    <Image
      src={url}
      alt={alt}
      width={1400}
      height={900}
      className={className}
    />
  );
}
