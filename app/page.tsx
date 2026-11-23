import HeroSection from '@/components/HeroSection'
import PerfumeCarousel from '@/components/PerfumeCarousel/PerfumeCarousel'

export default function Page() {
  return (
    <>
      <HeroSection />
      
      {/* Collections Section */}
      <section className="py-10">
        <div className="px-10 mx-auto">
          <h2 className="text-4xl md:text-4xl uppercase">
            Our Collections
          </h2>
        </div>
      </section>

      <PerfumeCarousel />
    </>
  )
}