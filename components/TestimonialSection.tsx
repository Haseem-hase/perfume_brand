import { ParallaxScroll } from "./ui/parallax-scroll";

export default function TestimonialSection() {
  const images = [
    "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
  ];

  return (
    <section className="py-10">
      <div className="px-10 mx-auto">
        <h2 className="text-4xl md:text-4xl uppercase mb-6">
          Testimonials
        </h2>
        <div className="px-2">
          <ParallaxScroll images={images} />
        </div>
      </div>
    </section>
  );
}
