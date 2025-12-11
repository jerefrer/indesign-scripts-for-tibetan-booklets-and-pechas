/**
 * Find External Hyperlinks and Cross-References
 * 
 * Lists all hyperlinks and cross-references in the document,
 * and reveals those pointing to external documents.
 */

#target indesign

function main() {
    if (app.documents.length === 0) {
        alert("Please open a document first.");
        return;
    }
    
    var doc = app.activeDocument;
    
    // Collect all hyperlinks and cross-references
    var externalLinks = [];
    var internalLinks = [];
    
    // Check hyperlinks
    for (var i = 0; i < doc.hyperlinks.length; i++) {
        var hyperlink = doc.hyperlinks[i];
        var linkInfo = analyzeHyperlink(hyperlink, doc);
        if (linkInfo.isExternal) {
            externalLinks.push(linkInfo);
        } else {
            internalLinks.push(linkInfo);
        }
    }
    
    // Check cross-references
    for (var i = 0; i < doc.crossReferenceSources.length; i++) {
        var xrefSource = doc.crossReferenceSources[i];
        var xrefInfo = analyzeCrossReference(xrefSource, doc);
        if (xrefInfo.isExternal) {
            externalLinks.push(xrefInfo);
        } else {
            internalLinks.push(xrefInfo);
        }
    }
    
    // Show results
    if (externalLinks.length === 0 && internalLinks.length === 0) {
        alert("No hyperlinks or cross-references found in this document.");
        return;
    }
    
    // Show dialog with results
    showResultsDialog(externalLinks, internalLinks, doc);
}

function getPageNumber(textRange) {
    try {
        if (textRange.parentTextFrames.length > 0) {
            var textFrame = textRange.parentTextFrames[0];
            if (textFrame && textFrame.parentPage) {
                return textFrame.parentPage.name;
            }
        }
    } catch(e) {}
    return "?";
}

function analyzeHyperlink(hyperlink, doc) {
    var info = {
        type: "Hyperlink",
        name: hyperlink.name,
        isExternal: false,
        destination: "",
        destinationType: "",
        source: hyperlink,
        sourceText: "",
        pageNumber: "?"
    };
    
    try {
        // Get source text and page number
        if (hyperlink.source) {
            if (hyperlink.source.sourceText) {
                info.sourceText = hyperlink.source.sourceText.contents.substring(0, 50);
                info.pageNumber = getPageNumber(hyperlink.source.sourceText);
            }
        }
    } catch(e) {}
    
    try {
        var dest = hyperlink.destination;
        if (!dest) {
            info.destination = "(no destination)";
            info.destinationType = "None";
            return info;
        }
        
        // Check destination type
        if (dest.constructor.name === "HyperlinkURLDestination") {
            info.destinationType = "URL";
            info.destination = dest.destinationURL || "(empty URL)";
            info.isExternal = true;
        } else if (dest.constructor.name === "HyperlinkExternalPageDestination") {
            info.destinationType = "External Page";
            info.destination = dest.documentPath ? dest.documentPath.toString() : "(external document)";
            info.isExternal = true;
        } else if (dest.constructor.name === "HyperlinkPageDestination") {
            info.destinationType = "Page";
            var destDoc = dest.destinationPage ? dest.destinationPage.parent.parent : null;
            if (destDoc && destDoc !== doc) {
                info.isExternal = true;
                info.destination = "Page in: " + destDoc.name;
            } else {
                info.destination = "Page " + (dest.destinationPage ? dest.destinationPage.name : "?");
            }
        } else if (dest.constructor.name === "HyperlinkTextDestination") {
            info.destinationType = "Text Anchor";
            try {
                var destStory = dest.destinationText.parentStory;
                var destDoc = destStory.parent;
                while (destDoc && destDoc.constructor.name !== "Document") {
                    destDoc = destDoc.parent;
                }
                if (destDoc && destDoc !== doc) {
                    info.isExternal = true;
                    info.destination = "Text in: " + destDoc.name;
                } else {
                    info.destination = dest.name || "(text anchor)";
                }
            } catch(e) {
                info.destination = dest.name || "(text anchor)";
            }
        } else {
            info.destinationType = dest.constructor.name.replace("Hyperlink", "").replace("Destination", "");
            info.destination = dest.name || "(unknown)";
        }
    } catch(e) {
        info.destination = "(error reading destination: " + e + ")";
    }
    
    return info;
}

