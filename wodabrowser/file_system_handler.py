import os
import json
import subprocess
import shlex
import base64
from PyQt6.QtCore import QObject, pyqtSlot, pyqtSignal, QMetaObject, Q_ARG, Qt, QVariant, QTimer

class FileSystemHandler(QObject):
    # Define signals with explicit names and signature
    fileRead = pyqtSignal(str, str, name='fileRead')
    fileCreated = pyqtSignal(str, name='fileCreated')
    fileChanged = pyqtSignal(str, name='fileChanged')
    fileDeleted = pyqtSignal(str, name='fileDeleted')
    directoryCreated = pyqtSignal(str, name='directoryCreated')
    directoryDeleted = pyqtSignal(str, name='directoryDeleted')
    directoryListed = pyqtSignal(str, str, name='directoryListed')
    errorOccurred = pyqtSignal(str, name='errorOccurred')

    def __init__(self, parent=None):
        super().__init__(parent)
        self.base_path = os.path.expanduser("~")
        self.setObjectName('fileSystemHandler')
        self._signal_map = {}
        self._register_signals()
        
        # Cache for directory contents
        self._directory_cache = {}
        
        # Store browser page reference
        self.browser_page = None
        
        print("FileSystemHandler initialized with name:", self.objectName())
        self._debug_signals()

    def _register_signals(self):
        """Register signals with QMetaObject system."""
        self._signal_map = {
            'fileRead': self.fileRead,
            'fileCreated': self.fileCreated,
            'fileChanged': self.fileChanged,
            'fileDeleted': self.fileDeleted,
            'directoryCreated': self.directoryCreated,
            'directoryDeleted': self.directoryDeleted,
            'directoryListed': self.directoryListed,
            'errorOccurred': self.errorOccurred
        }
        print("Registered signals:", list(self._signal_map.keys()))

    def _debug_signals(self):
        """Debug helper to list available signals."""
        signals = {}
        for name, signal in self._signal_map.items():
            signals[name] = {
                'type': str(type(signal)),
                'name': getattr(signal, 'signal', name)
            }
        print(f"Available signals: {signals}")

    def _resolve_path(self, path):
        """Resolve path to either absolute or relative to base_path."""
        if path.startswith("/"):
            return path
        return os.path.join(self.base_path, path)

    @pyqtSlot(str)
    def readFile(self, filePath):
        """Read a file and emit its content."""
        full_path = self._resolve_path(filePath)
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            self.fileRead.emit(filePath, content)
        except Exception as e:
            error_msg = f"Error reading file {filePath}: {str(e)}"
            print(error_msg)
            self.errorOccurred.emit(error_msg)

    @pyqtSlot(str, str)
    def createFile(self, filePath, content):
        """Create a file with the given content."""
        print(f"Creating file: {filePath}")
        full_path = self._resolve_path(filePath)
        try:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"File created successfully: {filePath}")
            print(f"Emitting fileCreated signal with path: {filePath}")
            self.fileCreated.emit(filePath)
            print(f"Signal emission completed")
        except Exception as e:
            error_msg = f"Error creating file {filePath}: {str(e)}"
            print(error_msg)
            print(f"Emitting errorOccurred signal with message: {error_msg}")
            self.errorOccurred.emit(error_msg)
            print(f"Error signal emission completed")

    @pyqtSlot(str)
    def createDirectory(self, dirPath: str) -> None:
        """Create a directory and emit appropriate signals."""
        print(f"Creating directory: {dirPath}")
        try:
            os.makedirs(dirPath, exist_ok=True)
            print(f"Directory created successfully: {dirPath}")
            # Add more logging for signal emission
            print(f"Emitting directoryCreated signal with path: {dirPath}")
            self.directoryCreated.emit(dirPath)
            print(f"Signal emission completed")
        except Exception as e:
            error_msg = f"Error creating directory {dirPath}: {str(e)}"
            print(error_msg)
            print(f"Emitting errorOccurred signal with message: {error_msg}")
            self.errorOccurred.emit(error_msg)
            print(f"Error signal emission completed")

    @pyqtSlot(str, str)
    def changeFileContent(self, filePath, content):
        """Change the content of a file."""
        full_path = self._resolve_path(filePath)
        try:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            self.fileChanged.emit(filePath)
        except Exception as e:
            error_msg = f"Error changing file content {filePath}: {str(e)}"
            print(error_msg)
            self.errorOccurred.emit(error_msg)

    @pyqtSlot(str)
    def deleteFile(self, filePath):
        """Delete a file."""
        full_path = self._resolve_path(filePath)
        try:
            os.remove(full_path)
            self.fileDeleted.emit(filePath)
        except Exception as e:
            error_msg = f"Error deleting file {filePath}: {str(e)}"
            print(error_msg)
            self.errorOccurred.emit(error_msg)

    @pyqtSlot(str)
    def deleteDirectory(self, dirPath):
        """Delete a directory."""
        full_path = self._resolve_path(dirPath)
        try:
            os.rmdir(full_path)  # Only works for empty directories
            self.directoryDeleted.emit(dirPath)
        except Exception as e:
            error_msg = f"Error deleting directory {dirPath}: {str(e)}"
            print(error_msg)
            self.errorOccurred.emit(error_msg)

    @pyqtSlot(str)
    def listDirectory(self, dirPath):
        print(f"[DEBUG] listDirectory called with dirPath: '{dirPath}'")
        if not dirPath or dirPath == '.' or dirPath == './':
            full_path = self.base_path
        else:
            # Remove leading slashes to prevent absolute path traversal
            safe_path = dirPath.lstrip('/')
            full_path = os.path.join(self.base_path, safe_path)
        print(f"[DEBUG] Listing directory: {full_path}")
        try:
            entries = []
            for name in os.listdir(full_path):
                path = os.path.join(full_path, name)
                entry = {
                    'name': name,
                    'is_dir': os.path.isdir(path),
                    'is_file': os.path.isfile(path),
                    'path': os.path.relpath(path, self.base_path)
                }
                entries.append(entry)
            print(f"[DEBUG] Found {len(entries)} entries in {full_path}")
            self.directoryListed.emit(dirPath or '', json.dumps(entries))
        except Exception as e:
            error_msg = f"Error listing directory {dirPath}: {str(e)}"
            print(error_msg)
            self.errorOccurred.emit(error_msg)

    @pyqtSlot(str, result=str)
    def getDirectoryContents(self, dirPath):
        """Get directory contents directly as a JSON string (no signals)."""
        print(f"[DEBUG] getDirectoryContents called with dirPath: '{dirPath}'")
        try:
            if not dirPath or dirPath == '.' or dirPath == './':
                full_path = self.base_path
            else:
                # Remove leading slashes to prevent absolute path traversal
                safe_path = dirPath.lstrip('/')
                full_path = os.path.join(self.base_path, safe_path)
            
            print(f"[DEBUG] Getting directory contents: {full_path}")
            entries = []
            for name in os.listdir(full_path):
                try:
                    path = os.path.join(full_path, name)
                    entry = {
                        'name': name,
                        'is_dir': os.path.isdir(path),
                        'is_file': os.path.isfile(path),
                        'path': os.path.relpath(path, self.base_path)
                    }
                    entries.append(entry)
                except Exception as e:
                    print(f"Error processing entry {name}: {e}")
                    # Skip problematic entries instead of failing the whole operation
                    continue
            
            print(f"[DEBUG] Returning {len(entries)} entries for {full_path}")
            result = json.dumps(entries)
            print(f"[DEBUG] JSON result length: {len(result)}")
            
            # Store the result in cache for access through getCachedDirectoryContents
            cache_key = dirPath or ""
            self._directory_cache[cache_key] = result
            
            # Also emit the signal as a backup method
            self.directoryListed.emit(dirPath or '', result)
            
            return result
        except Exception as e:
            error_msg = f"Error getting directory contents for {dirPath}: {str(e)}"
            print(error_msg)
            error_json = json.dumps([{"name": "Error loading directory", "is_dir": False, "is_file": True, "path": "error.txt"}])
            # Store error result in cache
            cache_key = dirPath or ""
            self._directory_cache[cache_key] = error_json
            return error_json
    
    @pyqtSlot(str, result=str)
    def getCachedDirectoryContents(self, dirPath):
        """Get cached directory contents for the given path."""
        cache_key = dirPath or ""
        result = self._directory_cache.get(cache_key, None)
        print(f"[DEBUG] getCachedDirectoryContents for {dirPath}: {'Found' if result else 'Not found'}")
        if result:
            return result
        else:
            # If not cached, trigger a fetch and return empty for now
            QTimer.singleShot(0, lambda: self.getDirectoryContents(dirPath))
            return json.dumps([{"name": "Loading...", "is_dir": False, "is_file": True, "path": "loading.txt"}])

    @pyqtSlot(str)
    def requestDirectoryContents(self, dirPath):
        """Request directory contents and store them in a global JS property."""
        print(f"[DEBUG] requestDirectoryContents called with dirPath: '{dirPath}'")
        try:
            if not dirPath or dirPath == '.' or dirPath == './':
                full_path = self.base_path
            else:
                # Remove leading slashes to prevent absolute path traversal
                safe_path = dirPath.lstrip('/')
                full_path = os.path.join(self.base_path, safe_path)
            
            print(f"[DEBUG] Getting directory contents: {full_path}")
            entries = []
            for name in os.listdir(full_path):
                try:
                    path = os.path.join(full_path, name)
                    entry = {
                        'name': name,
                        'is_dir': os.path.isdir(path),
                        'is_file': os.path.isfile(path),
                        'path': os.path.relpath(path, self.base_path)
                    }
                    entries.append(entry)
                except Exception as e:
                    print(f"Error processing entry {name}: {e}")
                    # Skip problematic entries instead of failing the whole operation
                    continue
            
            print(f"[DEBUG] Found {len(entries)} entries for {full_path}")
            result = json.dumps(entries)
            print(f"[DEBUG] JSON result length: {len(result)}")
            
            # Set global variable directly in JavaScript
            js_code = f"""
                (function() {{
                    console.log('[PY->JS] Setting directory contents');
                    window.directoryContents = JSON.parse('{result.replace("'", "\\'")}');
                    window.currentDirectoryPath = '{dirPath}';
                    console.log('[PY->JS] Directory contents set:', window.directoryContents.length, 'items');
                    
                    // Call renderFileArea directly if it exists
                    if (typeof updateBreadcrumb === 'function' && typeof renderFileArea === 'function') {{
                        console.log('[PY->JS] Calling rendering functions directly');
                        updateBreadcrumb('{dirPath}');
                        renderFileArea(window.directoryContents);
                    }}
                    
                    // Dispatch a custom event for any listeners
                    var customEvent = new CustomEvent('directoryContentsUpdated', {{ 
                        detail: {{ path: '{dirPath}', entries: window.directoryContents }}
                    }});
                    window.dispatchEvent(customEvent);
                }})();
            """
            
            # Get the current page/frame to run JavaScript
            page = None
            if hasattr(self, 'browser_page'):
                page = self.browser_page
            elif hasattr(self.parent(), 'tabs') and self.parent().tabs.count() > 0:
                current_tab = self.parent().tabs.currentWidget()
                if hasattr(current_tab, 'browser'):
                    page = current_tab.browser.page()
            
            if page:
                print(f"[DEBUG] Running JavaScript to update UI")
                page.runJavaScript(js_code)
            else:
                print(f"[DEBUG] No page found to run JavaScript")
                
            # Also emit signal as a backup method
            self.directoryListed.emit(dirPath or '', result)
        except Exception as e:
            error_msg = f"Error getting directory contents for {dirPath}: {str(e)}"
            print(error_msg)
            self.errorOccurred.emit(error_msg)

    @pyqtSlot(str)
    def openFile(self, filePath):
        """Open a file with the system's default application."""
        print(f"[DEBUG] openFile called with filePath: '{filePath}'")
        try:
            if not filePath:
                raise ValueError("Empty file path")
                
            # Remove leading slashes to prevent absolute path traversal
            safe_path = filePath.lstrip('/')
            full_path = os.path.join(self.base_path, safe_path)
            
            if not os.path.exists(full_path):
                raise FileNotFoundError(f"File not found: {full_path}")
                
            if not os.path.isfile(full_path):
                raise IsADirectoryError(f"Path is not a file: {full_path}")
            
            print(f"[DEBUG] Opening file with default application: {full_path}")
            
            # Use appropriate method to open based on platform
            if os.name == 'nt':  # Windows
                os.startfile(full_path)
            elif os.name == 'posix':  # Linux, macOS
                try:
                    subprocess.Popen(['xdg-open', full_path])
                except FileNotFoundError:
                    # Try alternatives
                    try:
                        subprocess.Popen(['open', full_path])  # macOS
                    except FileNotFoundError:
                        subprocess.Popen(['gio', 'open', full_path])  # GNOME
            
            # Return success message to JavaScript (optional)
            js_code = f"""
                console.log('[PY->JS] File opened: {filePath}');
                // Show a brief notification if desired
                if (typeof showNotification === 'function') {{
                    showNotification('File opened: {os.path.basename(filePath)}');
                }}
            """
            
            if hasattr(self, 'browser_page') and self.browser_page:
                self.browser_page.runJavaScript(js_code)
                
        except Exception as e:
            error_msg = f"Error opening file {filePath}: {str(e)}"
            print(error_msg)
            self.errorOccurred.emit(error_msg)
            
            # Show error in JavaScript
            if hasattr(self, 'browser_page') and self.browser_page:
                self.browser_page.runJavaScript(f"""
                    console.error('[PY->JS] {error_msg}');
                    if (typeof showNotification === 'function') {{
                        showNotification('Error: {str(e)}', 'error');
                    }}
                """)

    @pyqtSlot(str, str, str)
    def saveDroppedFile(self, dirPath, fileName, fileContent):
        """Save a file that was dropped into the browser."""
        print(f"[DEBUG] saveDroppedFile called with dirPath: '{dirPath}', fileName: '{fileName}'")
        try:
            if not dirPath:
                # Use home directory if no path specified
                full_dir_path = self.base_path
            else:
                # Remove leading slashes to prevent absolute path traversal
                safe_path = dirPath.lstrip('/')
                full_dir_path = os.path.join(self.base_path, safe_path)
            
            # Ensure directory exists
            if not os.path.exists(full_dir_path):
                raise ValueError(f"Directory does not exist: {full_dir_path}")
            
            # Create the full path for the new file
            full_file_path = os.path.join(full_dir_path, fileName)
            
            # Extract base64 data
            if fileContent.startswith('data:'):
                # Handle data URLs (e.g., from file input)
                # Format: data:[<mediatype>][;base64],<data>
                header, encoded = fileContent.split(",", 1)
                is_base64 = ';base64' in header
                if is_base64:
                    content = base64.b64decode(encoded)
                else:
                    content = encoded.encode('utf-8')
            else:
                # Assume it's already base64 encoded
                try:
                    content = base64.b64decode(fileContent)
                except Exception:
                    # If not base64, treat as plain text
                    content = fileContent.encode('utf-8')
            
            print(f"[DEBUG] Writing file to: {full_file_path}")
            
            # Write the file to disk
            with open(full_file_path, 'wb') as f:
                f.write(content)
            
            print(f"[DEBUG] File saved successfully: {fileName}")
            
            # Emit success message to JavaScript
            js_code = f"""
                console.log('[PY->JS] File saved successfully: {fileName}');
                showNotification('File uploaded: {fileName}');
                
                // Refresh directory contents
                if (window.fileSystemHandler && window.fileSystemHandler.requestDirectoryContents) {{
                    window.fileSystemHandler.requestDirectoryContents('{dirPath}');
                }}
            """
            
            if hasattr(self, 'browser_page') and self.browser_page:
                self.browser_page.runJavaScript(js_code)
            
            # Return success via standard signals as well
            self.fileCreated.emit(os.path.join(dirPath, fileName))
            return True
            
        except Exception as e:
            error_msg = f"Error saving dropped file {fileName}: {str(e)}"
            print(error_msg)
            self.errorOccurred.emit(error_msg)
            
            # Show error in JavaScript
            if hasattr(self, 'browser_page') and self.browser_page:
                self.browser_page.runJavaScript(f"""
                    console.error('[PY->JS] {error_msg}');
                    showNotification('Error saving file: {str(e)}', 'error');
                """)
            return False

    def __getattr__(self, name):
        """Intercept signal access for better debugging."""
        print(f"Accessing attribute: {name}")
        # Handle signal access
        if name in self._signal_map:
            print(f"Returning registered signal: {name}")
            return self._signal_map[name]
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
