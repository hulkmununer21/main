import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { MapPin, Bed, Bath, Square, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

// Define the shape of the data from the DB
interface RoomData {
  id: string;
  room_number: string;
  room_name?: string;
  room_type: string;
  monthly_rent: number;
  size_sqm?: number;
  has_ensuite: boolean;
  room_status: string; // 'available' | 'occupied' | 'reserved' | 'under_maintenance'
  is_featured: boolean;
  primary_image?: string;
  other_image_urls?: string[];
  property: {
    property_name: string;
    city: string;
    address_line1: string;
  };
}

const Properties = () => {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Rooms + Parent Property Details
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            *,
            property:properties (
              property_name,
              city,
              address_line1
            )
          `)
          .order('is_featured', { ascending: false }); // Show featured first

        if (error) throw error;
        setRooms(data as any || []);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // 2. Filter Logic (Client-side for responsiveness)
  const filteredRooms = rooms.filter((room) => {
    const term = searchTerm.toLowerCase();
    return (
      room.property.city.toLowerCase().includes(term) ||
      room.property.property_name.toLowerCase().includes(term) ||
      room.room_number.toLowerCase().includes(term)
    );
  });

  // 3. Helper: Get Display Image (Primary -> First Gallery -> Fallback)
  const getDisplayImage = (room: RoomData) => {
    if (room.primary_image) return room.primary_image;
    if (room.other_image_urls && room.other_image_urls.length > 0) return room.other_image_urls[0];
    return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"; // Fallback
  };

  // 4. Helper: Get Display Title
  const getDisplayTitle = (room: RoomData) => {
    if (room.room_name) return room.room_name;
    return `${room.room_type.charAt(0).toUpperCase() + room.room_type.slice(1)} Room - ${room.property.property_name}`;
  };

  // 5. Helper: Status Badge Logic
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">Available</div>;
      case "occupied":
        return <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">Occupied</div>;
      case "reserved":
        return <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">Reserved</div>;
      case "under_maintenance":
        return <div className="absolute top-4 right-4 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">Maintenance</div>;
      default:
        return null;
    }
  };

  return (
    <>
      <SEO
        title="Available Properties - Domus Servitia | Quality UK Accommodation"
        description="Browse our selection of quality properties available for lodging across the UK."
        keywords="properties for rent UK, lodging Manchester, apartments London"
        canonical="https://domusservitia.co.uk/properties"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
      
        {/* Header Section */}
        <section className="pt-32 pb-16 bg-gradient-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                Available Listings
              </h1>
              <p className="text-xl text-primary-foreground/90 mb-8">
                Browse our selection of quality rooms and properties available for lodging.
              </p>

              {/* Search Bar */}
              <div className="bg-card/95 backdrop-blur-sm p-4 rounded-xl shadow-lifted">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Search by city, property name, or room number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 h-12"
                  />
                  <Button className="h-12 px-8 bg-gradient-gold text-primary font-semibold">
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters Section (Visual Only for now) */}
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-4 justify-center">
              <select className="h-10 px-4 rounded-md border border-border bg-background">
                <option>Room Type</option>
                <option>Single</option>
                <option>Double</option>
                <option>En-suite</option>
                <option>Studio</option>
              </select>
              <select className="h-10 px-4 rounded-md border border-border bg-background">
                <option>Price Range</option>
                <option>£300 - £600</option>
                <option>£600 - £900</option>
                <option>£900+</option>
              </select>
              <Button variant="outline" className="h-10" onClick={() => setSearchTerm("")}>
                Reset Filters
              </Button>
            </div>
          </div>
        </section>

        {/* Properties Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">No properties found matching your search.</p>
                <Button variant="link" onClick={() => setSearchTerm("")}>Clear Search</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => (
                  <Card
                    key={room.id}
                    className="group overflow-hidden border-border hover:shadow-lifted transition-all duration-300"
                  >
                    <div className="relative overflow-hidden h-64">
                      <img
                        src={getDisplayImage(room)}
                        alt={getDisplayTitle(room)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      
                      {/* Featured Badge (Top Left) */}
                      {room.is_featured && (
                        <div className="absolute top-4 left-4 bg-accent text-primary px-3 py-1 rounded-full text-xs font-semibold shadow-sm z-10">
                          Featured
                        </div>
                      )}

                      {/* Status Badge (Top Right) */}
                      {getStatusBadge(room.room_status)}
                    </div>

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                          {getDisplayTitle(room)}
                        </h3>
                        <span className="text-accent font-bold text-xl whitespace-nowrap ml-2">
                          £{room.monthly_rent}
                          <span className="text-sm font-normal text-muted-foreground">
                            /mo
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center text-muted-foreground text-sm mb-4">
                        <MapPin className="h-4 w-4 mr-1 shrink-0" />
                        <span className="line-clamp-1">
                          {room.property.city}, {room.property.address_line1}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          <span className="capitalize">{room.room_type}</span>
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />
                          <span>{room.has_ensuite ? "En-suite" : "Shared"}</span>
                        </div>
                        <div className="flex items-center">
                          <Square className="h-4 w-4 mr-1" />
                          <span>{room.size_sqm ? Math.round(room.size_sqm * 10.76) : 0} sqft</span>
                        </div>
                      </div>

                      <Button
                        asChild
                        variant="outline"
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        disabled={room.room_status !== 'available'}
                      >
                        <Link to={`/property/${room.id}`}>
                          {room.room_status === 'available' ? "View Details" : "Currently Unavailable"}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Properties;