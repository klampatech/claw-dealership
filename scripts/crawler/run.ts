import { runCrawler } from '../../src/lib/crawler/index';

async function main() {
  console.log('='.repeat(50));
  console.log('Claw Dealership - AI Alternative Crawler');
  console.log('='.repeat(50));
  console.log('');

  try {
    const summary = await runCrawler();

    console.log('');
    console.log('='.repeat(50));
    console.log('CRAWLER SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total sources processed: ${summary.totalSources}`);
    console.log(`Total items found: ${summary.totalItemsFound}`);
    console.log(`Total items added: ${summary.totalItemsAdded}`);
    console.log(`Total duplicates skipped: ${summary.totalDuplicatesSkipped}`);
    console.log('');

    console.log('Results by source:');
    for (const result of summary.results) {
      console.log(`  ${result.source}:`);
      console.log(`    - Found: ${result.itemsFound}`);
      console.log(`    - Added: ${result.itemsAdded}`);
      console.log(`    - Skipped: ${result.duplicatesSkipped}`);
      if (result.errors.length > 0) {
        console.log(`    - Errors: ${result.errors.length}`);
        for (const error of result.errors.slice(0, 3)) {
          console.log(`      * ${error}`);
        }
      }
    }

    console.log('');
    console.log('Crawler run complete.');
  } catch (error) {
    console.error('Crawler failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
