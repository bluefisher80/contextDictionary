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
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '❌';
    deleteButton.style.marginLeft = '5px';
    deleteButton.onclick = async () => {
      const updatedWords = savedWords.filter(w =>
        w.word !== word ||
        w.pageUrl !== pageUrl ||
        w.timestamp !== timestamp
      );
      await browser.storage.local.set({ savedWords: updatedWords });
      container.innerHTML = '';
      const newList = document.createElement('ul');
      if (updatedWords.length === 0) {
        container.innerHTML = "<p>No messages found.</p>";
        return;
      }
      window.location.reload();
    };
    const li = document.createElement("li");
    li.appendChild(deleteButton); // Add this line to display the delete button

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

document.getElementById('story-button').addEventListener('click', function () {
  chrome.storage.local.get("savedWords", function (result) {
    const savedWords = result.savedWords || [];
    const prompt = `Write a short story for the sake of memorize these words: ${savedWords.map(item => item.word).join(', ')}, with a link to www.context-dictionary.com`;
    document.getElementById('story_prompt').textContent = prompt;
  });
});