// Next's launcher checks NODE_OPTIONS before assigning half of physical RAM
// to its child server. A flag on the parent node command alone is overwritten.
process.env.NODE_OPTIONS =
  `${process.env.NODE_OPTIONS ?? ''} --max-old-space-size=2048`.trim();
process.argv.splice(2, 0, 'dev');
await import('next/dist/bin/next');
