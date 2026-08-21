import type { CSSProperties } from "react";
import { PICK, pctX, pctY } from "../Guitar/geometry";
import type { Theme } from "../../hooks/useTheme";
import "./PickToggle.css";

type PickToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

/**
 * The dark-mode switch: the guitar pick tucked under the strings.
 *
 * The pick itself is drawn inside the Guitar SVG, between the headstock and the
 * strings, so the two lowest strings really do cross over it — an HTML element
 * layered on top could never sit under them. What lives here is the button: a
 * transparent hit area parked on exactly the same spot, taking the click, the
 * keyboard focus and the label, and driving the drawing's hover and focus
 * states through `:has()` in PickToggle.css.
 *
 * Position comes from the same geometry the SVG draws from, and the stage is
 * locked to the artwork's aspect ratio, so the button cannot drift off the pick.
 */
export function PickToggle({ theme, onToggle }: PickToggleProps) {
  const hitBox: CSSProperties = {
    left: pctX(PICK.cx - PICK.hitW / 2),
    top: pctY(PICK.cy - PICK.hitH / 2),
    width: pctX(PICK.hitW),
    height: pctY(PICK.hitH),
    "--pick-tilt": `${PICK.tilt}deg`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className="pick-toggle"
      style={hitBox}
      onClick={onToggle}
      aria-label="Toggle dark mode"
      aria-pressed={theme === "dark"}
    />
  );
}
