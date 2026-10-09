// Gear tags typed by hand: "1 harm magic", "1-harm, magic" -> ["1-harm", "magic"].
// Commas and spaces separate tags; a number joins the word after it, unless a comma
// comes between them ("1, harm" -> ["1", "harm"]).
const parseTags = (text) => text
    .split(',')
    .flatMap((part) => {
        const words = part.trim().split(/\s+/).filter(Boolean);
        const tags = [];
        for (let i = 0; i < words.length; i++) {
            if (/^[+-]?\d+$/.test(words[i]) && i + 1 < words.length) {
                tags.push(`${words[i]}-${words[++i]}`);
            } else {
                tags.push(words[i]);
            }
        }
        return tags;
    });

export { parseTags };
