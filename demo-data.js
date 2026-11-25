// The samples the start screen offers, one card each: `file` is the archive the card opens, `thumb` a small picture
// for the card. The first opens when the viewer starts without a file (the `demo` feature). A deployment can offer
// others with `samples` in config.js; a page that embeds the viewer, its own (see the README).
const DEFAULT_SAMPLES = [
  {
    title: "Docling paper",
    subtitle: "Eight pages from arXiv",
    file: "assets/2501.17887.dclx",
    thumb: "assets/samples/2501.17887.jpg",
  },
  {
    title: "Artemis",
    subtitle: "A video clip with chapters",
    file: "assets/artemis.dclx",
    thumb: "assets/samples/artemis.jpg",
  },
];
