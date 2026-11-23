import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden -mt-11 px-12 pt-14 pb-12 flex flex-col">
      {/* Background Image with rounded corners */}
      <div className="relative w-full flex-1 rounded-3xl overflow-hidden">
        <Image
          src="/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg"
          alt="Hero background"
          fill
          priority
          quality={100}
          className="object-cover object-center"
        />
        
        {/* Optional Overlay for better text contrast */}
        {/* <div className="absolute inset-0 bg-black/20" /> */}
        
        {/* Content Container - Ready for your content */}
        <div className="relative z-10 flex h-full items-center justify-center">
          {/* Add your hero content here */}
        </div>
      </div>
    </section>
  );
}
