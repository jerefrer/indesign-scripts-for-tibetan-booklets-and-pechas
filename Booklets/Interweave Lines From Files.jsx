#include '../lib/polyfills.js'

var dialog = new Window('dialog', 'Import Lines with Style');
dialog.orientation = 'column';
dialog.alignChildren = 'left';

var fileStyleGroups = [];
var maxLines = 0;
var fileGroupContainer = dialog.add('panel', undefined, 'Files and Styles');
fileGroupContainer.orientation = 'column';
fileGroupContainer.alignChildren = 'fill';
fileGroupContainer.spacing = 10;

var importTriggered = false; // Flag to check if import was triggered

function getStylePath(style) {
  var path = style.name;
  var parent = style.parent;
  while (parent && parent.constructor.name !== 'Document') {
    path = parent.name + '/' + path;
    parent = parent.parent;
  }
  return path;
}

function addFileStyleGroup(canDelete) {
    var group = fileGroupContainer.add('group');
    group.orientation = 'row';
    group.alignChildren = 'top';

    var fileButton = group.add('button', undefined, 'Browse...');
    var fileName = group.add('statictext', undefined, 'No file selected', {truncate: 'middle'});
    fileName.preferredSize.width = 600;

    var styles = app.activeDocument.allParagraphStyles;
    var styleNames = styles.map(function(style) { return getStylePath(style); });
    var styleDropdown = group.add('dropdownlist', undefined, styleNames);
    styleDropdown.selection = styleDropdown.items[0];

    fileButton.onClick = function() {
        var file = File.openDialog('Select a text file', '*.txt');
        if (file) {
            fileName.text = file.fsName;
            fileButton.file = file; // Store the file reference
        }
    };

    if (canDelete) {
        var deleteButton = group.add('button', undefined, 'X');
        deleteButton.characters = 1; // Make the button smaller, resembling an icon
        deleteButton.onClick = function() {
            fileGroupContainer.remove(group);
            fileStyleGroups.splice(fileStyleGroups.indexOf(group), 1);
            dialog.layout.layout(true); // Explicit layout update after deletion
        };
    }

    fileStyleGroups.push(group);
}

// Initial groups without delete buttons
addFileStyleGroup(false);
addFileStyleGroup(false);

var addFileButtonGroup = dialog.add('group');
addFileButtonGroup.alignment = 'left';
addFileButtonGroup.add('button', undefined, 'Add file').onClick = function() {
    addFileStyleGroup(true);
    dialog.layout.layout(true); // Repaint on adding
};

var actionButtonGroup = dialog.add('group');
actionButtonGroup.alignment = 'right';
actionButtonGroup.add('button', undefined, 'Import').onClick = function() {
    importTriggered = true;
    dialog.close();
};

actionButtonGroup.add('button', undefined, 'Cancel').onClick = function() {
    dialog.close();
};

function openDialog() {

    if (app.selection.length === 0 || !(app.selection[0] instanceof InsertionPoint || app.selection[0] instanceof TextFrame)) {
        alert("Please place the cursor inside a text frame or at a valid insertion point.");
        return;
    }

    dialog.show();

    if (importTriggered) {
        var lines = [];
        for (var i = 0; i < fileStyleGroups.length; i++) {
            var fileButton = fileStyleGroups[i].children[0];
            var file = fileButton.file;
            if (!file || !file.exists) {
                alert('Please select a valid text file for each entry.');
                return;
            }
            file.open('r');
            var fileLines = [];
            while (!file.eof) {
                fileLines.push(file.readln());
            }
            file.close();
            if (maxLines === 0 || fileLines.length === maxLines) {
                maxLines = fileLines.length;
                lines.push(fileLines);
            } else {
                alert('Files do not have the same number of lines.');
                return;
            }
        }

        for (var lineIndex = 0; lineIndex < maxLines; lineIndex++) {
            for (var fileIndex = 0; fileIndex < lines.length; fileIndex++) {
                // Get the current selection's location. We assume the cursor is at a valid insertion point.
                var currentSelection = app.selection[0];
                var insertionPoint = currentSelection instanceof TextFrame ? currentSelection.texts[0].insertionPoints[0] : currentSelection.insertionPoints[0];
        
                // Insert the text at the current cursor location
                insertionPoint.contents = lines[fileIndex][lineIndex] + '\r'; // Adding '\r' to simulate paragraph break
        
                // Apply the style
                var stylePath = fileStyleGroups[fileIndex].children[2].selection.text;
                var style = app.activeDocument.allParagraphStyles.find(function(s) { return getStylePath(s) === stylePath; });
                if (style) {
                    insertionPoint.paragraphs.lastItem().appliedParagraphStyle = style;
                } else {
                    alert("Style not found: " + stylePath);
                }
            }
        }
    }    
}

openDialog();