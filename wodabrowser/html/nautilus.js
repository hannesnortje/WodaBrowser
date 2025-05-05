// Minimal Nautilus-like interactivity
const fileArea = document.getElementById('fileArea');
const toggleViewBtn = document.getElementById('toggleView');

// Toggle between grid and list view
if (toggleViewBtn) {
    toggleViewBtn.addEventListener('click', () => {
        fileArea.classList.toggle('list-view');
        fileArea.classList.toggle('grid-view');
    });
}

// File/folder selection
fileArea.addEventListener('click', (e) => {
    const item = e.target.closest('.file-item');
    if (!item) return;
    document.querySelectorAll('.file-item.selected').forEach(el => el.classList.remove('selected'));
    item.classList.add('selected');
});

// Breadcrumb navigation (dummy)
document.querySelectorAll('.crumb').forEach(crumb => {
    crumb.addEventListener('click', () => {
        document.querySelectorAll('.crumb').forEach(c => c.classList.remove('active'));
        crumb.classList.add('active');
        // In a real app, update file area here
    });
});

// --- Real file/folder listing and navigation ---
function renderFileArea(entries) {
    const fileArea = document.getElementById('fileArea');
    fileArea.innerHTML = '';
    entries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'file-item ' + (entry.is_dir ? 'folder' : 'file');
        div.innerHTML = `<span class="icon ${entry.is_dir ? 'folder' : 'file'}"></span><span class="file-name">${entry.name}</span>`;
        div.dataset.path = entry.path;
        div.addEventListener('click', e => {
            e.stopPropagation();
            if (entry.is_dir) {
                listDirectory(entry.path);
            } else {
                // Select the file
                document.querySelectorAll('.file-item.selected').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                
                // Open the file with system's default application
                if (window.fileSystemHandler && window.fileSystemHandler.openFile) {
                    console.log('[JS] Opening file:', entry.path);
                    window.fileSystemHandler.openFile(entry.path);
                } else {
                    console.error('[JS] openFile method not available');
                }
            }
        });
        fileArea.appendChild(div);
    });
}

function updateBreadcrumb(path) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;
    
    // Clear existing breadcrumbs
    breadcrumb.innerHTML = '';
    
    // Add home crumb first
    const homeCrumb = document.createElement('span');
    homeCrumb.className = 'crumb' + (path === '' ? ' active' : '');
    homeCrumb.textContent = 'Home';
    homeCrumb.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        listDirectory('');
    });
    breadcrumb.appendChild(homeCrumb);
    
    // If we're at home, don't add more crumbs
    if (!path) return;
    
    // Split path and create breadcrumbs for each part
    const parts = path.split(/[\\\/]/).filter(Boolean);
    let currentPath = '';
    
    parts.forEach((part, idx) => {
        // Add separator
        const separator = document.createElement('span');
        separator.className = 'separator';
        separator.textContent = ' › ';
        breadcrumb.appendChild(separator);
        
        // Build path for this level
        currentPath = currentPath ? currentPath + '/' + part : part;
        
        // Add crumb
        const crumb = document.createElement('span');
        crumb.className = 'crumb' + (idx === parts.length - 1 ? ' active' : '');
        crumb.textContent = part;
        
        // Path for navigation - store in a closure to avoid reference issues
        const pathForNav = currentPath;
        
        crumb.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[JS] Breadcrumb clicked for path:', pathForNav);
            listDirectory(pathForNav);
        });
        
        breadcrumb.appendChild(crumb);
    });
}

