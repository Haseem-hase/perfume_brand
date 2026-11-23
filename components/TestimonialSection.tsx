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
    <section className="py-16 px-12">
      <div className="mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Testimonials
        </h2>
        <ParallaxScroll images={images} />
      </div>
    </section>
  );
}
