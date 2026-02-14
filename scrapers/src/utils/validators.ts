/**
 * Data Validation Utilities for Scraped Properties
 * Validates extracted property data for quality and consistency
 */

import type { ScrapedProperty } from "../interfaces/scraper.interface.js";

// Validation constants
const MIN_PRICE_TND = 1000;
const MAX_PRICE_TND = 100000000;
const MAX_REASONABLE_SIZE_SQM = 10000;
const MIN_SIZE_SQM = 1;
const MAX_REASONABLE_BEDROOMS = 20;
const MIN_BEDROOMS = 0;
const MAX_REASONABLE_BATHROOMS = 20;
const MIN_BATHROOMS = 0;
const MAX_NEIGHBORHOOD_LENGTH = 100;
const PREVIEW_LENGTH = 50;

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

/**
 * Validates a scraped property for data quality issues
 * @param property The property to validate
 * @returns ValidationResult with validation status and warnings
 */
export function validateProperty(
  property: ScrapedProperty,
): ValidationResult {
  const warnings: string[] = [];

  // Validate price is reasonable (1,000 to 100 million TND)
  if (property.price !== undefined) {
    if (property.price < MIN_PRICE_TND || property.price > MAX_PRICE_TND) {
      warnings.push(
        `Invalid price: ${property.price} TND (should be between ${MIN_PRICE_TND.toLocaleString()} and ${MAX_PRICE_TND.toLocaleString()})`,
      );
      return { valid: false, warnings };
    }
  }

  // Validate size doesn't match listing_id pattern (listing IDs are typically large numbers like 3450699)
  if (property.size !== undefined) {
    if (property.size > MAX_REASONABLE_SIZE_SQM) {
      warnings.push(
        `Suspicious size: ${property.size} m² (might be listing_id, should be < ${MAX_REASONABLE_SIZE_SQM.toLocaleString()})`,
      );
      return { valid: false, warnings };
    }
    if (property.size < MIN_SIZE_SQM) {
      warnings.push(`Invalid size: ${property.size} m² (must be > 0)`);
      return { valid: false, warnings };
    }
  }

  // Validate bedrooms
  if (property.bedrooms !== undefined) {
    if (property.bedrooms > MAX_REASONABLE_BEDROOMS) {
      warnings.push(
        `Suspicious bedroom count: ${property.bedrooms} (might be listing_id, should be <= ${MAX_REASONABLE_BEDROOMS})`,
      );
      return { valid: false, warnings };
    }
    if (property.bedrooms < MIN_BEDROOMS) {
      warnings.push(`Invalid bedroom count: ${property.bedrooms} (must be >= 0)`);
      return { valid: false, warnings };
    }
  }

  // Validate bathrooms
  if (property.bathrooms !== undefined) {
    if (property.bathrooms > MAX_REASONABLE_BATHROOMS) {
      warnings.push(
        `Suspicious bathroom count: ${property.bathrooms} (might be listing_id, should be <= ${MAX_REASONABLE_BATHROOMS})`,
      );
      return { valid: false, warnings };
    }
    if (property.bathrooms < MIN_BATHROOMS) {
      warnings.push(
        `Invalid bathroom count: ${property.bathrooms} (must be >= 0)`,
      );
      return { valid: false, warnings };
    }
  }

  // Validate listing_id is not in numeric fields
  if (property.listing_id) {
    const listingIdNum = parseInt(property.listing_id, 10);
    if (
      property.size === listingIdNum ||
      property.bedrooms === listingIdNum ||
      property.bathrooms === listingIdNum
    ) {
      warnings.push(
        `listing_id ${property.listing_id} found in numeric fields - data mapping error`,
      );
      return { valid: false, warnings };
    }
  }

  // Validate neighborhood doesn't contain breadcrumb navigation
  if (property.neighborhood) {
    if (
      property.neighborhood.includes("Accueil") ||
      property.neighborhood.includes(">") ||
      property.neighborhood.length > MAX_NEIGHBORHOOD_LENGTH
    ) {
      warnings.push(
        `Neighborhood contains breadcrumb/navigation text: ${property.neighborhood.substring(0, PREVIEW_LENGTH)}...`,
      );
      return { valid: false, warnings };
    }
  }

  // Validate images are real property images
  if (property.images && property.images.length > 0) {
    const badImages = property.images.filter(
      (img) => !img.includes("/upload2/"),
    );
    if (badImages.length > 0) {
      warnings.push(
        `Found ${badImages.length} non-property images (not from /upload2/)`,
      );
      return { valid: false, warnings };
    }
  }

  // All validations passed
  return { valid: true, warnings };
}

/**
 * Validates an array of properties and returns only valid ones
 * @param properties Array of properties to validate
 * @returns Object with valid properties and validation stats
 */
export function filterValidProperties(properties: ScrapedProperty[]): {
  valid: ScrapedProperty[];
  invalid: number;
  warnings: string[];
} {
  const valid: ScrapedProperty[] = [];
  const allWarnings: string[] = [];
  let invalidCount = 0;

  for (const property of properties) {
    const result = validateProperty(property);
    if (result.valid) {
      valid.push(property);
    } else {
      invalidCount++;
      allWarnings.push(
        `Property ${property.listing_id}: ${result.warnings.join(", ")}`,
      );
    }
  }

  return { valid, invalid: invalidCount, warnings: allWarnings };
}
