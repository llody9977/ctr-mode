// Safe HTML construction for the interactive demonstrations.
//
// The rule this module exists to enforce: escaping is the DEFAULT, and every
// exception is explicit and greppable. The alternative — remembering to wrap
// each interpolated value in an escape call — fails the moment someone adds a
// field, and it fails silently.
//
// Educational & defensive use only.

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

// Escapes quotes as well as angle brackets, so a value is safe in an attribute
// as well as in element content. Angle-bracket-only escaping cannot protect
// `class="${...}"`, and this project does interpolate into attributes.
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);

const RAW = Symbol("raw");

// Marks a string as markup this project built itself, so `html` passes it
// through unescaped. Only ever wrap the output of `html`.
export const raw = (markup) => ({ [RAW]: markup });

// Tagged template that escapes every interpolated value unless it is raw().
export const html = (strings, ...values) =>
  strings.reduce((out, str, i) => {
    const v = values[i - 1];
    const piece = v !== null && typeof v === "object" && RAW in v ? v[RAW] : esc(v);
    return out + piece + str;
  });
