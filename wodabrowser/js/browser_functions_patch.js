// Inject this patch before the main browser_functions.js script
(function() {
    /**
     * This patch supports the enhanced signal handling system.
     * It creates proper signal objects on FileSystemHandler when 
     * they're not available directly.
     */
    window._patchFileSystemHandler = function(handler) {
        if (!handler) return;
        
        console.log("Patching FileSystemHandler signals");
        
        // Fix missing signals
        const signalNames = [
            'fileRead', 'fileCreated', 'fileChanged', 'fileDeleted',
            'directoryCreated', 'directoryDeleted', 'directoryListed', 'errorOccurred'
        ];
        
        signalNames.forEach(signalName => {
            if (signalName === 'directoryListed' || typeof handler[signalName] !== 'object') {
                console.log(`Forcefully creating proxy signal for ${signalName}`);
                Object.defineProperty(handler, signalName, {
                    value: {
                        _callbacks: [],
                        connect: function(callback) {
                            this._callbacks.push(callback);
                            return true;
                        },
                        disconnect: function(callback) {
                            const idx = this._callbacks.indexOf(callback);
                            if (idx !== -1) this._callbacks.splice(idx, 1);
                            return true;
                        },
                        emit: function(...args) {
                            this._callbacks.forEach(cb => { try { cb(...args); } catch(e) {} });
                        }
                    },
                    writable: true,
                    configurable: true,
                    enumerable: true
                });
                
                // If signal handler exists for this signal
                const handlerId = `${handler.__id__}_${signalName}`;
                const signalHandler = channel.objects[handlerId];
                
                if (signalHandler && signalHandler.signalFired) {
                    console.log(`Found signal handler for ${signalName}`);
                    signalHandler.signalFired.connect(function(args) {
                        console.log(`Signal fired: ${signalName} with args:`, args);
                        if (Array.isArray(args)) {
                            handler[signalName].emit(...args);
                        } else {
                            handler[signalName].emit(args);
                        }
                    });
                }
            }
        });
        
        return handler;
    };
    
    // Original initialization function
    const originalInitializeChannel = window.initializeChannel;
    
    // Override the initialization function
    window.initializeChannel = function() {
        new QWebChannel(qt.webChannelTransport, function(channel) {
            console.log('Enhanced QWebChannel initialization started');
            
            // Make channel globally available
            window.channel = channel;
            
            // Debug channel objects
            console.log('Available channel objects:', Object.keys(channel.objects));
            
            // Get handlers from channel
            window.fileSystemHandler = channel.objects.fileSystemHandler;
            window.codeExecutor = channel.objects.codeExecutor;
            
            // Patch with enhanced signal support
            if (window.fileSystemHandler) {
                window._patchFileSystemHandler(window.fileSystemHandler);
            }
            
            // Continue with original initialization
            if (originalInitializeChannel) {
                originalInitializeChannel.call(window, channel);
            }
        });
    };
})();
