// Text formatting for the sheet.

const signed = (value) => (value > 0 ? `+${value}` : value === 0 ? '=0' : `${value}`);

// A ratings line as HTML, each number colored by value:
// { charm: -1, cool: 1, sharp: 1, tough: 0, weird: 2 }
//   -> "Charm-1, Cool+1, Sharp+1, Tough=0, Weird+2"
const ratingLineHtml = (rating) => Object.entries(rating)
    .map(([key, value]) => `${key[0].toUpperCase()}${key.slice(1)}`
        + `<span class="color-${value}">${signed(value)}</span>`)
    .join(', ');

export { ratingLineHtml };
