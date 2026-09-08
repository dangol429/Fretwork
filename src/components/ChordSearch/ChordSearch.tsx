import { useState, type CSSProperties, type FormEvent } from "react";
import { PLATE, VIEW, pctX, pctY } from "../Guitar/geometry";
import { warmChords } from "../../chords/load";
import "./ChordSearch.css";

const HINTS = ["A♯", "B♭", "Am"];

type ChordSearchProps = {
  onFocusChange: (focused: boolean) => void;
  /** Called on focus and on every keystroke, so the strings can respond. */
  onPluck: () => void;
  onSearch: (query: string) => void;
  /** A query that came back as something we could not read as a chord. */
  notFound?: string | null;
};

/**
 * The search field itself: a real <input> parked exactly on the nameplate that
 * the Guitar draws into the neck.
 *
 * Position comes from the same geometry the SVG uses, and the stage is locked
 * to the artwork's aspect ratio, so the two cannot drift apart.
 */
export function ChordSearch({ onFocusChange, onPluck, onSearch, notFound }: ChordSearchProps) {
  const [value, setValue] = useState(() => notFound ?? "");
  const [focused, setFocused] = useState(false);

  // A query that did not resolve stays in the field, so it can be corrected
  // rather than retyped — including when it arrived from a link. Adjusted
  // during render rather than in an effect: there is no external system here,
  // only one piece of state catching up with another.
  const [lastMiss, setLastMiss] = useState(notFound);
  if (notFound !== lastMiss) {
    setLastMiss(notFound);
    if (notFound) setValue(notFound);
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (query) onSearch(query);
  };

  const plateBox: CSSProperties = {
    left: pctX(PLATE.x),
    top: pctY(PLATE.y),
    width: pctX(PLATE.w),
    height: pctY(PLATE.h),
    borderRadius: `${(PLATE.r / VIEW.w) * 100}cqw`,
  };

  return (
    <form
      className={`chord-search${focused ? " is-focused" : ""}`}
      role="search"
      onSubmit={handleSubmit}
    >
      <label className="chord-search__field" style={plateBox}>
        <span className="visually-hidden">Search a chord</span>
        <input
          className="chord-search__input"
          type="search"
          name="chord"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            onPluck();
          }}
          onFocus={() => {
            setFocused(true);
            onFocusChange(true);
            onPluck();
            // Touching the field is the earliest honest signal that an answer
            // is coming, so the chord engine starts loading now rather than on
            // Enter — by then it is usually already here.
            warmChords();
          }}
          onBlur={() => {
            setFocused(false);
            onFocusChange(false);
          }}
          placeholder="Search a chord…"
          aria-describedby="chord-hint"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
        />
      </label>

      {/* Sits in the clear space under the neck — nothing to collide with.
          Kept in the accessibility tree at all times so the input keeps its
          description; only the visual reveal waits for focus. */}
      <p className="chord-search__hints" id="chord-hint">
        <span className="chord-search__hints-label">Try</span>
        {HINTS.map((hint, i) => (
          <button
            key={hint}
            type="button"
            className="chord-search__chip"
            style={{ "--i": i } as CSSProperties}
            // The field never has focus when a chip is clicked, so filling it
            // in and searching in one go is the only useful behaviour.
            onMouseDown={(event) => event.preventDefault()}
            onPointerEnter={warmChords}
            onClick={() => {
              setValue(hint);
              onSearch(hint);
            }}
          >
            {hint}
          </button>
        ))}
      </p>

      {notFound && (
        <p className="chord-search__miss" role="status">
          <span className="chord-search__miss-name">{notFound}</span> is not a chord we can read.
          Try a root and a quality — <span className="chord-search__miss-eg">F♯m7</span>,{" "}
          <span className="chord-search__miss-eg">Bb</span>,{" "}
          <span className="chord-search__miss-eg">Csus4</span>.
        </p>
      )}
    </form>
  );
}
