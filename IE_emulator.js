// This will eventually be put in Windows_emulation.js once I emulate all of the 
// necessary functions to allow base.js and ui.js to run in WinRT mode.
// - Noah

// I believe this is some sort of log for what the app is currently doing
window.msWriteProfilerMark = window.msWriteProfilerMark || function (str) {
    console.log("msProfilerMark: ", str);
}

// Function to run something immediately after the current execution stack
window.setImmediate = window.setImmediate || function (func) {
    return setTimeout(func, 0);
};

// Old IE object to manage gestures from touch screens
class MSGesture {
    // TODO: figure out how to actually implement this
    constructor() {
        this.target = null;
    }

    addPointer() {}
}

// Code to add "attachEvent" and "detachEvent" back as functions you can call on
// elements, the document, and the window.
// Currently, this replaces them with addEventListener and removeEventListener
(function () {

    // Function for converting old event names into their modern equivalents
    const conversionMap = {
         // IE10 / Windows 8 prefixed Pointer Events
        MSPointerDown: "pointerdown",
        MSPointerUp: "pointerup",
        MSPointerMove: "pointermove",
        MSPointerOver: "pointerover",
        MSPointerOut: "pointerout",
        MSPointerEnter: "pointerenter",
        MSPointerLeave: "pointerleave",
        MSPointerCancel: "pointercancel",

        // Manipulation events (old IE touch model)
        MSManipulationStateChanged: "pointermove",

        // Old mouse wheel
        mousewheel: "wheel",
        DOMMouseScroll: "wheel",

        // Legacy fullscreen
        MSFullscreenChange: "fullscreenchange",
        MSFullscreenError: "fullscreenerror",

        // IE animation events
        MSAnimationStart: "animationstart",
        MSAnimationEnd: "animationend",
        MSAnimationIteration: "animationiteration",

        // IE transition events
        MSTransitionEnd: "transitionend",

        // Old mutation events (obsolete)
        // DOMNodeInserted: "MutationObserver",
        // DOMNodeRemoved: "MutationObserver",
        // DOMSubtreeModified: "MutationObserver",

        // Touch fallback mappings
        // touchstart: "pointerdown",
        // touchmove: "pointermove",
        // touchend: "pointerup",
        // touchcancel: "pointercancel",

        // Mouse fallback mappings
        mousedown: "pointerdown",
        mousemove: "pointermove",
        mouseup: "pointerup",
        mouseenter: "pointerenter",
        mouseleave: "pointerleave",
        mouseover: "pointerover",
        mouseout: "pointerout"
    }
    function modernizeEventName(event) {
        // Do a manual conversion if it's available
        if (conversionMap[event]) {
            return conversionMap[event];
        }

        // Removes "on" from the beginning of event names
        // Solves 50% of issues with old event names
        return event.replace(/^on/, "");
    }


    // Override addEventListener to convert names
    const originalAddEventListener = EventTarget.prototype.addEventListener;

    EventTarget.prototype.addEventListener = function (type, listener, options) {

        // TODO: modern browsers introduced this feature called "passive events" that makes
        // certain events automatically passive. Ideally, this should be removed, but it usually
        // doesn't cause issues.

        return originalAddEventListener.call(
            this,
            modernizeEventName(type),
            listener,
            options
        );
    };

    // Override removeEventListener to convert names
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = function (type, listener, options) {
        return originalRemoveEventListener.call(
            this,
            modernizeEventName(type),
            listener,
            options
        );
    };

    // Stores wrapped handlers per object
    const eventMap = new WeakMap();
    
    // TODO: double-check that chat did this right
    function attachEvent(eventName, handler) {

        const type = modernizeEventName(eventName); // NOTE: this may not be necessary

        // IE compatibility wrapper
        const wrappedHandler = function (e) {

            window.event = e;

            // Note: "window" is technically right, but "this" is more modern
            return handler.call(window, e);
        };

        // Create storage for this object
        if (!eventMap.has(this)) {
            eventMap.set(this, {});
        }

        const events = eventMap.get(this);

        // Store wrapper by original handler
        if (!events[type]) {
            events[type] = new Map();
        }

        events[type].set(handler, wrappedHandler);

        this.addEventListener(type, wrappedHandler);

        return true;
    }

    // TODO: double-check that chat did this right
    function detachEvent(eventName, handler) {

        const type = modernizeEventName(eventName); // NOTE: this may not be necessary

        const events = eventMap.get(this);

        if (!events || !events[type]) {
            return false;
        }

        const wrappedHandler = events[type].get(handler);

        if (!wrappedHandler) {
            return false;
        }

        this.removeEventListener(type, wrappedHandler);

        events[type].delete(handler);

        return true;
    }

    // Install polyfills
    if (!Element.prototype.attachEvent) {
        Element.prototype.attachEvent = attachEvent;
    }

    if (!Element.prototype.detachEvent) {
        Element.prototype.detachEvent = detachEvent;
    }

    if (!Document.prototype.attachEvent) {
        Document.prototype.attachEvent = attachEvent;
    }

    if (!Document.prototype.detachEvent) {
        Document.prototype.detachEvent = detachEvent;
    }

    if (!Window.prototype.attachEvent) {
        Window.prototype.attachEvent = attachEvent;
    }

    if (!Window.prototype.detachEvent) {
        Window.prototype.detachEvent = detachEvent;
    }

    const ruleConversionMap = {
        "-ms-user-select": "user-select",
        "-ms-flexbox;": "flex;",
        "-ms-flex-align": "align-items",
        "-ms-flex-pack": "justify-content",
        "-ms-flex-direction": "flex-direction",
        "-ms-grid;": "grid;",
        "-ms-grid-columns": "grid-template-columns",
        "-ms-grid-rows": "grid-template-rows",
        "-webkit-interpolation-mode: nearest-neighbor;": "image-rendering: pixelated;",
        "-webkit-interpolation-mode:nearest-neighbor;": "image-rendering: pixelated;",
    }

    // Function for converting style properties
    function convertCssRules(styleString) {
        for (const [from, to] of Object.entries(ruleConversionMap)) {
            styleString = styleString.replaceAll(from, to);
        }
        return styleString;
    }

    // CSS emulation
    document.addEventListener("DOMContentLoaded", async function() {

        // Get every element
        document.querySelectorAll('*').forEach(el => {
            const style = getComputedStyle(el);
            
            // Check 1: ensure that "pointer-events: none" only applies to 
            // the parent element and none of its children
            if (style.pointerEvents === 'none') {
                el.querySelectorAll('*').forEach(child => {
                    if (!child.style.pointerEvents) {
                        child.style.pointerEvents = 'auto';
                    }
                });
            }

            // Check 2: convert inline style rules to modern rules
            if (el.style.textContent) {
                const newStyle = convertCssRules(el.style.textContent);
                el.style.textContent = newStyle;
            }
        });

        // Iterate over all style elements
        const style_elems = document.querySelectorAll('style');
        for (const style of style_elems) {
            
            // Get text
            let css = style.textContent;

            // Convert text
            const newText = convertCssRules(css);

            // Put new css rules in style element
            if (css !== newText) {
                style.textContent = newText;
            }
        }

        // Iterate over all stylesheets
        const links = document.querySelectorAll('link');
        for (const link of links) {

            if (link.rel !== "stylesheet") {
                continue;
            }
            console.log("Sheet: " + link.href);
            const response = await fetch(link.href);
            
            // Get text
            let css = await response.text();

            // Convert text
            const newText = convertCssRules(css);

            // Put new css rules in style element
            if (css !== newText) {
                const style = document.createElement("style");
                style.textContent = newText;

                document.head.appendChild(style);
                
                // Disable the old rules
                link.disabled = true;
            }
        }
    });
})();
