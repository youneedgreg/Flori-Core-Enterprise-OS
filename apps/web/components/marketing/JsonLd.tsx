/**
 * Emits a JSON-LD graph.
 *
 * `dangerouslySetInnerHTML` is the documented way to do this — React escapes
 * text children, which would corrupt the JSON. The content is built from our own
 * modules, never from user input.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
