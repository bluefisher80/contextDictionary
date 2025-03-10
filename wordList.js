document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("messages-container");
    
    // Fetch messages from storage
    const result = await browser.storage.local.get("messages");
    const messages = result.messages || [];
    
    // Display messages
    if (messages.length === 0) {
      container.innerHTML = "<p>No messages found.</p>";
    } else {
      const list = document.createElement("ul");
      messages.forEach(msg => {
        const li = document.createElement("li");
        li.textContent = msg;
        list.appendChild(li);
      });
      container.appendChild(list);
    }
  });