function listDirectory(path) {
    if (window.fileSystemHandler) {
        console.log('[JS] Listing directory with path:', path);
        window.currentPath = path || '';
        
        // Use the new direct method that bypasses QWebChannel return values
        if (window.fileSystemHandler.requestDirectoryContents) {
            console.log('[JS] Using requestDirectoryContents with path:', path);
            // This method will set global variables and directly call rendering functions
            window.fileSystemHandler.requestDirectoryContents(path);
            return;
        }
        
        // Try the old methods as fallbacks
        // Try the getCachedDirectoryContents method (the most reliable approach)
        if (window.fileSystemHandler.getCachedDirectoryContents) {
            try {
                console.log('[JS] Calling getCachedDirectoryContents with path:', path);
                const jsonResult = window.fileSystemHandler.getCachedDirectoryContents(path);
                console.log('[JS] Got cached JSON result:', jsonResult);
                if (jsonResult) {
                    const entries = JSON.parse(jsonResult);
                    console.log('[JS] Successfully parsed cached entries:', entries.length);
                    updateBreadcrumb(path);
                    renderFileArea(entries);
                    return;
                }
            } catch (error) {
                console.error('[JS] Error with cached directory contents:', error);
            }
        }
        
        // As a fallback, try the direct getDirectoryContents method
        if (window.fileSystemHandler.getDirectoryContents) {
            try {
                console.log('[JS] Trying direct getDirectoryContents');
                // First call to populate cache
                window.fileSystemHandler.getDirectoryContents(path); 
                // Then use the cache
                setTimeout(function() {
                    console.log('[JS] Retrying with cache after initial load');
                    try {
                        const jsonResult = window.fileSystemHandler.getCachedDirectoryContents(path);
                        if (jsonResult) {
                            const entries = JSON.parse(jsonResult);
                            updateBreadcrumb(path);
                            renderFileArea(entries);
                        } else {
                            fallbackToSignal();
                        }
                    } catch (error) {
                        console.error('[JS] Error with retry:', error);
                        fallbackToSignal();
                    }
                }, 200);
                return;
            } catch (error) {
                console.error('[JS] Error with getDirectoryContents:', error);
            }
        }
        
        // Last resort: use the original signal method
        function fallbackToSignal() {
            console.log('[JS] Falling back to signal-based method');
            if (window.fileSystemHandler.listDirectory) {
                window.fileSystemHandler.listDirectory(path);
            } else {
                showDummyData();
            }
        }
        
        fallbackToSignal();
    } else {
        console.error('[JS] FileSystemHandler not available');
        showDummyData();
    }
    
    // Last resort: show dummy data if all else fails
    function showDummyData() {
        console.log('[JS] Showing dummy data as last resort');
        const dummyFiles = [
            {name: 'Documents', is_dir: true, is_file: false, path: 'Documents'},
            {name: 'Downloads', is_dir: true, is_file: false, path: 'Downloads'},
            {name: 'Pictures', is_dir: true, is_file: false, path: 'Pictures'},
            {name: 'Videos', is_dir: true, is_file: false, path: 'Videos'},
            {name: 'Music', is_dir: true, is_file: false, path: 'Music'},
            {name: 'example.txt', is_dir: false, is_file: true, path: 'example.txt'}
        ];
        updateBreadcrumb(path);
        renderFileArea(dummyFiles);
    }
}

// Listen for directoryListed signal
function setupDirectoryListener() {
    if (window.fileSystemHandler && window.fileSystemHandler.directoryListed) {
        window.fileSystemHandler.directoryListed.connect((path, entriesJson) => {
            const entries = JSON.parse(entriesJson);
            console.log('[JS] directoryListed received', path, entries);
            updateBreadcrumb(path);
            renderFileArea(entries);
        });
    } else {
        console.log('[JS] directoryListed signal not available yet');
    }
}

function setupDirectListener() {
    if (window.fileSystemHandler) {
        console.log('[JS] Setting up direct listener poll');
        // Use polling as a last resort to get directory contents
        const checkDirectContents = function(path) {
            console.log('[JS] Direct polling for path:', path);
            // Store current path for the polling mechanism
            window.currentPath = path || '';
            
            // Try to call the method directly if it exists
            if (window.fileSystemHandler.getDirectoryContents) {
                try {
                    console.log('[JS] Calling getDirectoryContents from poll');
                    const jsonResult = window.fileSystemHandler.getDirectoryContents(path);
                    console.log('[JS] Got JSON from getDirectoryContents poll:', jsonResult);
                    if (jsonResult) {
                        const entries = JSON.parse(jsonResult);
                        if (entries && Array.isArray(entries)) {
                            console.log('[JS] Got valid entries array:', entries.length);
                            updateBreadcrumb(path);
                            renderFileArea(entries);
                            return true;
                        } else {
                            console.error('[JS] Invalid entries format:', entries);
                        }
                    } else {
                        console.error('[JS] Empty result from getDirectoryContents');
                    }
                } catch (error) {
                    console.error('[JS] Error calling getDirectoryContents:', error);
                }
            }
            return false;
        };
        
        // First attempt
        const path = '';
        if (!checkDirectContents(path)) {
            // If failed, set up polling as a fallback
            console.log('[JS] Setting up polling fallback');
            window.directoryPoll = setInterval(function() {
                if (window.fileSystemHandler && window.fileSystemHandler.getDirectoryContents) {
                    checkDirectContents(window.currentPath || '');
                }
            }, 1000);
        }
    }
}

// On QWebChannel ready, setup listeners and load home dir
function waitForFSHandler() {
    if (window.fileSystemHandler) {
        console.log('[JS] FileSystemHandler available, loading directory');
        // Only use requestDirectoryContents since it works well
        if (window.fileSystemHandler.requestDirectoryContents) {
            listDirectory('');
        } else {
            // Legacy fallbacks only if needed
            setupDirectoryListener();
            setupDirectListener();
            listDirectory('');
        }
    } else {
        setTimeout(waitForFSHandler, 100);
    }
}
waitForFSHandler();

