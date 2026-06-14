import Hero from "./components/Hero"
import FeaturesSection from "./components/FeaturesSection"; 
import AboutEnvironment from "./components/AboutEnvironment";
import VirtualTour from "./components/VirtualTour";
import TeamSection from "./components/TeamSection";
import ContactSection from "./components/ContactSection";
import ScrollToTop from "./components/ScrollToTop";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <FeaturesSection />
      <AboutEnvironment />
      <VirtualTour />
      <TeamSection />
      <ContactSection />
      <ScrollToTop />
    </main>
  );
}
