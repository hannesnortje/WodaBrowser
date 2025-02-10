import pytest
from wodabrowser.browser import CodeExecutor
from PyQt6.QtCore import QByteArray
from unittest.mock import patch, MagicMock, mock_open  # Added mock_open import

@pytest.fixture
def executor(qapp):
    """Create a code executor instance for testing."""
    return CodeExecutor()

def test_execute_signal_with_pdf(executor):
    """Test PDF download handling."""
    with patch('PyQt6.QtWidgets.QFileDialog.getSaveFileName') as mock_dialog:
        mock_dialog.return_value = ("/tmp/test.pdf", "")
        
        # Mock PDF data
        pdf_data = {
            'type': 'downloadPDF',
            'filename': 'test.pdf',
            'data': 'data:application/pdf;base64,TEST=='
        }
        
        with patch('builtins.open', mock_open()) as mock_file:
            executor.executeSignal(pdf_data)
            mock_file.assert_called_once()

def test_execute_signal_with_invalid_input(executor):
    """Test handling of invalid input."""
    result = executor.executeSignal("invalid input")
    assert result is None
