import puppeteer from "puppeteer";

async function testTunisie() {
  console.log("Testing Tunisie Annonce with visual browser...\n");

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const url = "http://www.tunisie-annonce.com/AnnoncesImmobilier.asp";
  console.log("Going to:", url);

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("\nExtracting data...\n");

  const data = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll("a[href]"));

    const patterns = [
      {
        name: "Has DetailAnnonce",
        filter: (a: any) => a.href.includes("DetailAnnonce"),
      },
      { name: "Has Detail", filter: (a: any) => a.href.includes("Detail") },
      {
        name: "Has IdAnnonce",
        filter: (a: any) => a.href.includes("IdAnnonce"),
      },
      { name: "Has .asp", filter: (a: any) => a.href.includes(".asp") },
    ];

    const results: any = { totalLinks: allLinks.length };

    patterns.forEach((p) => {
      const matches = allLinks.filter(p.filter);
      results[p.name] = {
        count: matches.length,
        samples: matches.slice(0, 3).map((a: any) => ({
          href: a.href,
          text: (a.textContent || "").trim().substring(0, 60),
        })),
      };
    });

    const tables = document.querySelectorAll("table");
    const rows = document.querySelectorAll("tr");

    results.structure = {
      tables: tables.length,
      rows: rows.length,
    };

    return results;
  });

  console.log("Results:");
  console.log(JSON.stringify(data, null, 2));

  console.log(
    "\n\nBrowser staying open for 30 seconds for manual inspection...",
  );
  await new Promise((resolve) => setTimeout(resolve, 30000));

  await browser.close();
}

testTunisie().catch(console.error);
