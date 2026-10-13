import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ComponentProps } from "react";
import { text, type Block, type Inline } from "@/lib/document";

/** react-pdf style prop (taken from View, whose type excludes the SVG variant). */
type TextStyle = ComponentProps<typeof View>["style"];

// Legal documents aren't hyphenated, and hyphenation splits URLs mid-word.
Font.registerHyphenationCallback((word) => [word]);

const FONT_FAMILY = "Noto Serif";

/**
 * Embeds Noto Serif (public/fonts) so names and addresses in Latin, Greek and
 * Cyrillic scripts render correctly; the built-in PDF fonts only cover Western
 * European characters. `fontUrl` maps a font file name to where it can be loaded.
 */
export function registerPdfFonts(fontUrl: (fileName: string) => string) {
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: fontUrl("NotoSerif-Regular.ttf") },
      { src: fontUrl("NotoSerif-Bold.ttf"), fontWeight: "bold" },
    ],
  });
}

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    lineHeight: 1.45,
    // Ligature glyphs (fi, ff) lose their letters when text is copied or searched.
    fontFeatureSettings: { liga: false },
  },
  title: { fontWeight: "bold", fontSize: 14, textAlign: "center", marginBottom: 14 },
  heading: { fontWeight: "bold", fontSize: 11, marginTop: 10 },
  note: { fontSize: 8, fontWeight: "normal", color: "#666666" },
  paragraph: { marginVertical: 3 },
  clause: { marginVertical: 4, textAlign: "justify" },
  bold: { fontWeight: "bold" },
  link: { color: "#1d4ed8", textDecoration: "none" },
  choice: { flexDirection: "row", marginVertical: 2 },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 0.75,
    borderColor: "#000000",
    marginTop: 2.5,
    marginRight: 6,
    fontSize: 7,
    lineHeight: 1,
    textAlign: "center",
  },
  choiceText: { flex: 1 },
  table: { marginTop: 6, marginBottom: 10, borderTopWidth: 0.75, borderLeftWidth: 0.75, borderColor: "#999999" },
  row: { flexDirection: "row", minHeight: 26 },
  cell: { flex: 1, padding: 5, borderRightWidth: 0.75, borderBottomWidth: 0.75, borderColor: "#999999" },
  labelCell: { flex: 0.7 },
  headerText: { fontWeight: "bold", textAlign: "center" },
});

function inlineNode(inline: Inline, key: number) {
  switch (inline.kind) {
    case "bold":
      return <Text key={key} style={styles.bold}>{inline.text}</Text>;
    case "link":
      return <Link key={key} src={inline.href} style={styles.link}>{inline.text}</Link>;
    // Defined terms and entered values are plain text in the final document;
    // highlighting them is only an on-screen editing aid.
    case "term":
    case "value":
    case "text":
      return inline.text;
  }
}

/**
 * Forbids line breaks inside words. Without it, react-pdf treats boundaries
 * between styled runs (e.g. an opening quote before bold text) as hyphenation
 * points and inserts a stray "-".
 */
const NO_HYPHENATION_PENALTY = 10_000;

function Inlines({ inlines, style }: { inlines: Inline[]; style?: TextStyle }) {
  return (
    <Text style={style} hyphenationPenalty={NO_HYPHENATION_PENALTY}>
      {inlines.map(inlineNode)}
    </Text>
  );
}

function PdfBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case "title":
      return <Text style={styles.title}>{block.text}</Text>;
    case "heading":
      return (
        <View wrap={false} style={styles.heading}>
          <Text>{block.text}</Text>
          {block.note && <Text style={styles.note}>{block.note}</Text>}
        </View>
      );
    case "paragraph":
      return <Inlines inlines={block.content} style={styles.paragraph} />;
    case "clause":
      return <Inlines inlines={[text(`${block.number}. `), ...block.content]} style={styles.clause} />;
    case "choice":
      return (
        <View>
          {block.options.map((option, i) => (
            <View key={i} style={styles.choice} wrap={false}>
              <Text style={styles.checkbox}>{option.selected ? "X" : " "}</Text>
              <Inlines inlines={option.content} style={styles.choiceText} />
            </View>
          ))}
        </View>
      );
    case "parties":
      return (
        <View wrap={false}>
          <Inlines inlines={block.intro} style={styles.paragraph} />
          <View style={styles.table}>
            <View style={styles.row}>
              <View style={[styles.cell, styles.labelCell]} />
              {block.headers.map((header) => (
                <View key={header} style={styles.cell}>
                  <Text style={styles.headerText}>{header}</Text>
                </View>
              ))}
            </View>
            {block.rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <View style={[styles.cell, styles.labelCell]}>
                  <Text style={styles.bold}>{row.label}</Text>
                  {row.note && <Text style={styles.note}>{row.note}</Text>}
                </View>
                {row.values.map((cell, i) => (
                  <View key={i} style={styles.cell}>
                    <Inlines inlines={[cell]} />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      );
  }
}

/** One PDF page (flowing onto more as needed) per section. */
export function NdaPdf({ sections, title }: { sections: Block[][]; title: string }) {
  return (
    <Document title={title} creator="Prelegal" producer="Prelegal">
      {sections.map((blocks, s) => (
        <Page key={s} size="LETTER" style={styles.page}>
          {blocks.map((block, i) => (
            <PdfBlock key={i} block={block} />
          ))}
        </Page>
      ))}
    </Document>
  );
}
