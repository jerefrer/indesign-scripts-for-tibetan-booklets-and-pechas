function updateTOCs() {
  var stories = app.activeDocument.stories;
  for (var i = 0; i < stories.length; i++) {
    var story = stories[i];
    if (story.storyType != StoryTypes.TOC_STORY) continue;

    try {
      story.textContainers[0].select();
      app.menuActions.item("$ID/UpdateTableOfContentsCmd").invoke();
    } catch (e) {}
  }
}

updateTOCs();
