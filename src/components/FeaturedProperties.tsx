import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Bed, Bath, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

// Define the shape of the data coming from the DB join
interface RoomData {
  id: string;
  room_name?: string;
  room_number: string;
  room_type: string;
  monthly_rent: number;
  size_sqm?: number;
  primary_image?: string;
  other_image_urls?: string[];
  has_ensuite: boolean;
  property: {
    property_name: string;
    city: string;
    address_line1: string;
    total_bathrooms?: number;
  };
}

const FeaturedProperties = () => {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedRooms();
  }, []);

  const fetchFeaturedRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_name,
          room_number,
          room_type,
          monthly_rent,
          size_sqm,
          primary_image,
          other_image_urls,
          has_ensuite,
          property:properties (
            property_name,
            city,
            address_line1,
            total_bathrooms
          )
        `)
        .eq('is_featured', true) // ✅ Only fetching featured rooms
        .eq('room_status', 'available') // Optional: Only show available rooms?
        .limit(4);

      if (error) throw error;

      // We need to cast the data because Supabase returns 'property' as an array or object depending on relationship type
      // In this case (Many-to-One), it returns a single object.
      setRooms(data as any || []);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Helper to get the best display image
  const getDisplayImage = (room: RoomData) => {
    if (room.primary_image) return room.primary_image;
    if (room.other_image_urls && room.other_image_urls.length > 0) return room.other_image_urls[0];
    return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"; // Fallback placeholder
  };

  // Helper to construct a display title
  const getDisplayTitle = (room: RoomData) => {
    if (room.room_name) return room.room_name;
    // Formatting: "Double Room in Manchester"
    return `${room.room_type.charAt(0).toUpperCase() + room.room_type.slice(1)} Room - ${room.property.property_name}`;
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            Featured Properties
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our handpicked selection of premium rooms available
            for lodging across the UK.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>No featured properties available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="group overflow-hidden border-border hover:shadow-lifted transition-all duration-300"
              >
                <div className="relative overflow-hidden h-48 sm:h-56 md:h-64">
                  <img
                    src={getDisplayImage(room)}
                    alt={getDisplayTitle(room)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Since we filter by is_featured=true, this badge is always relevant here */}
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-accent text-primary px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
                    Featured
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground line-clamp-2 flex-1">
                      {getDisplayTitle(room)}
                    </h3>
                    <span className="text-accent font-bold text-lg sm:text-xl whitespace-nowrap">
                      {formatPrice(room.monthly_rent)}
                      <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                        /mo
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {room.property.city}, {room.property.address_line1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    <div className="flex items-center gap-1">
                      <Bed className="h-3 w-3 sm:h-4 sm:w-4" />
                      {/* Logic: Single=1, Double=1 (but larger), we can default to 1 for rooms */}
                      <span className="capitalize">{room.room_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-3 w-3 sm:h-4 sm:w-4" />
                      {/* Logic: Check if ensuite, otherwise it's likely shared/unknown */}
                      <span>{room.has_ensuite ? "En-suite" : "Shared"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Square className="h-3 w-3 sm:h-4 sm:w-4" />
                      {/* Convert SQM to SQFT approx x10.7 */}
                      <span className="whitespace-nowrap">
                        {room.size_sqm ? Math.round(room.size_sqm * 10.764) : 0} sqft
                      </span>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                  >
                    <Link to={`/property/${room.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-gold text-primary font-semibold shadow-gold hover:shadow-lifted transition-all duration-300"
          >
            <Link to="/properties">View All Rooms</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;