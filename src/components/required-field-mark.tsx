/** Red asterisk for required form labels (includes tooltip for accessibility). */
export function RequiredFieldMark() {
  return (
    <abbr
      title="Required"
      className="ml-0.5 cursor-help font-semibold text-destructive no-underline"
    >
      *
    </abbr>
  );
}
