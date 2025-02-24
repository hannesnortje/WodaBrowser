(function() {
    // Initialize QWebChannel
    if (typeof qt === 'undefined') {
        window.qt = { webChannelTransport: null };
    }

    function initializeChannel() {
        new QWebChannel(qt.webChannelTransport, function(channel) {
            window.fileSystemHandler = channel.objects.fileSystemHandler;
            window.codeExecutor = channel.objects.codeExecutor;
            
            // Define and attach functions to window object immediately
            window.createFile = function(filePath, content) {
                console.log('createFile called', filePath, content);
                return new Promise((resolve, reject) => {
                    if (!filePath) {
                        reject(new Error("File path is required"));
                        return;
                    }
                    
                    try {
                        window.fileSystemHandler.createFile(filePath, content);
                        window.fileSystemHandler.errorOccurred.connect((error) => {
                            reject(new Error(error));
                        });
                        window.fileSystemHandler.fileCreated.connect((path) => {
                            resolve(path);
                        });
                    } catch (error) {
                        reject(error);
                    }
                });
            };

            window.createDirectory = function(dirPath) {
                console.log('createDirectory called', dirPath);
                window.fileSystemHandler.createDirectory(dirPath);
                return dirPath;
            };

            window.changeFileContent = function(filePath, content) {
                console.log('changeFileContent called', filePath, content);
                window.fileSystemHandler.changeFileContent(filePath, content);
                return filePath;
            };

            window.deleteFile = function(filePath) {
                console.log('deleteFile called', filePath);
                window.fileSystemHandler.deleteFile(filePath);
                return filePath;
            };

            window.deleteDirectory = function(dirPath) {
                console.log('deleteDirectory called', dirPath);
                window.fileSystemHandler.deleteDirectory(dirPath);
                return dirPath;
            };

            window.readFile = function(filePath) {
                console.log('readFile called', filePath);
                return new Promise((resolve, reject) => {
                    window.readFileCallback = (content) => {
                        resolve(content);
                    };
                    window.fileSystemHandler.readFile(filePath);
                });
            };

            window.executePython = function(code) {
                console.log('executePython called', code);
                return new Promise((resolve, reject) => {
                    if (window.codeExecutor && window.codeExecutor.codeResultReady) {
                        window.codeExecutor.codeResultReady.connect((result) => {
                            resolve(result);
                        });
                        window.codeExecutor.executeSignal({type: 'executePython', code: code});
                    } else {
                        reject(new Error("codeExecutor or codeResultReady is not defined"));
                    }
                });
            };

            window.browserAPI = {
                openNewTab: function(url) {
                    if (typeof window.codeExecutor !== 'undefined') {
                        window.codeExecutor.executeSignal(url);
                    }
                },
                
                readFile: function(filePath, callback) {
                    window.readFileCallback = callback;
                    if (typeof window.fileSystemHandler !== 'undefined') {
                        window.fileSystemHandler.readFile(filePath);
                    }
                }
            };

            console.log('File system functions initialized and attached to window object');
        });
    }

    // Initialize as soon as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChannel);
    } else {
        initializeChannel();
    }
})();