function analyzeCrossReference(xrefSource, doc) {
    var info = {
        type: "Cross-Reference",
        name: xrefSource.name || "(unnamed)",
        isExternal: false,
        destination: "",
        destinationType: "Text",
        source: xrefSource,
        sourceText: "",
        pageNumber: "?"
    };
    
    try {
        // Get source text and page number
        if (xrefSource.sourceText) {
            info.sourceText = xrefSource.sourceText.contents.substring(0, 50);
            info.pageNumber = getPageNumber(xrefSource.sourceText);
        }
    } catch(e) {}
    
    try {
        // Cross-references point to text destinations
        // Check if the destination is in the same document
        var dest = xrefSource.destination;
        if (!dest) {
            info.destination = "(no destination)";
            return info;
        }
        
        // Try to determine if it's external
        try {
            var destText = dest.destinationText;
            if (destText) {
                var destStory = destText.parentStory;
                var destDoc = destStory.parent;
                while (destDoc && destDoc.constructor.name !== "Document") {
                    destDoc = destDoc.parent;
                }
                if (destDoc && destDoc !== doc) {
                    info.isExternal = true;
                    info.destination = "In document: " + destDoc.name;
                } else {
                    info.destination = dest.name || "(internal anchor)";
                }
            } else {
                info.destination = dest.name || "(unknown)";
            }
        } catch(e) {
            // If we can't access the destination text, it might be external or broken
            info.destination = dest.name || "(possibly external or broken)";
            // Check if name suggests external
            if (dest.name && dest.name.indexOf(".indd") !== -1) {
                info.isExternal = true;
            }
        }
    } catch(e) {
        info.destination = "(error: " + e + ")";
    }
    
    return info;
}

function showResultsDialog(externalLinks, internalLinks, doc) {
    var selectedLink = null;
    var action = null;
    
    while (true) {
        var dialog = new Window("dialog", "Hyperlinks and Cross-References");
        dialog.orientation = "column";
        dialog.alignChildren = ["fill", "top"];
        dialog.preferredSize = [650, 500];
        
        // Summary
        var summaryGroup = dialog.add("group");
        summaryGroup.add("statictext", undefined, 
            "External: " + externalLinks.length + "  |  Internal: " + internalLinks.length + "  |  Total: " + (externalLinks.length + internalLinks.length));
        
        // Tabs for external and internal
        var tabbedPanel = dialog.add("tabbedpanel");
        tabbedPanel.alignChildren = ["fill", "fill"];
        tabbedPanel.preferredSize = [630, 380];
        
        // External tab
        var externalTab = tabbedPanel.add("tab", undefined, "External (" + externalLinks.length + ")");
        externalTab.alignChildren = ["fill", "fill"];
        
        var externalList = null;
        if (externalLinks.length > 0) {
            externalList = externalTab.add("listbox", undefined, [], {
                numberOfColumns: 4,
                showHeaders: true,
                columnTitles: ["Page", "Type", "Source Text", "Destination"],
                columnWidths: [50, 80, 200, 250]
            });
            externalList.preferredSize = [610, 300];
            
            for (var i = 0; i < externalLinks.length; i++) {
                var link = externalLinks[i];
                var displayName = link.sourceText || link.name;
                if (displayName.length > 35) displayName = displayName.substring(0, 35) + "...";
                var item = externalList.add("item", "p. " + link.pageNumber);
                item.subItems[0].text = link.type;
                item.subItems[1].text = displayName;
                item.subItems[2].text = link.destination;
                item.linkData = link;
            }
            
            var extBtnGroup = externalTab.add("group");
            var revealExtBtn = extBtnGroup.add("button", undefined, "Reveal Selected");
            var revealAllExtBtn = extBtnGroup.add("button", undefined, "Reveal All External (one by one)");
            
            revealExtBtn.onClick = function() {
                if (externalList.selection) {
                    selectedLink = externalList.selection.linkData;
                    action = "reveal";
                    dialog.close();
                }
            };
            
            revealAllExtBtn.onClick = function() {
                action = "reveal-all-external";
                dialog.close();
            };
            
            externalList.onDoubleClick = function() {
                if (externalList.selection) {
                    selectedLink = externalList.selection.linkData;
                    action = "reveal";
                    dialog.close();
                }
            };
        } else {
            externalTab.add("statictext", undefined, "No external links found.");
        }
        
        // Internal tab
        var internalTab = tabbedPanel.add("tab", undefined, "Internal (" + internalLinks.length + ")");
        internalTab.alignChildren = ["fill", "fill"];
        
        var internalList = null;
        if (internalLinks.length > 0) {
            internalList = internalTab.add("listbox", undefined, [], {
                numberOfColumns: 4,
                showHeaders: true,
                columnTitles: ["Page", "Type", "Source Text", "Destination"],
                columnWidths: [50, 80, 200, 250]
            });
            internalList.preferredSize = [610, 300];
            
            for (var i = 0; i < internalLinks.length; i++) {
                var link = internalLinks[i];
                var displayName = link.sourceText || link.name;
                if (displayName.length > 35) displayName = displayName.substring(0, 35) + "...";
                var item = internalList.add("item", "p. " + link.pageNumber);
                item.subItems[0].text = link.type;
                item.subItems[1].text = displayName;
                item.subItems[2].text = link.destination;
                item.linkData = link;
            }
            
            var intBtnGroup = internalTab.add("group");
            var revealIntBtn = intBtnGroup.add("button", undefined, "Reveal Selected");
            
            revealIntBtn.onClick = function() {
                if (internalList.selection) {
                    selectedLink = internalList.selection.linkData;
                    action = "reveal";
                    dialog.close();
                }
            };
            
            internalList.onDoubleClick = function() {
                if (internalList.selection) {
                    selectedLink = internalList.selection.linkData;
                    action = "reveal";
                    dialog.close();
                }
            };
        } else {
            internalTab.add("statictext", undefined, "No internal links found.");
        }
        
        // Close button
        var closeBtn = dialog.add("button", undefined, "Close");
        closeBtn.onClick = function() { 
            action = "close";
            dialog.close(); 
        };
        
        // Start on external tab if there are external links
        if (externalLinks.length > 0) {
            tabbedPanel.selection = externalTab;
        }
        
        dialog.show();
        
        // Handle actions after dialog closes
        if (action === "close" || action === null) {
            break;
        } else if (action === "reveal" && selectedLink) {
            revealLink(selectedLink);
            // Reset and show dialog again
            selectedLink = null;
            action = null;
        } else if (action === "reveal-all-external") {
            revealAllLinks(externalLinks);
            break;
        }
    }
}

