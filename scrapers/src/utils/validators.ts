/**
 * Data Validation Utilities for Scraped Properties
 * Validates extracted property data for quality and consistency
 */

import type { ScrapedProperty } from "../interfaces/scraper.interface.js";

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
    if (property.price < 1000 || property.price > 100000000) {
      warnings.push(
        `Invalid price: ${property.price} TND (should be between 1,000 and 100,000,000)`,
      );
      return { valid: false, warnings };
    }
  }

  // Validate size doesn't match listing_id pattern (listing IDs are typically large numbers like 3450699)
  if (property.size !== undefined) {
    if (property.size > 10000) {
      warnings.push(
        `Suspicious size: ${property.size} m² (might be listing_id, should be < 10,000)`,
      );
      return { valid: false, warnings };
    }
    if (property.size < 1) {
      warnings.push(`Invalid size: ${property.size} m² (must be > 0)`);
      return { valid: false, warnings };
    }
  }

  // Validate bedrooms
  if (property.bedrooms !== undefined) {
    if (property.bedrooms > 20) {
      warnings.push(
        `Suspicious bedroom count: ${property.bedrooms} (might be listing_id, should be <= 20)`,
      );
      return { valid: false, warnings };
    }
    if (property.bedrooms < 0) {
      warnings.push(`Invalid bedroom count: ${property.bedrooms} (must be >= 0)`);
      return { valid: false, warnings };
    }
  }

  // Validate bathrooms
  if (property.bathrooms !== undefined) {
    if (property.bathrooms > 20) {
      warnings.push(
        `Suspicious bathroom count: ${property.bathrooms} (might be listing_id, should be <= 20)`,
      );
      return { valid: false, warnings };
    }
    if (property.bathrooms < 0) {
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
      property.neighborhood.length > 100
    ) {
      warnings.push(
        `Neighborhood contains breadcrumb/navigation text: ${property.neighborhood.substring(0, 50)}...`,
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
