/**
 * Multi-Source Scraper Interface Definitions
 * Defines TypeScript interfaces for the scraping system
 */

export interface ScraperConfig {
  source: 'tayara' | 'mubawab' | 'tunisie-annonce';
  governorates?: string[];
  propertyTypes?: string[];
  maxPages?: number;
  delayMin?: number;
  delayMax?: number;
  userAgent?: string;
}

export interface ScrapedProperty {
  // Identifiers
  source_url: string;
  listing_id: string;
  source_website: string;

  // Basic Information
  title: string;
  description?: string;
  price?: number;
  price_currency?: string;
  property_type?: string;
  transaction_type?: string;

  // Location
  governorate?: string;
  delegation?: string;
  neighborhood?: string;
  address?: string;
  latitude?: number;
  longitude?: number;

  // Property Details
  size?: number;
  size_unit?: string;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  price_per_m2?: number;

  // Features
  has_parking?: boolean;
  has_elevator?: boolean;
  has_pool?: boolean;
  has_garden?: boolean;
  has_sea_view?: boolean;
  is_furnished?: boolean;

  // Media
  images?: string[];
  virtual_tour?: string;

  // Contact Information
  contact_phone?: string;
  contact_name?: string;
  contact_email?: string;

  // Metadata
  listing_date?: string;
  scrape_timestamp: string;
  data_completeness_score?: number;
  content_hash?: string;
}

export interface ScrapeResult {
  source: string;
  success: boolean;
  propertiesScraped: number;
  errors: string[];
  startTime: string;
  endTime: string;
  duration: number;
  filePath?: string;
}

export interface ScrapeJobData {
  sources: ('tayara' | 'mubawab' | 'tunisie-annonce')[];
  type?: 'full' | 'incremental';
  governorates?: string[];
  propertyTypes?: string[];
  maxPages?: number;
  priority?: 'high' | 'normal' | 'low';
  trigger?: 'scheduled' | 'manual' | 'api';
}

export interface JobResult {
  jobId: string;
  success: boolean;
  results: ScrapeResult[];
  totalPropertiesScraped: number;
  errors: string[];
  completedAt: string;
}