function revealLink(linkInfo) {
    try {
        var source = linkInfo.source;
        
        if (linkInfo.type === "Hyperlink") {
            // For hyperlinks, select the source text
            if (source.source && source.source.sourceText) {
                var textRange = source.source.sourceText;
                
                // Navigate to the page
                if (textRange.parentTextFrames.length > 0) {
                    var textFrame = textRange.parentTextFrames[0];
                    if (textFrame && textFrame.parentPage) {
                        var spread = textFrame.parentPage.parent;
                        app.activeWindow.activeSpread = spread;
                    }
                }
                
                app.select(textRange);
                textRange.showText();
            }
        } else if (linkInfo.type === "Cross-Reference") {
            // For cross-references, select the source text
            if (source.sourceText) {
                var textRange = source.sourceText;
                
                // Navigate to the page
                if (textRange.parentTextFrames.length > 0) {
                    var textFrame = textRange.parentTextFrames[0];
                    if (textFrame && textFrame.parentPage) {
                        var spread = textFrame.parentPage.parent;
                        app.activeWindow.activeSpread = spread;
                    }
                }
                
                app.select(textRange);
                textRange.showText();
            }
        }
    } catch(e) {
        alert("Could not reveal link: " + e);
    }
}

function revealAllLinks(links) {
    if (links.length === 0) return;
    
    var currentIndex = 0;
    
    while (currentIndex < links.length) {
        var link = links[currentIndex];
        
        // Reveal the link
        revealLink(link);
        
        // Show navigation dialog
        var dialog = new Window("dialog", "External Link (" + (currentIndex + 1) + "/" + links.length + ")");
        dialog.orientation = "column";
        dialog.alignChildren = ["fill", "top"];
        
        dialog.add("statictext", undefined, "Type: " + link.type);
        dialog.add("statictext", undefined, "Destination: " + link.destination);
        if (link.sourceText) {
            dialog.add("statictext", undefined, "Source: " + link.sourceText.substring(0, 60));
        }
        
        var btnGroup = dialog.add("group");
        var prevBtn = btnGroup.add("button", undefined, "Previous");
        var nextBtn = btnGroup.add("button", undefined, "Next");
        var doneBtn = btnGroup.add("button", undefined, "Done");
        
        prevBtn.enabled = currentIndex > 0;
        nextBtn.enabled = currentIndex < links.length - 1;
        
        var result = { action: null };
        prevBtn.onClick = function() { result.action = "prev"; dialog.close(); };
        nextBtn.onClick = function() { result.action = "next"; dialog.close(); };
        doneBtn.onClick = function() { result.action = "done"; dialog.close(); };
        
        dialog.show();
        
        if (result.action === "prev") {
            currentIndex--;
        } else if (result.action === "next") {
            currentIndex++;
        } else {
            break;
        }
    }
}

// Run the script
main();
