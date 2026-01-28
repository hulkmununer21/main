import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { MapPin, Bed, Bath, Square, Calendar, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

interface RoomDetail {
  id: string;
  room_number: string;
  room_name?: string;
  room_type: string;
  monthly_rent: number;
  deposit_amount: number;
  size_sqm?: number;
  available_from?: string;
  notes?: string;
  features?: string[];
  primary_image?: string;
  other_image_urls?: string[];
  has_ensuite: boolean;
  property: {
    property_name: string;
    address_line1: string;
    city: string;
    postcode: string;
    total_bathrooms?: number;
  };
}

const PropertyDetail = () => {
  const { id } = useParams();
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            *,
            property:properties (
              property_name,
              address_line1,
              city,
              postcode,
              total_bathrooms
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        
        const roomData = data as any;
        setRoom(roomData);

        // Combine primary and gallery images for the UI
        const images = [];
        if (roomData.primary_image) images.push(roomData.primary_image);
        if (roomData.other_image_urls && Array.isArray(roomData.other_image_urls)) {
          images.push(...roomData.other_image_urls);
        }
        // Fallback if no images
        if (images.length === 0) {
          images.push("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800");
        }
        setGalleryImages(images);

      } catch (error) {
        console.error("Error loading room details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
        <Button asChild><Link to="/properties">Back to Listings</Link></Button>
      </div>
    );
  }

  const title = room.room_name || `${room.room_type.charAt(0).toUpperCase() + room.room_type.slice(1)} Room at ${room.property.property_name}`;
  const location = `${room.property.address_line1}, ${room.property.city} ${room.property.postcode}`;

  return (
    <>
      <SEO
        title={`${title} - Domus Servitia`}
        description={`Rent this ${room.room_type} room in ${room.property.city}. £${room.monthly_rent}/mo. ${room.notes?.substring(0, 100)}...`}
        keywords={`room for rent ${room.property.city}, ${room.room_type} room, lodging`}
        canonical={`https://domusservitia.co.uk/room/${id}`}
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <div className="mb-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-accent">Home</Link>
              {" / "}
              <Link to="/properties" className="hover:text-accent">Properties</Link>
              {" / "}
              <span className="text-foreground">{title}</span>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Image Gallery */}
                <div className="mb-8">
                  <div className={`grid gap-4 ${galleryImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Primary Image */}
                    <img
                      src={galleryImages[0]}
                      alt={title}
                      className={`w-full object-cover rounded-lg shadow-elegant ${galleryImages.length > 1 ? 'col-span-2 h-96' : 'h-[500px]'}`}
                    />
                    {/* Other Images (Limit to 2 for layout balance) */}
                    {galleryImages.slice(1, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${title} view ${index + 2}`}
                        className="w-full h-48 object-cover rounded-lg shadow-elegant"
                      />
                    ))}
                  </div>
                </div>

                {/* Property Info */}
                <div className="mb-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                        {title}
                      </h1>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-5 w-5 mr-2" />
                        <span>{location}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-accent">
                        £{room.monthly_rent}
                      </div>
                      <div className="text-sm text-muted-foreground">per month</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-8 py-6 border-y border-border">
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium capitalize">{room.room_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{room.has_ensuite ? "En-suite" : "Shared Bath"}</span>
                    </div>
                    {room.size_sqm && (
                      <div className="flex items-center gap-2">
                        <Square className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{Math.round(room.size_sqm * 10.76)} sqft</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{room.available_from ? `Available: ${room.available_from}` : "Available Now"}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                    Description
                  </h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {room.notes || "A beautiful room situated in a prime location. Contact us for more details."}
                  </p>
                </div>

                {/* Features */}
                {room.features && room.features.length > 0 && (
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                      Property Features
                    </h2>
                    <div className="grid md:grid-cols-2 gap-3">
                      {room.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-accent" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Enquiry Form */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 border-border shadow-elegant">
                  <CardContent className="p-6">
                    <h3 className="font-serif text-xl font-bold text-foreground mb-4">
                      Request to Lodge
                    </h3>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="John Doe" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+44 7000 000000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="moveDate">Preferred Move-in Date</Label>
                        <Input id="moveDate" type="date" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="I am interested in this room..."
                          rows={4}
                        />
                      </div>

                      <Button className="w-full bg-gradient-gold text-primary font-semibold shadow-gold hover:shadow-lifted">
                        Submit Request
                      </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-border">
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Or contact us directly
                      </p>
                      <Button variant="outline" className="w-full">
                        Call Us: +44 (0) 7000 000 000
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default PropertyDetail;