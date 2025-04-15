function addStyleDropdown(dialog, label, styles, selectedStyle) {
  var group = dialog.add('group');
  group.add('statictext', undefined, label + ':');
  var dropdown = group.add('dropdownlist');
  group.alignment = 'right';
  for (var i = 0; i < styles.length; i++) {
      var stylePath = getStylePath(styles[i]);
      dropdown.add('item', stylePath);
  }
  if (selectedStyle) {
      var selectedIndex = findSelectedStyleIndex(styles, selectedStyle);
      if (selectedIndex !== -1) {
      dropdown.selection = selectedIndex;
      }
  }
  return dropdown;
}

function findStyleByPath(stylePath, type) {
  var pathParts = stylePath.split('/');
  var currentCollection;
  if (type === 'paragraph') {
    currentCollection = app.activeDocument.paragraphStyles;
  } else if (type === 'character') {
    currentCollection = app.activeDocument.characterStyles;
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

function findSelectedStyleIndex(styles, selectedStyle) {
  for (var i = 0; i < styles.length; i++) {
    var stylePath = getStylePath(styles[i]);
    if (stylePath === selectedStyle) {
      return i;
    }
  }
  return -1;
}