(async () => {
// ============================================================
// 1. CONVERSATION ID
// ============================================================

const CONVERSATION_ID =
"6a866860-0768-83e9-b2b6-5f61deab7f1a";

// ============================================================
// 2. CONVERSATION URL
// ============================================================

const url =
`https://chatgpt.com/backend-api/conversation/${CONVERSATION_ID}`;

console.log("==========================================");
console.log("🚀 ChatGPT Conversation Exporter");
console.log("==========================================");
console.log("Conversation ID:", CONVERSATION_ID);
console.log("Fetching:", url);

// ============================================================
// 3. FETCH
// ============================================================

const response = await fetch(url, {
method: "GET",
credentials: "include",

    headers: {
      "accept": "*/*",
      "accept-language": document.documentElement.lang || "en",

      // ChatGPT-ийн browser request-тэй төстэй header-үүд
      "oai-language": document.documentElement.lang || "en",

      "x-openai-target-path":
        `/backend-api/conversation/${CONVERSATION_ID}`,

      "x-openai-target-route":
        "/backend-api/conversation/{conversation_id}"
    }

});

console.log("HTTP STATUS:", response.status);

// ============================================================
// 4. HTTP ERROR CHECK
// ============================================================

if (!response.ok) {
const errorText = await response.text();

    console.error("❌ Conversation fetch failed");
    console.error("STATUS:", response.status);
    console.error("RESPONSE:", errorText.slice(0, 2000));

    throw new Error(
      `Conversation fetch failed: HTTP ${response.status}`
    );

}

// ============================================================
// 5. PARSE JSON
// ============================================================

const data = await response.json();

console.log("✅ Conversation fetched");
console.log("TITLE:", data.title);
console.log("MAPPING:", data.mapping ? "FOUND" : "MISSING");
console.log("CURRENT NODE:", data.current_node);

if (!data.mapping) {
throw new Error(
"Conversation data дотор mapping байхгүй байна."
);
}

if (!data.current_node) {
throw new Error(
"Conversation data дотор current_node байхгүй байна."
);
}

// ============================================================
// 6. SAVE RAW DATA
// ============================================================

window.chatData = data;

console.log(
"MAPPING COUNT:",
Object.keys(data.mapping).length
);

// ============================================================
// 7. RECONSTRUCT CONVERSATION TREE
//
// current_node
// ↓
// parent
// ↓
// parent
// ↓
// ...
// ↓
// root
//
// Ингэж бодит conversation branch-ийг сэргээнэ.
// ============================================================

const mapping = data.mapping;

const messages = [];

let nodeId = data.current_node;

const visited = new Set();

while (nodeId && mapping[nodeId]) {

    // Infinite loop хамгаалалт
    if (visited.has(nodeId)) {
      console.warn(
        "⚠️ Circular mapping detected:",
        nodeId
      );
      break;
    }

    visited.add(nodeId);


    const node = mapping[nodeId];


    if (node.message) {

      const message = node.message;

      const role =
        message.author?.role || "unknown";


      const parts =
        message.content?.parts || [];


      // Зөвхөн string content авах
      const text = parts
        .filter(part => typeof part === "string")
        .join("\n")
        .trim();


      if (text) {

        messages.unshift({
          id: message.id,
          role,
          text,
          create_time: message.create_time,
          node_id: node.id
        });

      }
    }


    // Parent руу буцна
    nodeId = node.parent;

}

// ============================================================
// 8. RESULT CHECK
// ============================================================

console.log("==========================================");
console.log("✅ CONVERSATION RECONSTRUCTED");
console.log("==========================================");

console.log("Title:", data.title);
console.log("Total nodes:", Object.keys(mapping).length);
console.log("Total messages:", messages.length);

console.log("==========================================");

// Browser console дээр messages хадгална
window.chatMessages = messages;

// ============================================================
// 9. SHOW MESSAGE LIST
// ============================================================

messages.forEach((msg, index) => {

    console.log(
      `\n========== ${index + 1}. ${msg.role.toUpperCase()} ==========`
    );

    console.log(msg.text);

});

// ============================================================
// 10. CREATE TEXT FILE
// ============================================================

const output = messages
.map((msg, index) => {

      let date = "";

      if (msg.create_time) {
        date = new Date(
          msg.create_time * 1000
        ).toLocaleString();
      }


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
// 11. DOWNLOAD TXT
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

a.href = downloadUrl;

// Filename-ийг conversation title-аас үүсгэнэ
const safeTitle =
(data.title || "ChatGPT Conversation")
.replace(/[<>:"/\\|?*]/g, "\_")
.trim();

a.download =
`${safeTitle}.txt`;

document.body.appendChild(a);

a.click();

a.remove();

URL.revokeObjectURL(downloadUrl);

// ============================================================
// 12. FINAL RESULT
// ============================================================

console.log("");
console.log("==========================================");
console.log("🎉 EXPORT COMPLETE");
console.log("==========================================");

console.log("Title:", data.title);
console.log("Messages:", messages.length);
console.log("File:", `${safeTitle}.txt`);

console.log("");
console.log(
"💾 window.chatData = raw conversation"
);

console.log(
"💬 window.chatMessages = reconstructed messages"
);

console.log("==========================================");

})();

(async () => {
// ============================================================
// 1. CONVERSATION ID
// ============================================================

const CONVERSATION_ID =
"6a866860-0768-83e9-b2b6-5f61deab7f1a";

// ============================================================
// 2. CONVERSATION URL
// ============================================================

const url =
`https://chatgpt.com/backend-api/conversation/${CONVERSATION_ID}`;

console.log("==========================================");
console.log("🚀 ChatGPT Conversation Exporter");
console.log("==========================================");
console.log("Conversation ID:", CONVERSATION_ID);
console.log("Fetching:", url);

// ============================================================
// 3. FETCH
// ============================================================

const response = await fetch(url, {
method: "GET",
credentials: "include",

    headers: {
      "accept": "*/*",
      "accept-language": document.documentElement.lang || "en",

      // ChatGPT-ийн browser request-тэй төстэй header-үүд
      "oai-language": document.documentElement.lang || "en",

      "x-openai-target-path":
        `/backend-api/conversation/${CONVERSATION_ID}`,

      "x-openai-target-route":
        "/backend-api/conversation/{conversation_id}"
    }

});

console.log("HTTP STATUS:", response.status);

// ============================================================
// 4. HTTP ERROR CHECK
// ============================================================

if (!response.ok) {
const errorText = await response.text();

    console.error("❌ Conversation fetch failed");
    console.error("STATUS:", response.status);
    console.error("RESPONSE:", errorText.slice(0, 2000));

    throw new Error(
      `Conversation fetch failed: HTTP ${response.status}`
    );

}

// ============================================================
// 5. PARSE JSON
// ============================================================

const data = await response.json();

console.log("✅ Conversation fetched");
console.log("TITLE:", data.title);
console.log("MAPPING:", data.mapping ? "FOUND" : "MISSING");
console.log("CURRENT NODE:", data.current_node);

if (!data.mapping) {
throw new Error(
"Conversation data дотор mapping байхгүй байна."
);
}

if (!data.current_node) {
throw new Error(
"Conversation data дотор current_node байхгүй байна."
);
}

// ============================================================
// 6. SAVE RAW DATA
// ============================================================

window.chatData = data;

console.log(
"MAPPING COUNT:",
Object.keys(data.mapping).length
);

// ============================================================
// 7. RECONSTRUCT CONVERSATION TREE
//
// current_node
// ↓
// parent
// ↓
// parent
// ↓
// ...
// ↓
// root
//
// Ингэж бодит conversation branch-ийг сэргээнэ.
// ============================================================

const mapping = data.mapping;

const messages = [];

let nodeId = data.current_node;

const visited = new Set();

while (nodeId && mapping[nodeId]) {

    // Infinite loop хамгаалалт
    if (visited.has(nodeId)) {
      console.warn(
        "⚠️ Circular mapping detected:",
        nodeId
      );
      break;
    }

    visited.add(nodeId);


    const node = mapping[nodeId];


    if (node.message) {

      const message = node.message;

      const role =
        message.author?.role || "unknown";


      const parts =
        message.content?.parts || [];


      // Зөвхөн string content авах
      const text = parts
        .filter(part => typeof part === "string")
        .join("\n")
        .trim();


      if (text) {

        messages.unshift({
          id: message.id,
          role,
          text,
          create_time: message.create_time,
          node_id: node.id
        });

      }
    }


    // Parent руу буцна
    nodeId = node.parent;

}

// ============================================================
// 8. RESULT CHECK
// ============================================================

console.log("==========================================");
console.log("✅ CONVERSATION RECONSTRUCTED");
console.log("==========================================");

console.log("Title:", data.title);
console.log("Total nodes:", Object.keys(mapping).length);
console.log("Total messages:", messages.length);

console.log("==========================================");

// Browser console дээр messages хадгална
window.chatMessages = messages;

// ============================================================
// 9. SHOW MESSAGE LIST
// ============================================================

messages.forEach((msg, index) => {

    console.log(
      `\n========== ${index + 1}. ${msg.role.toUpperCase()} ==========`
    );

    console.log(msg.text);

});

// ============================================================
// 10. CREATE TEXT FILE
// ============================================================

const output = messages
.map((msg, index) => {

      let date = "";

      if (msg.create_time) {
        date = new Date(
          msg.create_time * 1000
        ).toLocaleString();
      }


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
// 11. DOWNLOAD TXT
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

a.href = downloadUrl;

// Filename-ийг conversation title-аас үүсгэнэ
const safeTitle =
(data.title || "ChatGPT Conversation")
.replace(/[<>:"/\\|?*]/g, "\_")
.trim();

a.download =
`${safeTitle}.txt`;

document.body.appendChild(a);

a.click();

a.remove();

URL.revokeObjectURL(downloadUrl);

// ============================================================
// 12. FINAL RESULT
// ============================================================

console.log("");
console.log("==========================================");
console.log("🎉 EXPORT COMPLETE");
console.log("==========================================");

console.log("Title:", data.title);
console.log("Messages:", messages.length);
console.log("File:", `${safeTitle}.txt`);

console.log("");
console.log(
"💾 window.chatData = raw conversation"
);

console.log(
"💬 window.chatMessages = reconstructed messages"
);

console.log("==========================================");

})();
