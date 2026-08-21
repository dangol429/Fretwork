import { useCallback, useState, type CSSProperties } from "react";
import { Archive } from "../Archive/Archive";
import { ChordSearch } from "../ChordSearch/ChordSearch";
import { Guitar } from "../Guitar/Guitar";
import { PLATE_CENTER_PCT } from "../Guitar/geometry";
import { PickToggle } from "../PickToggle/PickToggle";
import { MAKER_NAME, SITE_NAME, TAGLINE } from "../../config";
import type { Theme } from "../../hooks/useTheme";
import "./Hero.css";

type HeroProps = {
  theme: Theme;
  onToggleTheme: () => void;
  onSearch: (query: string) => void;
  /** A query that came back unreadable, so the field can show why. */
  notFound?: string | null;
};

export function Hero({ theme, onToggleTheme, onSearch, notFound }: HeroProps) {
  const [focused, setFocused] = useState(false);
  const [pluck, setPluck] = useState(0);
  const [flip, setFlip] = useState(0);

  const handlePluck = useCallback(() => setPluck((count) => count + 1), []);

  // The pick is wedged under the strings, so turning it over sounds them.
  const handleFlip = useCallback(() => {
    setFlip((count) => count + 1);
    setPluck((count) => count + 1);
    onToggleTheme();
  }, [onToggleTheme]);

  return (
    <main className="hero">
      <Archive />

      <div className="hero__intro">
        <h1 className="hero__wordmark" data-enter="wordmark">
          {SITE_NAME}
        </h1>
        <p className="hero__tagline" data-enter="tagline">
          {TAGLINE}
        </p>
      </div>

      {/* Locked to the artwork's aspect ratio, which is what lets the real input
          sit exactly on the nameplate the SVG draws — and the pick button sit
          exactly on the pick. Also the container the cqw-based type inside
          scales against. */}
      <div
        className="hero__stage"
        style={{ "--plate-center": PLATE_CENTER_PCT } as CSSProperties}
      >
        <Guitar focused={focused} pluck={pluck} flip={flip} makerName={MAKER_NAME} />
        <ChordSearch
          onFocusChange={setFocused}
          onPluck={handlePluck}
          onSearch={onSearch}
          notFound={notFound}
        />
        <PickToggle theme={theme} onToggle={handleFlip} />
      </div>
    </main>
  );
}
