import puppeteer from "puppeteer";

async function debugTunisieExtract() {
  console.log("Debugging Tunisie Annonce extraction...\n");

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto("http://www.tunisie-annonce.com/AnnoncesImmobilier.asp", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("Running extraction logic...\n");

  const result = await page.evaluate(() => {
    const results: any[] = [];

    const allLinks = Array.from(document.querySelectorAll("a[href]"));
    console.log("Total links found:", allLinks.length);

    const detailLinks = allLinks.filter((a) => {
      const href = a.getAttribute("href") || "";
      return href.includes("DetailsAnnonceImmobilier");
    });

    console.log("Detail links found:", detailLinks.length);

    detailLinks.forEach((link, index) => {
      try {
        const href = link.getAttribute("href") || "";
        const sourceUrl = href.startsWith("http")
          ? href
          : "http://www.tunisie-annonce.com/" + href;
        const listingId = href.match(/cod_ann=(\d+)/)?.[1] || "";
        const title = link.textContent?.trim() || "";

        console.log(`Link ${index + 1}:`);
        console.log("  URL:", sourceUrl);
        console.log("  ID:", listingId);
        console.log("  Title:", title);
        console.log("  Title length:", title.length);

        let container = link.closest("tr") || link.closest("td");
        if (!container) {
          container = link.parentElement;
        }

        console.log("  Container found:", !!container);

        if (container) {
          const allText = container.textContent || "";
          console.log("  Container text length:", allText.length);
          console.log("  Container text preview:", allText.substring(0, 100));
        }

        // Check if conditions pass
        const hasUrl = !!sourceUrl;
        const hasTitle = !!title;
        const titleLongEnough = title.length > 5;

        console.log("  Passes checks:", { hasUrl, hasTitle, titleLongEnough });

        if (sourceUrl && title && title.length > 5) {
          results.push({
            source_url: sourceUrl,
            listing_id: listingId,
            title: title.substring(0, 200),
          });
          console.log("  ✓ Added to results");
        } else {
          console.log("  ✗ NOT added to results");
        }
        console.log("");
      } catch (err) {
        console.error("Error extracting listing:", err);
      }
    });

    console.log("Total results:", results.length);

    return {
      totalLinks: allLinks.length,
      detailLinks: detailLinks.length,
      results: results,
    };
  });

  console.log("\n=== Final Results ===");
  console.log(JSON.stringify(result, null, 2));

  console.log("\nBrowser staying open for 30 seconds...");
  await new Promise((resolve) => setTimeout(resolve, 30000));

  await browser.close();
}

debugTunisieExtract().catch(console.error);
