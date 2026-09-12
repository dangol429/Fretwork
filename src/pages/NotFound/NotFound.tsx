import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SITE_NAME } from "../../config";
import "./NotFound.css";

type NotFoundProps = {
  /** The chord slug or query that didn't resolve, when there was one. */
  query?: string;
};

/** A real 404: a chord we don't know, or a URL that isn't ours at all. Kept
 *  out of the index — a page reachable only by mistyping doesn't belong in
 *  search results. */
export function NotFound({ query }: NotFoundProps) {
  useEffect(() => {
    document.title = `Not found | ${SITE_NAME}`;
    const robots = (document.head.querySelector('meta[name="robots"]') ??
      document.createElement("meta")) as HTMLMetaElement;
    robots.name = "robots";
    robots.content = "noindex";
    if (!robots.isConnected) document.head.appendChild(robots);
  }, []);

  return (
    <main className="not-found">
      <p className="not-found__eyebrow">{SITE_NAME}</p>
      <h1 className="not-found__title">
        {query ? (
          <>We don't know a chord called "{query}".</>
        ) : (
          <>That page doesn't exist.</>
        )}
      </h1>
      <p className="not-found__hint">
        Try a root and a quality — <span>F♯m7</span>, <span>Bb</span>, <span>Csus4</span>.
      </p>
      <Link className="not-found__link" to="/">
        Back to search
      </Link>
    </main>
  );
}
