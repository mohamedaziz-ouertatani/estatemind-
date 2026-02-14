import puppeteer from "puppeteer";

async function debugTunisieLinks() {
  console.log("Debugging Tunisie Annonce links loading...\n");

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log("Navigating to page...");
  await page.goto("http://www.tunisie-annonce.com/AnnoncesImmobilier.asp", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  console.log("Page loaded. Checking links at different intervals...\n");

  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const linkInfo = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll("a[href]"));
      const allHrefs = allLinks.map((a) => a.getAttribute("href") || "");

      const patterns = {
        DetailsAnnonceImmobilier: allHrefs.filter((h) =>
          h.includes("DetailsAnnonceImmobilier"),
        ).length,
        DetailAnnonce: allHrefs.filter((h) => h.includes("DetailAnnonce"))
          .length,
        Detail: allHrefs.filter((h) => h.includes("Detail")).length,
        cod_ann: allHrefs.filter((h) => h.includes("cod_ann")).length,
        IdAnnonce: allHrefs.filter((h) => h.includes("IdAnnonce")).length,
      };

      const samples = allHrefs
        .filter((h) => h.includes("Detail") || h.includes("cod_ann"))
        .slice(0, 3);

      return {
        totalLinks: allLinks.length,
        patterns,
        samples,
      };
    });

    console.log(`Check ${i + 1} (after ${(i + 1) * 2}s):`);
    console.log(JSON.stringify(linkInfo, null, 2));
    console.log("");
  }

  console.log("Taking screenshot...");
  await page.screenshot({ path: "tunisie-debug.png", fullPage: true });
  console.log("Screenshot saved: tunisie-debug.png\n");

  console.log("Getting page HTML...");
  const html = await page.content();
  const detailCount = (html.match(/DetailsAnnonceImmobilier/g) || []).length;
  console.log(
    `HTML contains "DetailsAnnonceImmobilier" ${detailCount} times\n`,
  );

  console.log("Browser staying open for 60 seconds for manual inspection...");
  console.log("Check if you can see property listings on the page!");
  await new Promise((resolve) => setTimeout(resolve, 60000));

  await browser.close();
}

debugTunisieLinks().catch(console.error);
