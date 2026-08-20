}).then(async r => {
console.log("STATUS:", r.status);

const text = await r.text();

console.log("RAW LENGTH:", text.length);

if (!r.ok) {
console.error("❌ HTTP ERROR:", r.status);
console.error(text.slice(0, 2000));
throw new Error(`HTTP ${r.status}`);
}

const data = JSON.parse(text);

console.log("TITLE:", data.title);
console.log("MAPPING COUNT:", Object.keys(data.mapping || {}).length);
console.log("CURRENT NODE:", data.current_node);

if (!data.mapping) {
throw new Error("mapping байхгүй байна");
}

if (!data.current_node) {
throw new Error("current_node байхгүй байна");
}

// ============================================================
// RAW DATA-г хадгална
// ============================================================

window.chatData = data;

// ============================================================
// CONVERSATION TREE → ЗӨВ ДАРААЛАЛ
// current_node → parent → parent → ...
// ============================================================

const mapping = data.mapping;
const messages = [];

let nodeId = data.current_node;

const visited = new Set();

while (nodeId && mapping[nodeId]) {

    // Circular reference хамгаалалт
    if (visited.has(nodeId)) {
      console.warn("⚠️ Circular mapping:", nodeId);
      break;
    }

    visited.add(nodeId);

    const node = mapping[nodeId];

    if (node.message) {
      const message = node.message;

      const role = message.author?.role || "unknown";

      const parts = message.content?.parts || [];

      const messageText = parts
        .filter(part => typeof part === "string")
        .join("\n")
        .trim();

      if (messageText) {
        messages.unshift({
          id: message.id,
          role,
          text: messageText,
          create_time: message.create_time,
          node_id: node.id
        });
      }
    }

    nodeId = node.parent;

}

// ============================================================
// GLOBAL VARIABLE
// Console дээр дараа нь ашиглаж болно
// ============================================================

window.chatMessages = messages;

// ============================================================
// RESULT
// ============================================================

console.log("======================================");
console.log("✅ CONVERSATION RECONSTRUCTED");
console.log("======================================");

console.log("Title:", data.title);
console.log("Nodes:", Object.keys(mapping).length);
console.log("Messages:", messages.length);

console.log("======================================");

// ============================================================
// CONSOLE ДЭЭР MESSAGE-ҮҮДИЙГ ХАРУУЛАХ
// ============================================================

messages.forEach((msg, index) => {
console.log(
`\n========== ${index + 1}. ${msg.role.toUpperCase()} ==========`
);

    console.log(msg.text);

});

// ============================================================
// TXT ФАЙЛ ҮҮСГЭХ
// ============================================================

const output = messages
.map((msg, index) => {

      const date = msg.create_time
        ? new Date(msg.create_time * 1000).toLocaleString()
        : "";

      return [
        "============================================================",
        `${index + 1}. ${msg.role.toUpperCase()}`,
        `Time: ${date}`,
        `Message ID: ${msg.id}`,
        "============================================================",
        "",
        msg.text,
        "",
        ""
      ].join("\n");

    })
    .join("\n");

// ============================================================
// TXT DOWNLOAD
// ============================================================

const blob = new Blob(
[output],
{
type: "text/plain;charset=utf-8"
}
);

const downloadUrl =
URL.createObjectURL(blob);

const a =
document.createElement("a");

const safeTitle =
(data.title || "ChatGPT Conversation")
.replace(/[<>:"/\\|?*]/g, "\_")
.trim();

a.href = downloadUrl;
a.download = `${safeTitle}.txt`;

document.body.appendChild(a);

a.click();

a.remove();

URL.revokeObjectURL(downloadUrl);

// ============================================================
// COMPLETE
// ============================================================

console.log("");
console.log("======================================");
console.log("🎉 EXPORT COMPLETE");
console.log("======================================");

console.log(`📄 ${safeTitle}.txt`);
console.log(`💬 ${messages.length} messages`);

console.log("");
console.log("Raw data:");
console.log("window.chatData");

console.log("");
console.log("Reconstructed messages:");
console.log("window.chatMessages");

return messages;
});
