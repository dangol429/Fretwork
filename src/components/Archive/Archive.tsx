import type { CSSProperties } from "react";
import "./Archive.css";

/**
 * Two lines of the instrument's history, set as a museum placard in the top
 * corner of the screen — the card on the wall beside the piece rather than
 * writing on the piece itself.
 *
 * Kept deliberately quiet: a tracked label, a hairline, the year in the display
 * serif, one line of text. It should read as curated, and never compete with
 * the guitar for attention.
 */

type Entry = {
  year: string;
  place: string;
  line: string;
};

const ENTRIES: Entry[] = [
  {
    year: "c. 1550",
    place: "Spain",
    line: "The vihuela gives way to six courses of gut; something begins to be called a guitar.",
  },
  {
    year: "1850s",
    place: "Almería",
    line: "Antonio de Torres widens the body and fans the bracing; the modern guitar takes its shape.",
  },
];

export function Archive() {
  return (
    <aside className="archive" aria-labelledby="archive-label" data-enter="archive">
      <h2 className="archive__label" id="archive-label">
        From the archive
      </h2>
      <ol className="archive__list">
        {ENTRIES.map((entry, i) => (
          <li className="archive__entry" key={entry.year} style={{ "--i": i } as CSSProperties}>
            <p className="archive__head">
              <span className="archive__year">{entry.year}</span>
              <span className="archive__dot" aria-hidden="true">
                ·
              </span>
              <span className="archive__place">{entry.place}</span>
            </p>
            <p className="archive__line">{entry.line}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
