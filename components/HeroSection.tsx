import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden -mt-11">
      {/* Background Image */}
      <Image
        src="/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg"
        alt="Hero background"
        fill
        priority
        quality={100}
        className="object-cover object-center p-15"
      />
      
      {/* Optional Overlay for better text contrast */}
      {/* <div className="absolute inset-0 bg-black/20" /> */}
      
      {/* Content Container - Ready for your content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        {/* Add your hero content here */}
      </div>
    </section>
  );
}
