document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("messages-container");

  // Fetch messages from storage
  const result = await browser.storage.local.get("savedWords");
  const savedWords = result.savedWords || [];
  if (savedWords.length === 0) {
    container.innerHTML = "<p>No messages found.</p>";
    return;
  }

  const list = document.createElement("ul");
  savedWords.forEach(({ word, pageUrl, context, timestamp }) => {
    const li = document.createElement("li");

    const wordSpan = document.createElement('strong');
    wordSpan.textContent = word + ': ';

    const contextSpan = document.createElement('span');
    const regex = new RegExp(`(${word})`, 'gi');
    const highlightedContext = context.replace(regex, '<mark>$1</mark>');
    contextSpan.innerHTML = highlightedContext + ' ';
    contextSpan.textContent = context + ' ';

    const link = document.createElement('a');
    link.href = pageUrl;
    link.textContent = '🔗';
    link.style.textDecoration = 'none';
    link.title = pageUrl; // Add tooltip showing the full URL on hover
    link.target = 'blank';

    const timeSpan = document.createElement('span');
    timeSpan.textContent = ` (${new Date(timestamp).toLocaleDateString()})`;
    li.appendChild(wordSpan);
    li.appendChild(contextSpan);
    li.appendChild(link);
    li.appendChild(timeSpan);

    list.appendChild(li);
  });
  container.appendChild(list);

});