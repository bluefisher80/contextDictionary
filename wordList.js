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
    const prompt = `Write a story attractive to memorize these words:
     ${savedWords.map(item => `${item.word} (${new Date(item.timestamp).toLocaleDateString()})`).join(', ')}, 
     and make a new, unique URL path specifically representing the story with boilerplate https://www.context-dictionary.com/[unique-path-based-on-story]. Date is when the word was saved,
      you can create story based on user memory line, 
      Language of the story could be based on the words .
      Output should be clean, URL embedded in the story, 
      and no sign of memorization of words,just a natural pure story.`;
    document.getElementById('story_prompt').textContent = prompt;
  });
});