// Add listener for our custom event
window.addEventListener('directoryContentsUpdated', function(event) {
    console.log('[JS] Directory contents updated event received:', 
               event.detail.path, event.detail.entries.length, 'items');
    updateBreadcrumb(event.detail.path);
    renderFileArea(event.detail.entries);
});

// Handle navigation buttons (Back, Forward, Up)
document.addEventListener('DOMContentLoaded', function() {
    // Set up navigation history
    window.navigationHistory = {
        paths: [''],  // Start with home directory
        currentIndex: 0,
        add: function(path) {
            // Don't add if it's the same as current
            if (this.paths[this.currentIndex] === path) return;
            
            // If we're not at the end of the history, truncate
            if (this.currentIndex < this.paths.length - 1) {
                this.paths = this.paths.slice(0, this.currentIndex + 1);
            }
            
            // Add the new path and move index
            this.paths.push(path);
            this.currentIndex = this.paths.length - 1;
            
            console.log('[JS] History updated:', {
                paths: this.paths,
                currentIndex: this.currentIndex
            });
            
            this.updateNavButtons();
        },
        back: function() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                console.log('[JS] Going back to:', this.paths[this.currentIndex]);
                this.updateNavButtons();
                return this.paths[this.currentIndex];
            }
            return null;
        },
        forward: function() {
            if (this.currentIndex < this.paths.length - 1) {
                this.currentIndex++;
                console.log('[JS] Going forward to:', this.paths[this.currentIndex]);
                this.updateNavButtons();
                return this.paths[this.currentIndex];
            }
            return null;
        },
        up: function() {
            // Go up one directory level from current path
            const currentPath = this.paths[this.currentIndex];
            if (!currentPath) return '';  // Already at home
            
            const parts = currentPath.split(/[\\\/]/).filter(Boolean);
            if (parts.length === 0) return '';  // No parent, go to home
            
            // Remove last part to go up one level
            parts.pop();
            return parts.join('/');
        },
        updateNavButtons: function() {
            const backBtn = document.querySelector('.nav-btn[title="Back"]');
            const forwardBtn = document.querySelector('.nav-btn[title="Forward"]');
            
            if (backBtn) {
                backBtn.disabled = this.currentIndex <= 0;
                backBtn.classList.toggle('disabled', this.currentIndex <= 0);
            }
            if (forwardBtn) {
                forwardBtn.disabled = this.currentIndex >= this.paths.length - 1;
                forwardBtn.classList.toggle('disabled', this.currentIndex >= this.paths.length - 1);
            }
            
            console.log('[JS] Navigation buttons updated:', {
                back: backBtn ? !backBtn.disabled : 'unknown',
                forward: forwardBtn ? !forwardBtn.disabled : 'unknown'
            });
        }
    };

    // Wrap the original listDirectory function
    const originalListDirectory = window.listDirectory;
    window.listDirectory = function(path) {
        console.log('[JS] listDirectory called with path:', path);
        
        // Call original implementation
        originalListDirectory(path);
        
        // Add to history unless it's a history navigation
        if (!window.isHistoryNavigation) {
            window.navigationHistory.add(path);
        } else {
            console.log('[JS] History navigation - not adding to history');
        }
        window.isHistoryNavigation = false;
    };
    
    // Set up button handlers
    const backBtn = document.querySelector('.nav-btn[title="Back"]');
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('[JS] Back button clicked');
            const path = window.navigationHistory.back();
            if (path !== null) {
                window.isHistoryNavigation = true;
                listDirectory(path);
            }
        });
    } else {
        console.warn('[JS] Back button not found');
    }
    
    const forwardBtn = document.querySelector('.nav-btn[title="Forward"]');
    if (forwardBtn) {
        forwardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('[JS] Forward button clicked');
            const path = window.navigationHistory.forward();
            if (path !== null) {
                window.isHistoryNavigation = true;
                listDirectory(path);
            }
        });
    } else {
        console.warn('[JS] Forward button not found');
    }
    
    const upBtn = document.querySelector('.nav-btn[title="Up"]');
    if (upBtn) {
        upBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('[JS] Up button clicked');
            const upPath = window.navigationHistory.up();
            // Use regular navigation for up button, so it gets added to history
            listDirectory(upPath);
        });
    } else {
        console.warn('[JS] Up button not found');
    }
    
    // Initialize button states
    window.navigationHistory.updateNavButtons();
});

