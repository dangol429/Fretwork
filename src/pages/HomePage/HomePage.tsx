import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Hero } from "../../components/Hero/Hero";
import { POPULAR_CHORDS } from "../../chords/popular";
import { useChordSearch } from "../../chords/useChordNav";
import { applyHeadTags } from "../../seo/head";
import { HOME_META } from "../../seo/meta";
import { JsonLd } from "../../seo/JsonLd";
import { webApplicationSchema } from "../../seo/schema";
import { useTheme } from "../../hooks/useTheme";
import "./HomePage.css";

type LocationState = { notFound?: string } | null;

/** The hero, plus what makes it a page rather than just an image: a way in
 *  for a crawler that never types into the nameplate, and the schema that
 *  says what this site is. */
export function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const search = useChordSearch();
  const location = useLocation();
  const notFound = (location.state as LocationState)?.notFound ?? null;

  useEffect(() => applyHeadTags(HOME_META), []);

  return (
    <>
      <Hero theme={theme} onToggleTheme={toggleTheme} onSearch={search} notFound={notFound} />

      <nav className="popular" aria-label="Popular chords">
        <h2 className="popular__title">Popular chords</h2>
        <ul className="popular__list">
          {POPULAR_CHORDS.map((chord) => (
            <li key={chord.slug}>
              <Link to={`/chord/${chord.slug}`}>{chord.name}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <JsonLd data={webApplicationSchema()} />
    </>
  );
}
