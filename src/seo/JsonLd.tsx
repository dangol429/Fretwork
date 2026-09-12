/** One JSON-LD `<script>` block. Renders identically server and client, so
 *  hydration never has anything to reconcile here. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
