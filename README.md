# WinRT-Emulation
This repository contains files for getting WinJS-based Windows 8 apps to run in a modern browser. This is done by manually including these files in the HTML page and running a local webserver to view the page. This process will hopefully be automated in the future.

### Things to note about getting these apps to run:
 - Only some apps are WinJS-based. You can tell if an app uses WinJS because it will mostly contain .html, .css, and .js files.
 - All of the code is designed for and tested on Microsoft Edge, as this is most similar to the engines that were used to run the apps (Internet Explorer 10 would be the best, but I can't get it to run on a modern computer).
 - Some apps may expect a max framerate of 60 FPS and won't run properly if ran at a higher framerate.
 - Some apps may expect a 4:3 aspect ratio and may have minor graphical issues if ran at 16:9.
 - The emulation is not perfect, and significant modifications to the emulator or app may be needed to simply get it running.

### Current setup for getting games running:
 1. Copy Windows_emulator.js, IE_emulator.js, and the WinJS folder into the game's directory.
 2. Find the main HTML file for the game (usually labeled "default.html").
 3. Change the WinJS file paths to not start with two dashes.
 4. Import IE_emulator.js before all other scripts.
 5. Import Windows_emulator.js right after base.js and ui.js.
 6. Use a local web server (such as vscode's LiveServer extension) to view the app in your browser.
