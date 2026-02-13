import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get bounding box
    const minLng = parseFloat(searchParams.get("minLng") || "7.5");
    const minLat = parseFloat(searchParams.get("minLat") || "30.2");
    const maxLng = parseFloat(searchParams.get("maxLng") || "11.6");
    const maxLat = parseFloat(searchParams.get("maxLat") || "37.5");

    // Get filters
    const propertyTypeParam = searchParams.get("propertyType");
    const propertyTypes = propertyTypeParam
      ? propertyTypeParam.split(",")
      : undefined;

    const transactionType = searchParams.get("transactionType") || undefined;
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999999");
    const minSize = parseFloat(searchParams.get("minSize") || "0");
    const maxSize = parseFloat(searchParams.get("maxSize") || "999999");
    const bedrooms = searchParams.get("bedrooms")
      ? parseInt(searchParams.get("bedrooms")!)
      : undefined;

    const hasParking = searchParams.get("hasParking") === "true";
    const hasElevator = searchParams.get("hasElevator") === "true";
    const hasPool = searchParams.get("hasPool") === "true";
    const hasGarden = searchParams.get("hasGarden") === "true";
    const hasSeaView = searchParams.get("hasSeaView") === "true";

    const governoratesParam = searchParams.get("governorates");
    const governorates = governoratesParam
      ? governoratesParam.split(",")
      : undefined;

    const limit = parseInt(searchParams.get("limit") || "500");

    // Build where clause
    const where: any = {
      status: "ACTIVE",
      latitude: {
        gte: minLat,
        lte: maxLat,
      },
      longitude: {
        gte: minLng,
        lte: maxLng,
      },
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
      size: {
        gte: minSize,
        lte: maxSize,
      },
    };

    if (propertyTypes && propertyTypes.length > 0) {
      where.propertyType = { in: propertyTypes };
    }

    if (transactionType && transactionType !== "ALL") {
      where.transactionType = transactionType;
    }

    if (bedrooms !== undefined) {
      where.bedrooms = { gte: bedrooms };
    }

    if (hasParking) {
      where.hasParking = true;
    }

    if (hasElevator) {
      where.hasElevator = true;
    }

    if (hasPool) {
      where.hasPool = true;
    }

    if (hasGarden) {
      where.hasGarden = true;
    }

    if (hasSeaView) {
      where.hasSeaView = true;
    }

    if (governorates && governorates.length > 0) {
      where.governorate = { in: governorates };
    }

    // Fetch properties
    const properties = await prisma.property.findMany({
      where,
      take: limit,
      select: {
        id: true,
        title: true,
        price: true,
        size: true,
        bedrooms: true,
        propertyType: true,
        transactionType: true,
        images: true,
        governorate: true,
        delegation: true,
        neighborhood: true,
        latitude: true,
        longitude: true,
      },
    });

    // Convert to GeoJSON format
    const geojson = {
      type: "FeatureCollection",
      features: properties.map((property) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [property.longitude, property.latitude],
        },
        properties: {
          id: property.id,
          title: property.title,
          price: property.price,
          size: property.size,
          bedrooms: property.bedrooms,
          propertyType: property.propertyType,
          transactionType: property.transactionType,
          images: property.images,
          governorate: property.governorate,
          delegation: property.delegation,
          neighborhood: property.neighborhood,
        },
      })),
    };

    return NextResponse.json(geojson);
  } catch (error) {
    console.error("Error fetching map properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
