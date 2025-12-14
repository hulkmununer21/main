import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import SEO from "@/components/SEO";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";

const ContactPage = () => {
  return (
    <>
      <SEO
        title="Contact Domus Servitia - Property Services UK"
        description="Get in touch with Domus Servitia for property maintenance and lodging services. Based in Wolverhampton. Call, WhatsApp, or email us for assistance."
        keywords="contact property services, Domus Servitia contact, property maintenance Wolverhampton, UK property services contact"
        canonical="https://domusservitia.co.uk/contact"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-4">
            {/* Header */}
            <header className="text-center mb-16 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-text">
                Get in Touch
              </h1>
              <p className="text-lg text-muted-foreground">
                Have a question or need assistance? Our team is here to help. Contact us using the form below or reach out directly.
              </p>
            </header>

            {/* Contact Info Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              
              {/* Office Phone */}
              <div className="bg-card border border-border rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Office Number</h3>
                <p className="text-sm text-muted-foreground mb-2">Mon-Fri: 9am-5pm</p>
                <a href="tel:01902214066" className="text-accent font-semibold hover:underline">
                  01902 214 066
                </a>
              </div>

              {/* Email */}
              <div className="bg-card border border-border rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Email</h3>
                <p className="text-sm text-muted-foreground mb-2">We respond within 24hrs</p>
                <a href="mailto:info@domusservitia.co.uk" className="text-accent font-semibold hover:underline">
                  info@domusservitia.co.uk
                </a>
              </div>

              {/* WhatsApp */}
              <div className="bg-card border border-border rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                  {/* Changed icon to MessageCircle which looks like chat/whatsapp */}
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">WhatsApp</h3>
                <p className="text-sm text-muted-foreground mb-2">Direct Messaging</p>
                <a 
                  href="https://wa.me/447383925298" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-accent font-semibold hover:underline"
                >
                  +44 7383 925298
                </a>
              </div>

              {/* Main Office */}
              <div className="bg-card border border-border rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Main Office</h3>
                <p className="text-sm text-muted-foreground">
                  Liana Gardens,<br />Wolverhampton WV2 2AD
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="max-w-4xl mx-auto">
              <Contact />
            </div>

            {/* Office Locations */}
            <div className="mt-20 max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Our Location</h2>
              {/* Centered grid for single location */}
              <div className="flex justify-center">
                <div className="w-full max-w-md bg-gradient-to-br from-primary/5 to-accent/5 border border-border rounded-lg p-6">
                  <h3 className="font-bold text-xl mb-3 text-primary">Wolverhampton Office</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Liana Gardens<br />
                    Wolverhampton<br />
                    WV2 2AD<br />
                    United Kingdom
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Office:</span>{" "}
                      <a href="tel:01902214066" className="text-accent hover:underline">
                        01902 214 066
                      </a>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">WhatsApp:</span>{" "}
                      <a href="https://wa.me/447383925298" className="text-accent hover:underline">
                        +44 7383 925298
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ContactPage;