import { useNavigate } from "react-router-dom";
import { resolveChordAsync } from "./load";

/**
 * Resolve, then go: a chord that parses navigates straight to its canonical
 * URL — whatever spelling or enharmonic name was typed — and anything that
 * doesn't bounces to the hero with the miss shown, exactly as typing it there
 * directly would. One function, shared by the hero's search and the "search
 * another chord" field on every chord page, so a query means the same thing
 * wherever it is typed.
 *
 * `slugFor` is imported dynamically rather than at the top of this file on
 * purpose: this hook is used from the homepage, which must not pull the
 * chord engine (`catalog.ts` imports `resolve.ts`, `theory.ts` and the rest
 * of it) into the entry bundle just to search — see `load.ts`.
 */
export function useChordSearch() {
  const navigate = useNavigate();
  return async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const result = await resolveChordAsync(trimmed);
    if (result) {
      const { slugFor } = await import("./catalog.ts");
      navigate(`/chord/${slugFor(result.chord.rootPc, result.chord.quality.id)}`);
    } else {
      navigate("/", { state: { notFound: trimmed } });
    }
  };
}
