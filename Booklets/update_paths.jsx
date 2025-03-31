// @target indesign
// Save as update_versions.jsx

function runPythonScript(pythonPath, args) {
    try {
        if ($.os.indexOf("Windows") !== -1) {
            return app.doScript('cmd.exe /c python "' + pythonPath + '" ' + args, ScriptLanguage.VISUAL_BASIC);
        } else {
            var appleScript = 
                'set pythonPath to "/usr/bin/env python3"\n' + 
                'set scriptPath to "' + pythonPath + '"\n' + 
                'set command to pythonPath & " " & scriptPath & " " & "' + args + '"\n' + 
                'set output to do shell script command\n' + 
                'return output';
            return app.doScript(appleScript, ScriptLanguage.APPLESCRIPT_LANGUAGE);
        }
    } catch(e) {
        alert("Error running Python script: " + e);
        return false;
    }
}

function findAllVersionFiles(folder, oldVersion) {
    var allFiles = folder.getFiles("*.indd");
    var matchingFiles = [];
    
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i].name.indexOf(oldVersion) !== -1) {
            matchingFiles.push(allFiles[i]);
        }
    }
    
    return matchingFiles;
}

function updateVersions() {
    if (app.documents.length === 0) {
        alert("Please open an InDesign document first.");
        return;
    }
    
    var doc = app.activeDocument;
    var folder = doc.fullName.parent;
    
    // Show dialog for version input
    var dialog = app.dialogs.add({name: "Update Version Numbers"});
    with(dialog) {
        with(dialogColumns.add()) {
            // Add some spacing at the top
            staticTexts.add({staticLabel: " "});
            
            with(borderPanels.add()) {
                // Add left padding
                staticTexts.add({staticLabel: "    "}, {minWidth: 20});
                
                with(dialogColumns.add()) {
                    staticTexts.add({staticLabel: "Current version (default: v1.0):"});
                    var oldVersionField = textEditboxes.add({
                        editContents: "v1.0", 
                        minWidth: 200
                    });
                    
                    staticTexts.add({staticLabel: " "}); // Vertical spacing
                    
                    staticTexts.add({staticLabel: "New version:"});
                    var newVersionField = textEditboxes.add({
                        editContents: "v2.0",
                        minWidth: 200
                    });
                }
                
                // Add right padding
                staticTexts.add({staticLabel: "    "}, {minWidth: 20});
            }
            
            // Add some spacing at the bottom
            staticTexts.add({staticLabel: " "});
        }
    }
    
    if (dialog.show()) {
        var oldVersion = oldVersionField.editContents;
        var newVersion = newVersionField.editContents;
        
        // Find all files with the old version number
        var files = findAllVersionFiles(folder, oldVersion);
        
        if (files.length === 0) {
            alert("No files found containing '" + oldVersion + "'");
            dialog.destroy();
            return;
        }
        
        // Create temp folder if it doesn't exist
        var tempFolder = new Folder(folder + "/temp");
        if (!tempFolder.exists) {
            tempFolder.create();
        }
        
        var processed = 0;
        var errors = [];
        
        // Process each file
        for (var i = 0; i < files.length; i++) {
            var currentFile = files[i];
            try {
                // Open the document
                var currentDoc = app.open(currentFile);
                
                // Generate paths
                var idmlPath = new File(tempFolder + "/" + currentDoc.name.replace(/\.indd$/, ".idml"));
                var newPath = currentDoc.name.replace(oldVersion, newVersion);
                var newInddPath = new File(folder + "/" + newPath);
                
                // Export to IDML
                currentDoc.exportFile(ExportFormat.INDESIGN_MARKUP, idmlPath, false);
                
                // Close the current document
                currentDoc.close(SaveOptions.NO);
                
                // Run Python script
                var pythonScript = new File(folder + "/update_idml_paths.py");
                var args = '"' + idmlPath.fsName + '" "' + oldVersion + '" "' + newVersion + '"';
                
                if (runPythonScript(pythonScript.fsName, args)) {
                    // Open modified IDML and save as INDD
                    var newDoc = app.open(idmlPath);
                    newDoc.save(newInddPath);
                    newDoc.close();
                    processed++;
                }
                
            } catch(e) {
                errors.push(currentFile.name + ": " + e);
            }
        }
        
        // Clean up
        idmlPath.remove();
        tempFolder.remove();
        
        // Show results
        if (errors.length > 0) {
            alert("Processed " + processed + " files with " + errors.length + " errors.\n\nErrors:\n" + errors.join("\n"));
        } else {
            alert("Successfully processed " + processed + " files.");
        }
    }
    
    dialog.destroy();
}

updateVersions();