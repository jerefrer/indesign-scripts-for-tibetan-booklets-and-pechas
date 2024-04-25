function requiredStylesAreSelected(selectedStyles) {
  var tibetanExists = selectedStyles.tibetan && findStyleByPath(selectedStyles.tibetan, 'paragraph');
  var phoneticsExists = selectedStyles.phonetics && findStyleByPath(selectedStyles.phonetics, 'paragraph');
  return tibetanExists && phoneticsExists;
}

function findStyleByPath(stylePath, type) {
  var pathParts = stylePath.split('/');
  var currentCollection;
  if (type === 'paragraph') {
    currentCollection = document.paragraphStyles;
  } else if (type === 'character') {
    currentCollection = document.characterStyles;
  }
  for (var i = 0; i < pathParts.length; i++) {
    var part = pathParts[i];
    var foundStyleOrGroup = currentCollection.itemByName(part);
    if (!foundStyleOrGroup.isValid) {
      return null;
    }
    if (i < pathParts.length - 1) {
      currentCollection = foundStyleOrGroup.paragraphStyles;
    }
  }
  return foundStyleOrGroup;
}

function getStylePath(style) {
  var path = style.name;
  var parent = style.parent;
  while (parent && parent.constructor.name !== 'Document') {
    path = parent.name + '/' + path;
    parent = parent.parent;
  }
  return path;
}

function findSelectedIndex(styles, selectedStyle) {
  for (var i = 0; i < styles.length; i++) {
    var stylePath = getStylePath(styles[i]);
    if (stylePath === selectedStyle) {
      return i;
    }
  }
  return -1;
}