// Set up sidebar navigation
document.addEventListener('DOMContentLoaded', function() {
    const sidebarItems = document.querySelectorAll('.sidebar-section ul li');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all sidebar items
            document.querySelectorAll('.sidebar-section ul li').forEach(li => {
                li.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Determine which directory to navigate to based on the item text
            const itemText = this.textContent.trim();
            let targetPath = '';
            
            // Map sidebar items to appropriate paths
            switch(itemText) {
                case 'Home':
                    targetPath = '';
                    break;
                case 'Desktop':
                    targetPath = 'Desktop';
                    break;
                case 'Documents':
                    targetPath = 'Documents';
                    break;
                case 'Downloads':
                    targetPath = 'Downloads';
                    break;
                case 'Pictures':
                    targetPath = 'Pictures';
                    break;
                case 'Music':
                    targetPath = 'Music';
                    break;
                case 'Videos':
                    targetPath = 'Videos';
                    break;
                case 'File System':
                    targetPath = ''; // Root home directory
                    break;
                case 'Browse Network':
                    // Network browsing would need special handling
                    console.log('[JS] Network browsing not implemented');
                    showNotification('Network browsing is not implemented yet');
                    return;
                default:
                    console.log('[JS] Unknown sidebar item:', itemText);
                    return;
            }
            
            console.log('[JS] Navigating to path from sidebar:', targetPath);
            listDirectory(targetPath);
        });
    });
    
    // Set initial active state based on current path
    function updateSidebarActiveState(path) {
        // Normalize path - remove leading/trailing slashes and spaces
        path = (path || '').trim().replace(/^\/+|\/+$/g, '');
        
        // Find matching sidebar item and activate it
        let found = false;
        sidebarItems.forEach(item => {
            const itemText = item.textContent.trim();
            
            // Special case for Home/root
            if (path === '' && itemText === 'Home') {
                item.classList.add('active');
                found = true;
            }
            // Match if path starts with item text (case insensitive)
            else if (path.toLowerCase() === itemText.toLowerCase() || 
                     path.toLowerCase().startsWith(itemText.toLowerCase() + '/')) {
                item.classList.add('active');
                found = true;
            } else {
                item.classList.remove('active');
            }
        });
        
        // If no match found, default to Home
        if (!found && path !== '') {
            const homeItem = Array.from(sidebarItems).find(item => 
                item.textContent.trim() === 'Home');
            if (homeItem) {
                homeItem.classList.add('active');
            }
        }
    }
    
    // Override updateBreadcrumb to also update sidebar active state
    const originalUpdateBreadcrumb = window.updateBreadcrumb;
    window.updateBreadcrumb = function(path) {
        // Call original implementation
        originalUpdateBreadcrumb(path);
        
        // Update sidebar active state
        updateSidebarActiveState(path);
    };
    
    // Initial update
    updateSidebarActiveState('');
});

// Add drag and drop support for file uploads
document.addEventListener('DOMContentLoaded', function() {
    const fileArea = document.getElementById('fileArea');
    if (!fileArea) return;
    
    // Prevent default browser behavior for drag/drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        fileArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        fileArea.classList.add('drop-active');
    }
    
    function unhighlight() {
        fileArea.classList.remove('drop-active');
    }
    
    // Handle drop event
    fileArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            // Show progress indicator
            const progressIndicator = document.getElementById('upload-progress');
            const progressBarInner = document.getElementById('progress-bar-inner');
            
            if (progressIndicator) {
                progressIndicator.style.display = 'block';
            }
            
            // Get current path
            const currentPath = window.currentPath || '';
            
            // Process each file
            Array.from(files).forEach((file, index) => {
                // Set progress based on current file
                if (progressBarInner) {
                    const percentComplete = ((index) / files.length) * 100;
                    progressBarInner.style.width = percentComplete + '%';
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Get file content as data URL
                    const fileData = event.target.result;
                    
                    // Send to Python backend
                    if (window.fileSystemHandler && window.fileSystemHandler.saveDroppedFile) {
                        console.log(`[JS] Uploading file ${index+1}/${files.length}: ${file.name}`);
                        window.fileSystemHandler.saveDroppedFile(currentPath, file.name, fileData);
                        
                        // Update progress
                        if (progressBarInner) {
                            const percentComplete = ((index + 1) / files.length) * 100;
                            progressBarInner.style.width = percentComplete + '%';
                        }
                        
                        // Hide progress when all files are processed
                        if (index === files.length - 1) {
                            setTimeout(() => {
                                if (progressIndicator) {
                                    progressIndicator.style.display = 'none';
                                    if (progressBarInner) {
                                        progressBarInner.style.width = '0%';
                                    }
                                }
                            }, 1000);
                        }
                    } else {
                        console.error('[JS] saveDroppedFile method not available');
                        showNotification('Upload feature not available', 'error');
                    }
                };
                
                reader.onerror = function() {
                    console.error(`[JS] Error reading file: ${file.name}`);
                    showNotification(`Error reading file: ${file.name}`, 'error');
                };
                
                // Read file as data URL
                reader.readAsDataURL(file);
            });
        }
    }
});
