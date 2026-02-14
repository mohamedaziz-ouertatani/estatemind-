import puppeteer from "puppeteer";

async function testMubawab() {
  console.log("Testing Mubawab with visual browser...\n");

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const url = "https://www.mubawab.tn/fr/sc/appartements-a-vendre";
  console.log("Going to:", url);

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("\nExtracting data...\n");

  const data = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll("a[href]"));

    const patterns = [
      { name: "Has .html", filter: (a: any) => a.href.includes(".html") },
      {
        name: "Has /fr/ and numbers",
        filter: (a: any) => a.href.includes("/fr/") && a.href.match(/\d/),
      },
      { name: "Has /vente-", filter: (a: any) => a.href.includes("/vente-") },
      {
        name: "Has /appartement-",
        filter: (a: any) => a.href.includes("/appartement-"),
      },
      { name: "All /fr/ links", filter: (a: any) => a.href.includes("/fr/") },
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

testMubawab().catch(console.error);
