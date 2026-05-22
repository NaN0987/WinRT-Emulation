
// Fake windows object
window.Windows = {

    Foundation: {
        // TODO: fill this class out more
        Uri: class {
            constructor(uri) {
                this.rawUri = uri;

                const u = new URL(uri);

                this.absoluteUri = u.href;
                this.schemeName = u.protocol.replace(":", "");
                this.host = u.hostname;
                this.path = u.pathname;
                this.query = u.search;
                this.fragment = u.hash;
            }

            toString() {
                return this.absoluteUri;
            }
        }
    },

    ApplicationModel: {
        // Some basic shit that every single program has
        Activation: {
            ActivationKind: {
                // TODO: somehow add support for suspension and other types of activations
                launch: "Windows.Launch"
            },

            // NOTE: by default, base.js will use "NotRunning"
            ApplicationExecutionState: {
                NotRunning: 0,
                Running: 1,
                Suspended: 2,
                Terminated: 3,
                ClosedByUser: 4
            }
        },

        // Manages what happens when the user clicks "share"
        DataTransfer: {
            DataTransferManager: {
                getForCurrentView() {
                    return {
                        addEventListener(string, func) {
                            // TODO: find some way to emulate this
                            // For now, sharing will do nothing
                        }
                    }
                },

                showShareUI() {
                    // TODO: find some way to emulate this
                    // For now, sharing will do nothing
                }
            }
        },

        // There's a special "design mode" for when you would test the 
        // apps in Visual Studio
        DesignMode: {
            designModeEnabled: false
        },

        // Stuff for managing app id, license info, etc.
        Store: {
            CurrentApp: {
                appId: null, // set later

                licenseInformation: {
                    isActive: true,

                    productLicenses: {
                        // TODO: implement this better
                        lookup(name) {
                            return {
                                isActive: true
                            }
                        }
                    }
                }


            }
        }
    },

    // Functions for storing data about the game in files
    Storage: {
        ApplicationData: {
            current: {

                // TODO: make file emulation use actual files, and create a file class to represent files
                localFolder: {

                    // Function for accessing local files
                    // Emulating this using localStorage
                    getFileAsync(filename) {
                        let localStorageData = localStorage.getItem("WinRT-localFolder:" + filename);

                        return {
                            done(success_func, error_func) {
                                if (localStorageData === null) {
                                    error_func("The file " + filename + " doesn't exists.")
                                }
                                else {
                                    success_func({
                                        name: filename,
                                        data: localStorageData
                                    })
                                }
                            }
                        }
                    },

                    // Function for accessing local files
                    // Emulating this using localStorage
                    createFileAsync(filename, collisionOption) {
                        let localStorageData = localStorage.getItem("WinRT-localFolder:" + filename);
                        
                        // Handle Collisions
                        if (localStorageData != null) {
                            switch (collisionOption) {
                                // Call the error function
                                case "FailIfExists": {    
                                    return {
                                        done(success_func, error_func) {
                                            error_func("File " + filename + " already exists.");
                                        }
                                    }
                                    break;
                                }

                                // Create a new file under a different name
                                case "GenerateUniqueName": {
                                    // TODO: make this better
                                    filename = filename + " (1)";
                                    localStorageData = null;
                                    break;
                                }

                                // Pretend the file doesn't exist and overwrite it
                                case "replaceExisting": {
                                    localStorageData = null;
                                    break;
                                }
                            }
                        }

                        // If the file doesn't exist, create a new one
                        if (localStorageData == null) {
                            localStorage.setItem("WinRT-localFolder:" + filename, "");
                            localStorageData = "";
                        }

                        // Construct file object
                        let file = {
                            name: filename,
                            data: localStorageData,

                            // TODO: make file streams actually work
                            openAsync(fileAccessMode) {
                                // Create stream object
                                let stream = {
                                    stream_data: "",

                                    close() {},

                                    flushAsync() {
                                        data += this.stream_data;
                                        localStorage.setItem("WinRT-localFolder:" + name, data);
                                        return {
                                            then(func) {
                                                func();
                                            }
                                        }
                                    }
                                }

                                return {
                                    then(func) {
                                        func(stream);
                                    }
                                }
                            }
                        }

                        return {
                            done(success_func, error_func) {
                                success_func(file);
                            },

                            then(func) {
                                func(file);
                            }
                        }
                    },
                },

                roamingSettings: {
                    values: new Proxy({}, {
                        // Proxy wrapper to simulate a dictionary for roaming data to be stored in
                        // Currently being emulated with localStorage
                        get(target, prop) {
                            if (typeof prop !== "string") return undefined;

                            const item = localStorage.getItem("WinRT-roamingSettings:" + prop);
                            
                            if (item === null) {
                                return undefined;
                            }
                            return item;
                        },

                        set(target, prop, value) {
                            if (typeof prop !== "string") return false;
                            localStorage.setItem("WinRT-roamingSettings:" + prop, value);
                            return true; // required for Proxy sets
                        }
                    })
                }
            }
        },

        // Functions for reading/writing to files
        // Currently, this is emulated using localStorage the same way
        // localFolder is, so naming conflicts could easily arise/
        FileIO: {
            writeTextAsync(filename, string) {
                // TODO: error check for if file does not exist

                localStorage.setItem(filename, string);

                return {
                    done(success_func, error_func) {
                        // TODO: figure out when error_func would run
                        success_func();
                    }
                };
            },

            readTextAsync(filename) {
                let localStorageData = localStorage.getItem(filename);

                return {
                    done(success_func, error_func) {
                        if (localStorageData === null) {
                            error_func("The file " + filename + " doesn't exists.")
                        }
                        else {
                            success_func(localStorageData);
                        }
                    }
                };
            }

        },

        // Enum for managing file collisions
        CreationCollisionOption: {
            // TODO: replace this with an actual enum
            GenerateUniqueName: "GenerateUniqueName",
            replaceExisting: "replaceExisting",
            FailIfExists: "FailIfExists",
            OpenIfExists: "OpenIfExists"
        },

        FileAccessMode: {
            read: 0,
            readWrite: 1
        },

        Streams: {
            RandomAccessStream: {
                // Note: this is probably completely wrong
                copyAsync(data, stream) {
                    stream.stream_data += data;
                    return {
                        then(func) {
                            func()
                        }
                    }
                }
            }
        }
    },

    // UI management
    UI: {
        ViewManagement: {
            // Enums for the different ways an app can be viewed
            ApplicationViewState: {
                snapped: 2,
                filled: 1,
                fullScreenLandscape: 0,
                fullScreenPortrait: 3
            },

            ApplicationView: {
                value: 0
            }
        },

        WebUI: {
            WebUIApplication: {
                addEventListener(listenerType, func, useCapture) {
                    switch (listenerType) {
                        case "suspending":
                            // there isn't really a browser equivalent to suspension
                            break;
                        case "resuming":
                            // there isn't really a browser equivalent to resuming
                            break;
                        default:
                            break;
                    }
                }
            }
        },

        ApplicationSettings: {
            SettingsPane: {
                // Returns a SettingsPane object
                getForCurrentView() {
                    return {
                        addEventListener(eventName, func, options) {
                            // TODO: provide emulation for opening settings and stuff
                        }
                    }
                }
            },

            SettingsCommand: class {
                constructor(settingsCommandId, label, handler) {
                    this.Id = settingsCommandId;
                    this.Label = label;
                    this.Invoked = handler;
                }
                
                static get accountsCommand() {
                    return new this(
                        "accounts",
                        "Accounts",
                        null
                    );
                }
            }
        }
    },

    // Graphics
    Graphics: {
        Display: {
            // Properties of the current display
            DisplayProperties: {
                currentOrientation: 1 // Landscape
            }
        }
    },

    System: {
        UserProfile: {
            UserInformation: {
                // Not actually async
                getDisplayNameAsync() {
                    return {
                        done(func) {
                            func("Jeffery Epstein")
                        }
                    }
                }
            },

            GlobalizationPreferences: {
                homeGeographicRegion: "US",
                languages: ["en-US"]
            }
        }
    },

    // Apparently there's a whole section in the API for 
    // connected sensors and devices.
    Devices: {
        Sensors: {
            // Note: since we're only doing PC emulation, Mobile sensors will not be emulated
            Accelerometer: {
                getDefault() {
                    return null;
                }
            },
            
            Inclinometer: {
                getDefault() {
                    return null;
                }
            }
        }
    },

    Security: {
        Authentication: {
            Web: {
                WebAuthenticationStatus: {
                    success: 0,
                    userCancel: 1,
                    errorHttp: 2
                },

                WebAuthenticationOptions: {
                    default: 0, // this may just be a typo
                    none: 0,
                    silentMode: 1,
                    useTitle: 2,
                    useHttpPost: 4,
                    useCorporateNetwork: 8
                },

                WebAuthenticationBroker: {
                    // TODO: make this async and try to do actual web authentication
                    // Currently, this just returns an error
                    authenticateAsync(options, startURI, endURI) {
                        return {
                            done(func) {
                                func(2);
                            }
                        }
                    }
                }
            }
        }
    }
};

(function () {

    //TODO: extract the appID from AppxManifest.xml
    Windows.ApplicationModel.Store.CurrentApp.appId = {
        toString() {
            return "BF13D240-22AF-45CF-9344-F41E914CEB1A";
        }
    } 

    Windows.ApplicationModel.Store.CurrentAppSimulator = Windows.ApplicationModel.Store.CurrentApp

})();



window.MSApp = {
    execUnsafeLocalFunction(func) {
        return func();
    }
}

// WinJS.Utilities.startLog();
