const emojiIDs = {
    sample: ``
};

const emojis = emojiIDs;
for (const [key, value] of Object.entries(emojis)) {
    emojis[key] = `<:${key}:${value}>`;
}

export {
    emojiIDs,
    emojis
};
