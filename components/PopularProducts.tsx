import Image from "next/image";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
};

export default function PopularProducts() {
  const products: Product[] = [
    {
      id: 1,
      name: "Oud Noir",
      description: "Rich and mysterious oriental fragrance",
      price: "$129.00",
      image: "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    },
    {
      id: 2,
      name: "Bleu Royal",
      description: "Fresh aquatic notes with woody base",
      price: "$119.00",
      image: "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    },
    {
      id: 3,
      name: "Vert Émeraude",
      description: "Green and herbal with citrus twist",
      price: "$109.00",
      image: "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    },
    {
      id: 4,
      name: "Rose Fumé",
      description: "Smoky floral with amber warmth",
      price: "$139.00",
      image: "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    },
    {
      id: 5,
      name: "Ambre Soleil",
      description: "Warm amber with vanilla notes",
      price: "$115.00",
      image: "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    },
    {
      id: 6,
      name: "Violet Nuit",
      description: "Deep violet with powdery finish",
      price: "$125.00",
      image: "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    },
    {
      id: 7,
      name: "Blanc Musc",
      description: "Clean musk with cotton notes",
      price: "$99.00",
      image: "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    },
    {
      id: 8,
      name: "Cuir Intense",
      description: "Leather accord with spicy undertones",
      price: "$149.00",
      image: "/assets/Images/front-view-cologne-bottle-rotten-tree-branch-beige-wooden-background.jpg",
    },
  ];

  return (
    <section className="py-16 px-10">
      <div className="mx-auto">
        <h2 className="text-4xl md:text-4xl uppercase mb-12">
          Popular Products
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold uppercase tracking-wide">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
                <p className="text-xl font-bold">
                  {product.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
