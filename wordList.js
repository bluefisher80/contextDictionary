const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("messages-container");

  // Fetch messages from storage
  const result = await browserAPI.storage.local.get("savedWords");
  const savedWords = result.savedWords || [];
  if (savedWords.length === 0) {
    container.innerHTML = "<p>No messages found.</p>";
    return;
  }

  // Display word count
  const wordCount = document.createElement("p");
  wordCount.textContent = `Total Words: ${savedWords.length}`;
  wordCount.style.fontWeight = "bold";
  container.appendChild(wordCount);

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
      await browserAPI.storage.local.set({ savedWords: updatedWords });
      container.innerHTML = '';
      const newList = document.createElement('ul');
      if (updatedWords.length === 0) {
        container.innerHTML = "<p>No messages found.</p>";
        return;
      }
      window.location.reload();
    };

    const li = document.createElement("li");
    li.style.opacity = 0; // Start with opacity 0 for fade-in effect
    setTimeout(() => (li.style.opacity = 1), 100); // Fade-in effect

    li.appendChild(deleteButton);

    const wordSpan = document.createElement('span');
    wordSpan.textContent = word ;
    wordSpan.className = 'word-highlight';

    if (word === context) {
      wordSpan.textContent = null;
    } else {
      wordSpan.textContent = null; //hide anyway, since we are highlighting the context
    }
    const contextSpan = document.createElement('span');
    const regex = new RegExp(`(${word})`, 'gi');
    const highlightedContext = context.replace(regex, '<mark>$1</mark>');
    contextSpan.innerHTML = highlightedContext + ' ';
    

 

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
    const prompt = `Write a short story for the sake of memorize these word(first read date) pairs: ${savedWords.map(item => `${item.word} (${new Date(item.timestamp).toLocaleDateString()})`).join(', ')}, with a link to https://www.context-dictionary.com`;
    document.getElementById('story_prompt').textContent = prompt;
  });
});