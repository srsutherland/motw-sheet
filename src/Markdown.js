// The small markdown subset used in playbook text (DESIGN.md: "Display text is markdown"):
// paragraphs, **bold**, *italics*, [[wikilinks]] / [[target|text]], and <span class='name'>.
//
// Everything is escaped first and only those constructs are turned back into HTML:
// imported hunter files carry their own copy of the playbook, so its text isn't trusted.

const escape = (text) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const renderInline = (text) => escape(text ?? '')
    // <span class='roll'>+Weird</span>, as escaped above
    .replace(/&lt;span class=(?:'|&quot;)([a-z-]+)(?:'|&quot;)&gt;(.*?)&lt;\/span&gt;/g,
        '<span class="$1">$2</span>')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
        (match, target, shown) => (
            `<span class="term" data-term="${target}">${shown ?? target}</span>`
        ))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

const render = (text) => (text ?? '')
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${renderInline(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');

export { renderInline, render };
